export function formatRupees(amount: number, includeDecimals: boolean = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  let formatted = "";
  if (includeDecimals || absVal % 1 !== 0) {
    formatted = absVal.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(absVal).toLocaleString("en-IN");
  }

  return `${isNegative ? "-" : ""}₹${formatted}`;
}
