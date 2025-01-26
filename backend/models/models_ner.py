from pydantic import BaseModel, Field


class ResponseModel(BaseModel):
    classes: list[str] = Field(default_factory=list)
    descriptions: list[str] = Field(default_factory=list)