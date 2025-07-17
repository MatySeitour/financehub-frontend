/* IMPORTS */

import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { Seller } from "@renderer/hooks/seller";
import { errorsResponse } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import { SubmitHandler, useForm } from "react-hook-form";
import { FaRegTrashAlt } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { useMutation, useQueryClient } from "react-query";
import z from "zod";

/* DATA TYPES */
//create seller structure
export type SellerForm = z.infer<typeof sellerFormSchema>;
//delete seller structure
export type DeleteSeller = z.infer<typeof deleteSellerSchema>;
// edit seller structure
export type EditSellerForm = z.infer<typeof sellerFormSchema>;

/* INTERFACES */
//create seller parameters structure
interface CreateSellerModalProps {
  orgID: number;
  dialogRef: React.RefObject<HTMLDialogElement>;
  closeModal: () => void;
}
//delete seller parameters structure
interface DeleteSellerModalProps {
  orgID: number;
  sellerID: number;
  sellerName: string;
  dialogRef: React.RefObject<HTMLDialogElement>;
  closeModal: () => void;
}
//edit seller parameters structure
interface EditSellerModalProps {
  orgID: number;
  seller: Seller;
  dialogRef: React.RefObject<HTMLDialogElement>;
  closeModal: () => void;
}

/* UTILS */
//axios
const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

/* SCHEMAS */
//create and edit seller data validation
export const sellerFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacio.")
    .max(50, "El nombre no puede contener mas de 50 caracteres."),
  phone: z
    .string()
    .min(1, "El numero no puede estar vacio.")
    .max(20, "El telefono no puede contener mas de 20 numeros."),
  info: z.string(),
});
//delete seller data validation
export const deleteSellerSchema = z.object({
  sellerID: z.number().min(1, "El ID del vendedor es invalido.")
})

/* MODALS */
//create seller modal
export function CreateSellerModal({
  orgID,
  dialogRef,
  closeModal,
}: CreateSellerModalProps) {
  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  /* MUTATIONS */
  //mutation to create clients
  const mutation = useMutation<SellerForm, ServerError, SellerForm>({
    mutationFn: async (body) => {
      try {
        //send a new seller to backend
        const { data } = await AxiosFetch.post(
          `/api/v1/${orgID}/sellers`,
          body,
        );
				//return data for the toast
				return data;
      } catch (error) {
				console.error(error);

				return errorsResponse(error);
			}
    },
		onSuccess: (data) => {
			//forces a refetch
			queryClient.invalidateQueries(["sellers", "all"]);

			console.log("El vendedor se ha creado correctamente", data);
			//close modal once the seller was successfully added
			closeModal();
			//reset all fields in the form
			reset();
			/* PENDING TOAST */
		}
  });

	/* HOOKS */
	//manipulate and validate the data from the form
	const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SellerForm>({
    resolver: zodResolver(sellerFormSchema),
  });

	/* EVENT HANDLERS */
	//executes the mutation when the form is submitted
	const onSubmit: SubmitHandler<SellerForm> = (data) => mutation.mutate(data);

	return(
		<dialog
        ref={dialogRef}
        className="h-fit w-1/2 rounded-lg shadow-lg"
      >
        {/* FORM'S CONTAINER */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex h-full w-full flex-col px-8 py-4 text-slate-500"
        >
          {/* TITLE'S CONTAINER */}
          <div className="flex gap-4 border-b pb-4">
            <FaPeopleGroup className="size-7" />
            <h3 className="w-full text-xl font-semibold">
              Crear un nuevo vendedor
            </h3>
          </div>
          {/* FIELD'S CONTAINER */}
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            {/* SELLER NAME INPUT */}
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Nombre
              <input
                {...register("name")}
                placeholder="Ej: Eduardo Perez"
                className={`rounded-lg border p-3 shadow-sm outline-none ${
                errors.name
                  ? "border-red-500 focus:border-red-500"
                  : "focus:border-green-400"
              }`}
            />
            {errors.name && (
              <span className="text-sm text-red-500">
                {errors.name.message}
              </span>
            )}
            </label>
            {/* SELLER PHONE INPUT */}
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
								{...register("phone")}
                type="tel"
                placeholder="Ej: 1134865214"
                className={`rounded-lg border p-3 shadow-sm outline-none ${
                errors.phone
                  ? "border-red-500 focus:border-red-500"
                  : "focus:border-green-400"
              }`}
            />
            {errors.phone && (
              <span className="text-sm text-red-500">
                {errors.phone.message}
              </span>
            )}
            </label>
          </div>
          {/* NEW SELLER'S INFO */}
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
            {/* SAVE BUTTON */}
            <Button
						isLoading={mutation.isLoading}
              type="submit"
              color="success"
              className="w-full rounded-md text-white"
            >
              Aceptar
            </Button>
            {/* CANCEL BUTTON */}
            <Button
              type="button"
              onPress={closeModal}
              color="danger"
              className="w-full rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
	)
}
//delete seller modal
export function DeleteSellerModal({orgID, sellerID, sellerName, dialogRef, closeModal}: DeleteSellerModalProps){
  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  /* MUTATIONS */
  //mutation to delete sellers
  const mutation = useMutation<DeleteSeller, ServerError, number>(
    async (sellerID) => {
      try {
        const { data } = await AxiosFetch.delete(`/api/v1/${orgID}/sellers/${sellerID}`)
      
        return data;
      } catch (error) {
        console.error(error);

        return errorsResponse(error);
      }
    },
    {
      onSuccess: (data) => {
        //forces a refetch
        queryClient.invalidateQueries(["sellers", "all"]);

        console.log("Vendedor eliminado correctamente", data);
        //close modal once the seller was successfully deleted
        closeModal();
      },
    },
  );

  return (
    <dialog
      ref={dialogRef}
      className="h-fit w-1/3 rounded-lg px-8 py-4 text-slate-600"
    >
      {/* TITLE'S CONTAINER */}
      <div className="flex gap-4 border-b pb-3">
        <FaRegTrashAlt className="size-7" />
        <p className="w-full text-xl font-semibold">Eliminar vendedor</p>
        {/* BUTTON TO CLOSE THE MODAL */}
        <button
          onClick={closeModal}
          className="text-slate-500 transition-colors hover:text-red-500"
          aria-label="Cerrar"
        >
          <IoClose className="size-6" />
        </button>
      </div>
      {/* MESSAGE AND BUTTON CONTAINER */}
      <div className="flex flex-col justify-center pt-4">
        <p className="font-semibold">
          ¿Estas seguro de eliminar al cliente {sellerName}?
        </p>
        <p className="pb-4">
          Una vez eliminado, no podras volver a recuperarlo.
        </p>
        {/* ELIMINATE THE SELLER */}
        <Button
          type="button"
          color="danger"
          isLoading={mutation.isLoading}
          onPress={() => {
            mutation.mutate(sellerID);
          }}
        >
          Eliminar
        </Button>
      </div>
    </dialog>
  );







}
//edit seller modal
export function EditSellerModal({
  orgID,
  seller,
  dialogRef,
  closeModal,
}: EditSellerModalProps){
  /* UTILS */
  //get the query client instance to interact with the cache
  const queryClient = useQueryClient();

  /* MUTATIONS */
  //mutation to edit sellers
  const mutation = useMutation<EditSellerForm, ServerError, EditSellerForm>(
    async (body) => {
      try {
        const { data } = await AxiosFetch.put(`/api/v1/${orgID}/sellers/${seller.id}`, body);

        return data;
      } catch (error) {
        console.error(error);

        return errorsResponse(error);
      }
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(["sellers", "all"]);

        console.log("cliente editado correctamente", data);

        closeModal();

        reset();
      }
    }
  );

  /* HOOKS */
  //manipulate and validate the data from the form
  const {
    register, handleSubmit, formState: {errors}, reset,
  } = useForm<EditSellerForm>({
    resolver:zodResolver(sellerFormSchema),
    defaultValues: {
      name: seller.name,
      phone: seller.phone,
      info: seller.info ?? "",
    },
  });

  /* EVENT HANDLERS */
  //executes the mutation when the form is submitted
  const onSubmit: SubmitHandler<EditSellerForm> = (data) => mutation.mutate(data);

  return(
    <dialog ref={dialogRef} className="h-fit w-1/2 rounded-lg shadow-lg">
      {/* FORM'S CONTAINER */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex h-full w-full flex-col px-8 py-4 text-slate-500"
      >
        {/* TITLE'S CONTAINER */}
        <div className="flex gap-4 border-b pb-4">
          <FaPeopleGroup className="size-7" />
          <h3 className="w-full text-xl font-semibold">Editar vendedor</h3>
        </div>
        {/* FIELD'S CONTAINER */}
        <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
          <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
            Nombre
          {/* SELLER NAME INPUT */}
            <input
              {...register("name")}
              placeholder="Ej: Eduardo Perez"
              className={`rounded-lg border p-3 shadow-sm outline-none ${
                errors.name
                  ? "border-red-500 focus:border-red-500"
                  : "focus:border-green-400"
              }`}
            />
            {errors.name && (
              <span className="text-sm text-red-500">
                {errors.name.message}
              </span>
            )}
          </label>
          <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
            Telefono
          {/* SELLER PHONE INPUT */}
            <input
              {...register("phone")}
              type="tel"
              placeholder="Ej: +5491134865214"
              className={`rounded-lg border p-3 shadow-sm outline-none ${
                errors.phone
                  ? "border-red-500 focus:border-red-500"
                  : "focus:border-green-400"
              }`}
            />
            {errors.phone && (
              <span className="text-sm text-red-500">
                {errors.phone.message}
              </span>
            )}
          </label>
        </div>
        <label className="flex w-full flex-col gap-1 pt-4 text-sm focus-within:text-green-600">
          Informacion adicional
          {/* SELLER INFO TEXTAREA */}
          <textarea
            {...register("info")}
            placeholder="Por ejemplo: Casa de rejas verdes"
            className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
          />
        </label>
        {/* END MODAL CONTAINER */}
        <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
          {/* CONFIRM BUTTON */}
          <Button
            isLoading={mutation.isLoading}
            type="submit"
            color="success"
            className="w-full rounded-md text-white"
          >
            Aceptar
          </Button>
          {/* CANCELL BUTTON */}
          <Button
            type="reset"
            onPress={closeModal}
            color="danger"
            className="w-full rounded-md text-white"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </dialog>
  );
}











