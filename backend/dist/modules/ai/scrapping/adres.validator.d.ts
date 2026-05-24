declare function adresValidator(docNumber: string, expectedEps?: string | null): Promise<{
    status: boolean;
    payload: {
        estado: boolean;
        mensaje: string;
        razon: string | null;
        documento: string;
        epsValidada: string | null;
        scrapingExitoso: boolean;
        fuente: string;
        fecha: string;
        data: unknown;
    };
}>;
export default adresValidator;
