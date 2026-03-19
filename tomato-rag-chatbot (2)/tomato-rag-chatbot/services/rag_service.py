"""
RAG Service with Sentence Transformers
Handles semantic search across multiple collections (foods, restaurants, etc.)
Auto-configures based on config.json
"""

from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict
import logging
from services.config_loader import config_loader

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, mongodb_service):
        self.mongodb_service = mongodb_service
        self.model = None
        self.embeddings_by_collection = {}
        self.items_by_collection = {}
        
        # Get indexed collections from config
        self.indexed_collections = config_loader.get_enabled_collections()
        
        # Get RAG config
        rag_config = config_loader.get_rag_config()
        self.model_name = rag_config.get('model', 'all-MiniLM-L6-v2')
        self.top_k = rag_config.get('top_k_results', 5)
        self.threshold = rag_config.get('similarity_threshold', 0.2)
        
        logger.info(f"📋 RAG will index: {self.indexed_collections}")
    
    async def initialize(self):
        """Initialize embeddings model and create embeddings for all collections"""
        try:
            logger.info("🔄 Loading embedding model...")
            self.model = SentenceTransformer(self.model_name)
            logger.info(f"✅ Embedding model loaded: {self.model_name}")
            
            # Create embeddings for each collection
            for collection_name in self.indexed_collections:
                await self._index_collection(collection_name)
            
            total_items = sum(len(items) for items in self.items_by_collection.values())
            logger.info(f"✅ Total items indexed: {total_items}")
            
        except Exception as e:
            logger.error(f"RAG initialization error: {e}")
    
    async def _index_collection(self, collection_name: str):
        """Create embeddings for a specific collection"""
        try:
            items = self.mongodb_service.get_all_from_collection(collection_name)
            
            if not items:
                logger.info(f"📊 No items found in '{collection_name}' collection")
                return
            
            logger.info(f"📊 Indexing {len(items)} items from '{collection_name}'")
            
            # Get search fields from config
            search_fields = config_loader.get_search_fields(collection_name)
            
            # Create text representations using configured fields
            texts = []
            for item in items:
                # Concatenate all search fields
                text_parts = [str(item.get(field, '')) for field in search_fields]
                text = ' '.join(text_parts)
                texts.append(text)
            
            # Create embeddings
            embeddings = self.model.encode(texts)
            
            # Store embeddings and items
            self.embeddings_by_collection[collection_name] = embeddings
            self.items_by_collection[collection_name] = items
            
            logger.info(f"✅ Indexed {len(items)} items from '{collection_name}' using fields: {search_fields}")
            
        except Exception as e:
            logger.error(f"Error indexing {collection_name}: {e}")
    
    async def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Search across all collections using semantic similarity"""
        try:
            all_results = []
            
            # Search in each collection
            for collection_name in self.indexed_collections:
                results = await self._search_collection(collection_name, query, top_k)
                all_results.extend(results)
            
            # Sort all results by similarity score
            all_results.sort(key=lambda x: x.get('similarity_score', 0), reverse=True)
            
            # Return top k overall results
            final_results = all_results[:top_k]
            
            logger.info(f"🔍 Found {len(final_results)} relevant items across all collections")
            return final_results
            
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            # Fallback to text search
            return self._fallback_search(query)
    
    async def _search_collection(self, collection_name: str, query: str, top_k: int) -> List[Dict]:
        """Search in a specific collection"""
        try:
            if collection_name not in self.embeddings_by_collection:
                return []
            
            embeddings = self.embeddings_by_collection[collection_name]
            items = self.items_by_collection[collection_name]
            
            if len(embeddings) == 0:
                return []
            
            # Encode query
            query_embedding = self.model.encode([query])[0]
            
            # Calculate cosine similarity
            similarities = np.dot(embeddings, query_embedding) / (
                np.linalg.norm(embeddings, axis=1) * np.linalg.norm(query_embedding)
            )
            
            # Get top k results from this collection
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > self.threshold:  # Use configured threshold
                    item = items[idx].copy()
                    item['similarity_score'] = float(similarities[idx])
                    results.append(item)
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching {collection_name}: {e}")
            return []
    
    def _fallback_search(self, query: str) -> List[Dict]:
        """Fallback to text-based search if embeddings fail"""
        try:
            all_results = self.mongodb_service.search_all_collections(query)
            
            # Flatten results
            results = []
            for collection_name, items in all_results.items():
                results.extend(items)
            
            return results[:5]
            
        except Exception as e:
            logger.error(f"Fallback search error: {e}")
            return []
    
    async def search_by_collection(self, collection_name: str, query: str, top_k: int = 5) -> List[Dict]:
        """Search in a specific collection only"""
        return await self._search_collection(collection_name, query, top_k)
    
    async def refresh_index(self, collection_name: str = None):
        """Refresh embeddings for a specific collection or all collections"""
        if collection_name:
            await self._index_collection(collection_name)
            logger.info(f"✅ Refreshed index for '{collection_name}'")
        else:
            for coll_name in self.indexed_collections:
                await self._index_collection(coll_name)
            logger.info("✅ Refreshed all indexes")

