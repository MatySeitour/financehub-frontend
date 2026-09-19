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
import { IdCardIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import z from "zod";
import { toast } from "sonner";
import { Client } from "@renderer/hooks/clients";
import { ErrorForm } from "@renderer/components/ErrorMessage";
import { Button } from "@renderer/components/Button";
import { useState } from "react";
import { Mandatory } from "@renderer/components/Mandatory";
import { TCheckingAccountClient } from "@renderer/hooks/checkingAccounts";

const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

export type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
  client_id: z.number({ message: "Este campo es requerido." }),
});

export function CreateCheckingAccountClientModal({
  isOpen,
  onClose,
  clients,
}: ModalProps & {
  clients: Client[];
}) {
  const queryClient = useQueryClient();

  const [allPercentages, setAllPercentages] = useState<number[]>([]);
  const [percentageInput, setPercentageInput] = useState("");
  const [errorMessagePercentage, setErrorMessagePercentage] = useState(false);

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.post("/api/v1/checking-accounts", {
        ...body,
        percentages: allPercentages,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["checking-accounts-clients"]);

      toast.success("Se ha creado una nueva cuenta corriente", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
  });

  const addPercentage = () => {
    const isPercentageExists = allPercentages.some(
      (percentage) => percentage === +percentageInput,
    );

    if (isPercentageExists) return setErrorMessagePercentage(true);

    setErrorMessagePercentage(false);
    setPercentageInput("");
    return setAllPercentages((prev) => [...prev, +percentageInput]);
  };

  const removePercentage = (percentageValue: number) => {
    setErrorMessagePercentage(false);

    return setAllPercentages((prev) =>
      prev.filter((percentage) => percentage !== percentageValue),
    );
  };

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);
  return (
    <>
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
                <IdCardIcon className="size-8 min-w-8 text-slate-500" />
                <div className="flex w-fit flex-col justify-center">
                  <p className="text-lg text-slate-500">
                    Crear cuenta corriente
                  </p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  {/* Client */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Cliente <Mandatory />
                    </label>

                    <Controller
                      name="client_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona un cliente"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md !text-slate-400",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md  font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                            value: "!text-slate-500",
                          }}
                          className={cn(
                            errors.client_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {clients.map((filter) => (
                            <SelectItem
                              textValue={`${filter.name}`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>{" "}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.client_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.client_id.message}
                      </p>
                    )}
                  </div>

                  {/* Percentages */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-500">
                      Porcentajes (opcional)
                    </span>
                    <ul className="grid grid-cols-6 gap-2">
                      {allPercentages.map((percentage) => (
                        <li
                          key={percentage}
                          className={cn(
                            "border-slate-300/70 bg-[#FCFCFC] hover:border-slate-300",
                            "flex h-8 min-w-20 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all",
                          )}
                        >
                          <span className="flex items-center gap-0.5">
                            %{((Number(percentage) / 100) * 100).toFixed(2)}
                          </span>

                          <Trash2Icon
                            onClick={(e) => {
                              e.stopPropagation();
                              removePercentage(percentage);
                            }}
                            className="size-3.5 min-w-3.5 text-slate-300 transition-all hover:text-red-500"
                          />
                        </li>
                      ))}

                      <li key="input" className="flex flex-col gap-0.5">
                        <div
                          className={cn(
                            "flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all",
                          )}
                        >
                          %
                          <input
                            className="w-full"
                            onChange={(e) => {
                              if (errorMessagePercentage)
                                setErrorMessagePercentage(false);

                              const input = e.target.value;

                              const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                              if (!isValid) return;

                              if (
                                `${percentageInput}` === "0" &&
                                input.length === 2 &&
                                !input.includes(".")
                              ) {
                                // if the percentageInput number is 0 and the input has 2 values, remove the 0
                                setPercentageInput(input[1]);
                              } else {
                                ////////////////////////////// if input has no values, set default 0
                                setPercentageInput(
                                  input[input.length - 1] === "."
                                    ? input
                                    : input,
                                );
                              }
                            }}
                            value={percentageInput}
                            type="text"
                          />
                        </div>

                        {errorMessagePercentage && (
                          <span className="text-xs text-danger">
                            Este porcentaje ya existe
                          </span>
                        )}
                      </li>

                      <Button
                        type="button"
                        onClick={addPercentage}
                        variant="success"
                        className="flex h-8 w-fit min-w-10 items-center gap-1 p-2"
                      >
                        <SaveIcon className="size-4 min-w-4" />
                      </Button>
                    </ul>
                  </div>

                  {mutation.isError && (
                    <ErrorForm errorMessage={mutation.error} />
                  )}
                </ModalBody>

                <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                  <Button
                    type="submit"
                    isLoading={mutation.isLoading}
                    variant="success"
                    className="w-full"
                  >
                    Confirmar
                  </Button>
                  <Button variant="error" className="w-full" onClick={onClose}>
                    Cancelar
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      <datalist id="clientsList">
        {clients?.map((client) => (
          <option key={client.id} value={client.name}></option>
        ))}
      </datalist>
    </>
  );
}

export function UpdateCheckingAccountClientModal({
  isOpen,
  onClose,
  clients,
  checkingAccount,
}: ModalProps & {
  clients: Client[];
  checkingAccount: TCheckingAccountClient;
}) {
  const queryClient = useQueryClient();

  const [allPercentages, setAllPercentages] = useState<number[]>(
    checkingAccount.percentages.map((percentage) =>
      Number(percentage.percentage),
    ),
  );
  const [percentageInput, setPercentageInput] = useState("");
  const [errorMessagePercentage, setErrorMessagePercentage] = useState(false);

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      const { data } = await AxiosFetch.put(
        `/api/v1/checking-accounts/${checkingAccount.id}`,
        {
          ...body,
          percentages: allPercentages,
        },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["checking-accounts-clients"]);

      toast.success("Se ha creado una nueva cuenta corriente", {
        className: "!border-primary/70",
      });
      onClose();
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      client_id: checkingAccount.client.id,
    },
  });

  /* EVENT HANDLERS */
  //Executes the mutation when the form is submitted

  const addPercentage = () => {
    const isPercentageExists = allPercentages.some(
      (percentage) => percentage === +percentageInput,
    );

    if (isPercentageExists) return setErrorMessagePercentage(true);

    setErrorMessagePercentage(false);
    setPercentageInput("");
    return setAllPercentages((prev) => [...prev, +percentageInput]);
  };

  const removePercentage = (percentageValue: number) => {
    setErrorMessagePercentage(false);

    return setAllPercentages((prev) =>
      prev.filter((percentage) => percentage !== percentageValue),
    );
  };

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);
  return (
    <>
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
                <IdCardIcon className="size-8 min-w-8 text-slate-500" />
                <div className="flex w-fit flex-col justify-center">
                  <p className="text-lg text-slate-500">
                    Editar cuenta corriente
                  </p>
                </div>
              </ModalHeader>
              <form
                className="flex flex-col gap-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <ModalBody className="py-0">
                  {/* Client */}
                  <div className="flex w-full flex-col gap-1">
                    <label
                      htmlFor="currency"
                      className="text-sm text-slate-500"
                    >
                      Cliente <Mandatory />
                    </label>

                    <Controller
                      name="client_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={field.value ? `${field.value}` : ""}
                          placeholder="Selecciona un cliente"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md !text-slate-400",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md  font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                            value: "!text-slate-500",
                          }}
                          className={cn(
                            errors.client_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {clients.map((filter) => (
                            <SelectItem
                              textValue={`${filter.name}`}
                              classNames={{
                                base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                              }}
                              className="flex items-center gap-1"
                              key={filter.id}
                            >
                              <span className="text-sm">{filter.name}</span>{" "}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                    {errors.client_id && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.client_id.message}
                      </p>
                    )}
                  </div>

                  {/* Percentages */}
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-500">
                      Porcentajes (opcional)
                    </span>
                    <ul className="grid grid-cols-6 gap-2">
                      {allPercentages.map((percentage) => (
                        <li
                          key={percentage}
                          className={cn(
                            "border-slate-300/70 bg-[#FCFCFC] hover:border-slate-300",
                            "flex h-8 min-w-20 cursor-pointer items-center justify-center gap-2 rounded-md border px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all",
                          )}
                        >
                          <span className="flex items-center gap-0.5">
                            %{((Number(percentage) / 100) * 100).toFixed(2)}
                          </span>

                          <Trash2Icon
                            onClick={(e) => {
                              e.stopPropagation();
                              removePercentage(percentage);
                            }}
                            className="size-3.5 min-w-3.5 text-slate-300 transition-all hover:text-red-500"
                          />
                        </li>
                      ))}

                      <li key="input" className="flex flex-col gap-0.5">
                        <div
                          className={cn(
                            "flex h-8 items-center justify-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs tabular-nums text-slate-400 shadow-sm transition-all",
                          )}
                        >
                          %
                          <input
                            className="w-full"
                            onChange={(e) => {
                              if (errorMessagePercentage)
                                setErrorMessagePercentage(false);

                              const input = e.target.value;

                              const isValid = /^[0-9]*\.?[0-9]*$/.test(input);
                              if (!isValid) return;

                              if (
                                `${percentageInput}` === "0" &&
                                input.length === 2 &&
                                !input.includes(".")
                              ) {
                                // if the percentageInput number is 0 and the input has 2 values, remove the 0
                                setPercentageInput(input[1]);
                              } else {
                                ////////////////////////////// if input has no values, set default 0
                                setPercentageInput(
                                  input[input.length - 1] === "."
                                    ? input
                                    : input,
                                );
                              }
                            }}
                            value={percentageInput}
                            type="text"
                          />
                        </div>

                        {errorMessagePercentage && (
                          <span className="text-xs text-danger">
                            Este porcentaje ya existe
                          </span>
                        )}
                      </li>

                      <Button
                        type="button"
                        onClick={addPercentage}
                        variant="success"
                        className="flex h-8 w-fit min-w-10 items-center gap-1 p-2"
                      >
                        <SaveIcon className="size-4 min-w-4" />
                      </Button>
                    </ul>
                  </div>

                  {mutation.isError && (
                    <ErrorForm errorMessage={mutation.error} />
                  )}
                </ModalBody>

                <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                  <Button
                    type="submit"
                    isLoading={mutation.isLoading}
                    variant="success"
                    className="w-full"
                  >
                    Confirmar
                  </Button>
                  <Button variant="error" className="w-full" onClick={onClose}>
                    Cancelar
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      <datalist id="clientsList">
        {clients?.map((client) => (
          <option key={client.id} value={client.name}></option>
        ))}
      </datalist>
    </>
  );
}
