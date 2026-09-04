import { z } from "zod";

export const rentalDurationSchema = z.enum([
  "halfDay",
  "fullDay",
  "oneWeek",
  "twoWeeks",
]);

export const scheduleSchema = z.object({
  trailerId: z.string().trim().min(1, "Choose a trailer."),
  duration: rentalDurationSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid pickup date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a valid pickup time."),
});

export const checkoutSchema = scheduleSchema.extend({
  checkoutKey: z.string().uuid("Restart checkout and try again."),
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^(?=(?:\D*\d){10,15}\D*$)[+\d\s().-]+$/, "Enter a valid phone number."),
  address: z.object({
    street: z.string().trim().min(3, "Enter your street address.").max(140),
    city: z.string().trim().min(2, "Enter your city.").max(80),
    state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a two-letter state code."),
    zip: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/, "Enter a valid ZIP code."),
  }),
  referralSource: z.enum([
    "business_card",
    "referral",
    "website",
    "facebook",
    "instagram",
    "other",
  ]),
  referralDetail: z.string().trim().max(160).optional().default(""),
  towVehicle: z.object({
    year: z.string().trim().regex(/^(19|20)\d{2}$/, "Enter a four-digit vehicle year."),
    make: z.string().trim().min(2, "Enter the tow vehicle make.").max(80),
    model: z.string().trim().min(1, "Enter the tow vehicle model.").max(80),
    plate: z.string().trim().max(20).optional().default(""),
  }),
  policiesAccepted: z.literal(true, {
    error: "Accept the key rental and deposit policies before payment.",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
