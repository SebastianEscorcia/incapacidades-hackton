import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { EMPRESA_COMPANIES } from '../../const/empresa-companies.const';
import { CompanyFlowSession, EmpresaFlowAuditService } from '../../services/empresa-flow-audit.service';
import { WorkflowStage } from '@sharedWorkflow/types';

@Component({
  selector: 'empresa-auditoria-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PrimeNGModules, TranslatePipe, TranslateContentPipe],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss',
})
export class AuditoriaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly audit = inject(EmpresaFlowAuditService);

  protected readonly stage = WorkflowStage.Timeline;
  protected companyName = signal('');
  protected sessions = signal<CompanyFlowSession[]>([]);
  protected selectedSession = signal<CompanyFlowSession | null>(null);

  ngOnInit(): void {
    const companyId = this.route.snapshot.paramMap.get('companyId') ?? undefined;
    const company = companyId ? EMPRESA_COMPANIES.find((item) => item.id === companyId) : undefined;
    this.companyName.set(company?.name ?? 'Auditoría global');

    const items = this.audit.listSessions(companyId);
    this.sessions.set(items);
    this.selectedSession.set(items[0] ?? null);
  }

  selectSession(session: CompanyFlowSession): void {
    this.selectedSession.set(session);
  }

  stageLabel(stage: WorkflowStage): string {
    return `workflow.steps.${stage}`;
  }
}

