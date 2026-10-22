import { z } from "zod";

export const MARKETING_CONSENT_TEXT = "Email me Alamo City Hitch & Go offers and rental updates. Optional; I can unsubscribe at any time.";
export const profileInput = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  phone: z.string().trim().max(30).refine((value) => {
    const digits = value.replace(/\D/g, "");
    return /^[+\d\s().-]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
  }, "Enter a valid phone number, including area code."),
  emailMarketing: z.boolean(),
}).strict();
export type ProfileInput = z.infer<typeof profileInput>;
export type CustomerProfile = ProfileInput & {
  email: string;
  createdAt: string;
  updatedAt: string;
  consentUpdatedAt: string;
  consentText: string;
};

export function buildProfile(email: string, input: ProfileInput, previous: CustomerProfile | null, now: string): CustomerProfile {
  return {
    ...profileInput.parse(input),
    email: email.trim().toLowerCase(),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    consentUpdatedAt: previous && previous.emailMarketing === input.emailMarketing ? previous.consentUpdatedAt : now,
    consentText: MARKETING_CONSENT_TEXT,
  };
}
