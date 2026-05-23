import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-no-data',
  imports: [CommonModule, PrimeNGModules],
  templateUrl: './no-data.html',
  styleUrl: './no-data.scss',
})
export class NoData {
  icon = input<string>("pi-inbox")
  title = input<string>("No hay datos disponibles")
  message = input<string>("No se encontraron registros para mostrar")
  showButton = input<boolean>(false)
  buttonLabel = input<string>("Agregar nuevo")
  buttonIcon = input<string>("pi-plus")

  onAction = output<void>()

  handleAction() {
    this.onAction.emit()
  }
}
