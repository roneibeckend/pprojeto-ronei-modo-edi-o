
import { supabaseAdmin } from "./src/integrations/supabase/client.server";

async function findEbook() {
  const { data: ebooks, error: eError } = await supabaseAdmin
    .from("ebooks")
    .select("id, title, price");
  
  if (eError) {
    console.error("Error fetching ebooks:", eError);
  } else {
    console.log("Ebooks:", JSON.stringify(ebooks, null, 2));
  }

  const { data: courses, error: cError } = await supabaseAdmin
    .from("courses")
    .select("id, title, price");

  if (cError) {
    console.error("Error fetching courses:", cError);
  } else {
    console.log("Courses:", JSON.stringify(courses, null, 2));
  }
}

findEbook();
