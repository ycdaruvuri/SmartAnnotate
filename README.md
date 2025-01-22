# NER Annotation Tool

A full-stack application for annotating text with custom Named Entity Recognition (NER) labels. This tool provides an intuitive interface for creating and managing text annotations.

## Features

- Upload and manage text documents for annotation
- Interactive text selection and entity labeling
- Support for predefined and custom entity types
- Real-time preview of annotations
- MongoDB backend for persistent storage
- Modern React frontend with Material-UI

## Project Structure

```
ner-annotation-tool/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
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

3. Create a `.env` file from `.env.example` and update the MongoDB connection string:
   ```bash
   cp .env.example .env
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

- `GET /documents/`: List all documents
- `POST /documents/`: Create a new document
- `GET /documents/{id}`: Get a specific document
- `PUT /documents/{id}`: Update a document with annotations

## Technologies Used

- Backend:
  - FastAPI
  - MongoDB (with Motor for async operations)
  - Python 3.8+

- Frontend:
  - React 18
  - Material-UI
  - React Router
  - Axios

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.
