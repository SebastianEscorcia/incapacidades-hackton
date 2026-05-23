import { Component, input } from '@angular/core';
import { cardFormularioDataGeneric } from './const/cardFormularioGeneric.const';
import { cardFormulario } from './models/cardFormulario.model';
import { logo } from '@assets/images/shared';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { environment } from '../../../../environments/environment';

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
  readonly appName = environment.app_name;
}
