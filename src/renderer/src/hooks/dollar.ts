import axios from "axios";
import { z } from "zod";

const currentDollarSchema = z.object({
  compra: z.number(),
  venta: z.number(),
  casa: z.string(),
  nombre: z.string(),
  moneda: z.string(),
  fechaActualizacion: z.string().pipe(z.coerce.date()),
});

export const getCurrentDollar = async () => {
  try {
    const { data } = await axios.get("https://dolarapi.com/v1/dolares/blue");
    return currentDollarSchema.parse(data);
  } catch (error) {
    console.error(error);
    return error;
  }
};
