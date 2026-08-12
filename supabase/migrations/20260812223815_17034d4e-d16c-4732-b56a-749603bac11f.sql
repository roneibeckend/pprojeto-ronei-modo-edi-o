
-- Ajustar as transações para somarem exatamente R$ 5,00 (ou o valor correto atual)
-- No momento temos 9.00 (4.50 + 4.50). Vamos remover uma e ajustar a outra se necessário.
DELETE FROM public.payments WHERE external_id = 'simulated_pay_5_reais_515010';
UPDATE public.payments SET net_amount = 5.00, amount = 5.00, fee = 0.00 WHERE external_id = 'manual_pay_5_reais';
