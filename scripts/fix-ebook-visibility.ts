import { supabase } from "./src/integrations/supabase/client";

async function fixVisibility() {
  console.log("Starting visibility fix...");
  
  // 1. Get the admin user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  const adminUser = users?.find(u => u.email === 'newdroidsk8@gmail.com');
  
  if (!adminUser) {
    console.error("Admin user not found");
    return;
  }
  
  const userId = adminUser.id;
  const ebookId = 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb';

  console.log(`Fixing for user ${userId} and ebook ${ebookId}`);

  // 2. Ensure the ebook is unlocked and published (well, is_locked=false is our proxy)
  const { error: ebookError } = await supabase
    .from('ebooks')
    .update({ is_locked: false })
    .eq('id', ebookId);
  
  if (ebookError) console.error("Error updating ebook:", ebookError);

  // 3. Create a default module if none exists
  const { data: modules } = await supabase
    .from('ebook_modules')
    .select('id')
    .eq('ebook_id', ebookId);
    
  let moduleId;
  if (!modules || modules.length === 0) {
    const { data: newModule, error: modError } = await supabase
      .from('ebook_modules')
      .insert({
        ebook_id: ebookId,
        title: "Conteúdo Principal",
        order_index: 0
      })
      .select()
      .single();
    if (modError) console.error("Error creating module:", modError);
    moduleId = newModule?.id;
  } else {
    moduleId = modules[0].id;
  }

  // 4. Create a default chapter if none exists
  const { data: chapters } = await supabase
    .from('ebook_chapters')
    .select('id')
    .eq('ebook_id', ebookId);

  if (!chapters || chapters.length === 0) {
    const { error: chapError } = await supabase
      .from('ebook_chapters')
      .insert({
        ebook_id: ebookId,
        module_id: moduleId,
        title: "Introdução",
        content: "<p>Bem-vindo ao ebook Espetinho na Veia. O conteúdo está sendo processado.</p>",
        order_index: 0
      });
    if (chapError) console.error("Error creating chapter:", chapError);
  }

  // 5. Ensure enrollment for this user
  const { error: enrollError } = await supabase
    .from('ebook_enrollments')
    .upsert({
      user_id: userId,
      ebook_id: ebookId
    });
  
  if (enrollError) console.error("Error creating enrollment:", enrollError);

  console.log("Visibility fix completed.");
}

fixVisibility();
