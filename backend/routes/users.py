from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import os
from datetime import datetime
from models.user import UserUpdate, UserPasswordUpdate, UserInDB, UserResponse
from config.database import users_collection
from utils.auth import get_password_hash, verify_password, get_current_user
from bson import ObjectId

router = APIRouter()

UPLOAD_FOLDER = 'uploads/profile_pictures'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Handle both name and username fields for backward compatibility
    username = user.get("username", user.get("name", ""))
    
    # If we found a name but no username, update the document to use username
    if not user.get("username") and user.get("name"):
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"username": user["name"]},
                "$unset": {"name": ""}
            }
        )
    
    return {
        "_id": str(user["_id"]),
        "username": username,
        "email": user.get("email", ""),
        "about_me": user.get("about_me", ""),
        "profile_picture": user.get("profile_picture", ""),
        "created_at": user.get("created_at", datetime.utcnow())
    }

@router.put("/profile")
async def update_profile(
    about_me: Optional[str] = Form(""),
    username: Optional[str] = Form(""),
    email: Optional[str] = Form(None),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        update_data = {"updated_at": datetime.utcnow()}
        response_data = {}
        
        # Validate username if provided
        if username:
            existing_user = users_collection.find_one({
                "$or": [
                    {"username": username},
                    {"name": username}
                ],
                "_id": {"$ne": current_user["_id"]}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            update_data["username"] = username
            # Remove old name field if it exists
            update_data["$unset"] = {"name": ""}
            response_data["username"] = username

        # Validate email if provided
        if email:
            existing_user = users_collection.find_one({
                "email": email,
                "_id": {"$ne": current_user["_id"]}
            })
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            update_data["email"] = email
            response_data["email"] = email
        
        if profile_picture:
            if not allowed_file(profile_picture.filename):
                raise HTTPException(status_code=400, detail="Invalid file type")
            
            # Create upload folder if it doesn't exist
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            
            # Delete old profile picture if it exists
            user = users_collection.find_one({"_id": current_user["_id"]})
            if user and user.get("profile_picture"):
                old_picture_path = os.path.join(UPLOAD_FOLDER, user["profile_picture"])
                if os.path.exists(old_picture_path):
                    os.remove(old_picture_path)
            
            # Save new profile picture
            filename = f"{str(current_user['_id'])}_{profile_picture.filename}"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            with open(file_path, "wb") as buffer:
                content = await profile_picture.read()
                buffer.write(content)
            
            update_data["profile_picture"] = filename
            response_data["profile_picture"] = filename
        
        # Always update about_me, even if empty
        update_data["about_me"] = about_me
        response_data["about_me"] = about_me

        # Handle the update operation
        if "$unset" in update_data:
            unset = update_data.pop("$unset")
            result = users_collection.update_one(
                {"_id": current_user["_id"]},
                {
                    "$set": update_data,
                    "$unset": unset
                }
            )
        else:
            result = users_collection.update_one(
                {"_id": current_user["_id"]},
                {"$set": update_data}
            )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return JSONResponse(
            content={"message": "Profile updated successfully", "data": response_data},
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/change-password")
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        user = users_collection.find_one({"_id": current_user["_id"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not verify_password(password_data.current_password, user["password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        new_password_hash = get_password_hash(password_data.new_password)
        result = users_collection.update_one(
            {"_id": current_user["_id"]},
            {
                "$set": {
                    "password": new_password_hash,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update password")
        
        return {"message": "Password updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
