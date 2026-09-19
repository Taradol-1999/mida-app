export function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}
