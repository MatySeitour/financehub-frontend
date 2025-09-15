import { z } from "zod";

export type InstallmentHistory = z.infer<typeof installmentHistorySchema>;
export const installmentHistorySchema = z.object({
  id: z.number(),
  installment_id: z.number(),
  cashbox_id: z.number(),
  amount: z.coerce.number(),
  movimentDateTime: z.string(),
  loan_id: z.number(),
  number: z.number(),
  number_of_installments: z.number(),
  value: z.coerce.number(),
  payment_amount: z.coerce.number(),
  payment_date: z.string(),
  due_date: z.string(),
  clientName: z.string(),
  sellerName: z.string(),
});
