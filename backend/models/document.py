from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Entity(BaseModel):
    start: int
    end: int
    label: str
    text: str

class DocumentCreate(BaseModel):
    text: str
    project_id: str
    filename: Optional[str] = None

class Document(DocumentCreate):
    id: str
    entities: List[Entity] = []
    status: str = "pending"  # pending, in_progress, completed
    created_at: datetime
    updated_at: datetime

class DocumentUpdate(BaseModel):
    text: Optional[str] = None
    entities: Optional[List[Entity]] = None
    status: Optional[str] = None
