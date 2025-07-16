/* IMPORTS */
import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { errorsResponse } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { IoPeople } from "react-icons/io5";
import { useMutation, useQueryClient } from "react-query";
import z from "zod";

/* DATA TYPES */
export type ClientForm = z.infer<typeof clientFormSchema>;

/* UTILS */
//
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* SCHEMAS */
//Create client structure
export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacio.")
    .max(50, "El nombre no puede contener mas de 50 caracteres."),
  phone: z
    .string()
    .min(1, "El numero no puede estar vacio.")
    .max(20, "El telefono no puede contener mas de 20 numeros."),
  address: z
    .string()
    .min(1, "La direccion no puede estar vacia.")
    .max(200, "La direccion no puede contener mas de 200 caracteres."),
  info: z.string(),
});

// Define el tipo para el ref
export interface ModalRef {
  open: () => void;
  close: () => void;
}

//component starts here
export const CreateClientModal = forwardRef<ModalRef, { orgID: number }>(
  ({ orgID }, ref) => {
    /* UTILS */
    const queryClient = useQueryClient();
    //
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors },
    } = useForm<ClientForm>({
      resolver: zodResolver(clientFormSchema),
    });

    /* REFs */
    //
    const dialogRef = useRef<HTMLDialogElement>(null);

    /* MUTATIONS */
    //
    const mutation = useMutation<ClientForm, ServerError, ClientForm>({
      mutationFn: async (body) => {
        try {
          const { data } = await AxiosFetch.post(
            `/api/v1/${orgID}/clients`,
            body,
          );

          return data;
        } catch (error) {
          console.error(error);

          return errorsResponse(error);
        }
      },
      onSuccess: (data) => {
        //
        queryClient.invalidateQueries(["clients", "all"]);
        //
        console.log("El cliente se ha creado correctamente", data);
        //
        dialogRef.current?.close();
        //
        reset();
        //toast
      },
    });

    /* EVENT HANDLERS */
    //
    useImperativeHandle(ref, () => ({
      open: () => dialogRef.current?.showModal(),
      close: () => dialogRef.current?.close(),
    }));
    //
    const onSubmit: SubmitHandler<ClientForm> = (data) => mutation.mutate(data);

    return (
      <dialog ref={dialogRef} className="h-fit w-1/2 rounded-lg shadow-lg">
        {/* FORM'S CONTAINER */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full w-full flex-col px-8 py-4 text-slate-500"
        >
          {/* TITLE'S CONTAINER */}
          <div className="flex gap-4 border-b pb-4">
            <IoPeople className="size-7" />
            <h3 className="w-full text-xl font-semibold">
              Crear un nuevo cliente
            </h3>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Nombre
              <input
                {...register("name")}
                placeholder="Ej: Eduardo Perez"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Direccion
              <input
                {...register("address")}
                placeholder="Ej: Juncal 262"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
                {...register("phone")}
                type="tel"
                placeholder="Ej: +5491134865214"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Referido
              <input
                list="sellersList"
                placeholder="Nombre del vendedor.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <label className="flex w-full flex-col gap-1 pt-4 text-sm focus-within:text-green-600">
            Informacion adicional
            <textarea
              {...register("info")}
              placeholder="Por ejemplo: Casa de rejas verdes"
              className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
            <Button
              isLoading={mutation.isLoading}
              type="submit"
              color="success"
              className="w-full rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => dialogRef.current?.close()}
              color="danger"
              className="w-full rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
    );
  },
);
