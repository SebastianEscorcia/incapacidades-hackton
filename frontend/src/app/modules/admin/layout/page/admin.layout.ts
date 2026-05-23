import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { menuEnterprise } from '../const/menu-enterprise.const';
import { MenuItem } from 'primeng/api';
import { AppLayout } from '@/shared/layout/components/app.layout';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, AppLayout],
    template: `
        <app-layout [menu]="this.menu()"></app-layout>
    `,
})
export class AppAdminLayout {
    menu = signal<MenuItem[]>(menuEnterprise);

}
