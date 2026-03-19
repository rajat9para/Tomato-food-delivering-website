"""
MongoDB Service for Tomato App
Handles database operations across multiple collections
Auto-discovers collections from config.json
"""

import os
from pymongo import MongoClient
from typing import List, Dict, Optional
import logging
from services.config_loader import config_loader

logger = logging.getLogger(__name__)

class MongoDBService:
    def __init__(self):
        self.mongodb_uri = os.getenv("MONGODB_URI")
        if not self.mongodb_uri:
            raise ValueError("MONGODB_URI not found in environment variables")
        
        # Get database name from config
        self.db_name = config_loader.get_database_name()
        
        # Get enabled collections from config
        enabled_collections = config_loader.get_enabled_collections()
        
        # Initialize collections dictionary
        self.collections = {name: None for name in enabled_collections}
        
        self.client = None
        self.db = None
        
        logger.info(f"📋 Configured collections: {list(self.collections.keys())}")
    
    def connect(self) -> bool:
        """Connect to MongoDB and initialize all collections"""
        try:
            self.client = MongoClient(
                self.mongodb_uri,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            
            # Initialize all collections
            for collection_name in self.collections.keys():
                self.collections[collection_name] = self.db[collection_name]
            
            logger.info(f"✅ Connected to MongoDB: {self.db_name}")
            logger.info(f"📁 Available collections: {list(self.collections.keys())}")
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            return False
    
    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        return self.client is not None
    
    def get_collection(self, collection_name: str):
        """Get a specific collection"""
        return self.collections.get(collection_name)
    
    def get_all_from_collection(self, collection_name: str) -> List[Dict]:
        """Get all items from a specific collection"""
        try:
            collection = self.collections.get(collection_name)
            if collection is None:
                logger.warning(f"Collection '{collection_name}' not found")
                return []
            
            items = list(collection.find({}))
            # Convert ObjectId to string and add collection type
            for item in items:
                item['_id'] = str(item['_id'])
                item['_collection'] = collection_name
            return items
        except Exception as e:
            logger.error(f"Error fetching from {collection_name}: {e}")
            return []
    
    def search_in_collection(self, collection_name: str, query: str) -> List[Dict]:
        """Search in a specific collection"""
        try:
            collection = self.collections.get(collection_name)
            if collection is None:
                return []
            
            # Get first document to determine fields
            sample = collection.find_one()
            if not sample:
                return []
            
            # Build search query for all text fields
            search_fields = []
            for key in sample.keys():
                if key != '_id' and isinstance(sample[key], str):
                    search_fields.append({key: {"$regex": query, "$options": "i"}})
            
            if not search_fields:
                return []
            
            items = list(collection.find({"$or": search_fields}))
            for item in items:
                item['_id'] = str(item['_id'])
                item['_collection'] = collection_name
            return items
        except Exception as e:
            logger.error(f"Error searching in {collection_name}: {e}")
            return []
    
    def search_all_collections(self, query: str) -> Dict[str, List[Dict]]:
        """Search across all collections"""
        results = {}
        for collection_name in self.collections.keys():
            items = self.search_in_collection(collection_name, query)
            if items:
                results[collection_name] = items
        return results
    
    # Legacy methods for backward compatibility
    def get_all_foods(self) -> List[Dict]:
        """Get all food items (legacy method)"""
        return self.get_all_from_collection('foods')
    
    def search_foods(self, query: str) -> List[Dict]:
        """Search foods by name or description (legacy method)"""
        return self.search_in_collection('foods', query)
    
    def get_foods_by_category(self, category: str) -> List[Dict]:
        """Get foods by category"""
        try:
            collection = self.collections.get('foods')
            if collection is None:
                return []
            
            foods = list(collection.find({"category": category}))
            for food in foods:
                food['_id'] = str(food['_id'])
                food['_collection'] = 'foods'
            return foods
        except Exception as e:
            logger.error(f"Error fetching by category: {e}")
            return []
    
    # New methods for restaurants
    def get_all_restaurants(self) -> List[Dict]:
        """Get all restaurants"""
        return self.get_all_from_collection('restaurants')
    
    def search_restaurants(self, query: str) -> List[Dict]:
        """Search restaurants"""
        return self.search_in_collection('restaurants', query)
    
    def get_restaurant_by_id(self, restaurant_id: str) -> Optional[Dict]:
        """Get a specific restaurant by ID"""
        try:
            from bson.objectid import ObjectId
            collection = self.collections.get('restaurants')
            if collection is None:
                return None
            
            restaurant = collection.find_one({"_id": ObjectId(restaurant_id)})
            if restaurant:
                restaurant['_id'] = str(restaurant['_id'])
                restaurant['_collection'] = 'restaurants'
            return restaurant
        except Exception as e:
            logger.error(f"Error fetching restaurant: {e}")
            return None

