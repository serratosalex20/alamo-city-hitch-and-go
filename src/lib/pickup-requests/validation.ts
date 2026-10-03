import { z } from "zod";
import { checkoutSchema } from "@/lib/booking/validation";
export const requestInputSchema = checkoutSchema
  .pick({
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    trailerId: true,
    date: true,
    time: true,
    duration: true,
  })
  .extend({
    submissionKey: z
      .string()
      .uuid("Please reopen the request form and try again."),
    message: z
      .string()
      .trim()
      .max(1000, "Keep your message under 1,000 characters.")
      .default(""),
  });
export const decisionSchema = z.object({
  action: z.enum(["approved", "declined"]),
  note: z.string().trim().min(1, "Add a note for the renter.").max(1000),
});
