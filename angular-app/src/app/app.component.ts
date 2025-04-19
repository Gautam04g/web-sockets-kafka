// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KafkaDashboardComponent } from './components/kafka-dashboard/kafka-dashboard.component';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    KafkaDashboardComponent
],
providers: [ // Include provideHttpClient in providers
  provideAnimations(), // Include provideAnimations in providers
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true,
},
],
  templateUrl: './app.component.html',
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
  username = 'admin';
  password = 'password';

  constructor(private http: HttpClient, private authService: AuthService) {
    this.login();
  }

  login() {
      this.http.post<{ token: string }>('http://localhost:3000/api/kafka/login', {
          username: this.username,
          password: this.password,
      }).subscribe({
          next: (response) => {
              this.authService.setToken(response.token);
              // alert('Login successful!');  
          },
          error: () => {
              // alert('Invalid credentials');
          },
      });
  }
}