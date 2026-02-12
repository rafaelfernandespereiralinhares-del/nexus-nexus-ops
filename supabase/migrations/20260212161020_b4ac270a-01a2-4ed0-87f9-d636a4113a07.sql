
-- =============================================
-- NEXUS v2 — Complete Database Schema
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'DIRETORIA', 'FINANCEIRO', 'LOJA');
CREATE TYPE public.fechamento_status AS ENUM ('ABERTO', 'FECHADO_PENDENTE_CONCILIACAO', 'CONCILIADO_OK', 'CONCILIADO_DIVERGENCIA', 'REABERTO');
CREATE TYPE public.conciliacao_status AS ENUM ('OK', 'DIVERGENCIA', 'ANALISE');
CREATE TYPE public.conta_pagar_status AS ENUM ('ABERTO', 'PAGO', 'ATRASADO');
CREATE TYPE public.conta_receber_status AS ENUM ('ABERTO', 'PAGO', 'ATRASADO', 'NEGOCIADO');
CREATE TYPE public.etapa_cobranca AS ENUM ('D1', 'D7', 'D15', 'D30', 'JURIDICO');
CREATE TYPE public.auditoria_status AS ENUM ('ABERTA', 'EM_ANALISE', 'RESOLVIDA');

-- 2. BASE TABLES

-- Planos
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  limite_lojas INT NOT NULL DEFAULT 10,
  limite_usuarios INT NOT NULL DEFAULT 50,
  limite_relatorios_ia_mensal INT NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Empresas
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  plano_id UUID REFERENCES public.planos(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lojas
CREATE TABLE public.lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id),
  loja_id UUID REFERENCES public.lojas(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- User Roles (separate table for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Fechamentos (caixa diário)
CREATE TABLE public.fechamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  data DATE NOT NULL,
  saldo_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  dinheiro NUMERIC(12,2) NOT NULL DEFAULT 0,
  pix NUMERIC(12,2) NOT NULL DEFAULT 0,
  cartao NUMERIC(12,2) NOT NULL DEFAULT 0,
  sangrias NUMERIC(12,2) NOT NULL DEFAULT 0,
  suprimentos NUMERIC(12,2) NOT NULL DEFAULT 0,
  saidas NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_entradas NUMERIC(12,2) GENERATED ALWAYS AS (dinheiro + pix + cartao) STORED,
  saldo_final NUMERIC(12,2) GENERATED ALWAYS AS (saldo_inicial + dinheiro + pix + cartao + suprimentos - sangrias - saidas) STORED,
  valor_caixa_declarado NUMERIC(12,2),
  status public.fechamento_status NOT NULL DEFAULT 'ABERTO',
  responsavel_usuario_id UUID REFERENCES auth.users(id),
  responsavel_nome_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Metas
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  mes TEXT NOT NULL, -- YYYY-MM
  meta_mensal NUMERIC(12,2) NOT NULL DEFAULT 0,
  meta_diaria NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conciliações
CREATE TABLE public.conciliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  data DATE NOT NULL,
  valor_pdv NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_caixa NUMERIC(12,2) NOT NULL DEFAULT 0,
  diferenca NUMERIC(12,2) GENERATED ALWAYS AS (valor_pdv - valor_caixa) STORED,
  status public.conciliacao_status NOT NULL DEFAULT 'ANALISE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contas a Pagar
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  fornecedor TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  data_pagamento DATE,
  status public.conta_pagar_status NOT NULL DEFAULT 'ABERTO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  cliente TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  data_pagamento DATE,
  status public.conta_receber_status NOT NULL DEFAULT 'ABERTO',
  etapa_cobranca public.etapa_cobranca DEFAULT 'D1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auditorias
CREATE TABLE public.auditorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  tipo TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2),
  status public.auditoria_status NOT NULL DEFAULT 'ABERTA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Relatórios IA
CREATE TABLE public.relatorios_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  usuario_id UUID REFERENCES auth.users(id),
  entidade TEXT NOT NULL,
  entidade_id UUID,
  acao TEXT NOT NULL,
  antes_json JSONB,
  depois_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_lojas_empresa ON public.lojas(empresa_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_profiles_empresa ON public.profiles(empresa_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_fechamentos_loja_data ON public.fechamentos(loja_id, data);
CREATE INDEX idx_fechamentos_empresa ON public.fechamentos(empresa_id);
CREATE INDEX idx_metas_loja_mes ON public.metas(loja_id, mes);
CREATE INDEX idx_conciliacoes_loja_data ON public.conciliacoes(loja_id, data);
CREATE INDEX idx_contas_pagar_empresa ON public.contas_pagar(empresa_id);
CREATE INDEX idx_contas_receber_empresa ON public.contas_receber(empresa_id);
CREATE INDEX idx_auditorias_empresa ON public.auditorias(empresa_id);
CREATE INDEX idx_logs_empresa ON public.logs(empresa_id);

-- 4. SECURITY DEFINER HELPER FUNCTIONS

-- Get user empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Get user loja_id
CREATE OR REPLACE FUNCTION public.get_user_loja_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT loja_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
$$;

-- Check if user has any of specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(_roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = ANY(_roles)
  )
$$;

-- 5. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_fechamentos_updated BEFORE UPDATE ON public.fechamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_metas_updated BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_conciliacoes_updated BEFORE UPDATE ON public.conciliacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_contas_pagar_updated BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_contas_receber_updated BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_auditorias_updated BEFORE UPDATE ON public.auditorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ENABLE RLS ON ALL TABLES
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES

-- PLANOS: everyone authenticated can read, admin can manage
CREATE POLICY "planos_select" ON public.planos FOR SELECT TO authenticated USING (true);
CREATE POLICY "planos_admin" ON public.planos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- EMPRESAS
CREATE POLICY "empresas_select" ON public.empresas FOR SELECT TO authenticated
  USING (public.is_admin() OR id = public.get_user_empresa_id());
CREATE POLICY "empresas_insert" ON public.empresas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "empresas_update" ON public.empresas FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "empresas_delete" ON public.empresas FOR DELETE TO authenticated
  USING (public.is_admin());

-- LOJAS
CREATE POLICY "lojas_select" ON public.lojas FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "lojas_insert" ON public.lojas FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "lojas_update" ON public.lojas FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "lojas_delete" ON public.lojas FOR DELETE TO authenticated
  USING (public.is_admin());

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR empresa_id = public.get_user_empresa_id()
  );
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- USER_ROLES
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_admin());
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_admin());

-- TENANT-SCOPED TABLES (fechamentos, metas, conciliacoes, contas_pagar, contas_receber, auditorias)
-- Pattern: Admin full, DIRETORIA/FINANCEIRO same empresa, LOJA only own loja

-- FECHAMENTOS
CREATE POLICY "fechamentos_select" ON public.fechamentos FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      public.is_admin()
      OR (empresa_id = public.get_user_empresa_id() AND (
        public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
        OR loja_id = public.get_user_loja_id()
      ))
    )
  );
CREATE POLICY "fechamentos_insert" ON public.fechamentos FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO','LOJA']::public.app_role[])
    ))
  );
CREATE POLICY "fechamentos_update" ON public.fechamentos FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR (loja_id = public.get_user_loja_id() AND status = 'ABERTO')
    ))
  );

-- METAS
CREATE POLICY "metas_select" ON public.metas FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR loja_id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "metas_insert" ON public.metas FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "metas_update" ON public.metas FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );

-- CONCILIACOES
CREATE POLICY "conciliacoes_select" ON public.conciliacoes FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR loja_id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "conciliacoes_insert" ON public.conciliacoes FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "conciliacoes_update" ON public.conciliacoes FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );

-- CONTAS_PAGAR
CREATE POLICY "contas_pagar_select" ON public.contas_pagar FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR loja_id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "contas_pagar_insert" ON public.contas_pagar FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "contas_pagar_update" ON public.contas_pagar FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );

-- CONTAS_RECEBER
CREATE POLICY "contas_receber_select" ON public.contas_receber FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR loja_id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "contas_receber_insert" ON public.contas_receber FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "contas_receber_update" ON public.contas_receber FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );

-- AUDITORIAS
CREATE POLICY "auditorias_select" ON public.auditorias FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND (
      public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[])
      OR loja_id = public.get_user_loja_id()
    ))
  );
CREATE POLICY "auditorias_insert" ON public.auditorias FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "auditorias_update" ON public.auditorias FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );

-- RELATORIOS_IA
CREATE POLICY "relatorios_ia_select" ON public.relatorios_ia FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "relatorios_ia_insert" ON public.relatorios_ia FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA']::public.app_role[]))
  );

-- LOGS
CREATE POLICY "logs_select" ON public.logs FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA','FINANCEIRO']::public.app_role[]))
  );
CREATE POLICY "logs_insert" ON public.logs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin()
    OR empresa_id = public.get_user_empresa_id()
  );

-- 9. INSERT DEFAULT PLAN
INSERT INTO public.planos (nome, limite_lojas, limite_usuarios, limite_relatorios_ia_mensal)
VALUES ('Básico', 5, 20, 5), ('Profissional', 20, 100, 30), ('Enterprise', 999, 9999, 999);
