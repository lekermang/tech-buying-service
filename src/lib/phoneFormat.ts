/** Форматирует ввод телефона в +7 (___) ___-__-__ */
export function formatPhone(raw: string): string {
  let v = raw.replace(/\D/g, "");
  if (v.startsWith("8")) v = "7" + v.slice(1);
  if (v && !v.startsWith("7")) v = "7" + v;
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length === 0) return "";
  if (v.length <= 1) return "+7";
  if (v.length <= 4) return `+7 (${v.slice(1)}`;
  if (v.length <= 7) return `+7 (${v.slice(1,4)}) ${v.slice(4)}`;
  if (v.length <= 9) return `+7 (${v.slice(1,4)}) ${v.slice(4,7)}-${v.slice(7)}`;
  return `+7 (${v.slice(1,4)}) ${v.slice(4,7)}-${v.slice(7,9)}-${v.slice(9)}`;
}

/** Проверка валидности телефона: ровно 11 цифр, начинается с 7 */
export function isPhoneValid(raw: string): boolean {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("7");
}
