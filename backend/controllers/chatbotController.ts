import { Request, Response } from 'express';
import axios from 'axios';
import FoodItem from '../models/FoodItem';
import Restaurant from '../models/Restaurant';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Build context string by searching MongoDB for relevant food items and restaurants
 */
async function buildRAGContext(userMessage: string): Promise<string> {
  try {
    const keywords = userMessage
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'can', 'you', 'show', 'me', 'want', 'get', 'have', 'what', 'are', 'how', 'much', 'does', 'cost', 'any', 'give', 'some', 'please', 'with', 'from', 'this', 'that'].includes(w));

    if (keywords.length === 0) return '';

    // Build a regex pattern from keywords
    const regexPattern = keywords.join('|');

    // Search food items
    const foods = await FoodItem.find({
      $or: [
        { name: { $regex: regexPattern, $options: 'i' } },
        { category: { $regex: regexPattern, $options: 'i' } },
        { description: { $regex: regexPattern, $options: 'i' } }
      ],
      availability: true
    })
      .populate('restaurantId', 'name')
      .limit(5)
      .lean();

    // Search restaurants
    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: regexPattern, $options: 'i' } },
        { cuisineType: { $regex: regexPattern, $options: 'i' } },
        { description: { $regex: regexPattern, $options: 'i' } }
      ],
      approvalStatus: 'approved',
      activeStatus: true
    })
      .limit(3)
      .lean();

    let context = '';

    if (foods.length > 0) {
      context += '\n\nAvailable food items:\n';
      for (const food of foods) {
        const restaurantName = (food as any).restaurantId?.name || 'Unknown';
        context += `- ${food.name}: ₹${food.price} (${food.category || 'N/A'}) from ${restaurantName}\n`;
      }
    }

    if (restaurants.length > 0) {
      context += '\n\nRestaurants:\n';
      for (const r of restaurants) {
        context += `- ${r.name}: ${(r as any).cuisineType || 'Multi-cuisine'} (Rating: ${(r as any).averageRating || 'N/A'})\n`;
      }
    }

    return context;
  } catch (error) {
    console.error('RAG context build error:', error);
    return '';
  }
}

/**
 * POST /api/chatbot/chat
 * Handles chat messages using Groq LLM with MongoDB-backed context
 */
export const chatWithBot = async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Chatbot service is not configured' });
    }

    // Build RAG context from MongoDB
    const context = await buildRAGContext(message);

    const systemPrompt = `You are a friendly and helpful food delivery assistant for "Tomato" – a food delivery platform. 
You help customers find restaurants, discover dishes, get recommendations, and answer questions about orders.
Be concise, warm, and helpful. Use emoji occasionally to be friendly.
If you find relevant food items or restaurants in the context, recommend them with prices.
If you don't have specific menu data, provide general helpful advice.
Keep responses under 100 words unless the user asks for detailed information.`;

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
        max_tokens: 300,
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
      action: 'chat',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Chatbot error:', error?.response?.data || error.message);

    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return res.status(504).json({ 
        response: 'I\'m taking a bit long to respond. Please try again!',
        action: 'error' 
      });
    }

    return res.status(500).json({ 
      response: 'I\'m having trouble right now. Please try again in a moment! 🙏',
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
