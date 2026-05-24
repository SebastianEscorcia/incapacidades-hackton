import { Component, effect, ElementRef, inject, input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    styles: [
        `
            :host {
                display: block;
                width: 100%;
                height: 100%;
                min-height: 0;
            }
        `,
    ],
    template: `<div class="layout-menu-container" #menuContainer>
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model(); let i = index">
                <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    </div>`
})
export class AppMenu {
    el: ElementRef = inject(ElementRef);

    @ViewChild('menuContainer') menuContainer!: ElementRef;

    model = input<MenuItem[]>([])
    constructor() {
        console.log('AppMenu constructor', this.model());
        effect(() => {
            console.log('AppMenu effect', this.model());
        })
    }

}