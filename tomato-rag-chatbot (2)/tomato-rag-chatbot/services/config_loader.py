"""
Configuration Loader
Loads settings from config.json for dynamic collection management
"""

import json
import os
import logging

logger = logging.getLogger(__name__)

class ConfigLoader:
    def __init__(self, config_file='config.json'):
        self.config_file = config_file
        self.config = self._load_config()
    
    def _load_config(self):
        """Load configuration from JSON file"""
        try:
            if not os.path.exists(self.config_file):
                logger.warning(f"Config file {self.config_file} not found, using defaults")
                return self._default_config()
            
            with open(self.config_file, 'r') as f:
                config = json.load(f)
            
            logger.info(f"✅ Loaded configuration from {self.config_file}")
            return config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._default_config()
    
    def _default_config(self):
        """Default configuration if file not found"""
        return {
            "database": {
                "name": "tomatoDB",
                "collections": {
                    "foods": {
                        "enabled": True,
                        "search_fields": ["name", "description", "category"],
                        "display_fields": ["name", "price", "category"]
                    },
                    "restaurants": {
                        "enabled": True,
                        "search_fields": ["name", "cuisine", "location", "description"],
                        "display_fields": ["name", "cuisine", "location", "rating"]
                    }
                }
            },
            "rag": {
                "model": "all-MiniLM-L6-v2",
                "top_k_results": 5,
                "similarity_threshold": 0.2
            }
        }
    
    def get_database_name(self):
        """Get database name"""
        return self.config.get('database', {}).get('name', 'tomatoDB')
    
    def get_enabled_collections(self):
        """Get list of enabled collection names"""
        collections = self.config.get('database', {}).get('collections', {})
        return [name for name, settings in collections.items() 
                if settings.get('enabled', False)]
    
    def get_collection_config(self, collection_name):
        """Get configuration for a specific collection"""
        collections = self.config.get('database', {}).get('collections', {})
        return collections.get(collection_name, {})
    
    def get_search_fields(self, collection_name):
        """Get search fields for a collection"""
        config = self.get_collection_config(collection_name)
        return config.get('search_fields', ['name', 'description'])
    
    def get_display_fields(self, collection_name):
        """Get display fields for a collection"""
        config = self.get_collection_config(collection_name)
        return config.get('display_fields', ['name'])
    
    def get_rag_config(self):
        """Get RAG configuration"""
        return self.config.get('rag', {})
    
    def get_voice_config(self):
        """Get voice configuration"""
        return self.config.get('voice', {})
    
    def reload(self):
        """Reload configuration from file"""
        self.config = self._load_config()
        logger.info("🔄 Configuration reloaded")

# Global config instance
config_loader = ConfigLoader()
