

# NEXUS — SaaS Multi-Tenant de Gestão Operacional e Financeira

## Visão Geral
Sistema completo multi-empresa para gestão de redes de lojas físicas, com controle de caixa, conciliação, metas, contas a pagar/receber, auditoria e relatórios com IA. Administrado por um superadmin que cadastra empresas e usuários.

---

## 1. Identidade Visual & Design System
- **Cor primária**: Azul escuro `#0B1F3B` | Secundária: `#163E6C`
- **Fundo**: Branco, visual minimalista e executivo (corporativo premium)
- **Semáforo**: Verde para OK, amarelo para atenção, vermelho para risco/divergência
- **Layout responsivo**: Sidebar colapsável no desktop, bottom nav ou drawer no mobile
- **Tipografia limpa**, cards com sombras suaves, tabelas organizadas

---

## 2. Backend & Segurança (Supabase / Lovable Cloud)

### Autenticação
- Login por email + senha via Supabase Auth
- Redirecionamento automático conforme perfil (LOJA, FINANCEIRO, DIRETORIA, ADMIN)

### Banco de Dados (todas as tabelas com `empresa_id` e RLS)
- **empresas** — cadastro de empresas (nome, plano)
- **lojas** — lojas vinculadas a uma empresa
- **user_roles** — perfis RBAC separados (LOJA, FINANCEIRO, DIRETORIA, ADMIN)
- **profiles** — dados do usuário (nome, empresa_id, loja_id nullable)
- **fechamentos** — caixa diário com cálculos automáticos
- **metas** — metas mensais e diárias por loja
- **conciliacoes** — comparação PDV vs caixa com status
- **auditorias** — ocorrências e histórico
- **contas_pagar / contas_receber** — gestão financeira
- **relatorios_ia** — relatórios gerados pela IA
- **logs** — auditoria completa com antes/depois (JSON)

### Row-Level Security (RLS)
- Isolamento total por `empresa_id` em todas as tabelas
- LOJA só acessa dados da própria loja
- FINANCEIRO acessa todas as lojas da mesma empresa
- DIRETORIA acessa tudo da empresa (leitura)
- ADMIN (superadmin) gerencia empresas e usuários
- Funções `security definer` para verificação de roles sem recursão

### Regras de negócio no banco
- `total_entradas = dinheiro + pix + cartão`
- `saldo_final = saldo_inicial + total_entradas - saídas`
- `diferença = valor_pdv - valor_caixa`
- Soft delete (sem exclusão permanente)
- Logs automáticos em qualquer alteração relevante

---

## 3. Telas e Funcionalidades

### 3.1 Login
- Tela de login com email e senha
- Redirecionamento por perfil após autenticação

### 3.2 Painel Admin (Superadmin)
- CRUD de empresas
- CRUD de usuários (vincular a empresa, loja e perfil)
- Visão geral das empresas cadastradas

### 3.3 Perfil LOJA
- **Dashboard da Loja**: meta diária, realizado do dia, % atingido, status do caixa, botão "Fechar Caixa"
- **Caixa Diário**: formulário com saldo inicial, dinheiro, pix, cartão, saídas. Exibe total_entradas e saldo_final calculados. Botão salvar/fechar. Após fechado, loja não edita mais.

### 3.4 Perfil FINANCEIRO
- **Conciliação Alterdata**: Upload CSV/Excel, seleção de loja/data, mapeamento de colunas, comparação automática com caixa, geração de status (OK/DIVERGÊNCIA/ANÁLISE)
- **Metas**: Cadastro e edição de meta diária e mensal por loja, visualização de atingimento e projeção
- **Contas a Pagar/Receber**: CRUD completo com filtros por loja, status e vencimento
- **Auditoria**: Abertura de ocorrências, descrição, valor, status, histórico com filtros
- **Pode reabrir fechamentos** (com registro em log)

### 3.5 Perfil DIRETORIA
- **Dashboard Executivo**: Faturamento total, placeholders para lucro/margem, inadimplência, ranking por loja, semáforo de lojas (verde/amarelo/vermelho), gráficos de evolução mensal e comparação entre lojas
- **Relatório IA**: Botão "Gerar Relatório IA" que consolida dados dos últimos 7 dias + mês, envia para IA (via Lovable AI Gateway), salva resultado e exibe em tela com histórico de relatórios anteriores

---

## 4. Integração com IA (Lovable AI)
- Edge function dedicada para geração de relatórios
- Consolida: ranking, divergências, metas vs realizado, inadimplência, tendências
- Modelo: Google Gemini (via Lovable AI Gateway)
- Resultado salvo na tabela `relatorios_ia` com histórico consultável

---

## 5. Funcionalidades Transversais
- **Importação CSV/Excel** com biblioteca de parsing no frontend (xlsx)
- **Log de auditoria** em toda alteração crítica (antes/depois em JSON)
- **Soft delete** — nenhum dado é excluído permanentemente
- **Alertas visuais** — divergências e riscos destacados em vermelho
- **Responsivo** — funcional em desktop e mobile

