import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { DashboardSummary } from '@sharedWorkflow/types';
import { WorkflowService } from '@sharedWorkflow/services/workflow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'workflow-dashboard-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, TranslatePipe, TranslateContentPipe, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage implements OnInit {
  private readonly workflow = inject(WorkflowService);

  protected loading = true;
  protected data: DashboardSummary | null = null;

  ngOnInit(): void {
    void this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.workflow.getDashboard();
    } catch {
      /* handle error */
    } finally {
      this.loading = false;
    }
  }
}