import type { Booking } from "@/types/models";

type TextTab = { tabId?: string; tabLabel?: string; name?: string; value?: string };
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const fields = {
  insuranceCarrier: ["insurancecarrier", "insurancecompany", "carrier"],
  insurancePolicyNumber: ["insurancepolicynumber", "insurancepolicy", "insurancepolicyno", "policynumber", "policyno", "policy"],
  insuranceExpiresAt: ["insuranceexpirationdate", "insuranceexpiration", "insuranceexpiresat", "insuranceexpiry", "insurancepolicyexpiration", "policyexpirationdate", "policyexpiration", "expirationdate"],
} as const;

// Match actual recipient tab IDs so template label changes cannot silently leave blank fields.
export function insuranceTabUpdates(booking: Booking, tabs: TextTab[]) {
  const updates: { tabId: string; value: string; locked: string }[] = [];
  for (const [field, names] of Object.entries(fields)) {
    const value = booking[field as keyof typeof fields];
    const matches = tabs.filter(tab => tab.tabId && [tab.tabLabel, tab.name].some(label => label && (names as readonly string[]).includes(normalize(label))));
    if (!value || !matches.length) throw new Error("We could not prepare the insurance fields in your agreement. Please contact us before signing.");
    for (const tab of matches) updates.push({ tabId: tab.tabId!, value, locked: "true" });
  }
  return updates;
}
