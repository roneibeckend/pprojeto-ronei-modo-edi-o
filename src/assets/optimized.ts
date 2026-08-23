/**
 * Versões otimizadas (WebP, redimensionadas) das imagens da landing/plataforma.
 * As originais tinham 1440x1920 e ~800KB cada, o que fazia a landing baixar ~7MB.
 * Mantemos a mesma forma `{ url }` dos arquivos .asset.json para troca direta.
 */
import platter1Url from "./opt/platter1.webp";
import platter2Url from "./opt/platter2.webp";
import ribeyeUrl from "./opt/ribeye.webp";
import chefWorkingUrl from "./opt/chef-working.webp";
import skewersHeldUrl from "./opt/skewers-held.webp";
import skewersFlatUrl from "./opt/skewers-flat.webp";
import skewerSingleUrl from "./opt/skewer-single.webp";
import heroChefUrl from "./opt/hero-chef.webp";
import chefPortraitUrl from "./opt/chef-portrait.webp";
import authorUrl from "./opt/author.webp";
import logoMarkUrl from "./opt/logo-mark.webp";

const asAsset = (url: string) => ({ url });

export const optPlatter1 = asAsset(platter1Url);
export const optPlatter2 = asAsset(platter2Url);
export const optRibeye = asAsset(ribeyeUrl);
export const optChefWorking = asAsset(chefWorkingUrl);
export const optSkewersHeld = asAsset(skewersHeldUrl);
export const optSkewersFlat = asAsset(skewersFlatUrl);
export const optSkewerSingle = asAsset(skewerSingleUrl);
export const optHeroChef = asAsset(heroChefUrl);
export const optChefPortrait = asAsset(chefPortraitUrl);
export const optAuthor = asAsset(authorUrl);
export const optLogoMark = logoMarkUrl;
