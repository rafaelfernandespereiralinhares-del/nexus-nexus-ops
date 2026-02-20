import { useState } from "react";
import { FileImport } from "@/components/FileImport";
import { DataPreviewDialog } from "@/components/DataPreviewDialog";
import { toast } from "sonner";

interface DataImportButtonProps {
    onImport: (data: any[]) => Promise<void>;
    label?: string;
}

export function DataImportButton({ onImport, label = "Importar" }: DataImportButtonProps) {
    const [importedData, setImportedData] = useState<any[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleDataLoaded = (data: any[]) => {
        setImportedData(data);
        setIsPreviewOpen(true);
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            await onImport(importedData);
            toast.success("Importação concluída!", {
                description: `${importedData.length} registros processados.`,
            });
            setIsPreviewOpen(false);
            setImportedData([]);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar dados", {
                description: "Ocorreu um erro ao processar a importação.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <FileImport onDataLoaded={handleDataLoaded} />

            <DataPreviewDialog
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                data={importedData}
                onConfirm={handleConfirm}
                isLoading={isSaving}
                title={`Importar ${label}`}
            />
        </>
    );
}
