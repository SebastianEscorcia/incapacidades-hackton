export default function rethusValidator(docNumber: any): Promise<{
    status: any;
    payload: {
        estado: any;
        mensaje: any;
        razon: undefined;
        documento: any;
        fuente: string;
        scrapingExitoso: boolean;
        fecha: string;
        data: undefined;
    };
}>;
