import { z } from "zod";
import axios from "./axios";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

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

export async function getOperations(from?: Date, to?: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/operations", { params });
  return operationSchema.array().parse(data.data);
}

export type TOperationCount = z.infer<typeof operationCountSchema>;
export const operationCountSchema = z.object({
  count: z.number(),
  date: z.string(),
  profit: z.coerce.number(),
});

export async function getOperationsCount(from: Date, to: Date) {
  const params = {
    from,
    to,
  };
  const { data } = await AxiosFetch("/api/v1/operations-count", { params });
  return operationCountSchema.array().parse(data.data);
}
