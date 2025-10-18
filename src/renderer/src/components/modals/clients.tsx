/* IMPORTS */
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { cn } from "@renderer/utils";
import { ModalProps, ServerError } from "@renderer/utils/types";
import {
  AlertCircleIcon,
  CircleAlertIcon,
  TriangleAlertIcon,
  UserRoundPenIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../Button";
import { Mandatory } from "../Mandatory";
import { getSellers } from "@renderer/hooks/sellers";
import { Client } from "@renderer/hooks/clients";

export type Input = z.infer<typeof inputSchema>;
export const inputSchema = z.object({
  name: z
    .string()
    .min(1, "Este campo es requerido.")
    .max(50, "El nombre no puede contener mas de 50 caracteres."),
  phone: z
    .string()
    .min(1, "Este campo es requerido.")
    .max(20, "El telefono no puede contener mas de 20 numeros."),
  address: z
    .string()
    .min(1, "Este campo es requerido.")
    .max(200, "La direccion no puede contener mas de 200 caracteres."),
  info: z.string(),
  referred_to_id: z.number().nullable().optional(),
});
//delete client data validation
export const deleteClientSchema = z.object({
  clientID: z.number().min(1, "El ID del cliente es inválido."),
});

/* MODALS */
//create client modal
export function CreateClientModal({ isOpen, onClose }: ModalProps) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    watch,
    control,
    register,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
  });

  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryFn: () => getSellers(),
    queryKey: ["sellers", "all"],
  });

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.post(`/api/v1/clients`, {
        ...body,
        referred_to_id: body.referred_to_id ? body.referred_to_id : null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", "all"] });
      toast.success("Cliente creado con éxito", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);

  return (
    <Modal
      backdrop="opaque"
      radius="sm"
      size="3xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <UserRoundPlusIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <span className="text-lg text-slate-500">Crear cliente</span>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="grid w-full grid-cols-2 gap-4">
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Nombre <Mandatory />
                    </label>

                    <input
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                        errors.name && "border-red-500",
                      )}
                      type="text"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* phone */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="phone" className="text-sm text-slate-500">
                      Télefono <Mandatory />
                    </label>

                    <Controller
                      name="phone"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                            errors.phone && "border-red-500",
                          )}
                          type="text"
                          onChange={(e) => {
                            if (e.target.value.length > 20) return;
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* referred */}
                  <div className="flex w-full flex-col gap-1">
                    <label className="text-sm text-slate-500">Referente</label>

                    <Controller
                      name="referred_to_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? [`${field.value}`] : []}
                          placeholder="Selecciona un referente"
                          endContent={
                            sellersQuery.isLoading ? (
                              <div className="flex w-full items-center justify-end">
                                <span className="relative inline-block size-4 animate-rotateFull rounded-[50%] border-2 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-6 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-2 after:border-transparent"></span>
                              </div>
                            ) : null
                          }
                          aria-label="filters"
                          disabled={sellersQuery.isLoading}
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                          }}
                          className={cn(
                            errors.referred_to_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none focus-within:border-primary",
                          )}
                          onSelectionChange={(key) => {
                            const selectedKey = key.currentKey;

                            if (!selectedKey || selectedKey === "null") {
                              field.onChange(null);
                            } else {
                              field.onChange(+selectedKey);
                            }
                          }}
                        >
                          <>
                            <SelectItem
                              aria-hidden="true"
                              tabIndex={-1}
                              textValue="Sin referente"
                              className="text-slate-400 transition-colors data-[hover=true]:!bg-slate-100/70 data-[hover=true]:!text-slate-500"
                              key={null}
                            >
                              <span className="text-sm">Sin referente</span>{" "}
                            </SelectItem>

                            {sellersQuery.data?.map((filter) => (
                              <SelectItem
                                textValue={`${filter.name}`}
                                className="text-slate-400 transition-colors data-[hover=true]:!bg-slate-100/70 data-[hover=true]:!text-slate-500"
                                key={filter.id}
                              >
                                <span className="text-sm">{filter.name}</span>{" "}
                              </SelectItem>
                            ))}
                          </>
                        </Select>
                      )}
                    />
                    {errors.referred_to_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.referred_to_id.message}
                      </p>
                    )}
                  </div>

                  {/* address */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="address" className="text-sm text-slate-500">
                      Dirección <Mandatory />
                    </label>

                    <input
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                        errors.address && "border-red-500",
                      )}
                      type="text"
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  {/* info */}
                  <div className="relative col-span-2 flex w-full flex-col gap-1">
                    <label htmlFor="info" className="text-sm text-slate-500">
                      Información adicional (opcional)
                    </label>

                    <textarea
                      defaultValue=""
                      maxLength={200}
                      placeholder="Escribe informacion sobre extra sobre este cliente..."
                      className={cn(
                        "flex h-24 w-full resize-none items-center gap-2 rounded-md border border-slate-300 p-2 px-2 pb-4 text-sm outline-none focus:border-primary",
                        errors.info && "border-red-500",
                      )}
                      {...register("info")}
                    />

                    <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                      {watch("info") ? watch("info")?.length : 0} / 250
                    </span>
                    {errors.info && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.info.message}
                      </p>
                    )}
                  </div>
                </div>

                {mutation.isError && (
                  <div className="flex w-full items-center gap-2 rounded-md border border-red-500 bg-red-200/20 p-2">
                    <CircleAlertIcon className="size-3.5 min-w-3.5 text-red-500" />
                    <p className="text-sm text-red-500">
                      {mutation.error.message}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={mutation?.isLoading}
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button
                  variant="error"
                  className="w-full"
                  type="button"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export function DeleteClientModal({
  isOpen,
  onClose,
  client,
}: ModalProps & { client: Client }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(`/api/v1/clients/${client.id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", "all"] });
      toast.success("Se ha eliminado un cliente", {
        className: "!border-primary/70",
      });
      onClose && onClose();
    },
  });
  return (
    <Modal
      backdrop="opaque"
      radius="sm"
      size="xl"
      isOpen={isOpen}
      className="!my-0 py-2"
      onOpenChange={() => {
        onClose();
      }}
    >
      <ModalContent className="h-auto gap-2 bg-gradient-to-t from-red-200 via-white to-white">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                <div className="flex items-center rounded-full bg-red-200/30 p-4">
                  <TriangleAlertIcon className="size-12 min-w-12 text-danger" />
                </div>
                <span className="text-xl text-danger">Eliminar cliente</span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro que quieres eliminar el cliente {client.name}?
                </span>
              </div>
            </ModalHeader>
            {mutation?.isError && (
              <div className="flex items-center justify-center px-8">
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                  <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                  <p className="text-sm font-medium text-red-500">
                    {mutation?.error?.code === "connection-error"
                      ? "Ha ocurrido un error de conexión"
                      : "Ha ocurrido un error en el servidor"}
                  </p>
                </div>
              </div>
            )}
            <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
              <Button
                isLoading={mutation?.isLoading}
                disabled={true}
                onClick={() => mutation.mutate()}
                type="submit"
                variant="error"
              >
                Confirmar
              </Button>
              <Button onClick={onClose} variant="outline">
                Cerrar
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
//edit client modal
export function UpdateClientModal({
  isOpen,
  onClose,
  client,
}: ModalProps & { client: Client }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    watch,
    control,
    register,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      address: client.address,
      info: client.info ?? "",
      name: client.name,
      phone: client.phone,
      referred_to_id: client.referred_to?.id ?? undefined,
    },
  });

  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryFn: () => getSellers(),
    queryKey: ["sellers", "all"],
  });

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.put(`/api/v1/clients/${client.id}`, {
        ...body,
        referred_to_id: body.referred_to_id ? body.referred_to_id : null,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", "all"] });
      toast.success("Cliente modificado con éxito", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);

  return (
    <Modal
      backdrop="opaque"
      radius="sm"
      size="3xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <UserRoundPenIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <span className="text-lg text-slate-500">
                  Modificar cliente
                </span>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="grid w-full grid-cols-2 gap-4">
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Nombre <Mandatory />
                    </label>

                    <input
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                        errors.name && "border-red-500",
                      )}
                      type="text"
                      {...register("name")}
                    />
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* phone */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="phone" className="text-sm text-slate-500">
                      Télefono <Mandatory />
                    </label>

                    <Controller
                      name="phone"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <input
                          {...field}
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                            errors.phone && "border-red-500",
                          )}
                          type="text"
                          onChange={(e) => {
                            if (e.target.value.length > 20) return;
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* referred */}
                  <div className="flex w-full flex-col gap-1">
                    <label className="text-sm text-slate-500">Referente</label>

                    <Controller
                      name="referred_to_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? [`${field.value}`] : []}
                          placeholder="Selecciona un referente"
                          endContent={
                            sellersQuery.isLoading ? (
                              <div className="flex w-full items-center justify-end">
                                <span className="relative inline-block size-4 animate-rotateFull rounded-[50%] border-2 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-6 after:w-6 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-2 after:border-transparent"></span>
                              </div>
                            ) : null
                          }
                          aria-label="filters"
                          disabled={sellersQuery.isLoading}
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                          }}
                          className={cn(
                            errors.referred_to_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none focus-within:border-primary",
                          )}
                          onSelectionChange={(key) => {
                            const selectedKey = key.currentKey;

                            if (!selectedKey || selectedKey === "null") {
                              field.onChange(null);
                            } else {
                              field.onChange(+selectedKey);
                            }
                          }}
                        >
                          <>
                            <SelectItem
                              aria-hidden="true"
                              tabIndex={-1}
                              textValue="Sin referente"
                              className="text-slate-400 transition-colors data-[hover=true]:!bg-slate-100/70 data-[hover=true]:!text-slate-500"
                              key={null}
                            >
                              <span className="text-sm">Sin referente</span>{" "}
                            </SelectItem>

                            {sellersQuery.data?.map((filter) => (
                              <SelectItem
                                textValue={`${filter.name}`}
                                className="text-slate-400 transition-colors data-[hover=true]:!bg-slate-100/70 data-[hover=true]:!text-slate-500"
                                key={filter.id}
                              >
                                <span className="text-sm">{filter.name}</span>{" "}
                              </SelectItem>
                            ))}
                          </>
                        </Select>
                      )}
                    />
                    {errors.referred_to_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.referred_to_id.message}
                      </p>
                    )}
                  </div>

                  {/* address */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="address" className="text-sm text-slate-500">
                      Dirección <Mandatory />
                    </label>

                    <input
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                        errors.address && "border-red-500",
                      )}
                      type="text"
                      {...register("address")}
                    />
                    {errors.address && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  {/* info */}
                  <div className="relative col-span-2 flex w-full flex-col gap-1">
                    <label htmlFor="info" className="text-sm text-slate-500">
                      Información adicional (opcional)
                    </label>

                    <textarea
                      defaultValue=""
                      maxLength={200}
                      placeholder="Escribe informacion sobre extra sobre este cliente..."
                      className={cn(
                        "flex h-24 w-full resize-none items-center gap-2 rounded-md border border-slate-300 p-2 px-2 pb-4 text-sm outline-none focus:border-primary",
                        errors.info && "border-red-500",
                      )}
                      {...register("info")}
                    />

                    <span className="absolute bottom-2 right-3 text-xs text-slate-400">
                      {watch("info") ? watch("info")?.length : 0} / 250
                    </span>
                    {errors.info && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.info.message}
                      </p>
                    )}
                  </div>
                </div>

                {mutation.isError && (
                  <div className="flex w-full items-center gap-2 rounded-md border border-red-500 bg-red-200/20 p-2">
                    <CircleAlertIcon className="size-3.5 min-w-3.5 text-red-500" />
                    <p className="text-sm text-red-500">
                      {mutation.error.message}
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={mutation?.isLoading}
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button
                  variant="error"
                  className="w-full"
                  type="button"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
