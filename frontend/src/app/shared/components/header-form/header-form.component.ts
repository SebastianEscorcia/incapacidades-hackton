import { Component, input } from '@angular/core';

@Component({
  selector: 'app-header-form',
  standalone: true,
  template: `
    <div class="grid grid-cols-1 mb-4">
      <div class="rounded-lg p-6 border-l-4"
        style="background-color: var(--surface-card); border-color: var(--primary-color);">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shadow-lg"
            style="background-color: var(--primary-color); color: var(--primary-color-text);">
            <i [class]="'pi ' + icon()"></i>
          </div>
          <h3 class="text-3xl font-bold m-0" style="color: var(--text-color)">
            {{ title() }}
          </h3>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class HeaderFormComponent {
  title = input.required<string>();
  icon = input<string>('pi-info-circle');
}
