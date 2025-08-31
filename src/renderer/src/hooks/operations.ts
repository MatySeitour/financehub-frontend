import { z } from "zod";
import axios from "./axios";
import { errorsResponse } from "@renderer/utils";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

const operationType = ["sale", "buys"] as const;

export type operationHistory = z.infer<typeof operationHistorySchema>;
export const operationHistorySchema = z.object({
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

export async function getOperationsHistory(cashboxID: number) {
  try {
    const { data } = await AxiosFetch(
      `/api/v1/history/${cashboxID}/operations`,
    );
    return operationHistorySchema.array().parse(data.data);
  } catch (error) {
    return errorsResponse(error);
  }
}

// "id": 1,
//             "date": "2025-08-06 23:21:57",
//             "cashboxIncrement": {
//                 "id": 2,
//                 "name": "Caja de pesos",
//                 "currency": "pesos",
//                 "disabled": 0
//             },
//             "cashboxDecrement": {
//                 "id": 3,
//                 "name": "Libras Benja",
//                 "currency": "libras",
//                 "disabled": 0
//             },
//             "amount": "10000.00",
//             "price": "12.00",
//             "seller": {
//                 "id": 1,
//                 "name": "The",
//                 "phone": "+5491159640417"
//             },
//             "client": {
//                 "id": 1,
//                 "name": "Matias Seitour",
//                 "phone": "+5491159640417"
//             },
//             "type": "sale",
//             "marketPrice": "10.00",
//             "profit": "20000.00",
//             "commission": "10000.00"
