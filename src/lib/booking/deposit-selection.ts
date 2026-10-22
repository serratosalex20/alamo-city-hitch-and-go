export function depositSelection(value: string, depositCents: number) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const amountCents = Math.round(Number(value) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents < 0 || amountCents > depositCents) return null;
  return {
    action: amountCents === 0 ? "release_deposit" : "retain_deposit",
    amountCents: amountCents === 0 ? undefined : amountCents,
    retainedCents: amountCents,
    returnedCents: depositCents - amountCents,
  };
}
