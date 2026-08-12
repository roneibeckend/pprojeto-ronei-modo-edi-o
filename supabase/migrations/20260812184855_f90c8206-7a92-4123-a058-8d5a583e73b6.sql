DO $$
DECLARE
    v_ebook_id UUID := 'ee1a776c-6c7d-4a88-a980-7e671ad8d4fb';
    v_old_module_id UUID := '0c850947-b6e0-4eee-937f-3decb6b19c18';
    v_mod1 UUID; v_mod2 UUID; v_mod3 UUID; v_mod4 UUID; v_mod5 UUID; v_mod6 UUID; v_mod7 UUID;
BEGIN
    -- 1. Create new modules
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 1 — Introdução', 0) RETURNING id INTO v_mod1;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 2 — Etapa 1: Mentalidade e Oportunidade', 1) RETURNING id INTO v_mod2;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 3 — Etapa 2: Começando do Zero', 2) RETURNING id INTO v_mod3;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 4 — Etapa 3: Produto e Produção', 3) RETURNING id INTO v_mod4;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 5 — Etapa 4: Vendas e Faturamento', 4) RETURNING id INTO v_mod5;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 6 — Etapa 5: Crescimento e Escala', 5) RETURNING id INTO v_mod6;
    INSERT INTO ebook_modules (ebook_id, title, order_index) VALUES (v_ebook_id, 'Módulo 7 — Próximos Passos', 6) RETURNING id INTO v_mod7;

    -- 2. Reassociate chapters
    -- Módulo 1
    UPDATE ebook_chapters SET module_id = v_mod1, order_index = 0 WHERE id = 'da11d770-c8d4-4c8d-971c-19de84748060';
    UPDATE ebook_chapters SET module_id = v_mod1, order_index = 1 WHERE id = '3b269d31-5023-45da-8403-ecf37d1d6445';
    UPDATE ebook_chapters SET module_id = v_mod1, order_index = 2 WHERE id = 'ec53b54b-2554-4f66-afb6-5459ca6a3209';
    UPDATE ebook_chapters SET module_id = v_mod1, order_index = 3 WHERE id = '447c6ad6-6ed5-4e93-98dc-477c90a79b4b';

    -- Módulo 2
    UPDATE ebook_chapters SET module_id = v_mod2, order_index = 0 WHERE id = 'ae38e882-9d99-4196-a2a3-aeac51450dfd';
    UPDATE ebook_chapters SET module_id = v_mod2, order_index = 1 WHERE id = '9f52959d-2b57-4eab-b432-ac3f57980abe';

    -- Módulo 3
    UPDATE ebook_chapters SET module_id = v_mod3, order_index = 0 WHERE id = '76cf61b5-3ab7-455d-ab56-4b637d0fbf4c';
    UPDATE ebook_chapters SET module_id = v_mod3, order_index = 1 WHERE id = 'e17ae751-1f2b-4be5-b6a1-caf7ec4364bf';

    -- Módulo 4
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 0 WHERE id = '898aba06-fc4c-4438-b919-ac87b16b58c0';
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 1 WHERE id = '76c4ba67-5bc1-46f2-a4ed-acfa28c0162f';
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 2 WHERE id = '4a287d1d-af25-4c32-ab9c-aa0a66267e6e';
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 3 WHERE id = '021756a9-9c30-4c27-994f-27d9732018af';
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 4 WHERE id = '1fadfe8a-ef46-4284-858f-ceed4503d3a9';
    UPDATE ebook_chapters SET module_id = v_mod4, order_index = 5 WHERE id = 'c86a0651-08b1-42c1-ada7-062679d04550';

    -- Módulo 5
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 0 WHERE id = '3a17256d-8bb0-421c-8e5a-aa964b5bc136';
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 1 WHERE id = '7ecf053d-2f5a-4c4b-bb6b-51fed4fdf534';
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 2 WHERE id = 'eae1bbf5-1082-41b5-9103-f8bcc59a05bb';
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 3 WHERE id = '7e463140-8f76-4c55-9944-3fc3259c7901';
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 4 WHERE id = '95bb2fa7-e074-4bdb-b07d-fd0f2896ca57';
    UPDATE ebook_chapters SET module_id = v_mod5, order_index = 5 WHERE id = '471fd693-8ec9-403b-b351-20964f61c906';

    -- Módulo 6
    UPDATE ebook_chapters SET module_id = v_mod6, order_index = 0 WHERE id = 'ca74b952-afcb-4812-b697-5e7e24c9d5de';
    UPDATE ebook_chapters SET module_id = v_mod6, order_index = 1 WHERE id = 'afe8f065-5bac-4103-b73a-f186a864021a';

    -- Módulo 7
    UPDATE ebook_chapters SET module_id = v_mod7, order_index = 0 WHERE id = 'd5c38ee0-b4cf-4b2b-9edf-4f2734070a99';
    UPDATE ebook_chapters SET module_id = v_mod7, order_index = 1 WHERE id = '95b7e9d7-d3c5-41bb-a15a-807d9cfe5aa5';
    UPDATE ebook_chapters SET module_id = v_mod7, order_index = 2 WHERE id = '858a256f-b4ec-4a45-987d-9b84aea5d345';
    UPDATE ebook_chapters SET module_id = v_mod7, order_index = 3 WHERE id = 'd42b7687-7619-41f8-9f22-92a5b97bcea8';

    -- 3. Cleanup old module if empty
    IF NOT EXISTS (SELECT 1 FROM ebook_chapters WHERE module_id = v_old_module_id) THEN
        DELETE FROM ebook_modules WHERE id = v_old_module_id;
    END IF;
END $$;