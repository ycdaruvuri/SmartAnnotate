from fastapi import APIRouter, HTTPException, Depends
from models.project import ProjectCreate, Project, ProjectUpdate
from utils.auth import get_current_user
from config.database import projects_collection, documents_collection
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/", response_model=Project)
async def create_project(project: ProjectCreate, current_user = Depends(get_current_user)):
    project_dict = project.dict()
    project_dict["user_id"] = str(current_user["_id"])
    project_dict["created_at"] = datetime.utcnow()
    project_dict["updated_at"] = datetime.utcnow()
    
    result = projects_collection.insert_one(project_dict)
    project_dict["id"] = str(result.inserted_id)
    
    return Project(**project_dict)

@router.get("/", response_model=List[Project])
async def get_projects(current_user = Depends(get_current_user)):
    projects = []
    cursor = projects_collection.find({"user_id": str(current_user["_id"])})
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        projects.append(Project(**doc))
    return projects

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user = Depends(get_current_user)):
    project = projects_collection.find_one({
        "_id": ObjectId(project_id),
        "user_id": str(current_user["_id"])
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project["id"] = str(project.pop("_id"))
    return Project(**project)

@router.get("/{project_id}/documents")
async def get_project_documents(
    project_id: str,
    skip: int = 0,
    limit: int = 10,
    current_user = Depends(get_current_user)
):
    # First verify the project exists and belongs to the user
    project = projects_collection.find_one({
        "_id": ObjectId(project_id),
        "user_id": str(current_user["_id"])
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get documents for the project
    documents = []
    cursor = documents_collection.find({"project_id": project_id}).skip(skip).limit(limit)
    
    for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        documents.append(doc)
    
    return documents

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user = Depends(get_current_user)
):
    try:
        # Get the current project state
        current_project = projects_collection.find_one({
            "_id": ObjectId(project_id),
            "user_id": str(current_user["_id"])
        })
        if not current_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_data = project_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Check if entity classes have been updated
        if "entity_classes" in update_data:
            old_entities = {e["name"]: e for e in current_project.get("entity_classes", [])}
            new_entities = {e["name"]: e for e in update_data["entity_classes"]}
            
            # Find renamed entities
            for old_name, old_entity in old_entities.items():
                if old_name not in new_entities:
                    # This entity might have been renamed
                    for new_name, new_entity in new_entities.items():
                        if new_name not in old_entities:
                            # Found a potential rename (old_name -> new_name)
                            print(f"Detected entity rename: {old_name} -> {new_name}")
                            
                            # Update all documents that use this entity
                            docs_cursor = documents_collection.find({
                                "project_id": str(project_id),
                                "$or": [
                                    {"annotations.entity": old_name},
                                    {"entities.label": old_name}
                                ]
                            })
                            
                            for doc in docs_cursor:
                                try:
                                    # Update annotations
                                    if "annotations" in doc:
                                        for ann in doc["annotations"]:
                                            if ann["entity"] == old_name:
                                                ann["entity"] = new_name
                                    
                                    # Update entities
                                    if "entities" in doc:
                                        for entity in doc["entities"]:
                                            if entity["label"] == old_name:
                                                entity["label"] = new_name
                                    
                                    # Save the updated document
                                    documents_collection.update_one(
                                        {"_id": doc["_id"]},
                                        {
                                            "$set": {
                                                "annotations": doc["annotations"],
                                                "entities": doc["entities"],
                                                "updated_at": datetime.utcnow()
                                            }
                                        }
                                    )
                                    print(f"Updated document {doc['_id']} with new entity name")
                                except Exception as doc_error:
                                    print(f"Error updating document {doc['_id']}: {str(doc_error)}")
                                    continue
                            break
        
        # Update the project
        result = projects_collection.find_one_and_update(
            {
                "_id": ObjectId(project_id),
                "user_id": str(current_user["_id"])
            },
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Project not found after update")
        
        result["id"] = str(result.pop("_id"))
        return Project(**result)
        
    except Exception as e:
        print(f"Error updating project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user = Depends(get_current_user)):
    result = projects_collection.delete_one({
        "_id": ObjectId(project_id),
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Project deleted successfully"}
