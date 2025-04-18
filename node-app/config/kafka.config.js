// config/kafka.config.js
const { Kafka } = require('kafkajs');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'api-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL === 'true' ? {
    mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || ''
  } : null
});

// Configure default producer and consumer
const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_CONSUMER_GROUP || 'api-service-consumer',
  maxWaitTimeInMs: 1000,
  maxBytes: 10485760 // 10MB
});

// Pre-defined topics
const TOPICS = {
  USER_EVENTS: 'user-events',
  NOTIFICATIONS: 'notifications',
  SYSTEM_LOGS: 'system-logs',
  DATA_UPDATES: 'data-updates'
};

module.exports = {
  kafka,
  producer,
  consumer,
  TOPICS
};