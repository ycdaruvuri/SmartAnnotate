from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EntityClass(BaseModel):
    name: str
    color: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    entity_classes: List[EntityClass]

class Project(ProjectCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    entity_classes: Optional[List[EntityClass]] = None

class ProjectResponse(Project):
    updated_documents_count: Optional[int] = None
