// src/app/models/message.model.ts

export interface Message {
    topic: string;
    key?: string;
    value: any;
    headers?: Record<string, string>;
    partition: number;
    offset?: string;
    timestamp: number | Date;
  }
  
  export interface KafkaTopicConfig {
    topic: string;
    numPartitions: number;
    replicationFactor: number;
  }
  
  export interface KafkaProduceResponse {
    success: boolean;
    message: string;
  }
  
  export interface KafkaErrorResponse {
    error: string;
    details?: string;
  }