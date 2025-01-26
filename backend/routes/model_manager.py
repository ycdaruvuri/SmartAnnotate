from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI
import requests
import json
import re
from typing import Dict, Any, List, Tuple
from pydantic import BaseModel, Field
from config.model_manager_config import (
    OPENAI_API_KEY,
    OPENAI_MODEL,
    USE_LOCAL_LLM,
    OLLAMA_MODEL,
    OLLAMA_API_URL
)

router = APIRouter()

class Message(BaseModel):
    role: str = Field(
        default="user",
        description="The role of the message sender (e.g., 'user', 'assistant', 'system')"
    )
    content: str = Field(
        ...,
        description="The content of the message"
    )

class ChatRequest(BaseModel):
    messages: List[Message] = Field(
        default=[
            Message(
                role="user",
                content="Hello, how can I help you today?"
            )
        ],
        description="List of messages in the conversation"
    )

async def chat_with_gpt(messages: List[Message]) -> str:
    """
    Interact with ChatGPT API using the new OpenAI client (v1.0.0+).
    """
    try:
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": msg.role, "content": msg.content} for msg in messages]
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error with ChatGPT API: {str(e)}")

def parse_deepseek_response(response: str) -> Tuple[str, str]:
    """
    Parse the response from Deepseek model into think and response components.
    Returns a tuple of (think_content, response_content).
    """
    # Extract think content
    think_match = re.search(r'<think>(.*?)</think>', response, flags=re.DOTALL)
    think_content = think_match.group(1).strip() if think_match else ""
    
    # Remove think section and get response
    response_content = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)
    # Clean up any remaining XML-like tags
    response_content = re.sub(r'<[^>]+>', '', response_content)
    # Clean up extra whitespace and newlines
    response_content = re.sub(r'\n+', '\n', response_content.strip())
    
    return think_content, response_content

async def chat_with_ollama(messages: List[Message]) -> Dict[str, str]:
    """
    Interact with local Ollama instance.
    """
    try:
        # Convert messages to Ollama format
        prompt = " ".join([msg.content for msg in messages])
        
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False
        }
        
        response = requests.post(f"{OLLAMA_API_URL}/api/generate", json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, 
                              detail="Error communicating with Ollama")
        
        response_text = response.json()["response"]
        
        # Parse response if using Deepseek model
        if "deepseek" in OLLAMA_MODEL.lower():
            think_content, response_content = parse_deepseek_response(response_text)
            return {
                "think": think_content,
                "response": response_content
            }
        
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error with Ollama API: {str(e)}")

@router.post("/llm_chat")
async def llm_chat(request: ChatRequest):
    """
    Endpoint for LLM chat that switches between ChatGPT and Ollama based on configuration.

    Example request body:
    ```json
    {
        "messages": [
            {
                "role": "user",
                "content": "What is the capital of France?"
            }
        ]
    }
    ```

    Returns:
    - For ChatGPT: {"response": "message"}
    - For Deepseek: {"think": "thinking process", "response": "message"}
    - For other Ollama models: {"response": "message"}
    """
    try:
        messages = request.messages
        if not messages:
            raise HTTPException(status_code=400, detail="No messages provided")

        if USE_LOCAL_LLM:
            result = await chat_with_ollama(messages)
        else:
            response = await chat_with_gpt(messages)
            result = {"response": response}

        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
