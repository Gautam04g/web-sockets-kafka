// src/app/services/kafka.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, fromEvent, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class KafkaService {
  private http = inject(HttpClient);
  private socket: Socket | null = null;
  private messageSubjects: Map<string, Subject<Message>> = new Map();
  private socketConnectSubject = new Subject<void>();
  private socketDisconnectSubject = new Subject<void>();
  private readonly apiUrl = `${environment.apiUrl}/kafka`;
  private baseUrl = 'http://localhost:3000/api'; // Replace with your backend API base URL

  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); // Retrieve the token from localStorage
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '', // Add the token to the Authorization header
    });
  }

  /**
   * Initialize and connect to the WebSocket server
   */
  connectSocket(): void {
    if (this.socket) {
      return; // Already connected
    }

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socketConnectSubject.next();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.socketDisconnectSubject.next();
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get socket connection status
   */
  isSocketConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Observe socket connect events
   */
  onSocketConnect(): Observable<void> {
    return this.socketConnectSubject.asObservable();
  }

  /**
   * Observe socket disconnect events
   */
  onSocketDisconnect(): Observable<void> {
    return this.socketDisconnectSubject.asObservable();
  }

  /**
   * Subscribe to a Kafka topic
   */
  subscribeTopic(topic: string): void {
    if (!this.socket) {
      this.connectSocket();
    }

    // Create a new subject for this topic if it doesn't exist
    if (!this.messageSubjects.has(topic)) {
      this.messageSubjects.set(topic, new Subject<Message>());
    }

    this.socket?.emit('subscribe-topic', topic);
    
    // Set up socket listener for this topic
    this.socket?.on(`kafka-message:${topic}`, (message: Message) => {
      const subject = this.messageSubjects.get(topic);
      if (subject) {
        subject.next(message);
      }
    });
  }

  /**
   * Unsubscribe from a Kafka topic
   */
  unsubscribeTopic(topic: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('unsubscribe-topic', topic);
    this.socket.off(`kafka-message:${topic}`);
  }

  /**
   * Observe Kafka messages for a specific topic
   */
  onKafkaMessage(topic: string): Observable<Message> {
    if (!this.messageSubjects.has(topic)) {
      this.messageSubjects.set(topic, new Subject<Message>());
      this.subscribeTopic(topic);
    }

    return this.messageSubjects.get(topic)!.asObservable();
  }

  /**
   * Get all available Kafka topics
   */
  getTopics(): Observable<{ topics: string[] }> {
    return this.http.get<{ topics: string[] }>(`${this.apiUrl}/topics`,{
      headers: this.getAuthHeaders(),
    })
      .pipe(
        catchError(error => {
          console.error('Error getting topics:', error);
          return of({ topics: [] });
        })
      );
  }

  /**
   * Send a message to a Kafka topic
   */
  sendMessage(topic: string, message: any, key?: string, partition?: number): Observable<any> {
    const payload: any = { topic, message };
    
    if (key) {
      payload.key = key;
    }
    
    if (partition !== undefined && partition !== null) {
      payload.partition = partition;
    }
    
    // Convert message to JSON if it's an object
    if (typeof message === 'string') {
      try {
        const parsed = JSON.parse(message);
        payload.message = parsed;
      } catch (e) {
        // Not JSON, keep as string
      }
    }
    
    return this.http.post(`${this.apiUrl}/produce`, payload,{
      headers: this.getAuthHeaders(),
    },);
  }

  /**
   * Create a new Kafka topic
   */
  createTopic(topic: string, numPartitions: number = 1, replicationFactor: number = 1): Observable<any> {
    return this.http.post(`${this.apiUrl}/topics`, {
      topic,
      numPartitions,
      replicationFactor,
    },{
      headers: this.getAuthHeaders(),
    });
  }
}