from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from models.document import DocumentCreate, Document, DocumentUpdate
from utils.auth import get_current_user
from config.database import documents_collection, projects_collection
from bson import ObjectId
from datetime import datetime
from typing import List
import json

router = APIRouter()

@router.post("/", response_model=Document)
async def create_document(document: DocumentCreate, current_user = Depends(get_current_user)):
    print(f"Creating document for project {document.project_id}")
    try:
        # Verify project exists and belongs to user
        project = projects_collection.find_one({
            "_id": ObjectId(document.project_id),
            "user_id": str(current_user["_id"])
        })
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create document dictionary
        doc_dict = {
            "text": document.text,
            "project_id": str(document.project_id),
            "filename": document.filename,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "annotations": [],
            "entities": [],
            "status": "pending"
        }
        
        print(f"Inserting document: {doc_dict}")
        result = documents_collection.insert_one(doc_dict)
        doc_dict["id"] = str(result.inserted_id)
        
        print(f"Successfully created document with ID: {doc_dict['id']}")
        return Document(**doc_dict)
        
    except Exception as e:
        print(f"Error creating document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating document: {str(e)}")

@router.post("/upload")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    print(f"Uploading document for project {project_id}")
    try:
        # Verify project exists and belongs to user
        project = projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"])
        })
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        content = await file.read()
        text = content.decode()
        
        doc_dict = {
            "text": text,
            "project_id": str(project_id),
            "filename": file.filename,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "annotations": [],
            "entities": [],
            "status": "pending"
        }
        
        print(f"Inserting uploaded document: {doc_dict}")
        result = documents_collection.insert_one(doc_dict)
        doc_dict["id"] = str(result.inserted_id)
        
        print(f"Successfully created uploaded document with ID: {doc_dict['id']}")
        return Document(**doc_dict)
        
    except Exception as e:
        print(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@router.get("/project/{project_id}", response_model=List[Document])
async def get_project_documents(
    project_id: str,
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100  # Default limit of 100, but can be overridden
):
    print(f"Fetching documents for project {project_id} with skip={skip}, limit={limit}")
    
    try:
        # Verify project exists and belongs to user
        project = projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"])
        })
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Convert project_id to string for comparison
        project_id_str = str(project_id)
        print(f"Looking for documents with project_id: {project_id_str}")
        
        # First get total count
        total_count = documents_collection.count_documents({"project_id": project_id_str})
        print(f"Total documents in project: {total_count}")
        
        # Get all documents for this project
        cursor = documents_collection.find({"project_id": project_id_str})
        
        # Convert documents to list and process them
        documents = []
        for doc in cursor:
            try:
                # Convert _id to string id
                doc["id"] = str(doc.pop("_id"))
                # Ensure project_id is string
                doc["project_id"] = str(doc["project_id"])
                # Initialize missing fields
                doc.setdefault("annotations", [])
                doc.setdefault("entities", [])
                doc.setdefault("filename", None)
                # Convert datetime objects to strings
                if isinstance(doc.get("created_at"), datetime):
                    doc["created_at"] = doc["created_at"].isoformat()
                if isinstance(doc.get("updated_at"), datetime):
                    doc["updated_at"] = doc["updated_at"].isoformat()
                # Create Document object
                document = Document(**doc)
                documents.append(document)
                print(f"Processed document {doc['id']}")
            except Exception as e:
                print(f"Error processing document: {str(e)}")
                print(f"Document data: {doc}")
                continue
        
        # Sort documents by created_at in descending order
        documents.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination if needed
        if limit > 0:
            start = skip
            end = skip + limit
            documents = documents[start:end]
        
        print(f"Returning {len(documents)} documents")
        return documents
        
    except Exception as e:
        print(f"Error in get_project_documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user = Depends(get_current_user)):
    try:
        doc = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Verify project belongs to user
        project = projects_collection.find_one({
            "_id": ObjectId(doc["project_id"]),
            "user_id": str(current_user["_id"])
        })
        if not project:
            raise HTTPException(status_code=403, detail="Not authorized to access this document")
        
        # Convert entities to annotations format if needed
        if "entities" in doc and isinstance(doc["entities"], list):
            doc["annotations"] = [
                {
                    "start_index": entity["start"],
                    "end_index": entity["end"],
                    "entity": entity["label"],
                    "text": entity["text"]
                }
                for entity in doc["entities"]
            ]
        elif "annotations" not in doc or not isinstance(doc["annotations"], list):
            doc["annotations"] = []
        
        # Print debug info
        print("Document data:", doc)
        
        doc["id"] = str(doc.pop("_id"))
        return Document(**doc)
    except Exception as e:
        print(f"Error in get_document: {str(e)}")
        raise

@router.put("/{document_id}", response_model=Document)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user = Depends(get_current_user)
):
    try:
        # Verify document exists
        doc = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Verify project belongs to user
        project = projects_collection.find_one({
            "_id": ObjectId(doc["project_id"]),
            "user_id": str(current_user["_id"])
        })
        if not project:
            raise HTTPException(status_code=403, detail="Not authorized to update this document")
        
        update_data = document_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Print debug info
        print("Updating document. Current data:", doc)
        print("Update data:", update_data)
        
        # Convert annotations to entities format
        if "annotations" in update_data:
            if not isinstance(update_data["annotations"], list):
                update_data["annotations"] = []
                update_data["entities"] = []
            else:
                # Validate each annotation
                for ann in update_data["annotations"]:
                    if not all(k in ann for k in ["start_index", "end_index", "entity", "text"]):
                        raise HTTPException(status_code=400, detail="Invalid annotation format")
                
                # Update both annotations and entities
                update_data["entities"] = [
                    {
                        "start": ann["start_index"],
                        "end": ann["end_index"],
                        "label": ann["entity"],
                        "text": ann["text"]
                    }
                    for ann in update_data["annotations"]
                ]
        
        result = documents_collection.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_data}
        )
        
        # Get updated document
        updated_doc = documents_collection.find_one({"_id": ObjectId(document_id)})
        if not updated_doc:
            raise HTTPException(status_code=404, detail="Document not found after update")
        
        # Print debug info
        print("Updated document:", updated_doc)
        
        updated_doc["id"] = str(updated_doc.pop("_id"))
        return Document(**updated_doc)
    except Exception as e:
        print(f"Error in update_document: {str(e)}")
        raise

@router.get("/project/{project_id}/export")
async def export_project_data(project_id: str, current_user = Depends(get_current_user)):
    # Verify project exists and belongs to user
    project = projects_collection.find_one({
        "_id": ObjectId(project_id),
        "user_id": str(current_user["_id"])
    })
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all documents for the project
    documents = []
    cursor = documents_collection.find({"project_id": project_id})
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        documents.append(doc)
    
    export_data = {
        "project": {
            "id": str(project["_id"]),
            "name": project["name"],
            "entity_classes": project["entity_classes"]
        },
        "documents": documents
    }
    
    return export_data
