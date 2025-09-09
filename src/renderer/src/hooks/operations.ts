import { z } from "zod";

const operationType = ["sale", "buys"] as const;

export type Operation = z.infer<typeof operationSchema>;
export const operationSchema = z.object({
  id: z.number(),
  date: z.string(),
  cashboxIncrement: z.object({
    id: z.number(),
    name: z.string(),
    disabled: z.union([z.literal(0), z.literal(1)]),
  }),
  cashboxDecrement: z.object({
    id: z.number(),
    name: z.string(),
    disabled: z.union([z.literal(0), z.literal(1)]),
  }),
  amount: z.coerce.number(),
  price: z.coerce.number(),
  marketPrice: z.coerce.number(),
  commission: z.coerce.number(),
  clientName: z.string(),
  sellerName: z.string(),
  profit: z.coerce.number(),
  type: z.enum(operationType),
});
