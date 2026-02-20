import { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface UseExcelImportOptions {
    onSuccess?: (data: any[]) => void;
    onError?: (error: Error) => void;
}

export function useExcelImport({ onSuccess, onError }: UseExcelImportOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);

    const parseExcel = async (file: File) => {
        setIsLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                raw: false, // Parse dates as strings initially to avoid timezone issues
                dateNF: 'yyyy-mm-dd',
            });

            if (jsonData.length === 0) {
                throw new Error("A planilha está vazia.");
            }

            toast.success("Planilha processada com sucesso!", {
                description: `${jsonData.length} registros encontrados.`,
            });

            onSuccess?.(jsonData);
            return jsonData;
        } catch (error) {
            console.error("Error parsing Excel:", error);
            const err = error instanceof Error ? error : new Error("Erro desconhecido ao processar planilha.");

            toast.error("Erro na importação", {
                description: err.message,
            });

            onError?.(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        parseExcel,
        isLoading
    };
}
