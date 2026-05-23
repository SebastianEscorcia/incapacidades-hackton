import { Component, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { SpeedDialModule } from 'primeng/speeddial';

@Component({
  selector: 'app-speed-dial',
  standalone: true,
  imports: [SpeedDialModule],
  template: `
    <div class="flex justify-end mt-6 mr-1">
      <p-speeddial 
        [model]="model()" 
        [radius]="radius()" 
        [direction]="direction()" 
        [buttonClassName]="buttonClassName()" />
    </div>
  `,
  styleUrl: './speed-dial.component.scss'
})
export class SpeedDialComponent {
  model = input.required<MenuItem[]>();
  radius = input<number>(120);
  direction = input<'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right'>('left');
  buttonClassName = input<string>('p-button-rounded p-button-primary');
}
