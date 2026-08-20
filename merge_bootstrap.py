import re

def main():
    with open('supabase/migrations/00000000000000_external_supabase_bootstrap.sql', 'r') as f:
        v0 = f.read()
    
    with open('supabase/migrations/00000000000001_external_supabase_bootstrap_clean.sql', 'r') as f:
        v2 = f.read()

    # 1. Remove specific things from V0 that V2 will replace
    # - \restrict line
    v0 = re.sub(r'^\restrict .*', '', v0, flags=re.MULTILINE)
    
    # - handle_new_user function (to use the ON CONFLICT version from V2)
    v0 = re.sub(r'CREATE FUNCTION public\.handle_new_user\(.*?\).*?AS $$.*?$$ LANGUAGE plpgsql.*?;', '', v0, flags=re.DOTALL)
    
    # - Storage policies in V0 (they are under public.storage_objects or similar, or just CREATE POLICY)
    # Actually, V0 handles policies at the end. We'll remove all CREATE POLICY ON storage.objects from V0.
    v0 = re.sub(r'CREATE POLICY .*? ON storage\.objects .*?;', '', v0, flags=re.DOTALL)
    
    # - Realtime publication lines for notifications
    v0 = re.sub(r'ALTER PUBLICATION supabase_realtime ADD TABLE public\.notifications;', '', v0)
    
    # - Auth trigger on_auth_user_created
    v0 = re.sub(r'CREATE TRIGGER on_auth_user_created .*?;', '', v0, flags=re.DOTALL)

    # 2. Extract sections from V2
    # - Extensions from V2
    v2_ext = re.search(r'-- 1\. EXTENSÕES(.*?)-- 2\. TABELAS', v2, re.DOTALL).group(1).strip()
    
    # - Tables (profiles and user_roles are in V2, but the rest are in V0)
    # We will use V0's table definitions but ensure profiles and user_roles match V2 if they differ.
    
    # - Function handle_new_user from V2
    v2_func = re.search(r'CREATE OR REPLACE FUNCTION public\.handle_new_user\(\).*?AS $$.*?$$ LANGUAGE plpgsql.*?;', v2, re.DOTALL).group(0).strip()
    
    # - Realtime from V2
    v2_realtime = re.search(r'-- 4\. REALTIME \(Idempotente\)(.*?)-- 5\. TRIGGER AUTH', v2, re.DOTALL).group(1).strip()
    
    # - Trigger Auth from V2
    v2_trigger = re.search(r'-- 5\. TRIGGER AUTH(.*?)-- ==========================================================', v2, re.DOTALL).group(1).strip()
    
    # - Storage section from V2
    v2_storage = re.search(r'-- 6\. STORAGE \(BUCKETS \+ POLICIES AUDITADAS\)(.*)', v2, re.DOTALL).group(1).strip()

    # 3. Construct Final SQL
    final_sql = f"""-- ==========================================================
-- BOOTSTRAP SQL FINAL - ESTRUTURA COMPLETA RECONCILIADA
-- ==========================================================

{v2_ext}

{v0}

-- OVERRIDES E FIXES V2

{v2_func}

{v2_realtime}

{v2_storage}

{v2_trigger}
"""
    # Clean up any double empty lines or artifacts
    final_sql = re.sub(r'\n\s*\n\s*\n', '\n\n', final_sql)

    with open('supabase/migrations/00000000000001_external_supabase_bootstrap_clean.sql', 'w') as f:
        f.write(final_sql)

if __name__ == "__main__":
    main()
