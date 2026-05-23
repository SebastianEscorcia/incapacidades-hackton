import { Component, ElementRef, inject, input, ViewChild } from '@angular/core';
import { AppMenu } from './app.menu';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu],
    template: `<app-menu [model]="this.menu()" class="layout-sidebar"></app-menu>`,
})
export class AppSidebar {
    el = inject(ElementRef);

    @ViewChild(AppMenu) appMenu!: AppMenu;
    menu = input<MenuItem[]>([])

}
