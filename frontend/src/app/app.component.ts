import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { HeaderComponent } from './core/layout/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <div *ngIf="connectionStatus" class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
      Backend: {{ connectionStatus }}
    </div>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 70px);
      background: #f7fafc;
    }

    .connection-status {
      position: fixed;
      bottom: 10px;
      right: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      font-family: monospace;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .connected {
      background-color: #10b981;
      color: white;
    }
    .disconnected {
      background-color: #ef4444;
      color: white;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Smart Grocery System';
  connectionStatus: string = 'Checking...';
  isConnected: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.testBackendConnection();
  }

  testBackendConnection(): void {
    // Try to reach the backend health endpoint or base URL
    this.http.get(`${environment.apiUrl}/health`).subscribe({
      next: (response) => {
        this.connectionStatus = 'Connected';
        this.isConnected = true;
        console.log('Backend connection successful', response);
      },
      error: (error) => {
        // If health endpoint fails, try the base API URL
        this.http.get(`${environment.apiUrl}`).subscribe({
          next: (status) => {
            this.connectionStatus = 'Connected';
            this.isConnected = true;
            console.log('Backend connection successful (fallback)');
          },
          error: (fallbackError) => {
            this.connectionStatus = 'Disconnected';
            this.isConnected = false;
            console.error('Backend connection failed', fallbackError);
          }
        });
      }
    });
  }
}