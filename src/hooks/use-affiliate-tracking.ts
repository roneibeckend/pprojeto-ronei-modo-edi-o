import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

const AFFILIATE_REF_KEY = "affiliate_ref";

export function useAffiliateTracking() {
  const router = useRouter();

  useEffect(() => {
    // Pegar o parâmetro 'ref' da URL
    const searchParams = new URLSearchParams(window.location.search);
    const ref = searchParams.get("ref");

    if (ref) {
      // Armazenar no localStorage (valido por 30 dias por padrão na lógica de negócio, mas aqui simplificamos para persistência básica)
      localStorage.setItem(AFFILIATE_REF_KEY, ref);
      
      // Limpar o parâmetro da URL para uma estética melhor, se desejar (opcional)
      // window.history.replaceState({}, document.title, window.location.pathname);
      
      console.log("Afiliado rastreado:", ref);
    }
  }, [router]);
}

export function getAffiliateRef() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AFFILIATE_REF_KEY);
}

export function clearAffiliateRef() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AFFILIATE_REF_KEY);
}
