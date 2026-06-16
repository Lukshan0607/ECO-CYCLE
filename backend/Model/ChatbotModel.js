const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    messages: [{
        type: {
            type: String,
            enum: ['user', 'bot'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        intent: {
            type: String,
            default: null
        },
        confidence: {
            type: Number,
            default: 0
        }
    }],
    userContext: {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        userName: {
            type: String,
            default: 'Guest'
        },
        userType: {
            type: String,
            enum: ['customer', 'employee', 'admin', 'guest'],
            default: 'guest'
        }
    },
    resolved: {
        type: Boolean,
        default: false
    },
    escalated: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

chatbotSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Chatbot', chatbotSchema);
