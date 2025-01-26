# NER Annotation Tool

A full-stack application for annotating text with custom Named Entity Recognition (NER) labels. This tool provides an intuitive interface for creating and managing text annotations.

## Features

- Upload and manage text documents for annotation
- Interactive text selection and entity labeling
- Support for predefined and custom entity types
- Real-time preview of annotations
- MongoDB backend for persistent storage
- Modern React frontend with Material-UI
- Flexible LLM integration supporting both OpenAI and local models via Ollama

## Project Structure

```
ner-annotation-tool/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/
│   │   ├── database.py
│   │   └── model_manager_config.py
│   └── routes/
│       ├── auth.py
│       ├── documents.py
│       ├── model_manager.py
│       └── users.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnnotationTool.js
│   │   │   ├── DocumentList.js
│   │   │   └── Navbar.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment and activate it:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file from `.env.example` and update the configuration:
   ```bash
   cp .env.example .env
   ```

   Configure the following environment variables in `.env`:
   ```env
   # MongoDB Configuration
   MONGODB_URL=your_mongodb_url
   MONGODB_DB_NAME=your_db_name
   MONGODB_COLLECTION=your_collection_name

   # LLM Configuration
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4  # Options: gpt-4o-mini, gpt-4o, gpt-3.5-turbo, gpt-4
   USE_LOCAL_LLM=True  # Set to False to use ChatGPT, True to use local Ollama
   OLLAMA_MODEL=deepseek-r1:14b  # Your preferred Ollama model
   OLLAMA_API_URL=http://localhost:11434
   ```

4. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Add New Document" to create a new document for annotation
3. Click on any document to start annotating
4. Select text and choose an entity type to create annotations
5. View and manage your annotations in the entities list

## API Endpoints

### Document Management
- `GET /documents/`: List all documents
- `POST /documents/`: Create a new document
- `GET /documents/{id}`: Get a specific document
- `PUT /documents/{id}`: Update a document with annotations

### LLM Integration
- `POST /model/llm_chat`: Chat with the configured LLM
  ```json
  // Request body:
  {
    "messages": [
      {
        "role": "user",
        "content": "Your message here"
      }
    ]
  }

  // Response for ChatGPT:
  {
    "response": "message content"
  }

  // Response for Deepseek models:
  {
    "think": "thinking process",
    "response": "message content"
  }
  ```

## LLM Configuration

The application supports two types of LLM integrations:

1. **OpenAI (ChatGPT)**
   - Set `USE_LOCAL_LLM=False` in `.env`
   - Requires valid `OPENAI_API_KEY`
   - Supports models: gpt-4o-mini, gpt-4o, gpt-3.5-turbo, gpt-4

2. **Local LLM via Ollama**
   - Set `USE_LOCAL_LLM=True` in `.env`
   - Requires Ollama running locally
   - Supports various models including deepseek-r1:14b
   - Special handling for Deepseek models' thinking process

## Technologies Used

- Backend:
  - FastAPI
  - MongoDB (with Motor for async operations)
  - Python 3.8+
  - OpenAI API
  - Ollama Integration

- Frontend:
  - React 18
  - Material-UI
  - React Router
  - Axios

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
