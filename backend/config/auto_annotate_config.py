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
    "label": "the entity class",
    "start": start_index,
    "end": end_index
}
Make sure the start and end indices are correct and match the exact position in the original text.
Only include entities that exactly match the specified classes. Be precise with the entity boundaries.

Text: {text}
Classes: {classes}

Return only the JSON array without any additional explanation."""
)
