-- Vincular e-books aos cursos correspondentes baseando-se nos títulos
UPDATE ebooks 
SET course_id = 'do-zero-aos-10k' 
WHERE title ILIKE '%Do zero aos 10K%';

UPDATE ebooks 
SET course_id = 'vendas-marketing-espeto' 
WHERE title ILIKE '%Vendas%';

UPDATE ebooks 
SET course_id = 'b85e3aa7-6baf-4af1-8fc3-3c54264dbfc3' 
WHERE title ILIKE '%Mestre%';
