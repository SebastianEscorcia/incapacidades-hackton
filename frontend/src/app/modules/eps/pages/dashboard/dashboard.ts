import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { DashboardSummary } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';

@Component({
  selector: 'workflow-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PrimeNGModules, TranslatePipe, TranslateContentPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class EpsDashboardPage implements OnInit {
  private readonly workflow = inject(WorkflowService);

  protected loading = signal(true);
  protected data: DashboardSummary | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);
    try {
      this.data = await this.workflow.getDashboard();
    } catch (err) {
      /* handle error */
    } finally {
      this.loading.set(false);
    }
  }
}
