import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useMaintenanceServices, useDeleteMaintenance } from "../api";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { MaintenanceForm } from "./MaintenanceForm";
import type { Manutencao } from "../types";

export function MaintenanceList({ empresaId, lojaId }: { empresaId: string, lojaId: string }) {
    const { data: services, isLoading } = useMaintenanceServices(empresaId);
    const deleteMutation = useDeleteMaintenance();
    const [editingService, setEditingService] = useState<Manutencao | null>(null);

    if (isLoading) return <div>Carregando serviços...</div>;

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Lucro</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services?.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>{format(new Date(s.created_at), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="font-medium">{s.cliente_nome}</TableCell>
                                <TableCell>{s.aparelho_modelo}</TableCell>
                                <TableCell>{s.status}</TableCell>
                                <TableCell className="text-right">
                                    {(s.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell className="text-right text-green-600 font-medium">
                                    {(s.lucro_liquido || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingService(s)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja excluir este serviço?')) {
                                                    deleteMutation.mutate(s.id);
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {services?.length === 0 && (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Nenhum serviço registrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingService} onOpenChange={(o) => !o && setEditingService(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Serviço</DialogTitle>
                    </DialogHeader>
                    {editingService && (
                        <MaintenanceForm
                            empresaId={empresaId}
                            lojaId={lojaId}
                            initialData={editingService}
                            onSuccess={() => setEditingService(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
