// utils/kafka.helpers.js

/**
 * Helper function to parse Kafka message value
 * @param {Buffer} messageValue - Raw Kafka message value buffer
 * @returns {Object|String} - Parsed message
 */
function parseMessageValue(messageValue) {
    if (!messageValue) return null;
    
    const value = messageValue.toString();
    
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // Return as string if not valid JSON
      return value;
    }
  }
  
  /**
   * Generate a Kafka message with standard format
   * @param {String|Object} payload - The message payload
   * @param {Object} options - Additional options 
   * @returns {Object} - Formatted message
   */
  function createKafkaMessage(payload, options = {}) {
    const {
      eventType = 'GENERIC',
      source = 'api-service',
      correlationId = generateCorrelationId(),
      userId = null,
      metadata = {}
    } = options;
    
    return {
      eventType,
      payload,
      metadata: {
        timestamp: Date.now(),
        correlationId,
        source,
        userId,
        ...metadata
      }
    };
  }
  
  /**
   * Generate a unique correlation ID
   * @returns {String} - UUID v4
   */
  function generateCorrelationId() {
    return require('uuid').v4();
  }
  
  /**
   * Format a Kafka error for logging
   * @param {Error} error - The Kafka error
   * @returns {Object} - Formatted error object
   */
  function formatKafkaError(error) {
    return {
      name: error.name,
      message: error.message,
      retriable: error.retriable || false,
      brokerError: error.brokerError || null,
      code: error.code || 'UNKNOWN',
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    };
  }
  
  /**
   * Validate a Kafka topic name
   * @param {String} topic - Topic name to validate
   * @returns {Boolean} - Whether the topic name is valid
   */
  function isValidTopicName(topic) {
    // Kafka topic naming rules:
    // - Cannot be . or ..
    // - Cannot contain / or \
    // - Cannot be longer than 249 characters
    // - Cannot be empty
    if (!topic || typeof topic !== 'string') return false;
    if (topic === '.' || topic === '..') return false;
    if (topic.includes('/') || topic.includes('\\')) return false;
    if (topic.length > 249) return false;
    
    return true;
  }
  
  /**
   * Calculate the recommended number of partitions for a topic
   * @param {Number} expectedMessagesPerSecond - Expected message throughput
   * @param {Number} availableBrokers - Number of Kafka brokers
   * @returns {Number} - Recommended partition count
   */
  function calculatePartitionCount(expectedMessagesPerSecond = 100, availableBrokers = 3) {
    // Simple heuristic: 1 partition per 50 msgs/sec, min 3, max 3x brokers
    const basePartitions = Math.ceil(expectedMessagesPerSecond / 50);
    return Math.max(3, Math.min(basePartitions, availableBrokers * 3));
  }
  
  module.exports = {
    parseMessageValue,
    createKafkaMessage,
    generateCorrelationId,
    formatKafkaError,
    isValidTopicName,
    calculatePartitionCount
  };