/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

/* DATA TYPES */
export type Loan = z.infer<typeof loanSchema>;

/* ENUMS */
const paymentFrecuency = ["daily", "weekly", "biweekly", "monthly"] as const;

/* SCHEMAS */
export const loanSchema = z.object({
  id: z.number(),
  client: z.object({
    id: z.number(),
    name: z.string(),
  }),
  seller: z.object({
    id: z.number(),
    name: z.string(),
  }),
  principal: z.number(),
  currency: z.string(),
  installmentValue: z.number(),
  numberOfInstallments: z.number(),
  paymentFrequency: z.enum(paymentFrecuency),
  firstDueDate: z.string(),
  totalPaid: z.number().nullable(),
  commission: z.number(),
});

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* GETS */
export async function getLoans() {
  try {
    const { data } = await AxiosFetch("/api/loans");

    return loanSchema.array().parse(data?.data);
  } catch (error) {
    console.error(error);

    return errorsResponse(error);
  }
}
