// controllers/kafka.controller.js
const kafkaService = require('../services/kafka.service');

/**
 * Send a message to a Kafka topic
 */
async function produceMessage(req, res) {
  try {
    const { topic, message, key, partition } = req.body;
    
    if (!topic || !message) {
      return res.status(400).json({ error: 'Topic and message are required' });
    }

    await kafkaService.sendMessage(topic, message, key, partition);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully to topic: ' + topic 
    });
  } catch (error) {
    console.error('Error in produceMessage controller:', error);
    return res.status(500).json({ 
      error: 'Failed to send message to Kafka',
      details: error.message 
    });
  }
}

/**
 * Get all available Kafka topics
 */
async function getTopics(req, res) {
  try {
    const topics = await kafkaService.listTopics();
    return res.status(200).json({ topics });
  } catch (error) {
    console.error('Error in getTopics controller:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve Kafka topics',
      details: error.message 
    });
  }
}

/**
 * Create a new Kafka topic
 */
async function createTopic(req, res) {
  try {
    const { topic, numPartitions, replicationFactor } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    const result = await kafkaService.createTopic(
      topic, 
      numPartitions || 1, 
      replicationFactor || 1
    );
    
    return res.status(201).json({ 
      success: true, 
      message: `Topic '${topic}' created successfully` 
    });
  } catch (error) {
    console.error('Error in createTopic controller:', error);
    return res.status(500).json({ 
      error: 'Failed to create Kafka topic',
      details: error.message 
    });
  }
}

module.exports = {
  produceMessage,
  getTopics,
  createTopic
};