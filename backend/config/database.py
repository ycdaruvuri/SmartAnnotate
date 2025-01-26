import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGODB_DB_NAME")
COLLECTION_NAME = os.getenv("MONGODB_COLLECTION")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")  # Default admin password

# Create a new client and connect to the server
client = MongoClient(MONGODB_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
documents_collection = db[COLLECTION_NAME]
projects_collection = db["projects"]
