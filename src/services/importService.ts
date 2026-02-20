import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";

// Helper to clean currency strings (e.g. "R$ 1.200,50" -> 1200.50)
const parseCurrency = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        return parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    }
    return 0;
};

// Helper to parse dates (e.g. "18/02/2026" or Excel serial -> ISO String)
// Note: This is a simplified parser. Excel parsing often needs more robust libraries if raw values are serials.
const parseDate = (value: any): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();

    // Excel serial number (days since 1900-01-01)
    if (typeof value === 'number') {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return date.toString() !== 'Invalid Date' ? date.toISOString() : null;
    }

    if (typeof value === 'string') {
        // Handle DD/MM/YYYY
        if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [day, month, year] = value.split('/').map(Number);
            return new Date(year, month - 1, day).toISOString();
        }
        // Handle YYYY-MM-DD
        const date = new Date(value);
        return date.toString() !== 'Invalid Date' ? date.toISOString() : null;
    }

    return null;
};

export const importService = {
    async importManutencoes(data: any[], empresaId: string, lojaId: string) {
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            cliente_nome: item['Cliente'] || 'Cliente Desconhecido',
            aparelho_modelo: item['Aparelho'] || 'N/A',
            valor_total: parseCurrency(item['Valor Total']),
            valor_pecas: parseCurrency(item['Valor Peça']),
            valor_mao_de_obra: parseCurrency(item['Mão de Obra']),
            custo_pecas: parseCurrency(item['Custo Peça']),
            status: item['Status'] || 'Aberto',
            taxa_maquina: 0, // Default
            // Add other fields as needed based on schema
        }));

        const { error } = await supabase.from('manutencoes' as any).insert(formattedData);
        if (error) throw error;
    },

    async importContasPagar(data: any[], empresaId: string, lojaId: string) {
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            fornecedor: item['Fornecedor'] || 'Fornecedor Desconhecido',
            valor: parseCurrency(item['Valor']),
            vencimento: parseDate(item['Vencimento']) || new Date().toISOString(),
            status: 'pendente', // Default
            data_pagamento: item['Data Pagamento'] ? parseDate(item['Data Pagamento']) : null,
        }));
        const { error } = await supabase.from('contas_pagar' as any).insert(formattedData);
        if (error) throw error;
    },

    async importContasReceber(data: any[], empresaId: string, lojaId: string) {
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            cliente: item['Cliente'] || 'Cliente Desconhecido',
            valor: parseCurrency(item['Valor']),
            vencimento: parseDate(item['Vencimento']) || new Date().toISOString(),
            status: 'pendente', // Default
            data_pagamento: item['Data Pagamento'] ? parseDate(item['Data Pagamento']) : null,
        }));
        const { error } = await supabase.from('contas_receber' as any).insert(formattedData);
        if (error) throw error;
    },

    async importFuncionarios(data: any[], empresaId: string, lojaId: string) {
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            nome: item['Nome'],
            cargo: item['Cargo'] || 'Funcionário',
            salario: parseCurrency(item['Salário']),
            admissao: parseDate(item['Admissão']) || new Date().toISOString(),
            ativo: true,
            ajuda_custo: parseCurrency(item['Ajuda Custo']),
            passagem: parseCurrency(item['Passagem']),
            vinculo: 'clt' // Default, assumes enum matches
        }));
        const { error } = await supabase.from('funcionarios' as any).insert(formattedData);
        if (error) throw error;
    },

    async importCaixaDiario(data: any[], empresaId: string, lojaId: string) {
        // This often maps to 'fechamentos' or a transactions table. Using 'fechamentos' for daily summary.
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            data: parseDate(item['Data']) || new Date().toISOString(),
            saldo_inicial: parseCurrency(item['Saldo Inicial']),
            dinheiro: parseCurrency(item['Dinheiro']),
            pix: parseCurrency(item['Pix']),
            cartao: parseCurrency(item['Cartão']),
            sangrias: parseCurrency(item['Sangrias']),
            suprimentos: parseCurrency(item['Suprimentos']),
            saidas: parseCurrency(item['Saídas']),
            status: 'pendente'
        }));
        const { error } = await supabase.from('fechamentos' as any).insert(formattedData);
        if (error) throw error;
    },

    async importMetas(data: any[], empresaId: string, lojaId: string) {
        void lojaId;
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: lojaId,
            mes: item['Mês'] || new Date().toLocaleString('default', { month: 'long' }),
            meta_mensal: parseCurrency(item['Meta Mensal']),
            meta_diaria: parseCurrency(item['Meta Diária']),
            meta_lucro: parseCurrency(item['Meta Lucro']),
            realizado_faturamento: parseCurrency(item['Realizado Faturamento']),
            realizado_lucro: parseCurrency(item['Realizado Lucro'])
        }));
        const { error } = await supabase.from('metas' as any).insert(formattedData);
        if (error) throw error;
    },

    async importCampanhas(data: any[], empresaId: string, lojaId: string) {
        void lojaId;
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            nome: item['Nome Campanha'],
            tipo: (item['Tipo'] || 'MENSAL').toUpperCase(),
            data_inicio: parseDate(item['Início']) || new Date().toISOString(),
            data_fim: parseDate(item['Fim']) || new Date().toISOString(),
            meta_quantidade: parseInt(item['Meta Qtd'] || '0'),
            progresso: parseInt(item['Progresso'] || '0'),
            produto_servico: item['Produto/Serviço'] || 'Geral',
            ativa: true
        }));
        const { error } = await supabase.from('campanhas' as any).insert(formattedData);
        if (error) throw error;
    },

    importPlanejamento(data: any[], empresaId: string, lojaId: string) {
        void lojaId;
        const formattedData = data.map(item => ({
            empresa_id: empresaId,
            loja_id: null,
            loja_nome: item['Loja'] || 'Geral',
            ano: parseInt(item['Ano'] || new Date().getFullYear().toString()),
            mes: parseInt(item['Mês'] || '1'),
            categoria: item['Categoria'],
            subcategoria: item['Subcategoria'] || '',
            valor: parseCurrency(item['Valor']),
            percentual: parseFloat((item['%'] || '0').replace('%', '').replace(',', '.'))
        }));
        return supabase.from('dre_historico' as any).insert(formattedData).then(({ error }) => { if (error) throw error; });
    },

    async importEmpresas(data: any[]) {
        const formattedData = data.map(item => ({
            nome: item['Nome'],
            ativo: true
        }));
        const { error } = await supabase.from('empresas').insert(formattedData);
        if (error) throw error;
    },

    async importLojas(data: any[]) {
        // Need to resolve company ID by name or expect ID in excel. 
        // For simplicity, assuming 'Empresa ID' or trying to find by name would be complex here without pre-fetching.
        // Failing back to a simple schema: Nome, Empresa ID
        const formattedData = data.map(item => ({
            nome: item['Nome'],
            empresa_id: item['Empresa ID'], // User must provide ID for now or we enforce single company import context
            ativa: true
        }));
        const { error } = await supabase.from('lojas').insert(formattedData);
        if (error) throw error;
    },

    async importUsuarios(data: any[]) {
        // Note: Creating users usually requires calling Auth API which might be rate limited or restricted on client side.
        // We will call the create-user function for each row.
        const promises = data.map(item =>
            supabase.functions.invoke('create-user', {
                body: {
                    email: item['Email'],
                    password: item['Senha'] || '123456', // Default password if missing
                    nome: item['Nome'],
                    empresa_id: item['Empresa ID'] || null,
                    loja_id: item['Loja ID'] || null,
                    role: item['Perfil'] || 'LOJA'
                }
            })
        );
        const results = await Promise.all(promises);
        const errors = results.filter(r => r.error).map(r => r.error);
        if (errors.length > 0) throw new Error(`${errors.length} usuários falharam. Verifique os logs.`);
    }
};
