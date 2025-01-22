from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Entity(BaseModel):
    start: int
    end: int
    label: str
    text: str

class Annotation(BaseModel):
    start_index: int
    end_index: int
    entity: str
    text: str

class DocumentBase(BaseModel):
    text: str
    project_id: str
    filename: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    entities: List[Entity] = []
    status: str = "pending"
    annotations: List[Annotation] = []

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str

class DocumentUpdate(BaseModel):
    text: Optional[str] = None
    filename: Optional[str] = None
    entities: Optional[List[Entity]] = None
    status: Optional[str] = None
    annotations: Optional[List[Annotation]] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "text": "Sample document text",
                "filename": "example.txt",
                "entities": [
                    {
                        "start": 0,
                        "end": 6,
                        "label": "PERSON",
                        "text": "Sample"
                    }
                ],
                "status": "completed",
                "annotations": [
                    {
                        "start_index": 0,
                        "end_index": 6,
                        "entity": "PERSON",
                        "text": "Sample"
                    }
                ]
            }
        }
