import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Simulates generating a WhatsApp QR code.
 * In a real-world scenario, this would call an external API or use a dedicated worker service.
 */
export const getWhatsAppQRCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Verify admin role
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    
    if (!isAdmin) throw new Error("Acesso negado.");

    // 2. Mocking QR Code generation
    // We update the instance status to 'connecting' and generate a fake QR for demo purposes
    // A real implementation would integrate with Evolution API, Baileys, or similar.
    const fakeQRCode = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=WA-CONNECT-" + Date.now();
    
    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({ 
        status: 'connecting', 
        qr_code: fakeQRCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    return { success: true, qrCode: fakeQRCode };
  });

/**
 * Simulates confirming the WhatsApp connection.
 */
export const confirmWhatsAppConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    
    if (!isAdmin) throw new Error("Acesso negado.");

    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({ 
        status: 'connected', 
        qr_code: null,
        last_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    return { success: true };
  });

/**
 * Disconnects WhatsApp.
 */
export const disconnectWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    
    if (!isAdmin) throw new Error("Acesso negado.");

    const { error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({ 
        status: 'disconnected', 
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    return { success: true };
  });
