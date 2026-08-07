# Plano de Implementação: Sistema de Afiliados

Este plano descreve a implementação de um sistema completo de afiliados na plataforma "Espetinho na Veia", permitindo que usuários promovam cursos e recebam comissões.

## 1. Estrutura de Banco de Dados (Supabase)

### Novas Tabelas
- `affiliates`: Armazena o perfil do afiliado.
    - `id` (uuid, PK, references profiles.id)
    - `status` (enum: 'pending', 'active', 'blocked')
    - `commission_rate` (decimal, taxa global ou personalizada)
    - `pix_key` (text, para pagamentos)
    - `bank_info` (jsonb, dados bancários adicionais)
    - `total_earnings` (decimal)
    - `balance` (decimal)
- `affiliate_links`: Links únicos gerados.
    - `id` (uuid, PK)
    - `affiliate_id` (uuid, references affiliates.id)
    - `course_id` (uuid, references courses.id)
    - `code` (text, unique, ex: 'JOAO123')
- `affiliate_sales`: Registro de vendas vinculadas.
    - `id` (uuid, PK)
    - `affiliate_id` (uuid)
    - `sale_id` (venda original, se houver tabela)
    - `amount` (valor total)
    - `commission` (valor da comissão calculada)
    - `status` (enum: 'pending', 'paid', 'cancelled')

## 2. Interface do Afiliado (`/app/afiliados`)
- **Dashboard**: Resumo de ganhos, cliques e vendas.
- **Meus Links**: Gerador de links de afiliados para cursos específicos.
- **Extrato**: Histórico de comissões e status de pagamento.
- **Configurações**: Cadastro de dados bancários/PIX.

## 3. Interface Administrativa (`/admin/afiliados`)
- **Gestão de Afiliados**: Lista para aprovação, edição de taxas e bloqueio.
- **Relatório Geral**: Performance do programa.
- **Pagamentos**: Lista de comissões pendentes para processamento manual ou via integração.

## 4. Lógica de Rastreamento (Vendas)
- **Cookie/Session**: Quando um usuário acessa via link `?ref=CODE`, armazenamos o código do afiliado localmente.
- **Checkout**: Ao finalizar a compra, verificamos se existe um código de afiliado ativo e registramos a venda na tabela `affiliate_sales`.

## 5. Tarefas Técnicas
1. Criar migração SQL com tabelas e políticas RLS.
2. Criar hooks de dados para afiliados (`use-affiliates.ts`).
3. Desenvolver rotas no frontend:
    - `/app/afiliados` (Layout e sub-abas)
    - `/admin/afiliados` (Visão administrativa)
4. Implementar utilitário de rastreamento de links na raiz do app.

---
**Deseja prosseguir com a implementação deste sistema de afiliados?**
