import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PrimeNGModules } from '@/shared/lib/primeng.module';
import { WorkflowFlowService } from '@shared/workflow/services/workflow-flow.service';
import { TranslatePipe } from '@/core/i18n/translate.pipe';
import { TranslateContentPipe } from '@/core/i18n/translate-content.pipe';
import { EMPRESA_COMPANIES, EmpresaCompany } from '../../const/empresa-companies.const';

@Component({
  selector: 'empresa-empresas-page',
  standalone: true,
  imports: [CommonModule, PrimeNGModules, TranslatePipe, TranslateContentPipe],
  templateUrl: './empresas.html',
  styleUrl: './empresas.scss',
})
export class EmpresasPage {
  private readonly flow = inject(WorkflowFlowService);
  private readonly router = inject(Router);

  protected selectedCompany: EmpresaCompany | null = null;
  protected readonly companies = EMPRESA_COMPANIES;

  onCompanySelected(event: { data?: EmpresaCompany | EmpresaCompany[] }): void {
    const company = event.data;
    if (company && !Array.isArray(company)) {
      this.selectedCompany = company;
      this.flow.setSelectedCompany(company.id, company.name);
    }
  }

  startCase(company: EmpresaCompany): void {
    this.flow.resetFlow(company.id, company.name);
    this.flow.startFlow();
  }

  viewAudit(company: EmpresaCompany): void {
    void this.router.navigate(['/empresa/auditoria', company.id]);
  }
}
