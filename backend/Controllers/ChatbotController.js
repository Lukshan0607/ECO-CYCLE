const Chatbot = require('../Model/ChatbotModel');
const asyncHandler = require('express-async-handler');

// Enhanced intent recognition with better keyword matching
const intents = {
  greeting: {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'welcome', 'start'],
    priority: 1
  },
  help: {
    keywords: ['help', 'assist', 'support', 'what can you do', 'capabilities', 'how can you help', 'guide'],
    priority: 2
  },
  services: {
    keywords: ['services', 'service', 'offer', 'provide', 'what do you do', 'solutions', 'programs'],
    priority: 3
  },
  collection: {
    keywords: ['collection', 'collect', 'pickup', 'schedule', 'when', 'delivery', 'frequency', 'day', 'time', 'collection days', 'when can you collect'],
    priority: 4
  },
  products: {
    keywords: ['products', 'buy', 'purchase', 'shop', 'catalog', 'items', 'merchandise', 'store', 'sell', 'available', 'product range'],
    priority: 5
  },
  pricing: {
    keywords: ['price', 'cost', 'fee', 'charge', 'how much', 'billing', 'payment', 'expensive', 'affordable', 'rates', 'pricing', 'quote'],
    priority: 6
  },
  contact: {
    keywords: ['contact', 'phone', 'email', 'address', 'call', 'reach', 'customer service', 'support team', 'office'],
    priority: 7
  },
  technical: {
    keywords: ['technical', 'problem', 'issue', 'error', 'bug', 'broken', 'not working', 'crash', 'slow', 'glitch', 'app'],
    priority: 8
  },
  billing: {
    keywords: ['bill', 'invoice', 'statement', 'charge', 'payment', 'due', 'account balance', 'refund', 'credit'],
    priority: 9
  },
  account: {
    keywords: ['account', 'profile', 'login', 'register', 'settings', 'update', 'password', 'username', 'personal', 'information'],
    priority: 10
  },
  environmental: {
    keywords: ['environment', 'impact', 'green', 'eco', 'sustainable', 'planet', 'climate', 'carbon', 'waste', 'pollution'],
    priority: 11
  },
  recycling_tips: {
    keywords: ['recycle', 'recycling', 'tips', 'how to', 'guidelines', 'best practices', 'should i', 'can i recycle', 'what to recycle'],
    priority: 12
  },
  escalation: {
    keywords: ['human', 'agent', 'representative', 'speak to someone', 'transfer', 'manager', 'supervisor'],
    priority: 13
  }
};

// Enhanced response library with follow-up suggestions
const responses = {
  greeting: [
    { text: "Hello! I'm EcoBot, your virtual assistant for EcoCycle. How can I help you today? 🌍", suggestions: ['Services', 'Collection Schedule', 'Products', 'Help'] },
    { text: "Hi there! Welcome to EcoCycle. I'm here to assist you with recycling and waste management. What brings you here?", suggestions: ['Services', 'Collection Days', 'Pricing', 'Contact'] },
    { text: "Greetings! I'm EcoBot. Ready to help with your recycling needs. What would you like to know?", suggestions: ['How to Recycle', 'Collection Info', 'Products', 'Account'] }
  ],
  help: [
    { text: "I can assist with:\n📋 Recycling services & programs\n⏰ Collection schedules\n🛍️ Eco-friendly products\n💳 Billing & payments\n🔧 Technical support\n🌱 Environmental tips\n\nWhat interests you?", suggestions: ['Services', 'Schedule', 'Products', 'Account Help'] },
    { text: "Here's what I can help with: service information, collection schedules, product purchases, account management, billing questions, technical support, and recycling tips. What do you need?", suggestions: ['Services', 'Schedule', 'Billing', 'Technical Help'] }
  ],
  services: [
    { text: "EcoCycle offers:\n🏠 Residential & commercial waste collection\n♻️ Multi-material recycling programs\n🏭 Industrial waste management\n📚 Educational workshops\n🏢 Corporate sustainability solutions\n🛍️ Recycled products marketplace\n\nWhich would you like to explore?", suggestions: ['Residential', 'Commercial', 'Pricing', 'Schedule'] },
    { text: "Our comprehensive services include residential & commercial collection, various recycling programs, industrial solutions, education, and recycled product sales. What service level interests you?", suggestions: ['Residential Plan', 'Business Plan', 'Learn More', 'Products'] }
  ],
  collection: [
    { text: "📅 To find your collection schedule, I need your zip code or address. We typically collect:\n• Weekly for residential (1-3 times/week)\n• Bi-weekly or custom for commercial\n• All materials: paper, plastic, glass, metals\n\nWhat's your location?", suggestions: ['Enter Zip Code', 'Find Service', 'More Info'] },
    { text: "Collection details vary by location. To check YOUR schedule, please share your zip code or neighborhood. We offer flexible collection frequencies and handle paper, plastics, glass, and metals.", suggestions: ['Check Schedule', 'Learn More', 'Contact Us'] }
  ],
  products: [
    { text: "🛍️ Our eco-friendly product range includes:\n📄 Recycled paper products\n🔵 Plastic items (bags, containers)\n🟢 Glass products\n🪙 Metal items\n🌿 Composting supplies\n\nWhich category interests you? Or visit our shop!", suggestions: ['Paper Products', 'Plastic Items', 'Glass', 'Composting'] },
    { text: "We offer quality products made from recycled materials: paper goods, plastic containers, glass items, metal products, and composting supplies. Visit our product page or tell me what you're looking for!", suggestions: ['Browse Shop', 'Paper Products', 'Plastic', 'Other'] }
  ],
  pricing: [
    { text: "💰 Our pricing structure:\n🏠 Residential: Starting $15-30/month (based on frequency)\n🏢 Commercial: Custom quotes\n🛍️ Products: Vary by item ($5-200+)\n\nWhat service interests you?", suggestions: ['Residential Plan', 'Commercial Quote', 'Product Prices'] },
    { text: "Pricing depends on your location and service type. Residential plans start at $15/month for weekly collection. Commercial services are customized. Products range from $5-200+ each. Want a quote?", suggestions: ['Get Quote', 'Residential Plans', 'Product Pricing'] }
  ],
  contact: [
    { text: "📞 Reach EcoCycle Support:\n☎️ Phone: 1-800-ECO-CYCLE\n📧 Email: support@ecocycle.com\n💬 Live Chat: Available 9AM-6PM\n🏢 Visit us: Check locations page\n\nHow would you like to connect?", suggestions: ['Call Us', 'Email', 'Live Chat', 'Locations'] },
    { text: "Multiple ways to contact us: Call 1-800-ECO-CYCLE, email support@ecocycle.com, use live chat (9AM-6PM), or visit our local centers. What works best for you?", suggestions: ['Phone', 'Email', 'Chat', 'Find Office'] }
  ],
  technical: [
    { text: "🔧 Let's troubleshoot:\n1️⃣ Clear cache & cookies\n2️⃣ Try a different browser\n3️⃣ Check internet connection\n4️⃣ Update to latest version\n5️⃣ Restart your device\n\nDoes this help? If not, our tech team is ready!", suggestions: ['Try These Steps', 'Contact Support', 'Report Issue'] },
    { text: "Common fixes: clear your browser cache, try a different browser, check connection, update the app, or restart. Still having issues? Our 24/7 tech support team can help!", suggestions: ['Tech Support', 'Report Bug', 'Contact Us'] }
  ],
  billing: [
    { text: "💳 Billing Information:\n📱 View statements in your account\n💰 Payment methods: Card, PayPal, Bank transfer\n📅 Due dates: 1st of each month\n⚠️ Late fees: Apply after 5 days\n\nWhat billing help do you need?", suggestions: ['View Statement', 'Payment Method', 'Make Payment'] },
    { text: "You can view all statements in your account dashboard. We accept credit cards, PayPal, and bank transfers. Payments are due by the 1st of each month. Need to update payment info?", suggestions: ['Update Payment', 'Make Payment', 'View Bill'] }
  ],
  account: [
    { text: "👤 Your Account Features:\n✏️ Update profile & contact info\n💳 Manage payment methods\n📊 View service history\n📥 Download statements\n🔔 Notification settings\n\nWhat would you like to manage?", suggestions: ['Edit Profile', 'Payment Method', 'Notifications'] },
    { text: "In your account you can: update personal info, change payment methods, view collection history, download receipts, and adjust notification preferences. What do you need?", suggestions: ['Profile Settings', 'Payments', 'History', 'Preferences'] }
  ],
  environmental: [
    { text: "🌍 EcoCycle's Impact So Far:\n🗑️ 1,000,000+ tons diverted from landfills\n🌳 500,000+ trees saved\n👥 200,000+ households served\n⭐ 95% customer satisfaction\n\nTogether, we're making a real difference! Ready to join?", suggestions: ['Learn More', 'Get Started', 'Products'] },
    { text: "Our community has diverted over 1 million tons from landfills, saved 500K+ trees, and serves 200K+ households. Every recycling effort counts! Want to contribute?", suggestions: ['Start Service', 'Learn More', 'Track Impact'] }
  ],
  recycling_tips: [
    { text: "♻️ Recycling Best Practices:\n🧼 Clean containers before recycling\n📋 Sort materials by type\n🔩 Remove caps from bottles\n📦 Flatten cardboard boxes\n🚫 Keep electronics separate\n\nWhat specific recycling questions do you have?", suggestions: ['What to Recycle', 'How to Sort', 'Electronics'] },
    { text: "Key tips: rinse containers, sort by material type, remove lids, flatten boxes, and keep hazardous items separate. Check your local guidelines for accepted items. What would you like to recycle?", suggestions: ['Recycling Guide', 'Accepted Items', 'Tips'] }
  ],
  escalation: [
    { text: "I understand you need specialized assistance. I'm connecting you with a human agent who has expertise in your area. One moment please... 🔄", suggestions: ['Wait for Agent', 'Leave Message'] },
    { text: "You'll be talking with one of our specialist agents shortly. They have access to your full account and can provide personalized help. Thank you for your patience! ⏳", suggestions: ['Wait', 'Leave Message', 'Callback'] }
  ],
  fallback: [
    { text: "I'm not quite sure I understand. 🤔 Try asking about: services, collection schedules, products, pricing, account help, recycling tips, or contact info. What interests you?", suggestions: ['Services', 'Schedule', 'Products', 'Help'] },
    { text: "Let me help you better! Ask about recycling programs, collection days, eco-products, pricing, account management, or contact our team. What can I assist with?", suggestions: ['Services', 'Schedule', 'Products', 'Contact'] }
  ]
};

// Improved intent detection with context awareness
const getIntent = (message, previousMessages = []) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for multi-word phrases first
  const phrases = {
    'collection schedule': 'collection',
    'collection day': 'collection',
    'when do you collect': 'collection',
    'how much': 'pricing',
    'contact us': 'contact',
    'speak to someone': 'escalation',
    'need help': 'help',
    'how to recycle': 'recycling_tips',
    'can i recycle': 'recycling_tips'
  };

  for (const [phrase, intent] of Object.entries(phrases)) {
    if (lowerMessage.includes(phrase)) {
      return intent;
    }
  }

  // Then check individual keywords with scoring
  let bestMatch = { intent: 'unknown', score: 0 };

  for (const [intentName, intentData] of Object.entries(intents)) {
    let score = 0;
    const words = lowerMessage.split(/\s+/);

    for (const keyword of intentData.keywords) {
      // Exact match worth more points
      if (lowerMessage.includes(keyword)) {
        score += 2;
      }
      // Word match
      if (words.some(word => word.includes(keyword))) {
        score += 1;
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { intent: intentName, score };
    }
  }

  return bestMatch.score > 0 ? bestMatch.intent : 'unknown';
};

// Confidence scoring based on match quality
const calculateConfidence = (intent, message) => {
  if (intent === 'unknown') return 0.3;
  if (intent === 'greeting') return 0.95;
  
  const messageLength = message.trim().split(/\s+/).length;
  let confidence = 0.7;
  
  // Longer, more specific messages get higher confidence
  if (messageLength >= 5) confidence += 0.15;
  if (messageLength >= 10) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
};

// Get contextualized response
const getResponse = (intent, previousContext = null) => {
  const responseArray = responses[intent] || responses.fallback;
  const selectedResponse = responseArray[Math.floor(Math.random() * responseArray.length)];
  return selectedResponse;
};

// Enhanced chat endpoint with better context handling
const chat = asyncHandler(async (req, res) => {
  const { message, sessionId, userId, userName, userType } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Message and sessionId are required'
    });
  }

  // Find or create chat session
  let chatSession = await Chatbot.findOne({ sessionId });
  
  if (!chatSession) {
    chatSession = new Chatbot({
      sessionId,
      userContext: {
        userId: userId || null,
        userName: userName || 'Guest',
        userType: userType || 'guest'
      }
    });
  }

  // Add user message
  chatSession.messages.push({
    type: 'user',
    message,
    timestamp: new Date()
  });

  // Get intent with context awareness
  const previousMessages = chatSession.messages.slice(-6).map(m => m.message);
  const intent = getIntent(message, previousMessages);
  const confidence = calculateConfidence(intent, message);
  
  // Get response with suggestions
  const responseData = getResponse(intent, { previousMessages, intent });
  const botResponse = responseData.text;
  const suggestions = responseData.suggestions || [];

  // Add bot response
  chatSession.messages.push({
    type: 'bot',
    message: botResponse,
    suggestions,
    timestamp: new Date(),
    intent,
    confidence
  });

  // Enhanced escalation detection
  if (intent === 'escalation' || message.toLowerCase().includes('human agent') || message.toLowerCase().includes('transfer')) {
    chatSession.escalated = true;
  }

  // Update context tracking
  if (!chatSession.userContext) {
    chatSession.userContext = {};
  }
  chatSession.userContext.lastIntent = intent;
  chatSession.userContext.lastInteractionTime = new Date();

  await chatSession.save();

  res.json({
    success: true,
    response: botResponse,
    suggestions,
    intent,
    confidence,
    sessionId,
    escalated: chatSession.escalated
  });
});

// Get chat history for a session
const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required'
    });
  }

  const chatSession = await Chatbot.findOne({ sessionId });

  if (!chatSession) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  res.json({
    success: true,
    messages: chatSession.messages,
    resolved: chatSession.resolved,
    escalated: chatSession.escalated,
    createdAt: chatSession.createdAt
  });
});

// Get all chat sessions (for admin/management)
const getChatSessions = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  
  let query = {};
  if (userId) {
    query['userContext.userId'] = userId;
  }

  const sessions = await Chatbot.find(query)
    .sort({ updatedAt: -1 })
    .select('sessionId userContext resolved escalated createdAt updatedAt');

  res.json({
    success: true,
    sessions
  });
});

// Mark chat session as resolved
const markResolved = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const chatSession = await Chatbot.findOneAndUpdate(
    { sessionId },
    { resolved: true },
    { new: true }
  );

  if (!chatSession) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  res.json({
    success: true,
    message: 'Chat session marked as resolved'
  });
});

// Delete chat session
const deleteSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const result = await Chatbot.deleteOne({ sessionId });

  if (result.deletedCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Chat session not found'
    });
  }

  res.json({
    success: true,
    message: 'Chat session deleted successfully'
  });
});

module.exports = {
  chat,
  getChatHistory,
  getChatSessions,
  markResolved,
  deleteSession
};
