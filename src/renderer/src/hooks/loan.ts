/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

/* DATA TYPES */
export type Loan = z.infer<typeof loanSchema>;

/* ENUMS */
const paymentFrecuency = ["daily", "weekly", "biweekly", "monthly"] as const;

/* SCHEMAS */
//
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
  principal: z.coerce.number(),
  cashboxID: z.number(),
  number_of_installments: z.number(),
  payment_frequency: z.enum(paymentFrecuency),
  commission: z.coerce.number(),
  total_paid: z.coerce.number().nullable(),
  first_due_date: z.string(),
  installment_value: z.coerce.number(),
});

/* UTILS */
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* GETS */
export async function getLoans() {
  try {
    const { data } = await AxiosFetch(`/api/v1/loans`);
    return loanSchema.array().parse(data?.data);
  } catch (error) {
    console.error(error);

    return errorsResponse(error);
  }
}
