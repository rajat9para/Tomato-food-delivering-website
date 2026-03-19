"""
Voice-Based AI Agent for Tomato Food Delivery App
Uses: Groq API + MongoDB + RAG + Web Speech API
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Tomato Voice AI Agent")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    context: Optional[List[dict]] = []
    cart: Optional[dict] = None
    action: Optional[str] = None

# Import services (we'll create these next)
from services.groq_service import GroqService
from services.mongodb_service import MongoDBService
from services.rag_service import RAGService
from services.cart_service import cart_service

# Initialize services
groq_service = GroqService()
mongodb_service = MongoDBService()
rag_service = RAGService(mongodb_service)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Starting Tomato Voice AI Agent...")
    
    # Connect to MongoDB
    if mongodb_service.connect():
        logger.info("✅ MongoDB connected")
        
        # Initialize RAG embeddings
        await rag_service.initialize()
        logger.info("✅ RAG system initialized")
    else:
        logger.warning("⚠️  MongoDB connection failed - using fallback mode")

@app.get("/")
async def root():
    """Serve the main HTML page"""
    try:
        with open("templates/voice_chat.html", "r", encoding="utf-8") as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except Exception as e:
        logger.error(f"Error loading HTML: {e}")
        return HTMLResponse(content="<h1>Error loading page</h1>", status_code=500)

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests with RAG and cart functionality"""
    try:
        logger.info(f"📝 Received message: {request.message}")
        
        # Detect cart action
        action, message = groq_service.detect_cart_action(request.message)
        logger.info(f"🎯 Detected action: {action}")
        
        # Handle cart actions
        if action == 'view_cart':
            cart = cart_service.get_cart(request.user_id)
            total = cart_service.get_cart_total(request.user_id)
            
            if not cart:
                return ChatResponse(
                    response="Your cart is empty. Browse our menu and add items!",
                    context=[],
                    cart={"items": [], "total": 0},
                    action="view_cart"
                )
            
            cart_summary = f"Your cart has {len(cart)} items (Total: ₹{total}):\n"
            for item in cart:
                cart_summary += f"- {item['name']} x{item['quantity']} (₹{item['price']})\n"
            
            return ChatResponse(
                response=cart_summary,
                context=[],
                cart={"items": cart, "total": total},
                action="view_cart"
            )
        
        elif action == 'checkout':
            result = cart_service.checkout(request.user_id)
            
            if result['success']:
                order = result['order']
                response_text = f"✅ Order confirmed! Order ID: {order['order_id']}\nTotal: ₹{order['total']}\nEstimated delivery: 30-40 mins"
            else:
                response_text = result['message']
            
            return ChatResponse(
                response=response_text,
                context=[],
                cart={"items": [], "total": 0},
                action="checkout"
            )
        
        elif action == 'remove_from_cart':
            # Extract item name and quantity from message
            message_lower = request.message.lower()
            
            # Try to extract quantity (e.g., "remove 2 pizza", "delete 1 burger")
            import re
            quantity_match = re.search(r'\b(\d+)\b', message_lower)
            quantity = int(quantity_match.group(1)) if quantity_match else None
            
            # Remove common words and numbers
            stop_words = ['remove', 'delete', 'from', 'cart', 'the', 'my', 'a', 'an', 'please', 'can', 'you', 'take', 'out']
            words = message_lower.split()
            item_words = [w for w in words if w not in stop_words and not w.isdigit()]
            item_name = " ".join(item_words).strip()
            
            logger.info(f"🗑️ Attempting to remove: '{item_name}' (quantity: {quantity})")
            
            # If no item name found, try to get from cart
            if not item_name:
                cart = cart_service.get_cart(request.user_id)
                if cart:
                    item_name = cart[0]['name']  # Remove first item
                    logger.info(f"🗑️ No item specified, removing first item: '{item_name}'")
            
            # Show current cart before removal
            cart_before = cart_service.get_cart(request.user_id)
            logger.info(f"📦 Cart before removal: {[(item['name'], item['quantity']) for item in cart_before]}")
            
            result = cart_service.remove_from_cart(request.user_id, item_name, quantity)
            
            # Show cart after removal
            cart_after = cart_service.get_cart(request.user_id)
            total = cart_service.get_cart_total(request.user_id)
            logger.info(f"📦 Cart after removal: {[(item['name'], item['quantity']) for item in cart_after]}")
            logger.info(f"💰 New total: ₹{total}")
            
            return ChatResponse(
                response=result['message'],
                context=[],
                cart={"items": cart_after, "total": total},
                action="remove_from_cart"
            )
        
        # For add_to_cart or regular chat, search for items
        context = await rag_service.search(request.message, top_k=3)  # Reduced to 3 for speed
        logger.info(f"🔍 Found {len(context)} relevant items")
        
        if action == 'add_to_cart' and context:
            # Add first matching item to cart
            item = context[0]
            result = cart_service.add_to_cart(request.user_id, item)
            
            cart = cart_service.get_cart(request.user_id)
            total = cart_service.get_cart_total(request.user_id)
            
            response_text = f"✅ {result['message']}! Cart total: ₹{total}"
            
            return ChatResponse(
                response=response_text,
                context=context,
                cart={"items": cart, "total": total},
                action="add_to_cart"
            )
        
        # Regular chat - generate AI response
        cart = cart_service.get_cart(request.user_id)
        total = cart_service.get_cart_total(request.user_id)
        cart_info = {"items": cart, "total": total}
        
        response = await groq_service.generate_response(
            user_message=request.message,
            context=context,
            cart_info=cart_info
        )
        
        return ChatResponse(
            response=response,
            context=context,
            cart=cart_info,
            action="chat"
        )
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "mongodb": mongodb_service.is_connected(),
        "groq": groq_service.is_configured()
    }

@app.get("/api/cart/{user_id}")
async def get_cart(user_id: str = "default"):
    """Get user's cart"""
    cart = cart_service.get_cart(user_id)
    total = cart_service.get_cart_total(user_id)
    return {"items": cart, "total": total}

@app.post("/api/cart/clear/{user_id}")
async def clear_cart(user_id: str = "default"):
    """Clear user's cart"""
    result = cart_service.clear_cart(user_id)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
