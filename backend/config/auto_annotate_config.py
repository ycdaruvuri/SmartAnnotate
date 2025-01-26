"""Configuration for auto-annotation functionality."""
import os
from dotenv import load_dotenv

load_dotenv()

# Default prompt for NER auto-annotation
AUTO_ANNOTATE_NER_PROMPT = os.getenv(
    "AUTO_ANNOTATE_NER_PROMPT",
    """Given the text below, identify and extract named entities for the specified classes. 
Format the response as a JSON array where each item contains:
{
    "text": "the extracted entity text",
    "entity": "the entity class"
}
Only include entities that exactly match the specified classes.
"""
)
