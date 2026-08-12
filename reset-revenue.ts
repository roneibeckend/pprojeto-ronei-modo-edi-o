import { supabaseAdmin } from "./src/integrations/supabase/client.server.ts";

async function resetRevenue() {
  console.log("Iniciando reset de receita manual...");
  const { error } = await supabaseAdmin
    .from("financial_settings")
    .update({ manual_revenue: 0 })
    .eq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("Erro ao resetar:", error);
  } else {
    console.log("Sucesso: Receita manual resetada para 0.");
  }
}

resetRevenue();
