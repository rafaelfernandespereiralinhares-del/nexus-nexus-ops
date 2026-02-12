export type AppRole = 'ADMIN' | 'DIRETORIA' | 'FINANCEIRO' | 'LOJA';

export interface UserProfile {
  id: string;
  user_id: string;
  empresa_id: string | null;
  loja_id: string | null;
  nome: string;
  email: string;
  ativo: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
