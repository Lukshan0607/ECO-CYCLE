# AI Chatbot Test Guide

## Testing the EcoBot Chatbot

### Backend Testing
1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Test the chatbot API endpoints:
   - POST `/api/chatbot/chat` - Send messages
   - GET `/api/chatbot/history/:sessionId` - Get chat history
   - GET `/api/chatbot/sessions` - List all sessions

### Frontend Testing
1. Start the frontend:
   ```bash
   cd frontend
   npm start
   ```

2. The chatbot should appear as a floating green button in the bottom-right corner

3. Test conversations:
   - Click the chat button to open
   - Try these test messages:
     * "Hello"
     * "What services do you offer?"
     * "When is my collection day?"
     * "I need technical support"
     * "What products do you sell?"

### Features Implemented
✅ AI-powered intent recognition
✅ Predefined responses for common queries
✅ Session management
✅ Chat history persistence
✅ Responsive UI design
✅ Typing indicators
✅ Quick suggestion buttons
✅ Minimize/maximize functionality
✅ User context awareness

### Supported Intents
- Greetings
- Help and support
- Service information
- Collection schedules
- Product inquiries
- Pricing and billing
- Technical support
- Account management
- Environmental impact
- Recycling tips
- Escalation to human agents

### Integration Points
- MongoDB for chat storage
- Express.js API endpoints
- React frontend components
- User authentication context
- Responsive design for mobile
