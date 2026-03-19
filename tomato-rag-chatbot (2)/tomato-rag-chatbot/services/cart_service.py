"""
Cart Service for Managing Orders
Handles add to cart, remove from cart, checkout
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class CartService:
    def __init__(self):
        # In-memory cart storage (user_id -> cart items)
        self.carts = {}
    
    def get_cart(self, user_id: str = "default") -> List[Dict]:
        """Get user's cart"""
        return self.carts.get(user_id, [])
    
    def add_to_cart(self, user_id: str, item: Dict) -> Dict:
        """Add item to cart"""
        try:
            if user_id not in self.carts:
                self.carts[user_id] = []
            
            # Check if item already in cart
            for cart_item in self.carts[user_id]:
                if cart_item['name'] == item['name']:
                    cart_item['quantity'] += item.get('quantity', 1)
                    logger.info(f"Updated quantity for {item['name']}")
                    return {
                        "success": True,
                        "message": f"Updated {item['name']} quantity to {cart_item['quantity']}",
                        "cart": self.carts[user_id]
                    }
            
            # Add new item
            cart_item = {
                "name": item['name'],
                "price": item.get('price', 0),
                "quantity": item.get('quantity', 1),
                "category": item.get('category', 'unknown'),
                "added_at": datetime.now().isoformat()
            }
            
            self.carts[user_id].append(cart_item)
            logger.info(f"Added {item['name']} to cart")
            
            return {
                "success": True,
                "message": f"Added {item['name']} to cart",
                "cart": self.carts[user_id]
            }
            
        except Exception as e:
            logger.error(f"Error adding to cart: {e}")
            return {
                "success": False,
                "message": "Failed to add item to cart",
                "cart": []
            }
    
    def remove_from_cart(self, user_id: str, item_name: str, quantity: int = None) -> Dict:
        """Remove item from cart (supports quantity)"""
        try:
            if user_id not in self.carts:
                return {
                    "success": False,
                    "message": "Cart is empty",
                    "cart": []
                }
            
            item_name_lower = item_name.lower().strip()
            
            # Find matching item
            found = False
            for item in self.carts[user_id]:
                if item_name_lower in item['name'].lower():
                    found = True
                    
                    if quantity is None or quantity >= item['quantity']:
                        # Remove entire item
                        self.carts[user_id].remove(item)
                        logger.info(f"Removed all {item['name']} from cart")
                        return {
                            "success": True,
                            "message": f"Removed {item['name']} from cart",
                            "cart": self.carts[user_id]
                        }
                    else:
                        # Decrease quantity
                        item['quantity'] -= quantity
                        logger.info(f"Decreased {item['name']} quantity by {quantity}, now {item['quantity']}")
                        return {
                            "success": True,
                            "message": f"Removed {quantity} {item['name']} from cart (remaining: {item['quantity']})",
                            "cart": self.carts[user_id]
                        }
            
            if not found:
                logger.warning(f"Item '{item_name}' not found in cart")
                return {
                    "success": False,
                    "message": f"'{item_name}' not found in cart",
                    "cart": self.carts[user_id]
                }
            
        except Exception as e:
            logger.error(f"Error removing from cart: {e}")
            return {
                "success": False,
                "message": "Failed to remove item",
                "cart": self.carts[user_id] if user_id in self.carts else []
            }
    
    def clear_cart(self, user_id: str) -> Dict:
        """Clear entire cart"""
        self.carts[user_id] = []
        return {
            "success": True,
            "message": "Cart cleared",
            "cart": []
        }
    
    def get_cart_total(self, user_id: str) -> float:
        """Calculate cart total"""
        cart = self.get_cart(user_id)
        total = sum(item['price'] * item['quantity'] for item in cart)
        return total
    
    def checkout(self, user_id: str, delivery_address: str = "") -> Dict:
        """Process checkout"""
        try:
            cart = self.get_cart(user_id)
            
            if not cart:
                return {
                    "success": False,
                    "message": "Cart is empty",
                    "order": None
                }
            
            total = self.get_cart_total(user_id)
            
            order = {
                "order_id": f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "items": cart,
                "total": total,
                "delivery_address": delivery_address,
                "status": "confirmed",
                "ordered_at": datetime.now().isoformat()
            }
            
            # Clear cart after checkout
            self.carts[user_id] = []
            
            logger.info(f"Order placed: {order['order_id']}")
            
            return {
                "success": True,
                "message": f"Order placed successfully! Order ID: {order['order_id']}",
                "order": order
            }
            
        except Exception as e:
            logger.error(f"Error during checkout: {e}")
            return {
                "success": False,
                "message": "Failed to place order",
                "order": None
            }

# Global cart service
cart_service = CartService()
