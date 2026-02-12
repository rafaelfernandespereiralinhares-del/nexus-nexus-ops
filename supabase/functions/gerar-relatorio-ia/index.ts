import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { empresa_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hoje = new Date().toISOString().slice(0, 10);
    const mesAtual = hoje.slice(0, 7);
    const seteDiasAtras = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    // Fetch data
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

    // Save to database
    await supabaseAdmin.from("relatorios_ia").insert({
      empresa_id,
      data: hoje,
      texto,
    });

    return new Response(JSON.stringify({ texto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
