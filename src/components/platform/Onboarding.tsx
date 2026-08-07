import { useEffect, useState } from "react";
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride";
import { useLocation } from "@tanstack/react-router";

export function Onboarding() {
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Só roda em mobile
    if (!isMobile) return;

    const hasSeenOnboarding = localStorage.getItem("onboarding_seen");
    
    // Configura os passos baseado na rota
    if (location.pathname === "/login") {
      setSteps([
        {
          target: "body",
          placement: "center",
          content: "Bem-vindo ao Espetinho na Veia! Vamos fazer um tour rápido.",
          title: "Boas-vindas",
        },
        {
          target: 'button[type="button"]',
          content: "Você pode entrar rapidamente usando sua conta Google.",
          title: "Login Rápido",
        },
        {
          target: "form",
          content: "Ou se preferir, use seu e-mail e senha cadastrados.",
          title: "Acesso por E-mail",
        },
      ]);
      setRun(true);
    } else if (location.pathname.startsWith("/app") && !hasSeenOnboarding) {
      setSteps([
        {
          target: "header",
          content: "Aqui você encontra o menu principal e notificações.",
          title: "Navegação",
        },
        {
          target: 'nav[aria-label="Menu principal"]',
          content: "Acesse seus cursos, receitas e recursos por aqui.",
          title: "Menu Lateral",
        },
        {
          target: ".grid.gap-6",
          content: "Aqui estão os cursos disponíveis para você começar a lucrar.",
          title: "Vitrine de Cursos",
        },
      ]);
      setRun(true);
    }
  }, [location.pathname, isMobile]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      if (location.pathname.startsWith("/app")) {
        localStorage.setItem("onboarding_seen", "true");
      }
    }
  };

  if (!isMobile) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular",
      }}
      styles={{
        options: {
          arrowColor: "#1a0d08",
          backgroundColor: "#1a0d08",
          overlayColor: "rgba(0, 0, 0, 0.75)",
          primaryColor: "#f97316",
          textColor: "#ffffff",
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#f97316",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "14px",
          padding: "8px 16px",
        },
        buttonBack: {
          marginRight: "8px",
          color: "#ffffff",
          fontSize: "14px",
        },
        buttonSkip: {
          color: "#a3a3a3",
          fontSize: "14px",
        }
      }}
    />
  );
}
