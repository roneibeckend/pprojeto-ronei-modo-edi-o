
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const path = 'videos/07c7cf6f-d0c5-4310-b406-b03b746ff6a3.mp4';
  const bucket = 'course-assets';
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);
    
  if (error) {
    console.error("Error signing URL:", error);
    process.exit(1);
  }
  
  console.log(data.signedUrl);
}

main();
