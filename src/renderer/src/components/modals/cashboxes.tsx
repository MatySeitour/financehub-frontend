import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { z } from "zod";
import { Cashbox } from "@renderer/hooks/cashboxes";
import { cn, errorsResponse } from "@renderer/utils";
import { useMutation, useQueryClient } from "react-query";
import { ModalProps, ServerError } from "@renderer/utils/types";
import axios from "@renderer/hooks/axios";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircleIcon,
  CircleAlertIcon,
  PackageIcon,
  PackageOpenIcon,
  PackagePlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Button } from "../Button";
import { toast } from "sonner";

type ChangeStateCashbox = z.infer<ReturnType<typeof checkIsCashboxOpenSchema>>;
const checkIsCashboxOpenSchema = (isCashboxOpen: boolean) =>
  z
    .object({
      openingValue: z.coerce
        .number()
        .gt(0, { message: "Debe ser mayor a 0" })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (!isCashboxOpen && !data.openingValue) {
        ctx.addIssue({
          path: ["openingValue"],
          code: z.ZodIssueCode.custom,
          message: "El valor de apertura es requerido si la caja está cerrada",
        });
      }
    });

export function ChangeStateCashboxModal({
  isOpen,
  onClose,
  cashbox,
}: {
  isOpen: boolean;
  onClose: () => void;
  cashbox: Cashbox;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    control,
    handleSubmit,
  } = useForm<ChangeStateCashbox>({
    resolver: zodResolver(checkIsCashboxOpenSchema(cashbox.state === 1)),
  });

  const mutation = useMutation<void, ServerError, ChangeStateCashbox>({
    mutationFn: async (body) => {
      try {
        const { data } = await AxiosFetch.patch(
          `/api/v1/cashboxes/${cashbox.id}/action`,
          { ...body, state: cashbox.state === 1 ? 0 : 1 },
        );
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashboxes", "all"] });
      toast.success(
        `Se ha ${cashbox.state === 1 ? "cerrado" : "abierto"} la caja ${cashbox.name}`,
        {
          className: "!border-primary/70",
        },
      );
      onClose();
    },
  });

  const onSubmit: SubmitHandler<ChangeStateCashbox> = (data) =>
    mutation.mutate(data);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              {cashbox.state ? (
                <PackageIcon className="size-8 min-w-8 text-slate-500" />
              ) : (
                <PackageOpenIcon className="size-8 min-w-8 text-slate-500" />
              )}
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">
                  {" "}
                  {cashbox.state === 0
                    ? `Abrir ${cashbox.name}`
                    : `Cerrar ${cashbox.name}`}
                </p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                {cashbox.state === 0 ? (
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="openingValue"
                      className="text-sm text-slate-500"
                    >
                      Valor de apertura
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                        errors.openingValue && "border-red-500",
                      )}
                    >
                      $
                      <Controller
                        control={control}
                        name="openingValue"
                        render={({ field }) => (
                          <input
                            className="h-full w-full bg-transparent text-sm outline-none"
                            type="text"
                            onChange={(e) => {
                              const input = e.target.value;

                              const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                              if (!isValid) return;

                              if (
                                `${field.value}` === "0" &&
                                input.length === 2
                              ) {
                                // if the field number is 0 and the input has 2 values, remove the 0
                                field.onChange(input[1]);
                              } else if (input === "") {
                                ////////////////////////////// if input has no values, set default 0
                                field.onChange("0");
                              } else {
                                field.onChange(input);
                              }
                            }}
                            value={field.value ?? ""}
                          />
                        )}
                      />
                    </div>
                    {errors.openingValue && (
                      <p className="text-sm text-red-500">
                        {errors.openingValue.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-balance text-center text-slate-400">
                    ¿Estás seguro que deseas cerrar la caja{" "}
                    <b>{cashbox.name}</b>?
                  </p>
                )}

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
                <Button variant="error" className="w-full" onClick={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
  name: z.string().min(1, { message: "Campo requerido" }),
  currency: z.string().min(1, { message: "Campo requerido" }),
});

export function CreateCashboxModal({ isOpen, onClose }: ModalProps) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
  });

  const mutation = useMutation<Cashbox, ServerError, Input>({
    mutationFn: async (body) => {
      try {
        const { data } = await AxiosFetch.post(`/api/v1/cashboxes`, body);
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashboxes", "all"] });
      toast.success("Caja creada con éxito", {
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
              <PackagePlusIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Crear caja</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex w-full items-start gap-4">
                  {/* opening value */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Nombre de caja
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                        errors.name && "border-red-500",
                      )}
                    >
                      <input
                        className="h-full w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Divisa
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                        errors.currency && "border-red-500",
                      )}
                    >
                      <input
                        className="h-full w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        {...register("currency")}
                      />
                    </div>
                    {errors.currency && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.currency.message}
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
                  Cerrar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

type InputUpdate = z.infer<ReturnType<typeof inputUpdateSchema>>;
const inputUpdateSchema = (isCashboxOpen: boolean) =>
  z
    .object({
      openingValue: z.coerce
        .number()
        .gt(0, { message: "Debe ser mayor a 0" })
        .optional(),
    })
    .merge(inputSchema)
    .superRefine((data, ctx) => {
      if (isCashboxOpen && !data.openingValue) {
        ctx.addIssue({
          path: ["openingValue"],
          code: z.ZodIssueCode.custom,
          message: "El valor de apertura es requerido si la caja está cerrada",
        });
      }
    });

export function UpdateCashboxModal({
  isOpen,
  onClose,
  cashbox,
}: ModalProps & { cashbox: Cashbox }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    control,
    register,
  } = useForm<InputUpdate>({
    resolver: zodResolver(inputUpdateSchema(cashbox.state === 1)),
    defaultValues: {
      name: cashbox.name,
      currency: cashbox.currency,
      openingValue: cashbox.state === 1 ? cashbox.openingValue : undefined,
    },
  });

  const mutation = useMutation<Cashbox, ServerError, Input>({
    mutationFn: async (body) => {
      try {
        const { data } = await AxiosFetch.put(
          `/api/v1/cashboxes/${cashbox.id}`,
          body,
        );
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashboxes", "all"] });
      toast.success("Caja modificada con éxito", {
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
              <PackagePlusIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Modificar caja</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex w-full items-start gap-4">
                  {/* opening value */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Nombre de caja
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                        errors.name && "border-red-500",
                      )}
                    >
                      <input
                        className="h-full w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        {...register("name")}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Divisa
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                        errors.currency && "border-red-500",
                      )}
                    >
                      <input
                        className="h-full w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        {...register("currency")}
                      />
                    </div>
                    {errors.currency && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.currency.message}
                      </p>
                    )}
                  </div>

                  {/* opening value */}
                  {cashbox.state === 1 && (
                    <div className="flex w-full flex-col gap-1">
                      <label
                        htmlFor="openingValue"
                        className="text-sm text-slate-500"
                      >
                        Valor de apertura
                      </label>
                      <div
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 p-1 text-sm outline-none",
                          errors.openingValue && "border-red-500",
                        )}
                      >
                        $
                        <Controller
                          control={control}
                          name="openingValue"
                          render={({ field }) => (
                            <input
                              className="h-full w-full bg-transparent text-sm font-medium outline-none"
                              type="text"
                              onChange={(e) => {
                                const input = e.target.value;

                                const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                                if (!isValid) return;

                                if (
                                  `${field.value}` === "0" &&
                                  input.length === 2
                                ) {
                                  // if the field number is 0 and the input has 2 values, remove the 0
                                  field.onChange(input[1]);
                                } else if (input === "") {
                                  ////////////////////////////// if input has no values, set default 0
                                  field.onChange("0");
                                } else {
                                  field.onChange(input);
                                }
                              }}
                              value={field.value ?? ""}
                            />
                          )}
                        />
                      </div>
                      {errors.openingValue && (
                        <p className="text-sm text-red-500">
                          {errors.openingValue.message}
                        </p>
                      )}
                    </div>
                  )}
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
                  Cerrar
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

export function DeleteCashboxModal({
  isOpen,
  onClose,
  cashbox,
}: ModalProps & { cashbox: Cashbox }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      try {
        const { data } = await AxiosFetch.delete(
          `/api/v1/cashboxes/${cashbox.id}`,
        );
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashboxes", "all"] });
      toast.success(`Se ha deshabilitado la caja ${cashbox.name}`, {
        className: "!border-primary/70",
      });
      onClose();
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
      <ModalContent className="h-auto gap-2 bg-gradient-to-t from-red-200/50 via-white to-white">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                <div className="flex items-center rounded-full bg-red-200/30 p-4">
                  <TriangleAlertIcon className="size-12 min-w-12 text-danger" />
                </div>
                <p className="text-xl text-danger">Deshabilitar caja</p>
                <p className="text-balance text-center text-sm font-normal text-red-400">
                  No podrás realizar <b>operaciones ni prestamos</b> en esta
                  caja si está deshabilitada, pero conservarás su historial
                </p>
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
                disabled={mutation?.isLoading}
                onClick={() => mutation.mutate()}
                type="submit"
                variant="error"
              >
                Deshabilitar caja
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
