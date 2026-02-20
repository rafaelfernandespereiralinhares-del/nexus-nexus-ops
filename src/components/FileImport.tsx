import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileUp, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExcelImport } from "@/hooks/useExcelImport";
import { toast } from "sonner";

interface FileImportProps {
    onDataLoaded?: (data: any[]) => void;
}

export function FileImport({ onDataLoaded }: FileImportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { parseExcel, isLoading } = useExcelImport({
        onSuccess: (data) => {
            if (onDataLoaded) onDataLoaded(data);
        }
    });

    const handleImportClick = (type: 'excel' | 'pdf' | 'other') => {
        if (type === 'excel') {
            fileInputRef.current?.click();
        } else {
            toast.info(`Importação de ${type.toUpperCase()} em breve`, {
                description: "No momento, apenas arquivos Excel (.xlsx, .xls) são suportados para processamento automático.",
            });
        }
    };

    const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast.error("Formato inválido", {
                description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)."
            });
            return;
        }

        await parseExcel(file);

        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept=".xlsx, .xls"
                className="hidden"
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                        Importar
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleImportClick('excel')}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Planilha Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleImportClick('pdf')}>
                        <FileText className="mr-2 h-4 w-4" />
                        Arquivo PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleImportClick('other')}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Outros Arquivos
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
