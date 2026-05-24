import { CommonModule } from '@angular/common';

import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { RouterModule } from '@angular/router';

import { ConfirmationService, MessageService } from 'primeng/api';

import { PrimeNGModules } from '@/shared/lib/primeng.module';

import { AiValidationMetric, IntakeValidationStatus, ScrapingResults, WorkflowStage } from '@sharedWorkflow/types';

import { WorkflowService } from '@sharedWorkflow/services/workflow.service';

import { AiRealtimeService } from '@sharedWorkflow/services/ai-realtime.service';

import { WorkflowFlowNav } from '@sharedWorkflow/components/workflow-flow-nav/workflow-flow-nav';

import { WorkflowFlowService } from '@sharedWorkflow/services/workflow-flow.service';

import { TranslatePipe } from '@/core/i18n/translate.pipe';

import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';

import { I18nService } from '@/core/i18n/i18n.service';

import { Subscription } from 'rxjs';



@Component({

  selector: 'ai-validation-page',

  standalone: true,

  imports: [CommonModule, RouterModule, PrimeNGModules, WorkflowFlowNav, TranslatePipe, TranslateContentPipe],

  templateUrl: './ai-validation.html',

  styleUrl: './ai-validation.scss',

})

export class AiValidationPage implements OnInit, OnDestroy {

  private readonly flow = inject(WorkflowFlowService);

  protected readonly actor = this.flow.actor;

  private readonly workflow = inject(WorkflowService);

  private readonly realtime = inject(AiRealtimeService);

  private readonly confirmation = inject(ConfirmationService);

  private readonly messages = inject(MessageService);

  private readonly i18n = inject(I18nService);

  private scrapingSubscription?: Subscription;



  protected readonly stage = WorkflowStage.AiValidation;

  protected loading = signal(true);

  protected scrapingPending = signal(false);

  protected processingFailed = signal(false);

  protected processingPending = signal(false);

  protected motivo = signal<string | undefined>(undefined);

  protected scraping = signal<ScrapingResults | undefined>(undefined);

  protected metrics: AiValidationMetric[] = [];



  ngOnInit(): void {

    this.flow.ensureAccess(this.stage);

    this.workflow.connectRealtime();

    this.refreshScrapingState();

    void this.loadMetrics();



    this.scrapingSubscription = this.realtime.scrapingCompletado$.subscribe((event) => {

      const activeId = this.flow.activeCase().primaryIncapacidadId;

      const eventId = event.incapacidadId ?? event.id;

      if (!activeId || eventId !== activeId) return;



      this.refreshScrapingState();

      this.messages.add({

        severity: 'success',

        summary: event.mensaje ?? 'Validaciones RETHUS y ADRES completadas',

        life: 6000,

      });

      void this.loadMetrics();

    });

  }



  ngOnDestroy(): void {

    this.scrapingSubscription?.unsubscribe();

  }



  private refreshScrapingState(): void {

    this.scraping.set(this.workflow.getScraping());

    this.scrapingPending.set(this.workflow.isScrapingPending());

  }



  private async loadMetrics(): Promise<void> {

    this.loading.set(true);

    try {

      const context = await this.workflow.getAiValidationContext();

      this.metrics = context.metrics;

      this.processingFailed.set(context.processingFailed);

      this.processingPending.set(context.processingPending);

      this.motivo.set(context.motivo);

      this.refreshScrapingState();

    } catch (err) {

      this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.aiValidation.loadError') });

    } finally {

      this.loading.set(false);

    }

  }



  confirmStage(): void {

    if (this.processingFailed()) {

      this.messages.add({

        severity: 'warn',

        summary: this.i18n.t('workflow.aiValidation.processingFailedAction'),

      });

      return;

    }



    this.confirmation.confirm({

      message: this.i18n.t('workflow.aiValidation.confirmMessage'),

      header: this.i18n.t('workflow.aiValidation.confirmHeader'),

      accept: async () => {

        this.loading.set(true);

        try {

          await this.workflow.confirmStage(this.stage);

          this.messages.add({ severity: 'info', summary: this.i18n.t('workflow.aiValidation.success') });

        } catch (err) {

          this.messages.add({ severity: 'error', summary: this.i18n.t('workflow.aiValidation.error') });

        } finally {

          this.loading.set(false);

        }

      },

    });

  }



  scrapingSeverity(ok?: boolean): 'success' | 'danger' | 'warn' {

    if (ok === undefined) return 'warn';

    return ok ? 'success' : 'danger';

  }



  severity(status: IntakeValidationStatus): 'success' | 'danger' | 'warn' | 'info' {

    if (status === IntakeValidationStatus.Valid) return 'success';

    if (status === IntakeValidationStatus.Invalid) return 'danger';

    if (status === IntakeValidationStatus.Warning) return 'warn';

    return 'info';

  }

  protected goBack(): void {
    this.flow.navigateBack(this.stage);
  }

}


