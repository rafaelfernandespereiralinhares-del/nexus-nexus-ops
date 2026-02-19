import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente de suporte do NEXUS, um sistema SaaS de gestão operacional e financeira para redes de lojas físicas. Responda sempre em português brasileiro, de forma clara, objetiva e amigável.

**Sobre o NEXUS:**
O NEXUS é um sistema multi-empresa para gestão de lojas físicas com os seguintes módulos:

**Perfis de acesso:**
- LOJA: Acessa apenas dados da própria loja. Pode lançar e fechar o Caixa Diário e usar a Máquina Amarela.
- FINANCEIRO: Acessa todas as lojas da empresa. Gerencia Caixa, Conciliação, Metas, Contas a Pagar/Receber, Custo Casa, Auditoria, Funcionários, Campanhas, Folha/DRE.
- DIRETORIA: Vê Dashboard Executivo, Relatório IA e Planejamento DRE.
- ADMIN: Acesso total. Gerencia Empresas, Lojas, Usuários e todas as demais funcionalidades.

**Módulos do sistema:**
- **Caixa Diário**: Lançamento diário com Saldo Inicial, Dinheiro, PIX, Cartão, Sangrias, Suprimentos e Saídas. O total de entradas é calculado automaticamente. Após fechar, o status muda para "Fechado" e só o FINANCEIRO/ADMIN pode reabrir.
- **Conciliação Alterdata**: Upload de CSV/Excel com dados do PDV, comparação automática com o caixa, geração de status OK/DIVERGÊNCIA/ANÁLISE.
- **Metas**: Cadastro de meta diária e mensal por loja/mês. O dashboard mostra o % atingido.
- **Metas Semanais**: Planejamento semanal com folha, contas a pagar e margem de segurança.
- **Contas a Pagar/Receber**: CRUD completo com status ABERTO/PAGO/ATRASADO.
- **Custo Casa**: Controle de custos operacionais da empresa (retiradas, despesas gerais).
- **Máquina Amarela**: Registro de transações por tipo de pagamento com taxa e valor líquido.
- **Auditoria**: Registro de ocorrências com status ABERTA/EM_ANÁLISE/RESOLVIDA.
- **Funcionários**: Cadastro com salário, passagem, ajuda de custo, vínculo (CLT/MEI/PJ/Estagiário).
- **Campanhas de Vendas**: Criação de campanhas por período com meta de quantidade.
- **Folha & DRE**: Cálculo de folha e demonstrativo de resultados.
- **Dashboard Executivo (Diretoria)**: Faturamento total, inadimplência, ranking de lojas, semáforo de performance, evolução mensal.
- **Relatório IA**: Gera relatório automático com análise de desempenho usando Inteligência Artificial.
- **Planejamento DRE**: Projeções financeiras mensais por categoria.
- **Admin - Empresas/Lojas/Usuários**: Cadastro e gerenciamento de toda a estrutura.

**Dicas de uso:**
- Para instalar como app no celular: abra no Chrome, toque nos 3 pontos e selecione "Adicionar à tela inicial".
- O menu inferior no mobile mostra os 4 primeiros atalhos. Toque em "Mais" para ver todos os módulos.
- O caixa deve ser aberto no início do dia e fechado ao final. Após fechado, aguarde a conciliação do FINANCEIRO.
- Divergências na conciliação ficam marcadas em vermelho no semáforo das lojas.

Responda perguntas sobre como usar o sistema, navegação, funcionalidades e resolução de problemas. Seja direto e prático. Se não souber algo específico sobre o negócio do usuário, oriente-o a entrar em contato com o administrador do sistema.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para o assistente IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("suporte-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
