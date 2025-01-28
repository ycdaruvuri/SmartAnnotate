from pydantic import BaseModel, Field
from typing import List


class ResponseModel(BaseModel):
    classes: list[str] = Field(default_factory=list)
    descriptions: list[str] = Field(default_factory=list)
    
    # classes: List[str] = Field(default_factory=list)
    # descriptions: List[str] = Field(default_factory=list)