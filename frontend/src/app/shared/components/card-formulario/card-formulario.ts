import { Component, input } from '@angular/core';
import { cardFormularioDataGeneric } from './const/cardFormularioGeneric.const';
import { cardFormulario } from './models/cardFormulario.model';
import { logo } from '@assets/images/shared';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

@Component({
  selector: 'app-card-formulario',
  imports: [PrimeNGModules],
  templateUrl: './card-formulario.html',
  styleUrl: './card-formulario.scss',
})
export class CardFormulario {
  datos = input<cardFormulario>(cardFormularioDataGeneric);
  logoClass = input<string>('w-10 h-10');
  imgLogo = logo
}
