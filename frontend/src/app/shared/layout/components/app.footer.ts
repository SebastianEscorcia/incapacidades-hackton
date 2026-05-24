import { Component, inject } from '@angular/core';
import { logo } from '@assets/images/shared';
import { LayoutService } from '../service/layout.service';
import { environment } from '../../../../environments/environment';


@Component({
    standalone: true,
    selector: '[app-footer]',
    template: ` <div class="footer-start">
            <img [src]="logo" alt="logo" />
            <span class="app-name">{{ appName }}</span>
        </div>
        <div class="footer-right">
            <span>©{{ appName }}</span>
        </div>`,
    host: {
        class: 'layout-footer'
    }
})
export class AppFooter {
    logo = logo
    layoutService = inject(LayoutService);
    readonly appName = environment.app_name;
}
