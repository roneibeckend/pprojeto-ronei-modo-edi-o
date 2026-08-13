
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const filePath = '/tmp/intro-mobile.mp4';
  const bucket = 'course-assets';
  const remotePath = 'videos/intro-optimized-mobile.mp4';
  
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(remotePath, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true
    });
    
  if (error) {
    console.error("Error uploading video:", error);
    process.exit(1);
  }
  
  console.log("Uploaded successfully:", data.path);
}

main();
