import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface DataPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    onConfirm: () => void;
    isLoading?: boolean;
    title?: string;
}

export function DataPreviewDialog({
    isOpen,
    onClose,
    data,
    onConfirm,
    isLoading = false,
    title = "Pré-visualização de Importação"
}: DataPreviewDialogProps) {

    if (!data || data.length === 0) return null;

    const headers = Object.keys(data[0]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Confira os dados abaixo antes de confirmar a importação.
                        <br />
                        Total de registros: <strong>{data.length}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden border rounded-md my-4">
                    <ScrollArea className="h-[400px]">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0">
                                <TableRow>
                                    {headers.map((header) => (
                                        <TableHead key={header} className="whitespace-nowrap">
                                            {header}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((row, i) => (
                                    <TableRow key={i}>
                                        {headers.map((header) => (
                                            <TableCell key={`${i}-${header}`}>
                                                {String(row[header] ?? "")}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>

                <div className="flex justify-end gap-2 mt-auto">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirm} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Importação
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
