from pydantic import BaseModel, Field

class Message(BaseModel):
    role: str = Field(
        default="user",
        description="The role of the message sender (e.g., 'user', 'assistant', 'system')"
    )
    content: str = Field(
        ...,
        description="The content of the message"
    )
