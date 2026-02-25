/**
 * Derive 3-letter currency code from QuickBooks CurrencyRef (name or value).
 * - "United States Dollar" -> "USD"
 * - "Indian National Rupee" -> "INR"
 * - "Euro" / "EURO" -> "EUR"
 * - Existing value like "USD" is used as-is.
 */
export function currencyCodeFromRef(ref: { value?: string; name?: string } | undefined): string {
  if (!ref) return 'USD';
  const name = (ref.name ?? '').trim();
  const value = (ref.value ?? '').trim();
  if (name) {
    const lower = name.toLowerCase();
    if (lower === 'euro') return 'EUR';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const code = words.map((w) => w[0]).join('').toUpperCase();
      if (code.length >= 2) return code;
    }
  }
  if (value && /^[A-Za-z]{2,4}$/.test(value)) return value.toUpperCase();
  return 'USD';
}
