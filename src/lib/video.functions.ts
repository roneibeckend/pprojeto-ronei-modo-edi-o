import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getSignedVideoUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ 
    path: z.string(),
    bucket: z.string().default("course-assets")
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Path might be a full public URL, we need to extract the relative path if it is
    let relativePath = data.path;
    if (data.path.includes('/storage/v1/object/public/')) {
        const parts = data.path.split(`${data.bucket}/`);
        if (parts.length > 1) {
            relativePath = parts[parts.length - 1];
        }
    } else if (data.path.includes('/storage/v1/object/sign/')) {
        // Already a signed URL or weird format, try to extract path
        const parts = data.path.split(`${data.bucket}/`);
        if (parts.length > 1) {
            relativePath = parts[parts.length - 1].split('?')[0];
        }
    }
    
    // Remove "videos/" prefix if it's already there and we are prepending it in storage logic
    // Actually, VideoUpload saves it as 'videos/filename.mp4'
    
    const { data: signedData, error } = await supabaseAdmin.storage
      .from(data.bucket)
      .createSignedUrl(relativePath, 21600); // 6 hours - long enough for a full session

    if (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Falha ao gerar URL de acesso ao vídeo.");
    }

    return { signedUrl: signedData.signedUrl };
  });
