// services/kafka.service.js
const { kafka, producer, consumer, TOPICS } = require('../config/kafka.config');
const { v4: uuidv4 } = require('uuid');

// Store active socket connections to send Kafka messages to
const socketConnections = new Map();

/**
 * Initialize Kafka connections
 */
async function initializeKafka(io) {
  try {
    // Connect the producer
    await producer.connect();
    console.log('Kafka producer connected successfully');
    
    // Connect the consumer
    await consumer.connect();
    console.log('Kafka consumer connected successfully');
    
    // Subscribe to topics
    await subscribeToTopics([
      TOPICS.USER_EVENTS,
      TOPICS.NOTIFICATIONS,
      TOPICS.SYSTEM_LOGS,
      TOPICS.DATA_UPDATES
    ]);
    
    // Run the consumer with message handler
    await consumer.run({
      eachMessage: async ({ topic, partition, message, heartbeat }) => {
        try {
          const value = message.value.toString();
          const key = message.key ? message.key.toString() : null;
          const headers = message.headers ? 
            Object.entries(message.headers).reduce((acc, [key, value]) => {
              acc[key] = value.toString();
              return acc;
            }, {}) : {};
          
          console.log(`Received message from topic ${topic}:`, { 
            key, 
            value: value.substring(0, 100) + (value.length > 100 ? '...' : ''),
            partition,
            offset: message.offset,
            timestamp: message.timestamp
          });
          
          // Parse the message value if it's JSON
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch (e) {
            parsedValue = value;
          }
          
          // Emit to connected WebSocket clients
          if (io) {
            io.emit(`kafka-message:${topic}`, {
              topic,
              key,
              value: parsedValue,
              headers,
              partition,
              offset: message.offset,
              timestamp: message.timestamp
            });
          }
          
          // Process specific message types
          if (topic === TOPICS.NOTIFICATIONS) {
            processNotification(parsedValue);
          }
          
          // Acknowledge the message (important for some Kafka configurations)
          await heartbeat();
        } catch (err) {
          console.error(`Error processing message from topic ${topic}:`, err);
        }
      },
      autoCommit: true,
      autoCommitInterval: 5000,
      autoCommitThreshold: 100
    });
    
    console.log('Kafka consumer is running');
    return true;
  } catch (error) {
    console.error('Failed to initialize Kafka:', error);
    throw error;
  }
}

/**
 * Subscribe consumer to list of topics
 */
async function subscribeToTopics(topics) {
  try {
    for (const topic of topics) {
      await consumer.subscribe({ 
        topic, 
        fromBeginning: false 
      });
      console.log(`Subscribed to topic: ${topic}`);
    }
  } catch (error) {
    console.error('Failed to subscribe to topics:', error);
    throw error;
  }
}

/**
 * Send message to a Kafka topic
 */
async function sendMessage(topic, message, key = null, partition = null) {
  try {
    // Convert message to string if it's an object
    const messageValue = typeof message === 'object' ? 
      JSON.stringify(message) : String(message);
    
    // Prepare message payload
    const payload = {
      topic,
      messages: [{
        value: messageValue,
        key: key || uuidv4(),
        headers: {
          'source': 'api-service',
          'timestamp': Date.now().toString()
        }
      }]
    };
    
    // Add partition if provided
    if (partition !== null && partition !== undefined) {
      payload.messages[0].partition = partition;
    }
    
    // Send the message to Kafka
    const result = await producer.send(payload);
    console.log(`Message sent to topic ${topic}:`, result);
    
    return result;
  } catch (error) {
    console.error(`Failed to send message to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Process notification messages
 */
function processNotification(notification) {
  // Logic for processing notifications
  console.log('Processing notification:', notification);
}

/**
 * List all available Kafka topics
 */
async function listTopics() {
  try {
    const admin = kafka.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    await admin.disconnect();
    return topics;
  } catch (error) {
    console.error('Failed to list topics:', error);
    throw error;
  }
}

/**
 * Create a new Kafka topic
 */
async function createTopic(topic, numPartitions = 1, replicationFactor = 1) {
  try {
    const admin = kafka.admin();
    await admin.connect();
    
    await admin.createTopics({
      topics: [{
        topic,
        numPartitions,
        replicationFactor
      }],
      waitForLeaders: true
    });
    
    await admin.disconnect();
    return true;
  } catch (error) {
    console.error(`Failed to create topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Register a socket connection
 */
function registerSocket(socketId, socket) {
  socketConnections.set(socketId, socket);
  console.log(`Socket ${socketId} registered`);
}

/**
 * Unregister a socket connection
 */
function unregisterSocket(socketId) {
  socketConnections.delete(socketId);
  console.log(`Socket ${socketId} unregistered`);
}

/**
 * Shutdown Kafka connections
 */
async function shutdown() {
  try {
    await consumer.disconnect();
    await producer.disconnect();
    console.log('Kafka connections closed');
  } catch (error) {
    console.error('Error during Kafka shutdown:', error);
    throw error;
  }
}

module.exports = {
  initializeKafka,
  sendMessage,
  subscribeToTopics,
  listTopics,
  createTopic,
  registerSocket,
  unregisterSocket,
  shutdown
};