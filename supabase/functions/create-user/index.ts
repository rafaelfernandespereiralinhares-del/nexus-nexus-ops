import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // === Authentication: verify caller is ADMIN ===
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

    // Verify ADMIN role using service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);

    if (!callerRoles?.some((r: { role: string }) => r.role === "ADMIN")) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Validation ===
    const { email, password, nome, empresa_id, loja_id, role } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!password || password.length < 6 || password.length > 128) {
      return new Response(JSON.stringify({ error: "Senha deve ter entre 6 e 128 caracteres" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!nome || nome.length < 2 || nome.length > 100) {
      return new Response(JSON.stringify({ error: "Nome deve ter entre 2 e 100 caracteres" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const validRoles = ["ADMIN", "DIRETORIA", "FINANCEIRO", "LOJA"];
    if (role && !validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Perfil inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (empresa_id && !uuidRegex.test(empresa_id)) {
      return new Response(JSON.stringify({ error: "ID de empresa inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (loja_id && !uuidRegex.test(loja_id)) {
      return new Response(JSON.stringify({ error: "ID de loja inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // Update profile with empresa and loja
    await supabaseAdmin.from("profiles").update({
      empresa_id: empresa_id || null,
      loja_id: loja_id || null,
    }).eq("user_id", userId);

    // Assign role
    if (role) {
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role,
      });
    }

    return new Response(JSON.stringify({ user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-user error:", e);
    const msg = e.message?.includes("already been registered")
      ? "Este email já está cadastrado"
      : "Erro ao criar usuário. Tente novamente.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
