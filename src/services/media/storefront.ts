import type { StorefrontCode } from "../../types/media";

const DEFAULT_STOREFRONT_CODE: StorefrontCode = "US";

export function getDeviceStorefrontCode(locale = getDeviceLocale()): StorefrontCode {
  return getStorefrontCodeFromLocale(locale) ?? DEFAULT_STOREFRONT_CODE;
}

export function getStorefrontCodeFromLocale(locale: string | undefined): StorefrontCode | undefined {
  if (!locale) {
    return undefined;
  }

  const [, ...regionParts] = locale.replace("_", "-").split("-");
  const region = regionParts.find((part) => /^[A-Za-z]{2}$/.test(part));

  return region?.toUpperCase();
}

function getDeviceLocale(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}
