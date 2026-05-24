declare function rethusValidator(docNumber: string): Promise<{
    status: boolean;
    payload: {
        estado: boolean;
        mensaje: string;
        razon: string | null;
        documento: string;
        fuente: string;
        scrapingExitoso: boolean;
        fecha: string;
        data: unknown;
    };
}>;
export default rethusValidator;
