import { z } from 'zod';

const text = (min: number, max: number) => z.string().min(min, `Mínimo ${min} caracteres`).max(max, `Máximo ${max} caracteres`);
const valor = z.number().positive('Valor deve ser positivo').max(999999999, 'Valor muito alto');

export const empresaSchema = z.object({
  nome: text(2, 100),
});

export const lojaSchema = z.object({
  nome: text(2, 100),
  empresa_id: z.string().uuid('Selecione uma empresa'),
});

export const usuarioSchema = z.object({
  nome: text(2, 100),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(128),
  empresa_id: z.string().optional(),
  loja_id: z.string().optional(),
  role: z.string().min(1, 'Selecione um perfil'),
});

export const contaPagarSchema = z.object({
  loja_id: z.string().uuid('Selecione uma loja'),
  fornecedor: text(1, 200),
  valor: valor,
  vencimento: z.string().min(1, 'Informe o vencimento'),
});

export const contaReceberSchema = z.object({
  loja_id: z.string().uuid('Selecione uma loja'),
  cliente: text(1, 200),
  valor: valor,
  vencimento: z.string().min(1, 'Informe o vencimento'),
});

export const auditoriaSchema = z.object({
  loja_id: z.string().uuid('Selecione uma loja'),
  tipo: text(1, 100),
  descricao: z.string().max(1000).optional(),
  valor: z.number().max(999999999).optional(),
});

export const metaSchema = z.object({
  loja_id: z.string().uuid('Selecione uma loja'),
  mes: z.string().min(1, 'Informe o mês'),
  meta_mensal: z.number().min(0, 'Valor inválido').max(999999999),
  meta_diaria: z.number().min(0, 'Valor inválido').max(999999999),
});

export const caixaSchema = z.object({
  saldo_inicial: z.number().min(0).max(999999999),
  dinheiro: z.number().min(0).max(999999999),
  pix: z.number().min(0).max(999999999),
  cartao: z.number().min(0).max(999999999),
  sangrias: z.number().min(0).max(999999999),
  suprimentos: z.number().min(0).max(999999999),
  saidas: z.number().min(0).max(999999999),
  valor_caixa_declarado: z.number().min(0).max(999999999).optional(),
});

export function validateOrError<T>(schema: z.ZodSchema<T>, data: unknown): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  return result.error.errors[0]?.message || 'Dados inválidos';
}
