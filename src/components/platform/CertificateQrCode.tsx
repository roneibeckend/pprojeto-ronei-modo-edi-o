import { useEffect, useState } from "react";

export const CERT_VERIFY_DOMAIN = "ronneinaveia.com.br";

export function certificateVerifyUrl(code: string) {
  return `https://${CERT_VERIFY_DOMAIN}/verificar-certificado?codigo=${encodeURIComponent(code)}`;
}

/** QR Code real apontando para a página pública de validação. */
export function CertificateQrCode({
  code,
  size = 64,
  className = "",
}: {
  code?: string | null;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!code) {
      setSrc(null);
      return;
    }
    import("qrcode")
      .then((QR) =>
        QR.toDataURL(certificateVerifyUrl(code), {
          margin: 1,
          width: size * 3,
          errorCorrectionLevel: "M",
          color: { dark: "#000000ff", light: "#ffffffff" },
        }),
      )
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => setSrc(null));
    return () => {
      active = false;
    };
  }, [code, size]);

  return (
    <div
      className={`grid shrink-0 place-items-center overflow-hidden rounded-sm bg-white ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={`QR Code de validação do certificado ${code ?? ""}`}
          width={size}
          height={size}
          className="h-full w-full"
        />
      ) : null}
    </div>
  );
}
