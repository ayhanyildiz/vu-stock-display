import { Component, inject, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ConfigService } from './config.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatCard, MatCardTitle, MatCardContent, MatCardActions,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private configService = inject(ConfigService);

  backendDown = signal(false);

  constructor() {
    this.configService.refresh();

    effect(() => {
      const config = this.configService.config();
      this.backendDown.set(config === null);
    });
  }

  retry(): void {
    this.configService.refresh();
  }

  reload(): void {
    window.location.reload();
  }
}
