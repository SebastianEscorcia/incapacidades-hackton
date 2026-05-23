import type { AppLanguage, TranslationDictionary } from '../../../core/i18n/i18n.types';
import type { I18nService } from '../../../core/i18n/i18n.service';

export const EMPRESA_TRANSLATIONS: Partial<Record<AppLanguage, TranslationDictionary>> = {
  en: {
    empresa: {
      dashboard: {
        eyebrow: 'Enterprise Dashboard',
        title: 'Operations Panel',
        subtitle: 'Status, reports, requirements, claims and final results.',
        selectCompanyTitle: 'Select an Enterprise / Client to start filing',
        initCase: 'Start process',
        requirements: 'Requirements',
        glosas: 'Claims',
        finalResults: 'Final results',
      },
      intake: {
        eyebrow: 'Client Enterprise',
        title: 'Mass Upload / Intake',
        subtitle: 'PDF, images, Excel, ZIP and metadata. Initial reception validation.',
        newUpload: 'New upload',
        company: 'Company / Client',
        selectCompany: 'Select a company',
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
        selectCompanyTitle: 'Seleccione una Empresa / Cliente para iniciar trámite',
        initCase: 'Iniciar trámite',
        requirements: 'Requerimientos',
        glosas: 'Glosas',
        finalResults: 'Resultados finales',
      },
      intake: {
        eyebrow: 'Empresa cliente',
        title: 'Carga masiva / Intake',
        subtitle: 'PDF, imágenes, Excel, ZIP y metadata. Validaciones iniciales en recepción.',
        newUpload: 'Nueva carga',
        company: 'Empresa / Cliente',
        selectCompany: 'Seleccione una empresa',
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
