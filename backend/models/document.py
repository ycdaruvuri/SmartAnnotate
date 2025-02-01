from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class Annotation(BaseModel):
    start_index: int
    end_index: int
    entity: str
    text: str

class DocumentBase(BaseModel):
    text: Optional[str] = None
    filename: Optional[str] = None
    project_id: Optional[str] = None
    status: str = 'pending'
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    annotations: List[Annotation] = []

class Document(DocumentBase):
    id: str

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    text: Optional[str] = None
    filename: Optional[str] = None
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
