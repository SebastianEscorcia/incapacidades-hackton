import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Toast } from "primeng/toast";
import { Dialog } from "primeng/dialog";
import { logo } from '@assets/images/shared';

@Component({
  selector: 'app-card-forgot',
  imports: [Toast, Dialog],
  templateUrl: './card-forgot.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardForgot {
  logoClass = input<string>('w-10 h-10');
  imgLogo = logo
}
