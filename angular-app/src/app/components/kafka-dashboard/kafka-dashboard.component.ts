// src/app/components/kafka-dashboard/kafka-dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { KafkaService } from '../../services/kafka.service';
import { Message } from '../../models/message.model';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-kafka-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './kafka-dashboard.component.html',
  styleUrls: ['./kafka-dashboard.component.scss']
})
export class KafkaDashboardComponent implements OnInit, OnDestroy {
  private kafkaService = inject(KafkaService);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Signals for reactive state
  topics = signal<string[]>([]);
  messages = signal<Message[]>([]);
  loading = signal<boolean>(false);
  selectedTopic = signal<string>('');
  connected = signal<boolean>(false);

  // Forms
  messageForm!: FormGroup;
  topicForm!: FormGroup;

  // Table columns
  displayedColumns: string[] = ['timestamp', 'key', 'value', 'partition'];

  ngOnInit(): void {
    this.initForms();
    this.loadTopics();
    this.setupSocketConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.kafkaService.disconnectSocket();
  }

  private initForms(): void {
    this.messageForm = this.formBuilder.group({
      topic: ['', Validators.required],
      key: [''],
      message: ['', Validators.required],
      partition: [null]
    });

    this.topicForm = this.formBuilder.group({
      topic: ['', [Validators.required, Validators.pattern(/^[^./\\]+$/), Validators.maxLength(249)]],
      numPartitions: [1, [Validators.required, Validators.min(1)]],
      replicationFactor: [1, [Validators.required, Validators.min(1)]]
    });
  }

  private loadTopics(): void {
    this.loading.set(true);
    this.kafkaService.getTopics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.topics.set(data.topics);
          this.loading.set(false);
        },
        error: (err) => {
          this.snackBar.open(`Error loading topics: ${err.message}`, 'Close', { duration: 5000 });
          this.loading.set(false);
        }
      });
  }

  private setupSocketConnection(): void {
    this.kafkaService.connectSocket();
    
    this.kafkaService.onSocketConnect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.connected.set(true);
        this.snackBar.open('Connected to Kafka service', 'Close', { duration: 3000 });
      });
      
    this.kafkaService.onSocketDisconnect()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.connected.set(false);
        this.snackBar.open('Disconnected from Kafka service', 'Close', { duration: 3000 });
      });
  }

  subscribeTopic(topic: string): void {
    this.selectedTopic.set(topic);
    this.messages.set([]);
    
    // Unsubscribe from previous topic
    if (this.selectedTopic() !== topic) {
      this.kafkaService.unsubscribeTopic(this.selectedTopic());
    }
    
    // Subscribe to new topic
    this.kafkaService.subscribeTopic(topic);
    
    // Listen for messages on this topic
    this.kafkaService.onKafkaMessage(topic)
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: Message) => {
        const currentMessages = this.messages();
        
        // Add new message to the beginning of the array and limit to 100 messages
        this.messages.set([message, ...currentMessages].slice(0, 100));
      });
      
    this.snackBar.open(`Subscribed to topic: ${topic}`, 'Close', { duration: 3000 });
  }

  sendMessage(): void {
    if (this.messageForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    const { topic, message, key, partition } = this.messageForm.value;
    
    this.kafkaService.sendMessage(topic, message, key, partition)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open('Message sent successfully', 'Close', { duration: 3000 });
          this.loading.set(false);
          this.messageForm.get('message')?.reset();
          
          // Auto-subscribe to topic if not already subscribed
          if (this.selectedTopic() !== topic) {
            this.subscribeTopic(topic);
          }
        },
        error: (err) => {
          this.snackBar.open(`Error sending message: ${err.message}`, 'Close', { duration: 5000 });
          this.loading.set(false);
        }
      });
  }

  createTopic(): void {
    if (this.topicForm.invalid) {
      return;
    }
    
    this.loading.set(true);
    const { topic, numPartitions, replicationFactor } = this.topicForm.value;
    
    this.kafkaService.createTopic(topic, numPartitions, replicationFactor)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(`Topic '${topic}' created successfully`, 'Close', { duration: 3000 });
          this.loadTopics();
          this.topicForm.reset({ numPartitions: 1, replicationFactor: 1 });
        },
        error: (err) => {
          this.snackBar.open(`Error creating topic: ${err.message}`, 'Close', { duration: 5000 });
          this.loading.set(false);
        }
      });
  }

  formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  }

  clearMessages(): void {
    this.messages.set([]);
  }

  refreshTopics(): void {
    this.loadTopics();
  }
}