import type { AppLanguage, TranslationDictionary } from '../../../core/i18n/i18n.types';
import type { I18nService } from '../../../core/i18n/i18n.service';

export const EMPRESA_TRANSLATIONS: Partial<Record<AppLanguage, TranslationDictionary>> = {
  en: {
    empresa: {
      dashboard: {
        eyebrow: 'Enterprise Dashboard',
        title: 'Operations Panel',
        subtitle: 'Status, reports, requirements, claims and final results.',
        selectCompanyTitle: 'Available companies / clients',
        selectCompanyHint: 'Click a row to select a company, then start a process or view its audit history.',
        initCase: 'Start process',
        viewAudit: 'Audit history',
        requirements: 'Requirements',
        glosas: 'Claims',
        finalResults: 'Final results',
      },
      empresas: {
        eyebrow: 'Directory',
        title: 'Client Companies',
        subtitle: 'Select a client company to start a case flow or view historical timelines.',
      },
      auditoria: {
        eyebrow: 'Flow audit',
        subtitle: 'History of filing processes for this company.',
        sessions: 'Registered processes',
        timeline: 'Process timeline',
        empty: 'This company has no registered filing processes yet.',
      },
      intake: {
        eyebrow: 'Client Enterprise',
        title: 'Mass Upload / Intake',
        subtitle: 'PDF, images, Excel, ZIP and metadata. Initial reception validation.',
        newUpload: 'New upload',
        company: 'Company / Client',
        selectCompanyFromPanel: 'Select a company from the panel and click "Start process".',
        backToPanel: 'Back to panel',
        selectedCompany: 'Selected company',
        uploadFiles: 'Upload files',
        uploadHint: 'PDF, JPG or PNG · max 5MB per file',
        batchName: 'Batch name',
        notes: 'Notes',
        required: 'Required',
        atLeastOneFile: 'At least one file is required',
        prepareUpload: 'Prepare upload',
        attachManually: 'Attach manually',
        receptionValidations: 'Reception validations',
      },
      requirement: {
        eyebrow: 'Requirement',
        title: 'Client Actions',
        subtitle: 'Reload doc, attach support, correct data, new evidence.',
        description: 'Description',
        fieldToCorrect: 'Field to correct',
        correctedValue: 'Corrected value',
        addField: 'Add field',
        attachSupport: 'Attach support',
        submitRequirement: 'Submit requirement',
        allInOrder: 'All in order / Next step',
        reloadDoc: 'Reload document',
        fixData: 'Correct data',
        newEvidence: 'New evidence',
        confirmMessage: 'Submit requirement data?',
        confirmHeader: 'Confirm',
        success: 'Requirement submitted successfully',
        error: 'Error submitting requirement',
      },
    },
  },
  es: {
    empresa: {
      dashboard: {
        eyebrow: 'Dashboard empresa',
        title: 'Panel operativo',
        subtitle: 'Estados, reportes, requerimientos, glosas y resultados finales.',
        selectCompanyTitle: 'Empresas / Clientes disponibles',
        selectCompanyHint: 'Haga clic en una fila para seleccionar la empresa, luego inicie trámite o vea su historial.',
        initCase: 'Iniciar trámite',
        viewAudit: 'Historial',
        requirements: 'Requerimientos',
        glosas: 'Glosas',
        finalResults: 'Resultados finales',
      },
      empresas: {
        eyebrow: 'Directorio',
        title: 'Lista de empresas',
        subtitle: 'Seleccione una empresa cliente para iniciar el flujo de un trámite o ver su historial de auditoría.',
      },
      auditoria: {
        eyebrow: 'Auditoría de flujos',
        subtitle: 'Historial de trámites registrados para esta empresa.',
        sessions: 'Trámites registrados',
        timeline: 'Timeline del trámite',
        empty: 'Esta empresa aún no tiene trámites registrados.',
      },
      intake: {
        eyebrow: 'Empresa cliente',
        title: 'Carga masiva / Intake',
        subtitle: 'PDF, imágenes, Excel, ZIP y metadata. Validaciones iniciales en recepción.',
        newUpload: 'Nueva carga',
        company: 'Empresa / Cliente',
        selectCompanyFromPanel: 'Seleccione una empresa en el panel y pulse "Iniciar trámite".',
        backToPanel: 'Volver al panel',
        selectedCompany: 'Empresa seleccionada',
        uploadFiles: 'Subir archivos',
        uploadHint: 'PDF, JPG o PNG · máx. 5MB por archivo',
        batchName: 'Nombre lote',
        notes: 'Notas',
        required: 'Requerido',
        atLeastOneFile: 'Al menos un archivo requerido',
        prepareUpload: 'Preparar carga',
        attachManually: 'Anexar manualmente',
        receptionValidations: 'Validaciones recepción',
      },
      requirement: {
        eyebrow: 'Requerimiento',
        title: 'Acciones empresa cliente',
        subtitle: 'Recargar doc, anexar soporte, corregir data, nueva evidencia.',
        description: 'Descripción',
        fieldToCorrect: 'Campo a corregir',
        correctedValue: 'Valor corregido',
        addField: 'Agregar campo',
        attachSupport: 'Anexar soporte',
        submitRequirement: 'Enviar requerimiento',
        allInOrder: 'Todo en orden / Siguiente',
        reloadDoc: 'Recargar documento',
        fixData: 'Corregir data',
        newEvidence: 'Nueva evidencia',
        confirmMessage: '¿Enviar datos del requerimiento?',
        confirmHeader: 'Confirmar',
        success: 'Requerimiento enviado exitosamente',
        error: 'Error al enviar requerimiento',
      },
    },
  },
};

let empresaTranslationsRegistered = false;

export function registerEmpresaTranslations(i18nService: I18nService): void {
  if (empresaTranslationsRegistered) {
    return;
  }
  i18nService.registerTranslations(EMPRESA_TRANSLATIONS);
  empresaTranslationsRegistered = true;
}
