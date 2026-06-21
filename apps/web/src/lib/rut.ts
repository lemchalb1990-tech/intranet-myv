export function validateRut(rut: string): boolean {
  const clean = rut.replace(/[.\-]/g, "").toUpperCase();
  if (clean.length < 2) return false;

  const dv = clean.at(-1)!;
  const digits = clean.slice(0, -1);
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let mul = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += parseInt(digits[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }

  const remainder = 11 - (sum % 11);
  const expected =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);

  return dv === expected;
}

export function formatRut(rut: string): string {
  const clean = rut.replace(/[.\-]/g, "").toUpperCase();
  if (clean.length < 2) return rut;
  const dv = clean.at(-1)!;
  const digits = clean.slice(0, -1);
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted}-${dv}`;
}

export function normalizeRut(rut: string): string {
  return rut.replace(/[.\-]/g, "").toUpperCase();
}

export function getDefaultPassword(rut: string): string {
  const clean = normalizeRut(rut);
  const digits = clean.slice(0, -1);
  return digits.slice(-6);
}
