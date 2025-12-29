import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { Vu1DisplayComponent } from '../vu1-display/vu1-display.component';
import { AppConfig } from '@shared/models';
import { ConfigService } from '../config.service';

interface DialItem {
  uid: string;
  ticker: string;
  invalid?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    Vu1DisplayComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private configService = inject(ConfigService);

  items = signal<DialItem[]>([]);
  timestamp = signal(Date.now());

  form = new FormRecord<FormControl<string>>({});

  private config: AppConfig | null = null;

  constructor() {
    effect(() => {
      const config: AppConfig = this.configService.config();
      if (!config) return;

      this.config = config;

      const dials = config.dials ?? {};
      const items: DialItem[] = Object.entries(dials).map(([uid, dial]) => ({
        uid,
        ticker: dial?.ticker ?? '',
      }));

      this.items.set(items);
    });

    effect(() => {
      this.syncFormControls(this.items());
    });
  }

  private syncFormControls(items: DialItem[]) {
    const wanted = new Set(items.map(i => i.uid));

    for (const name of Object.keys(this.form.controls)) {
      if (!wanted.has(name)) this.form.removeControl(name);
    }

    for (const item of items) {
      if (!this.form.contains(item.uid)) {
        this.form.addControl(
          item.uid,
          new FormControl<string>(item.ticker ?? '', { nonNullable: true })
        );
      }
    }
  }


  ctrl(uid: string): FormControl<string> {
    return this.form.get(uid) as FormControl<string>;
  }

  commitTicker(uid: string) {
    const ctrl = this.ctrl(uid);
    const item = this.items().find((x) => x.uid === uid);

    if (!ctrl || !item || !this.config) return;

    const raw = ctrl.value ?? '';
    const newTicker = raw.trim().toUpperCase();
    const current = (item.ticker ?? '').trim().toUpperCase();

    if (!newTicker) {
      ctrl.setValue(item.ticker ?? '', { emitEvent: false });
      return;
    }

    if (newTicker === current && !item.invalid) {
      ctrl.setValue(newTicker, { emitEvent: false });
      return;
    }

    this.http.post('/api/refresh-dial', { uid, ticker: newTicker }).subscribe({
      next: () => {
        this.configService.refresh();

        this.items.update((items) => {
          const next = items.map((x) =>
            x.uid === uid ? { ...x, ticker: newTicker, invalid: false } : x
          );
          return next;
        });

        ctrl.setValue(newTicker, { emitEvent: false });
        this.snackBar.open(`Updated Dial to ${newTicker}`, 'OK', { duration: 2000 });
      },
      error: (err) => {
        console.error('Failed to save / update hardware', err);

        this.items.update(items =>
          items.map(x => x.uid === uid ? { ...x, invalid: true } : x)
        );

        ctrl.markAsTouched();
        ctrl.setErrors({ saveFailed: true });
        this.snackBar.open('Failed to save / update hardware', 'Close', { duration: 3000 });
      }
    });

  }
}
