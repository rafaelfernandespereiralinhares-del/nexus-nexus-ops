import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { maintenanceSchema } from "../schema";
import type { MaintenanceFormValues } from "../schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMaintenance, useUpdateMaintenance } from "../api";
import type { Manutencao } from "../types";

interface MaintenanceFormProps {
    empresaId: string;
    lojaId: string;
    initialData?: Manutencao;
    onSuccess?: () => void;
}

export function MaintenanceForm({ empresaId, lojaId, initialData, onSuccess }: MaintenanceFormProps) {
    const isEditing = !!initialData;
    const createMutation = useCreateMaintenance();
    const updateMutation = useUpdateMaintenance();

    const form = useForm<MaintenanceFormValues>({
        resolver: zodResolver(maintenanceSchema) as any,
        defaultValues: (initialData as unknown as MaintenanceFormValues) || {
            empresa_id: empresaId,
            loja_id: lojaId,
            status: 'PENDENTE',
            valor_mao_de_obra: 0,
            valor_pecas: 0,
            custo_pecas: 0,
            taxa_maquina: 0,
            cliente_nome: '',
            aparelho_modelo: '',
        }
    });

    const { watch, handleSubmit, reset } = form;
    const vMaoObra = watch('valor_mao_de_obra') || 0;
    const vPecas = watch('valor_pecas') || 0;
    const vCusto = watch('custo_pecas') || 0;
    const vTaxa = watch('taxa_maquina') || 0;

    const total = vMaoObra + vPecas;
    const profit = total - vCusto - vTaxa;

    const onSubmit = (data: MaintenanceFormValues) => {
        // Inject calculated total and profit if backend doesn't do it (backend computed columns are read-only usually, but let's send total)
        const payload = { ...data, valor_total: total };

        if (isEditing && initialData) {
            updateMutation.mutate({ id: initialData.id, ...payload }, {
                onSuccess: () => {
                    reset();
                    onSuccess?.();
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    reset();
                    onSuccess?.();
                }
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Input {...form.register('cliente_nome')} placeholder="Nome do cliente" />
                </div>
                <div className="space-y-2">
                    <Label>Aparelho / Modelo</Label>
                    <Input {...form.register('aparelho_modelo')} placeholder="Ex: iPhone 13" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <div className="space-y-2">
                    <Label>Mão de Obra (R$)</Label>
                    <Input type="number" {...form.register('valor_mao_de_obra')} />
                </div>
                <div className="space-y-2">
                    <Label>Valor Peça (Cobrado)</Label>
                    <Input type="number" {...form.register('valor_pecas')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-primary font-bold">Total Cliente</Label>
                    <div className="flex h-10 items-center text-lg font-bold">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-red-50 dark:bg-red-900/10 border-red-100">
                <div className="space-y-2">
                    <Label>Custo Peça (Pago)</Label>
                    <Input type="number" {...form.register('custo_pecas')} />
                </div>
                <div className="space-y-2">
                    <Label>Taxa Maquininha</Label>
                    <Input type="number" {...form.register('taxa_maquina')} />
                </div>
                <div className="space-y-2">
                    <Label className="text-green-600 font-bold">Lucro Líquido</Label>
                    <div className="flex h-10 items-center text-lg font-bold text-green-600">{profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={v => form.setValue('status', v as any)} defaultValue={form.getValues('status')}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDENTE">Pendente</SelectItem>
                            <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                            <SelectItem value="ENTREGUE">Entregue</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Atualizar Serviço' : 'Registrar Serviço'}
            </Button>
        </form>
    )
}
