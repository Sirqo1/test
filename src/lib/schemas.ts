import { z } from "zod";

export const tipCalculatorSchema = z.object({
  billAmount: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .min(0.01, { message: "Bill amount must be greater than 0." }),
  tipPercentage: z.coerce
    .number({ invalid_type_error: "Please select a tip percentage." })
    .min(0, { message: "Tip percentage cannot be negative." }),
  numberOfPeople: z.coerce
    .number({ invalid_type_error: "Please enter a valid number." })
    .int({ message: "Number of people must be a whole number." })
    .min(1, { message: "At least one person is required." }),
  roundShare: z.boolean().default(false),
});

export type TipCalculatorFormValues = z.infer<typeof tipCalculatorSchema>;
