// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KafkaDashboardComponent } from './components/kafka-dashboard/kafka-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    KafkaDashboardComponent
  ],
  providers: [provideAnimations()],
  template: `./app.component.html`,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    .toolbar-spacer {
      flex: 1 1 auto;
    }
    
    main {
      flex: 1;
      background-color: #f5f5f5;
    }
  `]
})
export class AppComponent {
  title = 'kafka-angular-dashboard';
}