import { Component, ElementRef, inject, input, ViewChild } from '@angular/core';
import { AppMenu } from './app.menu';
import { MenuItem } from 'primeng/api';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [AppMenu],
    template: `
        <div class="layout-sidebar">
            <app-menu [model]="menu()" />
        </div>
    `,
})
export class AppSidebar {
    el = inject(ElementRef);

    @ViewChild(AppMenu) appMenu!: AppMenu;
    menu = input<MenuItem[]>([]);
}
