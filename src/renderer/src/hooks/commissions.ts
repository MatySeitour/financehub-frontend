/* IMPORTS */
import { z } from "zod";
import axios from "./axios";
import { DataPerPage } from "@renderer/components/Table";
import { sellerSchema } from "./sellers";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

type MovimentType = (typeof movimentType)[number];
const movimentType = ["operation", "loan"] as const;

export type Commission = z.infer<typeof commissionSchema>;
export const commissionSchema = z.object({
  id: z.number(),
  type: z.enum(movimentType),
  commission: z.number(),
  seller: sellerSchema,
  date: z.string(),
  state: z.union([z.literal(0), z.literal(1)]),
  operation_id: z.number().nullable().optional(),
  loan_id: z.number().nullable().optional(),
  cashboxID: z.number(),
});

export const commissionsWithTotalSchema = z.object({
  total: z.number(),
  moviments: commissionSchema.array(),
});

export async function getCommissions(
  from?: Date,
  to?: Date,
  page?: number,
  limit?: DataPerPage,
  moviment?: MovimentType | "all",
) {
  const params = {
    from,
    to,
    page,
    limit,
    moviment,
  };
  const { data } = await AxiosFetch("/api/v1/commission", { params });
  return commissionsWithTotalSchema.parse(data.data);
}

export type CommissionHistory = z.infer<typeof commissionHistorySchema>;
export const commissionHistorySchema = commissionSchema
  .omit({ commission: true, cashboxID: true, type: true })
  .extend({ value: z.number(), cashbox_id: z.number() });
