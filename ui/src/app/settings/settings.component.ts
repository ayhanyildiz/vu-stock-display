import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';

import type { AppConfig } from '@shared/models';
import { ConfigService } from '../config.service';

type ApplyResponse = {
  success: boolean;
  active: number;
  refreshed: number;
  dialsChanged: boolean;
  config: AppConfig;
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private configService = inject(ConfigService);

  loading = signal(false);
  currentConfig: AppConfig | undefined = undefined;


  form = this.fb.group({
    serverUrl: ['', Validators.required],
    apiKey: ['', Validators.required],
    logoDevToken: ['', Validators.required],
    finnhubToken: [''],
    intervalMinutes: [0, [Validators.required, Validators.min(1)]],
    thresholdPercent: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.loading.set(true);
    this.http.get<AppConfig>('/api/config').subscribe({
      next: (config) => {
        this.currentConfig = config;
        this.initForm();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading config', err);
        this.snackBar.open('Failed to load configuration.', 'Close', { duration: 5000 });
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    if (this.currentConfig?.vuServer?.apiKey) {
      this.router.navigate(['/dashboard']);
    } else {
      this.initForm();
    }
  }

  initForm() {
    this.form.patchValue({
      serverUrl: this.currentConfig?.vuServer?.url,
      apiKey: this.currentConfig?.vuServer?.apiKey ?? '',
      logoDevToken: this.currentConfig?.logoDevToken ?? '',
      finnhubToken: this.currentConfig?.finnhubToken ?? '',
      intervalMinutes: this.currentConfig?.settings?.intervalMinutes,
      thresholdPercent: this.currentConfig?.settings?.thresholdPercent,
    });
  }

  saveConfig() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { serverUrl, apiKey, logoDevToken, intervalMinutes, thresholdPercent, finnhubToken } = this.form.getRawValue();
console.log(this.form.value);
    const newConfig: AppConfig = {
      ...this.currentConfig,
      vuServer: {
        url: serverUrl!,
        apiKey: apiKey!,
      },
      logoDevToken: logoDevToken ?? '',
      finnhubToken: finnhubToken ?? '',
      settings: {
        intervalMinutes: intervalMinutes!,
        thresholdPercent: thresholdPercent!,
      },
    };

    this.http.post('/api/config', newConfig).pipe(
      switchMap(() => this.http.get<AppConfig>('/api/config'))
    ).subscribe({
      next: (config) => {
        this.currentConfig = config;
        this.configService.setConfig(config);
        this.loading.set(false);
        this.snackBar.open('Configuration saved successfully!', 'OK', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error saving', err);
        this.snackBar.open('Failed to save configuration.', 'Close', { duration: 5000 });
        this.loading.set(false);
      },
    });

  }
}
