import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Lightbulb } from 'lucide-react';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Generate or retrieve session ID
    let storedSessionId = localStorage.getItem('chatbot_session_id');
    if (!storedSessionId) {
      storedSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbot_session_id', storedSessionId);
    }
    setSessionId(storedSessionId);

    // Load chat history
    loadChatHistory(storedSessionId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const loadChatHistory = async (sessionId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chatbot/history/${sessionId}`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.success && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.warn('Could not load chat history:', error.message);
      // Don't block chat if history fails to load
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const sendMessage = async (messageToSend) => {
    const messageText = messageToSend || inputMessage.trim();
    if (!messageText) return;

    const userMessage = {
      type: 'user',
      message: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageToSend) {
      setInputMessage('');
    }
    setSuggestions([]);
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chatbot/chat', {
        message: messageText,
        sessionId: sessionId,
        userId: localStorage.getItem('userId') || null,
        userName: localStorage.getItem('userName') || 'Guest',
        userType: localStorage.getItem('userType') || 'guest'
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        const botMessage = {
          type: 'bot',
          message: response.data.response || 'I understand, but I need to process this better.',
          suggestions: response.data.suggestions || [],
          timestamp: new Date().toISOString(),
          intent: response.data.intent,
          confidence: response.data.confidence
        };
        setMessages(prev => [...prev, botMessage]);
        setSuggestions(response.data.suggestions || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        message: error.message?.includes('timeout') 
          ? 'Sorry, the response took too long. Please try again.'
          : 'Sorry, I encountered an error. Please try again later.',
        suggestions: ['Contact Support', 'Try Again', 'Help'],
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      setSuggestions(['Contact Support', 'Try Again', 'Help']);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isTyping) {
        sendMessage();
      }
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const clearChat = () => {
    setMessages([]);
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    localStorage.setItem('chatbot_session_id', newSessionId);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="chatbot-fab"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
        <span className="chatbot-fab-text">Chat with EcoBot</span>
      </button>
    );
  }

  return (
    <div className={`chatbot-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-header">
        <div className="chatbot-header-content">
          <Bot size={20} />
          <div className="chatbot-header-text">
            <h3>EcoBot</h3>
            <span className="chatbot-status">Online</span>
          </div>
        </div>
        <div className="chatbot-header-actions">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="chatbot-header-btn"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="chatbot-header-btn"
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                <Bot size={48} />
                <h4>Welcome to EcoBot! 🌍</h4>
                <p>I'm here to help you with recycling, waste management, and EcoCycle services. What can I assist you with?</p>
                <div className="quick-suggestions">
                  <button onClick={() => sendMessage('What services do you offer?')} disabled={isTyping} title="Ask about our services">
                    🏭 Services
                  </button>
                  <button onClick={() => sendMessage('When is my collection day?')} disabled={isTyping} title="Check collection schedule">
                    📅 Schedule
                  </button>
                  <button onClick={() => sendMessage('What products do you sell?')} disabled={isTyping} title="Browse products">
                    🛍️ Products
                  </button>
                  <button onClick={() => sendMessage('I need technical support')} disabled={isTyping} title="Get technical help">
                    🔧 Support
                  </button>
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`chatbot-message ${message.type === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.message}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
                {message.type === 'bot' && message.suggestions && message.suggestions.length > 0 && (
                  <div className="message-suggestions">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        disabled={isTyping}
                        className="suggestion-button"
                        title={`Ask: ${suggestion}`}
                      >
                        <Lightbulb size={12} />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="chatbot-message bot-message">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <div className="chatbot-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="chatbot-input"
                disabled={isTyping}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="chatbot-send-btn"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="chatbot-actions">
              <button onClick={clearChat} className="chatbot-action-btn">
                Clear Chat
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
