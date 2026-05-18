import { useState } from "react";
import { MaintenanceForm } from "./components/MaintenanceForm";
import { MaintenanceList } from "./components/MaintenanceList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthYearPicker } from "@/components/ui/month-year-picker";
import { Separator } from "@/components/ui/separator";
import { DataImportButton } from "@/components/DataImportButton";
import { importService } from "@/services/importService";
import { useAuth } from "@/hooks/useAuth";

export default function MaintenancePage() {
    const { profile } = useAuth();
    const empresaId = profile?.empresa_id ?? "";
    const lojaId = profile?.loja_id ?? "";

    if (!empresaId || !lojaId) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-muted-foreground">Carregando contexto do usuário...</p>
            </div>
        );
    }
    const [date, setDate] = useState<Date>(new Date());

    const handleImport = async (data: any[]) => {
        await importService.importManutencoes(data, empresaId, lojaId);
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Manutenção</h1>
                    <p className="text-muted-foreground">Sistema de gestão de ordens de serviço (v2.0)</p>
                </div>
                <div className="flex items-center gap-2">
                    <MonthYearPicker date={date} setDate={setDate} />
                    <DataImportButton onImport={handleImport} label="Manutenções" />
                </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-8 md:grid-cols-[400px_1fr]">
                <Card className="h-fit border-primary/20 shadow-lg shadow-primary/5">
                    <CardHeader>
                        <CardTitle>Nova OS</CardTitle>
                        <CardDescription>Registre um novo serviço</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceForm empresaId={empresaId} lojaId={lojaId} />
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle>Serviços Recentes</CardTitle>
                        <CardDescription>
                            Histórico de manutenções de {date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MaintenanceList empresaId={empresaId} lojaId={lojaId} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
