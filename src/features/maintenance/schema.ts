import { z } from "zod";

export const maintenanceSchema = z.object({
    empresa_id: z.string().uuid(),
    loja_id: z.string().uuid(),
    cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
    aparelho_modelo: z.string().min(1, "Modelo do aparelho é obrigatório"),
    descricao_problema: z.string().optional(),
    descricao_servico: z.string().optional(),
    valor_mao_de_obra: z.coerce.number().min(0, "Valor inválido"),
    valor_pecas: z.coerce.number().min(0, "Valor inválido"),
    custo_pecas: z.coerce.number().min(0, "Valor inválido"),
    taxa_maquina: z.coerce.number().min(0, "Valor inválido"),
    forma_pagamento: z.enum(["DINHEIRO", "PIX", "DEBITO", "CREDITO_1X", "CREDITO_2X"]).optional(),
    tecnico_id: z.string().uuid().optional().nullable(),
    vendedor_id: z.string().uuid().optional().nullable(),
    status: z.enum(["PENDENTE", "EM_ANDAMENTO", "AGUARDANDO_PECA", "CONCLUIDO", "ENTREGUE", "CANCELADO"]),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
