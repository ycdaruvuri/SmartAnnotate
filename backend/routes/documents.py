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
    # Verify project exists and belongs to user
    project = projects_collection.find_one({
        "_id": ObjectId(document.project_id),
        "user_id": str(current_user["_id"])
    })
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    doc_dict = document.dict()
    doc_dict["created_at"] = datetime.utcnow()
    doc_dict["updated_at"] = datetime.utcnow()
    doc_dict["entities"] = []
    doc_dict["status"] = "pending"
    
    result = documents_collection.insert_one(doc_dict)
    doc_dict["id"] = str(result.inserted_id)
    
    return Document(**doc_dict)

@router.post("/upload")
async def upload_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
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
        "project_id": project_id,
        "filename": file.filename,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "entities": [],
        "status": "pending"
    }
    
    result = documents_collection.insert_one(doc_dict)
    doc_dict["id"] = str(result.inserted_id)
    
    return Document(**doc_dict)

@router.get("/project/{project_id}", response_model=List[Document])
async def get_project_documents(
    project_id: str,
    current_user = Depends(get_current_user),
    skip: int = 0,
    limit: int = 10
):
    # Verify project exists and belongs to user
    project = projects_collection.find_one({
        "_id": ObjectId(project_id),
        "user_id": str(current_user["_id"])
    })
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    documents = []
    cursor = documents_collection.find({"project_id": project_id}).skip(skip).limit(limit)
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        documents.append(Document(**doc))
    return documents

@router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user = Depends(get_current_user)):
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
    
    doc["id"] = str(doc.pop("_id"))
    return Document(**doc)

@router.put("/{document_id}", response_model=Document)
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user = Depends(get_current_user)
):
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
    
    result = documents_collection.find_one_and_update(
        {"_id": ObjectId(document_id)},
        {"$set": update_data},
        return_document=True
    )
    
    result["id"] = str(result.pop("_id"))
    return Document(**result)

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
