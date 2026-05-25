import { Component, effect, inject, input, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppFooter } from './app.footer';
import { LayoutService, TabCloseEvent } from '../service/layout.service';
import { AppConfigurator } from './app.configurator';
import { AppBreadcrumb } from './app.breadcrumb';
import { AppSidebar } from "./app.sidebar";
import { MenuItem, MessageService } from 'primeng/api';
import { WorkflowTracker } from '@shared/workflow/components/workflow-tracker/workflow-tracker';
import { AiRealtimeService } from '@shared/workflow/services/ai-realtime.service';
import { AiNotificationCenterService } from '@shared/workflow/services/ai-notification-center.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter, AppConfigurator, AppBreadcrumb, WorkflowTracker],
    styleUrl: './app.layout.scss',
    template: `
        <div class="layout-wrapper" [ngClass]="containerClass">
            <div app-topbar></div>
            <app-sidebar [menu]="menu()" ></app-sidebar>
            <div class="layout-content-wrapper">
                <div class="layout-content">
                    <div class="layout-content-inner">
                        <nav app-breadcrumb></nav>
                        @if (shouldShowTracker()) {
                            <div class="workflow-tracker-shell">
                                <workflow-tracker />
                            </div>
                        }
                        <div class="workflow-card p-3 mb-3">
                            <div class="flex items-center justify-between gap-2 mb-2">
                                <strong>Notificaciones IA</strong>
                                <div class="flex items-center gap-2">
                                    <span class="workflow-text-muted text-sm">No leídas: {{ unreadCount() }}</span>
                                    <button class="p-button p-button-text p-button-sm" (click)="markAllNotificationsAsRead()">Marcar leídas</button>
                                </div>
                            </div>
                            @if (!notifications().length) {
                                <p class="text-sm workflow-text-muted">Sin notificaciones aún.</p>
                            } @else {
                                <ul class="grid gap-2 max-h-64 overflow-auto">
                                    @for (item of notifications(); track item.id) {
                                        <li class="workflow-list-item" [class.opacity-70]="item.read">
                                            <div class="flex items-center justify-between gap-2">
                                                <strong>{{ item.title }}</strong>
                                                <small class="workflow-text-muted">{{ item.timestamp | date:'short' }}</small>
                                            </div>
                                            <p class="text-sm">{{ item.message }}</p>
                                        </li>
                                    }
                                </ul>
                            }
                        </div>
                        <router-outlet></router-outlet>
                        <div app-footer></div>
                    </div>
                </div>
            </div>
        </div>
        <app-configurator />
    `,
})
export class AppLayout implements OnDestroy {
    private readonly notificationCenter = inject(AiNotificationCenterService);
    private readonly messageService = inject(MessageService);

    overlayMenuOpenSubscription: Subscription;
    menu = input<MenuItem[]>([])
    showWorkflowTracker = input(false)
    notifications = this.notificationCenter.items;
    unreadCount = this.notificationCenter.unreadCount;
    private aiSubscriptions: Subscription[] = [];

    shouldShowTracker(): boolean {
        if (!this.showWorkflowTracker()) return false;
        const url = this.router.url;
        return url !== '/empresa' && url !== '/empresa/empresas' && url !== '/eps' && !url.includes('/timeline') && !url.includes('/auditoria');
    }

    private syncWorkflowWebSocket(): void {
        if (this.shouldShowTracker()) {
            this.aiRealtime.connect();
            return;
        }

        if (this.showWorkflowTracker()) {
            this.aiRealtime.disconnect();
        }
    }

    tabOpenSubscription: Subscription;

    tabCloseSubscription: Subscription;

    menuOutsideClickListener: any;

    menuScrollListener: any;

    @ViewChild(AppSidebar) appSidebar!: AppSidebar;

    @ViewChild(AppTopbar) appTopbar!: AppTopbar;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private readonly aiRealtime: AiRealtimeService,
    ) {
        effect(() => {
            console.log('AppLayout constructor', this.menu());

        })

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.hideMenu();
            this.syncWorkflowWebSocket();
        });

        this.bindAiNotifications();

        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            setTimeout(() => {
                if (this.menuOutsideClickListener) return;

                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    const target = event.target as Node;
                    const sidebarEl = this.appSidebar.el.nativeElement;
                    const isOutsideClicked = !(
                        sidebarEl.contains(target) ||
                        this.appTopbar.menuButton.nativeElement.contains(target)
                    );
                    if (isOutsideClicked) {
                        this.hideMenu();
                    }
                });
            }, 0);

            if ((this.layoutService.isSlim() || this.layoutService.isSlimPlus()) && !this.menuScrollListener) {
                this.menuScrollListener = this.renderer.listen(this.appSidebar.appMenu.menuContainer.nativeElement, 'scroll', (event) => {
                    if (this.layoutService.isDesktop()) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.tabOpenSubscription = this.layoutService.tabOpen$.subscribe((tab) => {
            this.router.navigate(tab.routerLink);
            this.layoutService.openTab(tab);
        });

        this.tabCloseSubscription = this.layoutService.tabClose$.subscribe((event: TabCloseEvent) => {
            if (this.router.isActive(event.tab.routerLink[0], { paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored' })) {
                const tabs = this.layoutService.tabs;

                if (tabs.length > 1) {
                    if (event.index === tabs.length - 1) this.router.navigate(tabs[tabs.length - 2].routerLink);
                    else this.router.navigate(tabs[event.index + 1].routerLink);
                } else {
                    this.router.navigate(['/']);
                }
            }

            this.layoutService.closeTab(event.index);
        });
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        this.layoutService.reset();
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }

        if (this.menuScrollListener) {
            this.menuScrollListener();
            this.menuScrollListener = null;
        }

        this.unblockBodyScroll();
    }

    get containerClass() {
        return {
            'layout-slim': this.layoutService.layoutConfig().menuMode === 'slim',
            'layout-slim-plus': this.layoutService.layoutConfig().menuMode === 'slim-plus',
            'layout-static': this.layoutService.layoutConfig().menuMode === 'static',
            'layout-overlay': this.layoutService.layoutConfig().menuMode === 'overlay',
            'layout-overlay-active': this.layoutService.layoutState().overlayMenuActive,
            'layout-mobile-active': this.layoutService.layoutState().staticMenuMobileActive,
            'layout-static-inactive': this.layoutService.layoutState().staticMenuDesktopInactive && this.layoutService.layoutConfig().menuMode === 'static',
            'layout-light': this.layoutService.layoutConfig().layoutTheme === 'colorScheme' && !this.layoutService.isDarkTheme(),
            'layout-dark': this.layoutService.layoutConfig().layoutTheme === 'colorScheme' && this.layoutService.isDarkTheme(),
            'layout-primary': !this.layoutService.isDarkTheme() && this.layoutService.layoutConfig().layoutTheme === 'primaryColor'
        };
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }

        if (this.tabOpenSubscription) {
            this.tabOpenSubscription.unsubscribe();
        }

        if (this.tabCloseSubscription) {
            this.tabCloseSubscription.unsubscribe();
        }

        if (this.showWorkflowTracker()) {
            this.aiRealtime.disconnect();
        }

        this.aiSubscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    markAllNotificationsAsRead(): void {
        this.notificationCenter.markAllAsRead();
    }

    private bindAiNotifications(): void {
        this.aiSubscriptions.push(
            this.aiRealtime.alertaFraude$.subscribe((event) => {
                const entry = this.notificationCenter.push({
                    title: 'Alerta de fraude',
                    message: event.mensaje || 'Se detectaron anomalías en el documento.',
                    severity: 'danger',
                });
                this.messageService.add({
                    severity: 'error',
                    summary: entry.title,
                    detail: entry.message,
                });
            }),
            this.aiRealtime.scrapingCompletado$.subscribe((event) => {
                const entry = this.notificationCenter.push({
                    title: 'Validación documental completada',
                    message: `RETHUS y ADRES finalizados para ${event.incapacidadId ?? event.id}.`,
                    severity: 'info',
                    incapacidadId: event.incapacidadId ?? event.id,
                });
                this.messageService.add({
                    severity: 'info',
                    summary: entry.title,
                    detail: entry.message,
                });
            }),
            this.aiRealtime.epsResponseCompletada$.subscribe((event) => {
                const entry = this.notificationCenter.push({
                    title: 'Respuesta EPS generada',
                    message: `${event.estadoEpsResponse}: ${event.mensaje || 'Sin mensaje adicional.'}`,
                    severity: event.estadoEpsResponse === 'rejected' ? 'warn' : 'success',
                    incapacidadId: event.incapacidadId,
                });
                this.messageService.add({
                    severity: entry.severity === 'warn' ? 'warn' : 'success',
                    summary: entry.title,
                    detail: entry.message,
                });
            }),
        );
    }
}