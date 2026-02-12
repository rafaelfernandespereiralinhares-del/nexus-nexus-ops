import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // === Authentication: verify caller has DIRETORIA or ADMIN role ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (!callerRoles?.some((r: { role: string }) => r.role === "DIRETORIA" || r.role === "ADMIN")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a diretoria" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify empresa_id matches caller's company
    const { empresa_id } = await req.json();

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!empresa_id || !uuidRegex.test(empresa_id)) {
      return new Response(JSON.stringify({ error: "ID de empresa inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("empresa_id")
      .eq("user_id", callerId)
      .single();

    // Non-ADMIN users can only generate reports for their own company
    const isAdmin = callerRoles?.some((r: { role: string }) => r.role === "ADMIN");
    if (!isAdmin && callerProfile?.empresa_id !== empresa_id) {
      return new Response(JSON.stringify({ error: "Acesso negado a esta empresa" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const hoje = new Date().toISOString().slice(0, 10);
    const mesAtual = hoje.slice(0, 7);
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const [fechRes, metasRes, concRes, receberRes, lojasRes] = await Promise.all([
      supabaseAdmin.from("fechamentos").select("*").eq("empresa_id", empresa_id).is("deleted_at", null).gte("data", seteDiasAtras),
      supabaseAdmin.from("metas").select("*").eq("empresa_id", empresa_id).eq("mes", mesAtual),
      supabaseAdmin.from("conciliacoes").select("*").eq("empresa_id", empresa_id).gte("data", seteDiasAtras),
      supabaseAdmin.from("contas_receber").select("*").eq("empresa_id", empresa_id).eq("status", "ATRASADO"),
      supabaseAdmin.from("lojas").select("id, nome").eq("empresa_id", empresa_id).eq("ativa", true),
    ]);

    const prompt = `Você é um analista financeiro do sistema NEXUS. Gere um relatório executivo em português sobre a empresa nos últimos 7 dias e mês atual.

DADOS:
- Lojas: ${JSON.stringify(lojasRes.data)}
- Fechamentos (últimos 7 dias): ${JSON.stringify(fechRes.data)}
- Metas do mês: ${JSON.stringify(metasRes.data)}
- Conciliações (últimos 7 dias): ${JSON.stringify(concRes.data)}
- Contas em atraso: ${JSON.stringify(receberRes.data)}

Inclua: ranking de lojas, divergências, metas vs realizado, inadimplência, tendências e recomendações.
Formato: relatório executivo conciso com bullet points.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista financeiro especialista em redes de lojas físicas." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro ao gerar relatório com IA");
    }

    const aiData = await aiResp.json();
    const texto = aiData.choices?.[0]?.message?.content || "Sem conteúdo gerado.";

    await supabaseAdmin.from("relatorios_ia").insert({
      empresa_id,
      data: hoje,
      texto,
    });

    return new Response(JSON.stringify({ texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-relatorio-ia error:", e);
    return new Response(JSON.stringify({ error: "Erro ao gerar relatório. Tente novamente." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
