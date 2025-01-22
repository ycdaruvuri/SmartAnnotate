from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME")

client = MongoClient(MONGODB_URL)
db = client[MONGODB_DB_NAME]

# Collections
users_collection = db["users"]
projects_collection = db["projects"]
documents_collection = db["documents"]
