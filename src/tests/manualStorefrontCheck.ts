import assert from "node:assert/strict";
import {
  getDeviceStorefrontCode,
  getStorefrontCodeFromLocale,
} from "../services/media/storefront.ts";

assert.equal(getStorefrontCodeFromLocale("en-US"), "US");
assert.equal(getStorefrontCodeFromLocale("pt-BR"), "BR");
assert.equal(getStorefrontCodeFromLocale("en_GB"), "GB");
assert.equal(getStorefrontCodeFromLocale("zh-Hant-TW"), "TW");
assert.equal(getStorefrontCodeFromLocale("en"), undefined);
assert.equal(getStorefrontCodeFromLocale(undefined), undefined);
assert.equal(getDeviceStorefrontCode("en"), "US");

console.log("Storefront locale checks passed.");
