"""
Groq API Service
Handles AI chat completions with cart command detection
"""

import os
import requests
from typing import List, Dict, Tuple
import logging
import re

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"
    
    def is_configured(self) -> bool:
        """Check if Groq API is configured"""
        return self.api_key is not None and self.api_key != ""
    
    def detect_cart_action(self, message: str) -> Tuple[str, str]:
        """Detect if message is a cart action"""
        message_lower = message.lower()
        
        # Remove from cart patterns (CHECK FIRST - most specific)
        remove_patterns = [
            r'remove.*from.*cart',
            r'delete.*from.*cart',
            r'remove.*cart',
            r'delete.*cart',
            r'take.*out.*cart',
            r'cancel.*order',
            r'don\'t want',
            r'remove\s+\w+',  # "remove pizza"
            r'delete\s+\w+'   # "delete burger"
        ]
        
        # Checkout patterns (CHECK SECOND)
        checkout_patterns = [
            r'checkout',
            r'place.*order',
            r'confirm.*order',
            r'complete.*order',
            r'proceed.*checkout',
            r'pay now'
        ]
        
        # View cart patterns (CHECK THIRD)
        view_patterns = [
            r'show.*cart',
            r'view.*cart',
            r'what.*in.*cart',
            r'my cart',
            r'see.*cart',
            r'^cart$'  # Just "cart"
        ]
        
        # Add to cart patterns (CHECK LAST - least specific)
        add_patterns = [
            r'add.*to.*cart',
            r'add.*cart',
            r'put.*in.*cart',
            r'i want',
            r'order',
            r'buy',
            r'get me',
            r'i\'ll take',
            r'i\'ll have',
            r'give me'
        ]
        
        # Check in order of specificity
        for pattern in remove_patterns:
            if re.search(pattern, message_lower):
                return ('remove_from_cart', message)
        
        for pattern in checkout_patterns:
            if re.search(pattern, message_lower):
                return ('checkout', message)
        
        for pattern in view_patterns:
            if re.search(pattern, message_lower):
                return ('view_cart', message)
        
        for pattern in add_patterns:
            if re.search(pattern, message_lower):
                return ('add_to_cart', message)
        
        return ('chat', message)
    
    async def generate_response(self, user_message: str, context: List[Dict], cart_info: Dict = None) -> str:
        """Generate AI response using Groq"""
        try:
            # Build context string from RAG results
            context_str = ""
            if context:
                context_str = "\n\nAvailable items:\n"
                for item in context[:3]:  # Limit to top 3 for faster response
                    context_str += f"- {item['name']}: {item.get('description', 'N/A')} (₹{item.get('price', 'N/A')}, {item.get('category', 'N/A')})\n"
            
            # Add cart info if available
            cart_str = ""
            if cart_info and cart_info.get('items'):
                cart_str = f"\n\nUser's current cart ({len(cart_info['items'])} items, Total: ₹{cart_info.get('total', 0)}):\n"
                for item in cart_info['items']:
                    cart_str += f"- {item['name']} x{item['quantity']} (₹{item['price']})\n"
            
            # Optimized system prompt
            system_prompt = """You are a helpful food delivery assistant. Be concise and friendly.
For cart actions: Confirm what was added/removed.
For queries: Provide brief, helpful answers.
Keep responses under 50 words."""
            
            # Prepare messages
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message + context_str + cart_str}
            ]
            
            # Call Groq API with optimized settings
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.5,  # Lower for faster, more consistent responses
                "max_tokens": 150,   # Reduced for faster responses
                "top_p": 0.9
            }
            
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except requests.Timeout:
            logger.error("Groq API timeout")
            return "I'm processing your request. Please try again."
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return "I'm having trouble right now. Please try again."
