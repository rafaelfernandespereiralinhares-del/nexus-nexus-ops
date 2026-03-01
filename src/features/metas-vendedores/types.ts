export interface MetaVendedor {
  id: string;
  empresa_id: string;
  loja_id: string;
  funcionario_id: string;
  mes: string;
  escala: string;
  unidade_de_trabalho: string;
  qtd_unidades_reais_mes: number;
  horas_liquidas_mes: number;
  meta_mensal: number;
  meta_semanal_s1: number;
  meta_semanal_s2: number;
  meta_semanal_s3: number;
  meta_semanal_s4: number;
  meta_por_unidade: number;
  faixa_premio_30: number;
  faixa_premio_50: number;
  faixa_premio_80: number;
  faixa_premio_120: number;
  min_semanal_s1: number;
  min_semanal_s2: number;
  min_semanal_s3: number;
  min_semanal_s4: number;
  min_mensal: number;
  realizado_mensal: number;
  realizado_semanal_s1: number;
  realizado_semanal_s2: number;
  realizado_semanal_s3: number;
  realizado_semanal_s4: number;
  created_at: string;
  updated_at: string;
}

export interface PremiacaoConfig {
  id: string;
  empresa_id: string;
  mes: string;
  premio_diario_faixa1_mult: number;
  premio_diario_faixa1_valor: number;
  premio_diario_faixa2_mult: number;
  premio_diario_faixa2_valor: number;
  premio_diario_faixa3_mult: number;
  premio_diario_faixa3_valor: number;
  premio_diario_faixa4_mult: number;
  premio_diario_faixa4_valor: number;
  premio_semanal_valor: number;
  premio_semanal_min_participacao: number;
  premio_mensal_vendedor_valor: number;
  premio_mensal_vendedor_min_participacao: number;
  premio_mensal_loja_valor: number;
  premio_mensal_loja_min_participacao: number;
  multiplicador_meta_final: number;
  pesos_semana_json: number[];
  created_at: string;
  updated_at: string;
}

export interface Funcionario {
  id: string;
  nome: string;
  loja_id: string;
  cargo: string;
  ativo: boolean;
}

export interface Loja {
  id: string;
  nome: string;
}
