import {
  DatePicker,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
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
import { Currency } from "@renderer/hooks/currencies";
import { now } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";

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

  const isCashboxClosed = cashbox.state === 0;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
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
                  {isCashboxClosed
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
                {isCashboxClosed ? (
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="openingValue"
                      className="text-sm text-slate-500"
                    >
                      Valor de apertura
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus-within:border-primary focus:border-primary",
                        errors.openingValue && "border-red-500",
                      )}
                    >
                      <span className="pt-0.5">$</span>

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
                  variant={isCashboxClosed ? "success" : "error"}
                  className="w-full"
                >
                  {isCashboxClosed ? "Confirmar" : "Cerrar"}
                </Button>
                <Button
                  variant={isCashboxClosed ? "error" : "outline"}
                  className="w-full"
                  onClick={onClose}
                >
                  {isCashboxClosed ? "Cerrar" : "Cancelar"}
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
  currency_id: z.number({ message: "Campo requerido" }),
});

export function CreateCashboxModal({
  isOpen,
  onClose,
  currencies,
}: ModalProps & { currencies: Currency[] }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    control,
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

                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Divisa
                    </label>

                    <Controller
                      name="currency_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona una divisa"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                          }}
                          className={cn(
                            errors.currency_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {currencies.map((filter) => (
                            <SelectItem
                              textValue={`${filter.name} (${filter.nomenclature})`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>{" "}
                              <span className="text-xs text-slate-400">
                                ({filter.nomenclature})
                              </span>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.currency_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.currency_id.message}
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
  currencies,
}: ModalProps & { cashbox: Cashbox; currencies: Currency[] }) {
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
      currency_id: cashbox.currency.id,
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
        console.log(body);
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

                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Divisa
                    </label>

                    <Controller
                      name="currency_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={
                            field.value ? `${field.value}` : undefined
                          }
                          placeholder="Selecciona una divisa"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7 border border-slate-300",
                          }}
                          className="min-h-9 rounded-md outline-none"
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {currencies.map((filter) => (
                            <SelectItem
                              textValue={`${filter.name} (${filter.nomenclature})`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>{" "}
                              <span className="text-xs text-slate-400">
                                ({filter.nomenclature})
                              </span>
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
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
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus-within:border-primary focus:border-primary",
                          errors.openingValue && "border-red-500",
                        )}
                      >
                        <span className="pt-0.5">$</span>

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
      <ModalContent className="h-auto gap-2 bg-gradient-to-t from-red-200 via-white to-white">
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

type InputExpense = z.infer<ReturnType<typeof getInputExpenseSchema>>;
const getInputExpenseSchema = (maxCashboxValue: number) => {
  return z.object({
    description: z.string().min(1, { message: "Campo requerido" }),
    amount: z
      .number({ message: "Campo requerido" })
      .gt(0, { message: "Debe ser mayor a 0" })
      .refine((val) => val <= maxCashboxValue, {
        message: "El monto súpera el valor de la caja",
      }),
    date: z.date({ message: "Campo requerido" }),
    cashbox_id: z.number(),
  });
};

export function CreateCashboxExpenseModal({
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
  } = useForm<InputExpense>({
    resolver: zodResolver(getInputExpenseSchema(cashbox.value)),
    defaultValues: {
      cashbox_id: cashbox.id,
      date: now("America/Argentina/Buenos_Aires").toDate(),
    },
  });

  const mutation = useMutation<Cashbox, ServerError, InputExpense>({
    mutationFn: async (body) => {
      try {
        const { data } = await AxiosFetch.post(`/api/v1/expenses`, body);
        return data;
      } catch (error) {
        console.error(error);
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashboxes", "all"] });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<InputExpense> = (data) => mutation.mutate(data);

  console.log(errors.date);
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
                <p className="text-lg text-slate-500">Crear movimiento</p>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex w-full items-start gap-4">
                  {/* currency */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="amount" className="text-sm text-slate-500">
                      Cantidad
                    </label>
                    <div
                      className={cn(
                        "flex h-9 w-full items-center gap-1 rounded-md border border-slate-300/70 p-1 px-3 text-sm outline-none focus-within:border-primary",
                        errors.amount && "border-red-500",
                      )}
                    >
                      <span className="pt-0.5">$</span>
                      <Controller
                        control={control}
                        name="amount"
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
                                field.onChange(+input[1]);
                              } else if (input === "") {
                                ////////////////////////////// if input has no values, set default 0
                                field.onChange(+"0");
                              } else {
                                +input > cashbox.value
                                  ? field.onChange(cashbox.value)
                                  : field.onChange(+input);
                              }
                            }}
                            value={field.value ?? ""}
                          />
                        )}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-500">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  {/* Moviment date */}
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="amount" className="text-sm text-slate-500">
                      Fecha
                    </label>
                    <Controller
                      control={control}
                      name="date"
                      render={({ field }) => (
                        <I18nProvider locale="es-AR">
                          <DatePicker
                            className={cn(
                              errors.date?.message && "!border-red-500",
                              "rounded-md border border-slate-300/70",
                            )}
                            onChange={(val) => {
                              field.onChange(val ? val.toDate() : null);
                            }}
                            granularity="day"
                            defaultValue={now("America/Argentina/Buenos_Aires")}
                            classNames={{
                              innerWrapper: "rounded-md",
                              inputWrapper:
                                "hover:!bg-white hover:!border-primary  bg-white !h-8 min-h-7 ",
                              popoverContent:
                                "rounded-md text-slate-400 font-normal",
                              segment: "rounded-sm focus:bg-slate-300/40",
                            }}
                          />
                        </I18nProvider>
                      )}
                    />
                    {errors.date && (
                      <p className="text-sm text-red-500">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-1">
                  <label
                    htmlFor="description"
                    className="text-sm text-slate-500"
                  >
                    Observación
                  </label>
                  <Textarea
                    {...register("description")}
                    classNames={{
                      inputWrapper: [
                        "rounded-md border border-slate-300/70 bg-transparent px-3",
                        "hover:!bg-transparent",
                        "group-data-[focus=true]:border-primary group-data-[focus=true]:bg-transparent",
                      ].join(" "),
                      input: "bg-transparent p-0 placeholder:text-slate-400",
                    }}
                    labelPlacement="outside"
                    placeholder="Ej: Sueldos de mes de Agosto"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
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
