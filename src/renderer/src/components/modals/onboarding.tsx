import {
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "@heroui/react";
import { cn, withCbk } from "@renderer/utils";
import {
  AlertCircleIcon,
  CheckIcon,
  CircleDashedIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  TriangleAlertIcon,
  UserRoundPenIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { Button } from "../Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useState } from "react";
import { ModalProps, ServerError } from "@renderer/utils/types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { z } from "zod";
import { ErrorForm } from "../ErrorMessage";
import { UsersByOrganization } from "@renderer/hooks/user";
import { Select, SelectItem } from "@heroui/react";
import { getRoles } from "@renderer/hooks/permissions";
type Input = z.infer<ReturnType<typeof inputSchema>>;
const inputSchema = (isOnboarding: boolean) => {
  return z
    .object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
      repeatPassword: z.string(),
      needsResetPassword: z.boolean(),
      role_id: z.number().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.needsResetPassword && val.password !== val.repeatPassword) {
        return ctx.addIssue({
          message: "Las contraseñas no coinciden",
          path: ["repeatPassword"],
          code: "custom",
        });
      }

      if (!val.role_id && !isOnboarding) {
        return ctx.addIssue({
          message: "Este campo es requerido",
          path: ["role_id"],
          code: "custom",
        });
      }
    });
};

export function CreateUserModal({
  isOpen,
  onClose,
  isOnboarding,
}: ModalProps & { isOnboarding?: boolean }) {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const rolesQuery = useQuery<
    Awaited<ReturnType<typeof getRoles>>,
    ServerError
  >({
    queryFn: () => getRoles(),
    queryKey: ["roles", "all"],
    enabled: !isOnboarding,
  });

  const {
    watch,
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema(!!isOnboarding)),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      needsResetPassword: true,
      repeatPassword: "",
    },
  });

  console.log(errors);

  const mutation = useMutation<void, ServerError, Input>({
    mutationFn: async (user) => {
      const { data } = await AxiosFetch.post(
        `/api/organization-add-user`,
        user,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users-organization"],
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);

  const validations = [
    { test: watch("password").length >= 8, text: "Al menos 8 carácteres" },
    { test: /[0-9]/.test(watch("password")), text: "Al menos un número" },
    { test: /[A-Z]/.test(watch("password")), text: "Al menos una mayúscula" },
  ];

  const hasValidationError = validations.some((testing) => !testing?.test);

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <UserRoundPlusIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Crear miembro</p>
              </div>
            </ModalHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody>
                <div className="flex items-center gap-2">
                  <div className="flex w-full flex-col gap-1">
                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Nombre
                      <input
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                          errors.name && "border-red-500",
                        )}
                        type="text"
                        {...register("name")}
                      />
                    </label>

                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-1">
                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Correo eléctronico
                      <input
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                          errors.email && "border-red-500",
                        )}
                        type="email"
                        {...register("email")}
                      />
                    </label>

                    {errors.email && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role */}
                {!isOnboarding ? (
                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="Role" className="text-sm text-slate-500">
                      Role
                    </label>

                    {rolesQuery.isFetching ? (
                      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
                    ) : (
                      <Controller
                        name="role_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            selectedKeys={
                              rolesQuery.data && field.value
                                ? new Set([String(field.value)])
                                : new Set()
                            }
                            placeholder="Selecciona un rol"
                            aria-label="filters"
                            classNames={{
                              innerWrapper: "rounded-md ",
                              mainWrapper: "rounded-md",
                              popoverContent: "rounded-md font-normal",
                              trigger:
                                "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                              value: "!text-slate-500",
                            }}
                            className={cn(
                              errors.role_id?.message && "!border-red-500",

                              "min-h-9 rounded-md border border-slate-300 outline-none",
                            )}
                            onSelectionChange={(key) => {
                              if (key.currentKey)
                                field.onChange(+key.currentKey);
                            }}
                          >
                            {rolesQuery.data
                              ? rolesQuery.data?.map((filter) => (
                                  <SelectItem
                                    textValue={`${filter.name}`}
                                    classNames={{
                                      base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                                    }}
                                    className="flex items-center gap-1"
                                    key={filter.id}
                                  >
                                    <span className="text-sm">
                                      {filter.name}
                                    </span>{" "}
                                  </SelectItem>
                                ))
                              : []}
                          </Select>
                        )}
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-200/40 p-2 text-sm text-slate-400">
                    <InfoIcon className="size-5 min-w-5" />
                    <span>
                      Este empleado va a tener el rol <b>Empleado</b>. Una vez
                      creada la organización lo vas a poder modificar
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                    Nueva contraseña
                    <Input
                      errorMessage={errors?.password?.message}
                      {...register("password")}
                      name="password"
                      endContent={
                        <Tooltip
                          color="success"
                          className="text-xs text-white"
                          closeDelay={0}
                          content={
                            isPasswordVisible
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          <div className="flex">
                            <EyeIcon
                              onClick={() =>
                                setIsPasswordVisible(!isPasswordVisible)
                              }
                              className={cn(
                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                !isPasswordVisible && "hidden",
                              )}
                            />
                            <EyeOffIcon
                              onClick={() =>
                                setIsPasswordVisible(!isPasswordVisible)
                              }
                              className={cn(
                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                isPasswordVisible && "hidden",
                              )}
                            />
                          </div>
                        </Tooltip>
                      }
                      labelPlacement="outside-top"
                      id="password"
                      classNames={{
                        inputWrapper: cn(
                          errors.password
                            ? "border-red-500 "
                            : "border-slate-300",
                          "border !max-h-8 min-h-9 bg-white rounded-md hover:!bg-transparent  data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                        ),
                        label: "text-slate-400",
                        input:
                          "focus:outline-none focus:ring-0 !text-slate-500",
                      }}
                      type={isPasswordVisible ? "text" : "password"}
                    />
                    {errors?.password?.message && (
                      <span className="mt-0.5 text-xs font-medium text-red-500">
                        {errors?.password?.message}
                      </span>
                    )}
                  </label>

                  <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                    Repite la contraseña
                    <Input
                      errorMessage={errors?.repeatPassword?.message}
                      {...register("repeatPassword")}
                      name="repeatPassword"
                      endContent={
                        <Tooltip
                          color="success"
                          className="text-xs text-white"
                          closeDelay={0}
                          content={
                            isPasswordVisible
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          <div className="flex">
                            <EyeIcon
                              onClick={() =>
                                setIsPasswordVisible(!isPasswordVisible)
                              }
                              className={cn(
                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                !isPasswordVisible && "hidden",
                              )}
                            />
                            <EyeOffIcon
                              onClick={() =>
                                setIsPasswordVisible(!isPasswordVisible)
                              }
                              className={cn(
                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                isPasswordVisible && "hidden",
                              )}
                            />
                          </div>
                        </Tooltip>
                      }
                      labelPlacement="outside-top"
                      id="repeatPassword"
                      classNames={{
                        inputWrapper: cn(
                          errors.repeatPassword
                            ? "border-red-500 "
                            : "border-slate-300",
                          "border !max-h-8 min-h-9 bg-white rounded-md hover:!bg-transparent  data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                        ),
                        label: "text-slate-400",
                        input:
                          "focus:outline-none focus:ring-0 !text-slate-500",
                      }}
                      type={isPasswordVisible ? "text" : "password"}
                    />
                    {errors?.repeatPassword?.message && (
                      <span className="mt-0.5 text-xs font-medium text-red-500">
                        {errors?.repeatPassword?.message}
                      </span>
                    )}
                  </label>

                  <ul className="flex flex-col gap-0.5">
                    {validations.map((validation) => (
                      <li
                        key={validation.text}
                        className={cn(
                          validation.test
                            ? "text-success"
                            : "text-slate-400/80",
                          "relative flex items-center gap-1.5 text-sm transition-all",
                        )}
                      >
                        <CheckIcon
                          className={cn(
                            validation.test ? "opacity-100" : "opacity-0",
                            "absolute top-0.5 size-3.5 min-w-3.5 transition-all",
                          )}
                        />
                        <CircleDashedIcon
                          className={cn(
                            !validation.test ? "opacity-100" : "opacity-0",
                            "absolute top-0.5 size-3.5 min-w-3.5 transition-all",
                          )}
                        />
                        <span className="ml-5">{validation.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* <Input
                placeholder=" "
                label={
                  <label className="text-xs font-medium text-green-700">
                    Seleccionar rol
                  </label>
                }
                labelPlacement="outside"
                className="w-full text-slate-400"
                classNames={{
                  input:
                    "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                  mainWrapper: "w-full max-w-full focus-within:border-primary",
                  inputWrapper: "focus-within:!border-primary border",
                  base: "outline-none",
                }}
                type="text"
                value={"Empleado"}
                radius="sm"
                variant={"bordered"}
              /> */}
                {/* {mutation?.isError && (
                <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                  <AlertCircleIcon className="size-8 min-w-8 text-red-500" />
                  <p className="text-sm font-medium text-red-500">
                    {mutation?.error?.code === "connection-error"
                      ? "Ha ocurrido un error de conexión"
                      : "Ha ocurrido un error en el servidor"}
                  </p>
                </div>
              )} */}

                {mutation.isError && (
                  <ErrorForm errorMessage={mutation.error} />
                )}
              </ModalBody>
              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={hasValidationError || mutation.isLoading}
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
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

export function UpdateUserModal({
  isOpen,
  onClose,
  user,
  isOnboarding,
}: ModalProps & { user: UsersByOrganization; isOnboarding?: boolean }) {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  console.log(user);

  const rolesQuery = useQuery<
    Awaited<ReturnType<typeof getRoles>>,
    ServerError
  >({
    queryFn: withCbk({
      queryFn: () => getRoles(),
      onSuccess: (data) => {
        const roleID = data?.find((role) => role.id === user.role.id)?.id;

        if (roleID) setValue("role_id", roleID);
      },
    }),
    queryKey: ["roles", "all"],
    enabled: !isOnboarding,
  });

  const {
    watch,
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<Input>({
    resolver: zodResolver(inputSchema(!!isOnboarding)),
    defaultValues: {
      email: user.email,
      name: user.name,
      role_id: user.role.id,
      password: "",
      repeatPassword: "",
      needsResetPassword: false,
    },
  });

  const mutation = useMutation<void, ServerError, Input>({
    mutationFn: async (body) => {
      console.log(body);
      const { data } = await AxiosFetch.put(`/api/user/${user.id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users-organization"],
      });
      onClose();
    },
  });

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);

  const validations = [
    { test: watch("password").length >= 8, text: "Al menos 8 carácteres" },
    { test: /[0-9]/.test(watch("password")), text: "Al menos un número" },
    { test: /[A-Z]/.test(watch("password")), text: "Al menos una mayúscula" },
  ];

  const hasValidationError = validations.some((testing) => !testing?.test);
  const isModifyPasswordOpen = watch("needsResetPassword");

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="3xl">
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <UserRoundPenIcon className="size-8 min-w-8 text-slate-400" />
              <div className="flex w-fit flex-col justify-center">
                <p className="text-lg text-slate-500">Modificar miembro</p>
              </div>
            </ModalHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody>
                <div className="flex items-center gap-2">
                  <div className="flex w-full flex-col gap-1">
                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Nombre
                      <input
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                          errors.name && "border-red-500",
                        )}
                        type="text"
                        {...register("name")}
                      />
                    </label>

                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-1">
                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Correo eléctronico
                      <input
                        className={cn(
                          "flex h-9 w-full items-center gap-2 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-primary",
                          errors.email && "border-red-500",
                        )}
                        type="email"
                        {...register("email")}
                      />
                    </label>

                    {errors.email && (
                      <p className="text-xs font-medium text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="flex w-full flex-col gap-1">
                  <label htmlFor="Role" className="text-sm text-slate-500">
                    Role
                  </label>

                  {rolesQuery.isFetching ? (
                    <div className="h-9 w-full animate-pulse rounded-lg bg-slate-200" />
                  ) : user.isOwner ? (
                    <div className="flex flex-col gap-1">
                      <div className="h-9 rounded-md border border-slate-300 bg-slate-200/50 p-2 text-sm text-slate-500 opacity-60">
                        {user.role.name}
                      </div>

                      <span className="pl-1 text-xs text-slate-400">
                        No se puede modificar el rol del dueño del sistema
                      </span>
                    </div>
                  ) : (
                    <Controller
                      name="role_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          selectedKeys={
                            field.value != null
                              ? new Set([String(field.value)])
                              : new Set()
                          }
                          placeholder="Selecciona un rol"
                          aria-label="filters"
                          classNames={{
                            innerWrapper: "rounded-md ",
                            mainWrapper: "rounded-md",
                            popoverContent: "rounded-md font-normal",
                            trigger:
                              "hover:!bg-white hover:!border-primary rounded-md bg-white !h-9 min-h-7",
                            value: "!text-slate-500",
                          }}
                          className={cn(
                            errors.role_id?.message && "!border-red-500",

                            "min-h-9 rounded-md border border-slate-300 outline-none",
                          )}
                          //  selectedKeys={new Set([selected.name])}
                          onSelectionChange={(key) => {
                            if (key.currentKey) field.onChange(+key.currentKey);
                          }}
                        >
                          {rolesQuery.data
                            ? rolesQuery.data?.map((filter) => (
                                <SelectItem
                                  key={String(filter.id)}
                                  textValue={filter.name}
                                  classNames={{
                                    base: "hover:!bg-black/5 rounded-md  data-[selectable=true]:focus:bg-black/5 data-[selectable=true]:focus:text-slate-500 !gap-2 ",
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <span className="text-sm">{filter.name}</span>{" "}
                                </SelectItem>
                              ))
                            : []}
                        </Select>
                      )}
                    />
                  )}
                  {errors.role_id && (
                    <p className="text-xs font-medium text-red-500">
                      {errors.role_id.message}
                    </p>
                  )}
                </div>

                <div
                  className={cn(
                    isModifyPasswordOpen
                      ? "gap-3 bg-slate-300/20 py-2"
                      : "gap-0",
                    "justify-center-center flex w-full flex-col rounded-md px-2.5",
                  )}
                >
                  <Controller
                    name="needsResetPassword"
                    render={({ field }) => (
                      <Checkbox
                        aria-label={user.name}
                        isSelected={field.value ?? false}
                        onValueChange={(e) => field.onChange(e)}
                        radius="lg"
                        className="text-sm"
                        classNames={{
                          label: " text-slate-500 text-sm",
                          base: "rounded-md",
                          wrapper: " rounded-md",
                        }}
                        defaultSelected
                      >
                        {" "}
                        ¿Deseas modificar la contraseña?
                      </Checkbox>
                    )}
                    control={control}
                  />

                  <div
                    className={cn(
                      isModifyPasswordOpen ? "h-56" : "h-0",
                      "flex w-full flex-col gap-2 overflow-hidden transition-all",
                    )}
                  >
                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Nueva contraseña
                      <Input
                        errorMessage={errors?.password?.message}
                        {...register("password")}
                        name="password"
                        endContent={
                          <Tooltip
                            color="success"
                            className="text-xs text-white"
                            closeDelay={0}
                            content={
                              isPasswordVisible
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                          >
                            <div className="flex">
                              <EyeIcon
                                onClick={() =>
                                  setIsPasswordVisible(!isPasswordVisible)
                                }
                                className={cn(
                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                  !isPasswordVisible && "hidden",
                                )}
                              />
                              <EyeOffIcon
                                onClick={() =>
                                  setIsPasswordVisible(!isPasswordVisible)
                                }
                                className={cn(
                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                  isPasswordVisible && "hidden",
                                )}
                              />
                            </div>
                          </Tooltip>
                        }
                        labelPlacement="outside-top"
                        id="password"
                        classNames={{
                          inputWrapper: cn(
                            errors.password
                              ? "border-red-500 "
                              : "border-slate-300",
                            "border !max-h-8 min-h-9 bg-white rounded-md hover:!bg-transparent  data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                          ),
                          label: "text-slate-400",
                          input:
                            "focus:outline-none focus:ring-0 !text-slate-500",
                        }}
                        type={isPasswordVisible ? "text" : "password"}
                      />
                      {errors?.password?.message && (
                        <span className="mt-0.5 text-xs font-medium text-red-500">
                          {errors?.password?.message}
                        </span>
                      )}
                    </label>

                    <label className="flex w-full flex-col gap-1 text-sm text-slate-500">
                      Repite la contraseña
                      <Input
                        errorMessage={errors?.repeatPassword?.message}
                        {...register("repeatPassword")}
                        name="repeatPassword"
                        endContent={
                          <Tooltip
                            color="success"
                            className="text-xs text-white"
                            closeDelay={0}
                            content={
                              isPasswordVisible
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                          >
                            <div className="flex">
                              <EyeIcon
                                onClick={() =>
                                  setIsPasswordVisible(!isPasswordVisible)
                                }
                                className={cn(
                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                  !isPasswordVisible && "hidden",
                                )}
                              />
                              <EyeOffIcon
                                onClick={() =>
                                  setIsPasswordVisible(!isPasswordVisible)
                                }
                                className={cn(
                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                  isPasswordVisible && "hidden",
                                )}
                              />
                            </div>
                          </Tooltip>
                        }
                        labelPlacement="outside-top"
                        id="repeatPassword"
                        classNames={{
                          inputWrapper: cn(
                            errors.repeatPassword
                              ? "border-red-500 "
                              : "border-slate-300",
                            "border !max-h-8 min-h-9 bg-white rounded-md hover:!bg-transparent  data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                          ),
                          label: "text-slate-400",
                          input:
                            "focus:outline-none focus:ring-0 !text-slate-500",
                        }}
                        type={isPasswordVisible ? "text" : "password"}
                      />
                      {errors?.repeatPassword?.message && (
                        <span className="mt-0.5 text-xs font-medium text-red-500">
                          {errors?.repeatPassword?.message}
                        </span>
                      )}
                    </label>

                    <ul className="flex flex-col gap-0.5">
                      {validations.map((validation) => (
                        <li
                          key={validation.text}
                          className={cn(
                            validation.test
                              ? "text-success"
                              : "text-slate-400/80",
                            "relative flex items-center gap-1.5 text-sm transition-all",
                          )}
                        >
                          <CheckIcon
                            className={cn(
                              validation.test ? "opacity-100" : "opacity-0",
                              "absolute top-0.5 size-3.5 min-w-3.5 transition-all",
                            )}
                          />
                          <CircleDashedIcon
                            className={cn(
                              !validation.test ? "opacity-100" : "opacity-0",
                              "absolute top-0.5 size-3.5 min-w-3.5 transition-all",
                            )}
                          />
                          <span className="ml-5">{validation.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {mutation.isError && (
                  <ErrorForm errorMessage={mutation.error} />
                )}
              </ModalBody>
              <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                <Button
                  isLoading={mutation?.isLoading}
                  disabled={
                    (hasValidationError && isModifyPasswordOpen) ||
                    mutation.isLoading
                  }
                  type="submit"
                  variant="success"
                  className="w-full"
                >
                  Confirmar
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
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

export function DeleteMemberModal({
  isOpen,
  onClose,
  user,
}: ModalProps & { user: UsersByOrganization }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(`/api/user/${user.id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users-organization"],
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
                <span className="text-xl text-danger">Eliminar miembro</span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro quer quieres eliminar el miembro{" "}
                  <b>{user.name}</b>?
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
                disabled={mutation?.isLoading}
                onClick={() => mutation.mutate()}
                type="submit"
                variant="error"
              >
                Eliminar
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
