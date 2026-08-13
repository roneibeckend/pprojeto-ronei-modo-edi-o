
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const newUrl = 'videos/intro-optimized-mobile.mp4'; // Store relative path as the app handles signing
  const ebookId = 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb';
  
  const { data, error } = await supabase
    .from('ebooks')
    .update({ opening_video_url: newUrl })
    .eq('id', ebookId);
    
  if (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  }
  
  console.log("Database updated successfully");
}

main();
