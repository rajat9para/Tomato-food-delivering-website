# 🍅 Tomato Voice AI - Food Delivery Assistant

A complete voice-based AI assistant for food delivery with shopping cart, order management, and multi-collection search.

## ✨ Features

- 🎤 **Voice Input/Output** - Speak naturally, AI responds with voice
- 🛒 **Shopping Cart** - Add, remove items with quantity control
- 📦 **Order Management** - Place orders with order ID tracking
- 🔍 **Smart Search** - Searches across foods, restaurants, locations
- ⚡ **Fast Responses** - 1-2 second response time
- 🎨 **Modern UI** - Beautiful, responsive interface
- 🔇 **Mute Control** - Toggle AI voice on/off

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your keys:
```env
GROQ_API_KEY=your_groq_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

**Get Groq API Key (Free):** https://console.groq.com

### 3. Run Server
```bash
python voice_ai_agent.py
```

### 4. Open Browser
```
http://localhost:8000
```

## 🎯 Usage Examples

### Voice Commands

**Browse Items:**
- "What pizzas do you have?"
- "Show me vegetarian options"
- "What's under 200 rupees?"

**Add to Cart:**
- "Add pizza to cart"
- "I want 2 burgers"
- "Order pasta alfredo"

**Manage Cart:**
- "Show my cart"
- "Remove 1 pizza"
- "Remove pasta from cart"

**Checkout:**
- "Checkout"
- "Place order"
- "Confirm order"

## 📁 Project Structure

```
tomato-voice-ai/
├── voice_ai_agent.py          # Main server
├── config.json                # Configuration
├── requirements.txt           # Dependencies
├── services/                  # Backend services
│   ├── cart_service.py       # Cart management
│   ├── groq_service.py       # AI responses
│   ├── mongodb_service.py    # Database operations
│   ├── rag_service.py        # Semantic search
│   └── config_loader.py      # Config management
└── templates/
    └── voice_chat.html       # Web interface
```

## ⚙️ Configuration

Edit `config.json` to enable/disable collections:

```json
{
  "database": {
    "collections": {
      "foods": {"enabled": true},
      "restaurants": {"enabled": true},
      "locations": {"enabled": true}
    }
  }
}
```

The system automatically discovers and indexes enabled collections.

## 🛒 Cart Features

### Add Items
- "Add pizza to cart" - Adds 1 pizza
- "Add 2 burgers" - Adds 2 burgers
- Click items in search results to add

### Remove Items
- "Remove pizza" - Removes all pizza
- "Remove 1 pizza" - Removes only 1, keeps rest
- Quantity-aware removal

### View & Checkout
- "Show my cart" - View all items
- "Checkout" - Place order with order ID

## 🔧 Testing

### Test Cart Operations
```bash
python test_cart_operations.py
```

### Test Action Detection
```bash
python test_cart_actions.py
```

### Test Multi-Collection Search
```bash
python test_multi_collection.py
```

## 📊 Adding Data

### Add Food Items
```bash
python add_food_data.py
```

### Add Restaurants
```bash
python add_restaurant_data.py
```

Or add directly to MongoDB - the system auto-discovers new data!

## 🌐 Browser Compatibility

**Voice Features Work Best In:**
- ✅ Google Chrome
- ✅ Microsoft Edge
- ⚠️ Firefox (limited)
- ❌ Safari (not supported)

## 🔑 API Keys

### Groq API (Required)
- **Cost:** Free tier (generous limits)
- **Get it:** https://console.groq.com
- **Setup:** 5 minutes, no credit card

### MongoDB (Required)
- Use your existing MongoDB Atlas connection
- Or create free cluster at https://cloud.mongodb.com

## 📈 Performance

- **Response Time:** 1-2 seconds
- **Search Results:** Top 3 items (optimized)
- **Token Usage:** ~150 tokens per request
- **Concurrent Users:** Supports multiple users

## 🔒 Security

- ✅ API keys in environment variables
- ✅ MongoDB connection encrypted
- ✅ No sensitive data in code
- ✅ CORS configured

**Important:** Never commit `.env` file to Git!

## 🐛 Troubleshooting

### Server won't start
```bash
pip install -r requirements.txt
```

### Voice not working
- Use Chrome or Edge
- Allow microphone permissions
- Check HTTPS (localhost works)

### Slow responses
- Check internet connection
- Verify Groq API key
- Check MongoDB connection

### Cart not updating
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Check browser console (F12)
- Check server logs

## 📚 Documentation

- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `CART_ORDERING_GUIDE.md` - Cart features
- `MULTI_COLLECTION_GUIDE.md` - Database setup
- `QUANTITY_REMOVAL_GUIDE.md` - Quantity features
- `SYSTEM_OVERVIEW.md` - Architecture details

## 💰 Cost Estimate

**Development/Testing:**
- Groq API: $0 (free tier)
- MongoDB: $0 (free tier)
- **Total: $0**

**Production (1000 users/day):**
- Groq API: $0-5/month
- MongoDB: $0-9/month
- **Total: ~$0-15/month**

## 🚀 Deployment

### Local Development
```bash
python voice_ai_agent.py
```

### Production
```bash
uvicorn voice_ai_agent:app --host 0.0.0.0 --port 8000
```

Or deploy to:
- Heroku
- AWS
- Google Cloud
- Azure
- DigitalOcean

## 🤝 Contributing

This is a team project. To add features:

1. Add data to MongoDB (no code changes needed!)
2. Update `config.json` for new collections
3. Test with provided test scripts
4. Document changes

## 📝 License

[Your License Here]

## 👥 Team

Developed for Tomato food delivery app.

## 📞 Support

For issues:
1. Check documentation
2. Run test scripts
3. Check browser console (F12)
4. Check server logs
5. Contact team lead

---

**Ready to use!** 🎉

Setup time: ~10 minutes | Cost: $0 | Production-ready: ✅
