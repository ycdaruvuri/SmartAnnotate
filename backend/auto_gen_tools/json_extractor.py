import json
import re

def extract_json(input_text):
    try:
        # Directly try to parse as JSON
        return json.loads(input_text)
    except json.JSONDecodeError:
        # Attempt to extract JSON inside code blocks or other text
        # Regex to match content inside ``` ```
        code_block_pattern = r'```(?:json)?\n(.*?)\n```'
        match = re.search(code_block_pattern, input_text, re.DOTALL)
        if match:
            json_content = match.group(1)  # Extract content inside the code block
            try:
                return json.loads(json_content)
            except json.JSONDecodeError:
                raise ValueError("Extracted content inside code block is not valid JSON.")
        
        # If no code block, try to extract any JSON array or object
        json_pattern = r'\{.*?\}|\[.*?\]'
        match = re.search(json_pattern, input_text, re.DOTALL)
        if match:
            json_content = match.group(0)
            try:
                return json.loads(json_content)
            except json.JSONDecodeError:
                raise ValueError("Extracted content is not valid JSON.")
        
        # If all else fails, raise an error
        raise ValueError("No valid JSON found in the input.")