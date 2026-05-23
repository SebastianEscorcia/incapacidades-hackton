import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { cardSectionTop } from './models/cardTop';
import { cardTopDataGeneric } from './const/cardSectionTopGeneric.const';
import { RouterModule } from '@angular/router';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

@Component({
  selector: 'app-card-top',
  imports: [PrimeNGModules, RouterModule],
  templateUrl: './card-top.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTop {
  datos = input<cardSectionTop>(cardTopDataGeneric);
}
