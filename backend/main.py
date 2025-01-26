from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from routes import auth, projects, documents, users, model_manager, auto_gen

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads/profile_pictures", exist_ok=True)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(model_manager.router, prefix="/api/model", tags=["model"])
app.include_router(auto_gen.router, prefix="/api/auto", tags=["auto-generation"])

@app.get("/api/")
async def read_root():
    return {"message": "Welcome to SmartAnnotate API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
