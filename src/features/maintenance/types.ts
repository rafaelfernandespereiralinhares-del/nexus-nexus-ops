export interface Manutencao {
    id: string;
    empresa_id: string;
    loja_id: string;
    cliente_nome: string;
    aparelho_modelo: string;
    descricao_problema?: string;
    descricao_servico?: string;
    valor_mao_de_obra: number;
    valor_pecas: number;
    custo_pecas: number;
    taxa_maquina: number;
    valor_total: number;
    lucro_liquido: number;
    forma_pagamento?: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO_1X" | "CREDITO_2X";
    tecnico_id?: string | null;
    vendedor_id?: string | null;
    status: "PENDENTE" | "EM_ANDAMENTO" | "AGUARDANDO_PECA" | "CONCLUIDO" | "ENTREGUE" | "CANCELADO";
    created_at: string;
    updated_at: string;
}

export type NewManutencao = Omit<Manutencao, 'id' | 'created_at' | 'updated_at'>;
export type UpdateManutencao = Partial<NewManutencao>;
