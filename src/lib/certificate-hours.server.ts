/**
 * Carga horária usada nos certificados.
 * Server-only: delega para o cálculo inteligente de carga horária,
 * respeitando o valor manual definido pelo admin no produto.
 */

export async function estimateContentHours(
  contentId: string,
  contentType: "course" | "ebook",
): Promise<number> {
  const { resolveWorkloadHours } = await import("@/lib/workload.server");
  try {
    return await resolveWorkloadHours(contentId, contentType);
  } catch {
    return 1;
  }
}
