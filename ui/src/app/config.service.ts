import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AppConfig } from '@shared/models';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private http = inject(HttpClient);

  private readonly _config = signal<any | null>(null);
  readonly config = this._config.asReadonly();

  refresh(): void {
    this.http.get<any>('/api/config').subscribe({
      next: (cfg) => this._config.set(cfg),
      error: () => this._config.set(null),
    });
  }

  setConfig(cfg: AppConfig) {
    this._config.set(cfg);
  }
}
