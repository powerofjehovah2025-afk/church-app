/**
 * Phone/WhatsApp validation: require country code (e.g. +44, +234) so wa.me links work.
 * E.164: + followed by digits only; we allow spaces/dashes in input and strip for validation.
 */

export const PHONE_COUNTRY_CODE_HINT =
  "Include country code (e.g. +44 UK, +234 Nigeria) so we can reach you on WhatsApp.";

/** Min/max digits for E.164 (country code + subscriber number). */
const MIN_DIGITS = 10;
const MAX_DIGITS = 15;

/**
 * Returns true if the value is empty (no phone) or a valid phone with country code.
 * Valid: must start with + and contain only +, digits, spaces, dashes; after stripping
 * non-digits, length must be between MIN_DIGITS and MAX_DIGITS.
 */
export function isValidPhoneWithCountryCode(value: string | null | undefined): boolean {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return true;
  if (!trimmed.startsWith("+")) return false;
  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly.length >= MIN_DIGITS && digitsOnly.length <= MAX_DIGITS;
}

/**
 * Returns an error message if invalid, or null if valid/empty.
 */
export function getPhoneValidationError(value: string | null | undefined): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return null;
  if (!trimmed.startsWith("+")) {
    return "Phone must start with a country code (e.g. +44 or +234).";
  }
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length < MIN_DIGITS) {
    return "Phone number is too short. Include full country code and number.";
  }
  if (digitsOnly.length > MAX_DIGITS) {
    return "Phone number is too long.";
  }
  return null;
}

/**
 * Normalize for wa.me: digits only (no +). Use after validation.
 */
export function normalizePhoneForWhatsApp(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}
