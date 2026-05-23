import { Component, input } from '@angular/core';
import { cardFormularioDataGeneric } from './const/cardSectionFormularioGeneric.const';
import { cardSectionFormulario } from './models/cardFormulario.model';
import { PrimeNGModules } from '@/shared/lib/primeng.module';

@Component({
  selector: 'component-card-formulario',
  imports: [PrimeNGModules],
  templateUrl: './card-section-formulario.html',
  styleUrl: './card-section-formulario.scss',
})
export class CardFormulario {
  datos = input<cardSectionFormulario>(cardFormularioDataGeneric);

}
