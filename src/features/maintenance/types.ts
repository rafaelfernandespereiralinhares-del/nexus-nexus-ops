export interface Manutencao {
    id: string;
    empresa_id: string;
    loja_id: string;
    descricao: string;
    data_solicitacao: string;
    data_agendamento: string | null;
    data_conclusao: string | null;
    status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
    prioridade: 'Baixa' | 'Media' | 'Alta' | 'Urgente';
    valor_estimado: number | null;
    valor_final: number | null;
    prestador_servico: string | null;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
}

export type NewManutencao = Omit<Manutencao, 'id' | 'created_at' | 'updated_at'>;
export type UpdateManutencao = Partial<NewManutencao>;
