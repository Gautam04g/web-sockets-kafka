// models/message.model.js
const mongoose = require('mongoose');

/**
 * Schema for storing Kafka messages
 * Used for persistence and history of important messages
 */
const MessageSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String,
    default: null,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  partition: {
    type: Number,
    default: 0
  },
  offset: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for query optimization
MessageSchema.index({ topic: 1, timestamp: -1 });
MessageSchema.index({ processed: 1, topic: 1 });

// Instance method to mark message as processed
MessageSchema.methods.markProcessed = function() {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

// Static method to find unprocessed messages
MessageSchema.statics.findUnprocessed = function(topic) {
  const query = { processed: false };
  if (topic) {
    query.topic = topic;
  }
  return this.find(query).sort({ timestamp: 1 });
};

module.exports = mongoose.model('Message', MessageSchema);