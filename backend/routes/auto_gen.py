from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from routes.model_manager import chat_with_gpt, chat_with_ollama
from config.model_manager_config import USE_LOCAL_LLM
from config.auto_annotate_config import AUTO_ANNOTATE_NER_PROMPT
from models.message import Message

router = APIRouter()

class AutoAnnotateNERRequest(BaseModel):
    text: str = Field(..., description="The text to annotate")
    classes: List[str] = Field(..., description="List of entity classes to identify")
    prompt: Optional[str] = Field(None, description="Optional custom prompt for the annotation")

class EntityAnnotation(BaseModel):
    text: str
    label: str
    start: int
    end: int

@router.post("/auto_annotate_ner", response_model=List[EntityAnnotation])
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
        # Prepare the prompt
        prompt = request.prompt or AUTO_ANNOTATE_NER_PROMPT
        formatted_prompt = prompt.format(
            text=request.text,
            classes=", ".join(request.classes)
        )

        # Create message for LLM
        messages = [
            Message(role="user", content=formatted_prompt)
        ]

        # Get response from LLM
        if USE_LOCAL_LLM:
            result = await chat_with_ollama(messages)
            response_text = result["response"]
        else:
            response_text = await chat_with_gpt(messages)

        # Parse the JSON response
        try:
            annotations = json.loads(response_text)
            if not isinstance(annotations, list):
                raise ValueError("Response is not a JSON array")
            
            # Validate and convert annotations
            validated_annotations = []
            for ann in annotations:
                # Ensure required fields are present
                if not all(k in ann for k in ["text", "label", "start", "end"]):
                    continue
                
                # Validate indices
                if not (isinstance(ann["start"], int) and isinstance(ann["end"], int)):
                    continue
                if not (0 <= ann["start"] < len(request.text) and 0 < ann["end"] <= len(request.text)):
                    continue
                if ann["start"] >= ann["end"]:
                    continue
                
                # Validate extracted text matches position
                if request.text[ann["start"]:ann["end"]] != ann["text"]:
                    continue
                
                # Validate label is in requested classes
                if ann["label"] not in request.classes:
                    continue
                
                validated_annotations.append(EntityAnnotation(**ann))
            
            return validated_annotations

        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500,
                detail="Failed to parse LLM response as JSON"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing annotations: {str(e)}"
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Auto-annotation failed: {str(e)}"
        )
