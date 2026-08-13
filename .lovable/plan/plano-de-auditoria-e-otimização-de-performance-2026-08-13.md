# Plano de Auditoria e Otimização de Performance

## 1. Etapa de Medição (Baseline)
- Realizar medições de Lighthouse (Mobile/Desktop).
- Coletar métricas: LCP, INP, CLS, FCP, TTFB, TBT.
- Registrar peso total da página e número de requisições.

## 2. Teste de Impacto do Vídeo (A vs B)
- **Cenário A:** Fluxo normal com vídeo.
- **Cenário B:** Vídeo completamente removido (não carregado no DOM/Rede).
- Objetivo: Isolar o custo de performance da introdução.

## 3. Otimização de Ativos (Vídeo e Imagens)
- **Vídeo Intro:**
    - Gerar versão Mobile (H.264, ~720p, sem áudio, faststart).
    - Gerar versão Desktop (H.264, 1080p, sem áudio).
    - Implementar carregamento condicional (não carregar ambos).
    - Garantir destruição completa do componente e limpeza de memória após o término.
- **Imagens:** Verificar se há imagens pesadas ou sem lazy loading.

## 4. Auditoria de Código (React e Memória)
- **React Profiler:** Identificar renderizações desnecessárias.
- **Memory Leak:** Verificar se o vídeo ou outros componentes deixam resíduos no Heap.
- **useEffect & Event Listeners:** Revisar cleanups de todos os timers e listeners.

## 5. Rede e Infraestrutura
- Auditar requisições ao Supabase (colunas selecionadas, caching).
- Verificar se o Service Worker (se presente) está otimizando o cache.

## 6. Validação Final
- Medir novamente após as correções.
- Comparar números com o baseline inicial.

---

### Detalhes Técnicos
- Uso de `ffprobe` para análise técnica dos arquivos de vídeo.
- Uso de `ffmpeg` para transcodificação otimizada.
- Implementação de `ClientOnly` e `Suspense` para evitar bloqueios de renderização.
