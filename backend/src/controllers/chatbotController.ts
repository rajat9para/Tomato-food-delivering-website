import { Request, Response } from 'express';
import axios from 'axios';
import FoodItem from '../models/FoodItem';
import Restaurant from '../models/Restaurant';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

type SortOption = 'rating' | 'price' | 'discount';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'can', 'you', 'show', 'me', 'want', 'get', 'have',
  'what', 'are', 'how', 'much', 'does', 'cost', 'any', 'give', 'some',
  'please', 'with', 'from', 'this', 'that', 'list', 'all', 'make', 'makes',
  'serve', 'serves', 'tell', 'about', 'which', 'where', 'find', 'best',
  'menu', 'dish', 'dishes', 'food', 'foods', 'restaurant', 'restaurants',
  'price', 'prices', 'order', 'available', 'near', 'nearby', 'cheap',
  'cheapest', 'top', 'rated', 'discount', 'offer', 'offers'
]);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSort = (value: unknown): SortOption => {
  return value === 'price' || value === 'discount' || value === 'rating' ? value : 'rating';
};

const getKeywords = (message: string) => {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 8);
};

const sortFoods = (foods: any[], sortBy: SortOption) => {
  return [...foods].sort((a, b) => {
    if (sortBy === 'price') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'discount') return (b.discount || 0) - (a.discount || 0);
    return ((b.restaurantId as any)?.rating || 0) - ((a.restaurantId as any)?.rating || 0);
  });
};

const sortRestaurants = (restaurants: any[], sortBy: SortOption) => {
  return [...restaurants].sort((a, b) => {
    if (sortBy === 'price') return (a.averagePrice || 0) - (b.averagePrice || 0);
    if (sortBy === 'discount') return (b.maxDiscount || 0) - (a.maxDiscount || 0);
    return (b.rating || 0) - (a.rating || 0);
  });
};

const buildRestaurantStats = async (restaurantIds: any[]) => {
  if (restaurantIds.length === 0) return new Map<string, { averagePrice: number; maxDiscount: number; menuCount: number; firstImage?: string }>();

  const stats = await FoodItem.aggregate([
    { $match: { restaurantId: { $in: restaurantIds }, availability: true } },
    {
      $group: {
        _id: '$restaurantId',
        averagePrice: { $avg: '$price' },
        maxDiscount: { $max: '$discount' },
        menuCount: { $sum: 1 },
        firstImage: { $first: { $arrayElemAt: ['$images', 0] } }
      }
    }
  ]);

  return new Map(stats.map(item => [item._id.toString(), {
    averagePrice: Math.round(item.averagePrice || 0),
    maxDiscount: item.maxDiscount || 0,
    menuCount: item.menuCount || 0,
    firstImage: item.firstImage
  }]));
};

async function buildRAGContext(userMessage: string, sortBy: SortOption) {
  try {
    const keywords = getKeywords(userMessage);
    const regexPattern = keywords.length > 0 ? keywords.map(escapeRegExp).join('|') : '';
    const queryRegex = regexPattern ? new RegExp(regexPattern, 'i') : null;

    let foods: any[] = [];
    let restaurants: any[] = [];

    if (queryRegex) {
      foods = await FoodItem.find({
        availability: true,
        $or: [
          { name: queryRegex },
          { category: queryRegex },
          { description: queryRegex }
        ]
      })
        .populate('restaurantId', 'name address phone rating imageUrl cuisineType openingTime closingTime')
        .limit(20)
        .lean();

      restaurants = await Restaurant.find({
        approvalStatus: 'approved',
        activeStatus: true,
        isRemoved: { $ne: true },
        $or: [
          { name: queryRegex },
          { cuisineType: queryRegex },
          { description: queryRegex },
          { address: queryRegex }
        ]
      })
        .limit(12)
        .lean();
    }

    const restaurantPhraseMatch = userMessage.toLowerCase().match(/(?:from|at|in|of)\s+([a-z0-9\s&'-]{3,})(?:\s+restaurant|\s+menu|\s+dishes|\?|$)/i)
      || userMessage.toLowerCase().match(/([a-z0-9\s&'-]{3,})\s+(?:restaurant|menu|dishes|items)/i);

    if (restaurantPhraseMatch) {
      const possibleName = restaurantPhraseMatch[1].trim();
      const matchedRestaurant = await Restaurant.findOne({
        name: { $regex: escapeRegExp(possibleName), $options: 'i' },
        approvalStatus: 'approved',
        activeStatus: true,
        isRemoved: { $ne: true }
      }).lean();

      if (matchedRestaurant) {
        if (!restaurants.some(r => r._id.toString() === matchedRestaurant._id.toString())) {
          restaurants.unshift(matchedRestaurant);
        }

        const menuItems = await FoodItem.find({
          restaurantId: matchedRestaurant._id,
          availability: true
        })
          .populate('restaurantId', 'name address phone rating imageUrl cuisineType openingTime closingTime')
          .limit(30)
          .lean();

        const existingFoodIds = new Set(foods.map(food => food._id.toString()));
        foods.push(...menuItems.filter(item => !existingFoodIds.has(item._id.toString())));
      }
    }

    if (foods.length === 0 && restaurants.length === 0) {
      foods = await FoodItem.find({ availability: true })
        .populate('restaurantId', 'name address phone rating imageUrl cuisineType openingTime closingTime')
        .sort({ discount: -1, price: 1 })
        .limit(10)
        .lean();
    }

    const foodRestaurantIds = foods
      .map(food => (food.restaurantId as any)?._id)
      .filter(Boolean);

    const allRestaurantIds = [
      ...restaurants.map(r => r._id),
      ...foodRestaurantIds
    ];

    const statsByRestaurant = await buildRestaurantStats(allRestaurantIds);
    const restaurantById = new Map<string, any>();

    restaurants.forEach(restaurant => restaurantById.set(restaurant._id.toString(), restaurant));
    foods.forEach(food => {
      const restaurant = food.restaurantId as any;
      if (restaurant?._id && !restaurantById.has(restaurant._id.toString())) {
        restaurantById.set(restaurant._id.toString(), restaurant);
      }
    });

    const sortedFoods = sortFoods(foods, sortBy).slice(0, 12);
    const enrichedRestaurants = Array.from(restaurantById.values()).map(restaurant => {
      const stats = statsByRestaurant.get(restaurant._id.toString()) || {
        averagePrice: 0,
        maxDiscount: 0,
        menuCount: 0
      };

      return {
        ...restaurant,
        averagePrice: stats.averagePrice,
        maxDiscount: stats.maxDiscount,
        menuCount: stats.menuCount,
        coverImage: restaurant.coverImage || restaurant.imageUrl || stats.firstImage
      };
    });

    const sortedRestaurants = sortRestaurants(enrichedRestaurants, sortBy).slice(0, 8);

    let context = '';
    if (sortedFoods.length > 0) {
      context += '\n\nFood results from the live database:\n';
      sortedFoods.forEach((food, index) => {
        const restaurant = food.restaurantId as any;
        const discount = food.discount > 0 ? `, ${food.discount}% off` : '';
        context += `${index + 1}. ${food.name} - Rs ${food.price}${discount}, ${food.category || 'Food'}, from ${restaurant?.name || 'Unknown restaurant'}, rating ${restaurant?.rating || 'N/A'}.\n`;
      });
    }

    if (sortedRestaurants.length > 0) {
      context += '\n\nRestaurant results from the live database:\n';
      sortedRestaurants.forEach((restaurant, index) => {
        context += `${index + 1}. ${restaurant.name} - ${(restaurant.cuisineType || []).join(', ') || 'Multi-cuisine'}, rating ${restaurant.rating || 'N/A'}, ${restaurant.menuCount || 0} available items, address ${restaurant.address || 'N/A'}.\n`;
      });
    }

    const structuredFoods = sortedFoods.map(food => {
      const restaurant = food.restaurantId as any;
      return {
        _id: food._id.toString(),
        type: 'food',
        name: food.name,
        price: food.price,
        discount: food.discount || 0,
        category: food.category,
        images: food.images || [],
        description: food.description,
        restaurant: {
          _id: restaurant?._id?.toString() || '',
          name: restaurant?.name || 'Unknown restaurant',
          rating: restaurant?.rating || 0,
          imageUrl: restaurant?.imageUrl,
          address: restaurant?.address,
          cuisineType: restaurant?.cuisineType || [],
          openingTime: restaurant?.openingTime,
          closingTime: restaurant?.closingTime
        },
        navigateTo: '/customer/home'
      };
    });

    const structuredRestaurants = sortedRestaurants.map(restaurant => ({
      _id: restaurant._id.toString(),
      type: 'restaurant',
      name: restaurant.name,
      cuisineType: restaurant.cuisineType || [],
      rating: restaurant.rating || 0,
      totalReviews: restaurant.totalReviews || 0,
      address: restaurant.address,
      phone: restaurant.phone,
      imageUrl: restaurant.imageUrl,
      coverImage: restaurant.coverImage,
      openingTime: restaurant.openingTime,
      closingTime: restaurant.closingTime,
      averagePrice: restaurant.averagePrice || 0,
      maxDiscount: restaurant.maxDiscount || 0,
      menuCount: restaurant.menuCount || 0,
      navigateTo: '/customer/home'
    }));

    return {
      context,
      foods: structuredFoods,
      restaurants: structuredRestaurants,
      sortBy,
      totalResults: structuredFoods.length + structuredRestaurants.length
    };
  } catch (error) {
    console.error('RAG context build error:', error);
    return { context: '', foods: [], restaurants: [], sortBy, totalResults: 0 };
  }
}

export const chatWithBot = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const sortBy = normalizeSort(req.body?.sortBy);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const { context, foods, restaurants, totalResults } = await buildRAGContext(message, sortBy);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({
        response: totalResults > 0
          ? 'I found live database matches for you. Open any card to view the restaurant menu.'
          : 'I could not find matching food or restaurants right now.',
        foods,
        restaurants,
        sortBy,
        action: 'database_results',
        timestamp: new Date().toISOString()
      });
    }

    const systemPrompt = `You are Tomato's food delivery assistant.
Use only the live database context when recommending specific dishes or restaurants.
Keep the answer under 120 words.
Mention exact prices, discounts, and restaurant names when available.
If database results exist, tell the user they can open the cards below to view the menu.
If no database result exists, give a short helpful fallback and ask for a dish, cuisine, or restaurant name.`;

    const llmResponse = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${message}\n${context}` }
        ],
        temperature: 0.4,
        max_tokens: 350,
        top_p: 0.9
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const aiResponse = llmResponse.data?.choices?.[0]?.message?.content
      || 'I found matching database results for you.';

    return res.json({
      response: aiResponse,
      foods,
      restaurants,
      sortBy,
      action: 'chat',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chatbot error:', error?.response?.data || error.message);

    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return res.status(504).json({
        response: 'The chatbot is taking too long. Please try again.',
        foods: [],
        restaurants: [],
        action: 'error'
      });
    }

    return res.status(500).json({
      response: 'I am having trouble right now. Please try again in a moment.',
      foods: [],
      restaurants: [],
      action: 'error'
    });
  }
};

export const chatbotHealth = async (_req: Request, res: Response) => {
  return res.json({
    status: process.env.GROQ_API_KEY ? 'configured' : 'database_only',
    model: GROQ_MODEL,
    timestamp: new Date().toISOString()
  });
};
