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
  type: z.enum(movimentType),
  commission: z.string(),
  seller: sellerSchema,
  date: z.string(),
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
