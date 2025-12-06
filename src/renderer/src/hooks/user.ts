import { z } from "zod";
import axios from "./axios";

export type User = z.infer<typeof userSchema>;

export const userSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Escribe un nombre de usuario"),
  email: z
    .string()
    .email({ message: "Escribe un correo eléctronico valido" })
    .min(1, "El correo eléctronico es requerido"),
  password: z
    .string()
    .or(z.literal(""))
    .refine((value) => value === "" || value?.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .refine((value) => value === "" || /[0-9]/.test(value), {
      message: "La contraseña debe contener al menos un número",
    })
    .refine((value) => value === "" || /[A-Z]/.test(value), {
      message: "La contraseña debe contener al menos una mayúscula",
    }),
  role_id: z.number(),
});

export type TSession = z.infer<typeof sessionSchema>;
export const sessionSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  organization: z.object({
    id: z.number(),
    name: z.string(),
  }),
  role: z.object({
    id: z.number(),
    name: z.string(),
  }),
});

export type LoginUser = Omit<User, "name">;
export type RegisterUser = z.infer<typeof registerUserSchema>;

export const registerUserSchema = z.object({
  name: z.string().min(1, "Escribe un nombre de usuario"),
  email: z
    .string()
    .email({ message: "Escribe un correo eléctronico valido" })
    .min(1, "El correo eléctronico es requerido"),
  password: z
    .string()
    .or(z.literal(""))
    .refine((value) => value === "" || value?.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    })
    .refine((value) => value === "" || /[0-9]/.test(value), {
      message: "La contraseña debe contener al menos un número",
    })
    .refine((value) => value === "" || /[A-Z]/.test(value), {
      message: "La contraseña debe contener al menos una mayúscula",
    }),
});

export type UsersByOrganization = z.infer<typeof usersByOrganizationSchema>;
export const usersByOrganizationSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: z.enum(["admin", "empleado"]),
});

export type UserCredentials = z.infer<typeof loginUserSchema>;
export const loginUserSchema = z.object({
  email: z
    .string()
    .nonempty({ message: "El correo electrónico es requerido" })
    .email({ message: "Escribe un correo eléctronico valido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export type CurrentStep = z.infer<typeof currentStepSchema>;
export const currentStepSchema = z.object({
  step: z.number(),
  user: z
    .object({
      id: z.number(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  organization: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
});

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export const getCurrentStep = async () => {
  const { data } = await AxiosFetch("/api/organization-current-step");
  return currentStepSchema.parse(data?.data);
};

export const getUsersOrganization = async () => {
  const { data } = await AxiosFetch("/api/organization-users");
  return usersByOrganizationSchema.array().parse(data?.data);
};

export const whoIAm = async () => {
  const { data } = await AxiosFetch("/api/user");
  return sessionSchema.parse(data?.data);
};
