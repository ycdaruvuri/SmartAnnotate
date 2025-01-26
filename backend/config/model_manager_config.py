import os
from dotenv import load_dotenv

load_dotenv()

"""Configuration for the LLM model manager."""

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
# Default model for ChatGPT ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "gpt-4"]
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


# LLM Selection
USE_LOCAL_LLM = os.getenv("USE_LOCAL_LLM", True)  # Set to False to use ChatGPT, True to use local Ollama
# print(f"Using local LLM: {USE_LOCAL_LLM}")

# Ollama Configuration
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:14b")  # Default model for Ollama
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434")  # Default Ollama API endpoint
