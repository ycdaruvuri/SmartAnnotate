from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from routes.model_manager import chat_with_gpt, chat_with_ollama
from config.model_manager_config import USE_LOCAL_LLM
from config.auto_annotate_config import AUTO_ANNOTATE_NER_PROMPT, AUTO_ANNOTATE_NER_PROMPT_2
from models.message import Message
from auto_gen_tools.json_extractor import extract_json
from config.database import projects_collection, documents_collection
from bson import ObjectId
from routes.projects import get_ner_classes

router = APIRouter()

class AutoAnnotateNERRequest(BaseModel):
    text: str = Field(..., description="The text to annotate")
    classes: List[str] = Field(..., description="List of entity classes to identify")
    prompt: Optional[str] = Field(None, description="Optional custom prompt for the annotation")

class EntityAnnotation(BaseModel):
    text: str = Field(..., description="The extracted entity text")
    entity: str = Field(..., description="The entity class")
    start_index: int = Field(..., description="Start index of the entity in the text")
    end_index: int = Field(..., description="End index of the entity in the text")

@router.post("/auto_annotate_ner")#, response_model=List[EntityAnnotation])
async def auto_annotate_ner(request: AutoAnnotateNERRequest):
    """
    Automatically annotate named entities in the given text using LLM.
    
    Args:
        text: The text to analyze
        classes: List of entity classes to identify
        prompt: Optional custom prompt (uses default if not provided)
    
    Returns:
        List of identified entities with their positions
    """
    try:
        print('--------------------------')
        # Prepare the prompt
        if request.prompt is None or request.prompt == "" or request.prompt == "string":
            request.prompt = AUTO_ANNOTATE_NER_PROMPT_2
        prompt =  request.prompt
        # formatted_prompt = prompt.format(
        #     text=request.text,
        #     classes=", ".join(request.classes)
        # )
        # input_text = "The document to be annotated: "+request.text
        # classes_str ="The classes to be annotated: "+ ", ".join(request.classes)
        # instructions = "Please identify and extract named entities for the specified classes. Please return the response in JSON format."

        input_text = "Text: "+request.text
        classes_str ="Entity Classes: "+ ", ".join(request.classes)
        instructions = """
        Instructions
                1. Identify and extract only the entities that match the specified classes.
                2. Ensure each extracted entity is relevant and accurate based on the provided classes.
                3. Format the result as a JSON array where each item represents an extracted entity.
        """
        formatted_prompt = prompt + "\n\n" + input_text + "\n\n" + classes_str + "\n\n" + instructions

        print(f"Prompt: {formatted_prompt}")

        # Create message for LLM
        messages = [
            Message(role="user", content=formatted_prompt)
        ]

        print(f"USING LLM: {USE_LOCAL_LLM}")

        # Get response from LLM
        if USE_LOCAL_LLM:
            print(f"Running Ollama...")
            result = await chat_with_ollama(messages)
            response_text = result["response"]
        else:
            print(f"Running ChatGPT...")
            response_text = await chat_with_gpt(messages)
        print(f"Response: {response_text}")
        print(f"Type of response: {type(response_text)}")
        
        try:
            entities = extract_json(response_text)
            # for each entity, extract the start_index, end_index, text and entity
            # first sort the entities by length of the text
            entities = sorted(entities, key=lambda x: len(x['text']))
            # then for each entity, match the document text with the entity text and get the start_index and end_index
            annotations = []
            for entity in entities:
                start_index = request.text.find(entity['text'])
                end_index = start_index + len(entity['text'])
                annotations.append(EntityAnnotation(
                    text=entity['text'],
                    entity=entity['entity'],
                    start_index=start_index,
                    end_index=end_index
                ))
            return {"annotations": annotations}
           
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to extract JSON: {str(e)}"
            )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Auto-annotation failed: {str(e)}"
        )

@router.post("/project/{project_id}/document/{document_id}/auto_annotate")
async def auto_annotate_project_document(project_id: str, document_id: str, prompt: Optional[str] = None):
    """
    Auto-annotate a document in a project using the project's NER classes.
    
    Args:
        project_id: ID of the project
        document_id: ID of the document to annotate
        prompt: Optional custom prompt for annotation
    """
    try:
        # Get document content
        document = documents_collection.find_one({
            "_id": ObjectId(document_id),
            "project_id": project_id
        })
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get text content from document
        text = document.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="Document has no content")
        
        # Get NER classes from project
        ner_data = await get_ner_classes(project_id)
        classes = ner_data.classes
        
        if not classes:
            raise HTTPException(status_code=400, detail="No NER classes defined for this project")
        
        # Create auto-annotation request
        annotation_request = AutoAnnotateNERRequest(
            text=text,
            classes=classes,
            prompt=prompt
        )
        
        # Call auto_annotate_ner
        annotations = await auto_annotate_ner(annotation_request)
        return annotations
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error auto-annotating document: {str(e)}"
        )
