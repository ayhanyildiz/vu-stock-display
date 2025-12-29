import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vu1-display',
  imports: [CommonModule],
  templateUrl: './vu1-display.component.html',
  styleUrl: './vu1-display.component.scss'
})
export class Vu1DisplayComponent {
  ticker = input.required<string>();
  timestamp = input.required<number>();
  failed = signal(false);

  onError() {
    this.failed.set(true);
  }

  onLoad() {
    this.failed.set(false); }
}
