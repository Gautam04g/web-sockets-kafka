// routes/kafka.routes.js
const express = require('express');
const router = express.Router();
const kafkaController = require('../controllers/kafka.controller');
const { isAuthenticated, hasPermission } = require('../middleware/auth.middleware');

/**
 * @route POST /api/kafka/produce
 * @desc Send a message to a Kafka topic
 * @access Private
 */
router.post('/produce', 
  isAuthenticated, 
  hasPermission('kafka:produce'), 
  kafkaController.produceMessage
);

/**
 * @route GET /api/kafka/topics
 * @desc Get all available Kafka topics
 * @access Private
 */
router.get('/topics', 
  isAuthenticated, 
  hasPermission('kafka:read'), 
  kafkaController.getTopics
);

/**
 * @route POST /api/kafka/topics
 * @desc Create a new Kafka topic
 * @access Private (Admin only)
 */
router.post('/topics', 
  isAuthenticated, 
  hasPermission('kafka:admin'), 
  kafkaController.createTopic
);

module.exports = router;