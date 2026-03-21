import { Request, Response } from 'express';
import axios from 'axios';
import FoodItem from '../models/FoodItem';
import Restaurant from '../models/Restaurant';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Build rich RAG context by searching MongoDB for relevant food items and restaurants
 * Returns both text context and structured data for rich UI rendering
 */
async function buildRAGContext(userMessage: string) {
  try {
    const lowerMsg = userMessage.toLowerCase();
    const stopWords = ['the', 'and', 'for', 'can', 'you', 'show', 'me', 'want', 'get',
      'have', 'what', 'are', 'how', 'much', 'does', 'cost', 'any', 'give', 'some',
      'please', 'with', 'from', 'this', 'that', 'list', 'all', 'make', 'makes',
      'serve', 'serves', 'tell', 'about', 'which', 'where', 'find', 'best',
      'menu', 'dish', 'dishes', 'food', 'foods', 'restaurant', 'restaurants',
      'price', 'prices', 'order', 'available', 'near', 'nearby'];

    const keywords = lowerMsg
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w));

    // Also extract restaurant name patterns like "X restaurant" or "restaurant X"
    const restaurantNameMatch = lowerMsg.match(/(?:at|from|in|of)\s+([a-z\s]+?)(?:\s+restaurant|\s+menu|\s*\?|$)/i)
      || lowerMsg.match(/([a-z\s]+?)\s+(?:restaurant|menu|dishes|items)/i);

    let foods: any[] = [];
    let restaurants: any[] = [];

    // Search by keywords if we have any
    if (keywords.length > 0) {
      const regexPattern = keywords.join('|');

      foods = await FoodItem.find({
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { category: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } }
        ],
        availability: true
      })
        .populate('restaurantId', 'name address phone rating imageUrl cuisineType')
        .limit(8)
        .lean();

      restaurants = await Restaurant.find({
        $or: [
          { name: { $regex: regexPattern, $options: 'i' } },
          { cuisineType: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } }
        ],
        approvalStatus: 'approved',
        activeStatus: true
      })
        .limit(5)
        .lean();
    }

    // If restaurant name was detected, also search for its menu
    if (restaurantNameMatch) {
      const possibleName = restaurantNameMatch[1].trim();
      if (possibleName.length > 2) {
        const matchedRestaurant = await Restaurant.findOne({
          name: { $regex: possibleName, $options: 'i' },
          approvalStatus: 'approved'
        }).lean();

        if (matchedRestaurant) {
          // Add this restaurant if not already found
          if (!restaurants.find(r => r._id.toString() === matchedRestaurant._id.toString())) {
            restaurants.unshift(matchedRestaurant);
          }
          // Get all available menu items for this restaurant
          const menuItems = await FoodItem.find({
            restaurantId: matchedRestaurant._id,
            availability: true
          })
            .populate('restaurantId', 'name address phone rating imageUrl cuisineType')
            .limit(10)
            .lean();
          // Merge with existing foods (avoid duplicates)
          const existingIds = new Set(foods.map(f => f._id.toString()));
          for (const item of menuItems) {
            if (!existingIds.has(item._id.toString())) {
              foods.push(item);
            }
          }
        }
      }
    }

    // If no keyword results, try broader search with first meaningful word
    if (foods.length === 0 && restaurants.length === 0) {
      // Try to search all available items as fallback for general queries
      const generalFoods = await FoodItem.find({ availability: true })
        .populate('restaurantId', 'name address phone rating imageUrl cuisineType')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      foods = generalFoods;
    }

    // Build text context for LLM
    let context = '';
    if (foods.length > 0) {
      context += '\n\nAvailable food items from our database:\n';
      for (const food of foods) {
        const restaurantName = (food as any).restaurantId?.name || 'Unknown';
        const rating = (food as any).restaurantId?.rating || 'N/A';
        const discount = food.discount > 0 ? ` (${food.discount}% OFF)` : '';
        context += `- ${food.name}: ₹${food.price}${discount} | Category: ${food.category || 'N/A'} | From: ${restaurantName} (Rating: ${rating})\n`;
      }
    }

    if (restaurants.length > 0) {
      context += '\n\nRestaurants from our database:\n';
      for (const r of restaurants) {
        const menu = await FoodItem.countDocuments({ restaurantId: r._id, availability: true });
        context += `- ${r.name}: ${(r as any).cuisineType || 'Multi-cuisine'} | Rating: ${(r as any).rating || 'N/A'} | ${menu} items available | Address: ${(r as any).address || 'N/A'}\n`;
      }
    }

    // Build structured data for rich UI cards
    const structuredFoods = foods.map(food => ({
      _id: food._id,
      name: food.name,
      price: food.price,
      discount: food.discount || 0,
      category: food.category,
      images: food.images || [],
      description: food.description,
      restaurant: {
        name: (food as any).restaurantId?.name || 'Unknown',
        rating: (food as any).restaurantId?.rating || 0,
        imageUrl: (food as any).restaurantId?.imageUrl
      }
    }));

    const structuredRestaurants = restaurants.map(r => ({
      _id: r._id,
      name: r.name,
      cuisineType: (r as any).cuisineType,
      rating: (r as any).rating || 0,
      address: (r as any).address,
      imageUrl: (r as any).imageUrl
    }));

    return { context, foods: structuredFoods, restaurants: structuredRestaurants };
  } catch (error) {
    console.error('RAG context build error:', error);
    return { context: '', foods: [], restaurants: [] };
  }
}

/**
 * POST /api/chatbot/chat
 * Handles chat messages using Groq LLM with MongoDB-backed context
 * Returns rich structured data alongside AI response
 */
export const chatWithBot = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Chatbot service is not configured' });
    }

    // Build RAG context from MongoDB
    const { context, foods, restaurants } = await buildRAGContext(message);

    const systemPrompt = `You are a friendly and helpful food delivery assistant for "Tomato" – a premium food delivery platform.
You help customers find restaurants, discover dishes, get recommendations, and answer questions about orders.

IMPORTANT RULES:
- If food items were found in the database, recommend them with exact prices from the data
- If a user asks about a specific restaurant's menu, list ALL the dishes found from that restaurant
- Always mention the restaurant name when recommending dishes
- If you find dishes with discounts, highlight the discount
- Be concise, warm, and helpful. Use emoji to be friendly
- Keep responses under 150 words
- If no specific data is found, provide general helpful food advice
- Format prices as ₹ followed by the number
- When listing multiple items, use numbered lists for clarity`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message + context }
    ];

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 0.9
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const aiResponse = response.data?.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process that. Please try again.';

    return res.json({
      response: aiResponse,
      foods,
      restaurants,
      action: 'chat',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Chatbot error:', error?.response?.data || error.message);

    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return res.status(504).json({
        response: 'I\'m taking a bit long to respond. Please try again!',
        foods: [],
        restaurants: [],
        action: 'error'
      });
    }

    return res.status(500).json({
      response: 'I\'m having trouble right now. Please try again in a moment! 🙏',
      foods: [],
      restaurants: [],
      action: 'error'
    });
  }
};

/**
 * GET /api/chatbot/health
 */
export const chatbotHealth = async (_req: Request, res: Response) => {
  const apiKey = process.env.GROQ_API_KEY;
  return res.json({
    status: apiKey ? 'configured' : 'not_configured',
    model: GROQ_MODEL,
    timestamp: new Date().toISOString()
  });
};
