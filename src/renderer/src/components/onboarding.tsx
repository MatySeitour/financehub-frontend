import { Checkbox, Input, Tooltip } from "@heroui/react";
import { cn } from "@renderer/utils";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CircleCheckBigIcon,
  CircleDashedIcon,
  EyeIcon,
  EyeOffIcon,
  SquarePenIcon,
  Trash2Icon,
  UserPlus2Icon,
} from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "./Button";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { ServerError, User } from "@renderer/utils/types";
import axios from "@renderer/hooks/axios";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorForm } from "./ErrorMessage";
import { useState } from "react";
import {
  getUsersOrganization,
  UsersByOrganization,
} from "@renderer/hooks/user";
import {
  CreateUserModal,
  DeleteMemberModal,
  UpdateUserModal,
} from "./modals/onboarding";
import { useNavigate } from "react-router";

type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
  name: z.string(),
});
export function StepOne({
  organization,
  nextStep,
}: {
  organization?: { id: number; name: string };
  nextStep: (step) => void;
}) {
  const {
    formState: { errors },
    register,
    handleSubmit,
    watch,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      name: organization?.name,
    },
  });

  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, Input>({
    mutationFn: async (body) => {
      if (organization) {
        const { data } = await AxiosFetch.put(
          `/api/organization/${organization.id}`,
          body,
        );
        return data;
      } else {
        const { data } = await AxiosFetch.post(
          `/api/create-organization`,
          body,
        );
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-step", "all"] });
      nextStep(2);
    },
  });

  const onSubmit: SubmitHandler<Input> = (data) => mutation.mutate(data);

  const sameData = organization?.name === watch("name");

  return (
    <motion.section
      animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.2 } }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
      className="relative flex h-full w-full flex-col gap-4 pl-16 pt-10"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-3xl font-semibold text-slate-500">
          Crea tu organización
        </h3>

        <p className="text-lg text-slate-400/70">
          Dale identidad a tu organización
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <label className="flex flex-col gap-0.5 text-sm text-slate-400">
          Organización
          <Input
            errorMessage={errors.name?.message}
            {...register("name")}
            name="name"
            labelPlacement="outside-top"
            id="name"
            placeholder=" "
            className="focus:outline-none focus:ring-0 focus-visible:ring-0"
            classNames={{
              inputWrapper: cn(
                errors.name ? "border-red-500 " : "border-slate-300/60",
                "border !bg-slate-100 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 max-w-2xl data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
              ),
              label: "text-slate-400",
              input: "focus:outline-none focus:ring-0 !text-slate-500",
            }}
            type="string"
          />
          {errors?.name?.message && (
            <span className="text-xs font-medium text-red-500">
              {errors?.name?.message}
            </span>
          )}
        </label>

        {mutation.isError && (
          <div className="max-w-2xl">
            <ErrorForm errorMessage={mutation.error} />
          </div>
        )}
        <div className="flex w-full max-w-2xl justify-end">
          <Button
            onClick={() => {
              if (sameData) nextStep(2);
            }}
            isLoading={mutation.isLoading}
            type={sameData ? "button" : "submit"}
            disabled={!watch("name") || mutation.isLoading}
            className="gap-1"
            variant="success"
          >
            Siguiente paso
            <ArrowRightIcon className="size-4 min-w-4" />
          </Button>
        </div>
      </form>
    </motion.section>
  );
}

type InputSecontStep = z.infer<typeof inputSecondSchema>;
const inputSecondSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    password: z.string(),
    repeatPassword: z.string(),
    needsResetPassword: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.needsResetPassword && val.password !== val.repeatPassword) {
      console.log(val.needsResetPassword);
      return ctx.addIssue({
        message: "Las contraseñas no coinciden",
        path: ["repeatPassword"],
        code: "custom",
      });
    }
  });
export function StepTwo({
  user,
  nextStep,
}: {
  user: Pick<User, "email" | "name">;
  nextStep: (step) => void;
  organization?: { id: number; name: string };
  currentStep: number;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const {
    formState: { errors },
    register,
    handleSubmit,
    control,
    watch,
  } = useForm<InputSecontStep>({
    resolver: zodResolver(inputSecondSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: "",
      repeatPassword: "",
      needsResetPassword: false,
    },
  });

  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, InputSecontStep>({
    mutationFn: async (body: InputSecontStep) => {
      const { data } = await AxiosFetch.post("/api/second-step-organization", {
        name: body.name,
        email: body.email,
        password: body.password,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      nextStep(3);
    },
  });

  const onSubmit: SubmitHandler<InputSecontStep> = (data) =>
    mutation.mutate(data);

  const validations = [
    { test: watch("password").length >= 8, text: "Al menos 8 carácteres" },
    { test: /[0-9]/.test(watch("password")), text: "Al menos un número" },
    { test: /[A-Z]/.test(watch("password")), text: "Al menos una mayúscula" },
  ];

  const hasValidationError = validations.some((testing) => !testing?.test);
  const isModifyPasswordOpen = watch("needsResetPassword");

  return (
    <motion.section
      animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.2 } }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
      className="relative flex h-full w-full flex-col gap-6 pl-16 pt-10"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-3xl font-semibold text-slate-500">
          Tus credenciales
        </h3>

        <p className="text-lg text-slate-400/70">
          Configura los datos de tu cuenta
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-3"
      >
        <div className="flex w-full items-center gap-4">
          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-400">
            Nombre de usuario
            <Input
              errorMessage={errors.name?.message}
              {...register("name")}
              name="name"
              labelPlacement="outside-top"
              id="name"
              placeholder=" "
              className="focus:outline-none focus:ring-0 focus-visible:ring-0"
              classNames={{
                inputWrapper: cn(
                  errors.name ? "border-red-500 " : "border-slate-300/60",
                  "border !bg-slate-100 min-w-56 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 w-full data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                ),
                label: "text-slate-400",
                input: "focus:outline-none focus:ring-0 !text-slate-500",
              }}
              type="string"
            />
            {errors?.name?.message && (
              <span className="mt-0.5 text-xs font-medium text-red-500">
                {errors?.name?.message}
              </span>
            )}
          </label>

          <label className="flex w-full flex-col gap-0.5 text-sm text-slate-400">
            Correo eléctronico
            <Input
              errorMessage={errors.email?.message}
              {...register("email")}
              name="email"
              labelPlacement="outside-top"
              id="email"
              placeholder=" "
              className="focus:outline-none focus:ring-0 focus-visible:ring-0"
              classNames={{
                inputWrapper: cn(
                  errors.email ? "border-red-500 " : "border-slate-300/60",
                  "border !bg-slate-100 rounded-md min-w-56 hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 w-full data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                ),
                label: "text-slate-400",
                input: "focus:outline-none focus:ring-0 !text-slate-500",
              }}
              type="string"
            />
            {errors?.email?.message && (
              <span className="mt-0.5 text-xs font-medium text-red-500">
                {errors?.email?.message}
              </span>
            )}
          </label>
        </div>

        <div
          className={cn(
            "justify-center-center flex w-full flex-col gap-3 rounded-md px-2.5",
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
              "flex flex-col gap-2 overflow-hidden transition-all",
            )}
          >
            <label className="flex w-full flex-col gap-0.5 text-sm text-slate-400">
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
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className={cn(
                          "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                          !isPasswordVisible && "hidden",
                        )}
                      />
                      <EyeOffIcon
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
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
                    errors.password ? "border-red-500 " : "border-slate-300/60",
                    "border !bg-slate-100 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                  ),
                  label: "text-slate-400",
                  input: "focus:outline-none focus:ring-0 !text-slate-500",
                }}
                type={isPasswordVisible ? "text" : "password"}
              />
              {errors?.password?.message && (
                <span className="mt-0.5 text-xs font-medium text-red-500">
                  {errors?.password?.message}
                </span>
              )}
            </label>

            <label className="flex w-full flex-col gap-0.5 text-sm text-slate-400">
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
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className={cn(
                          "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                          !isPasswordVisible && "hidden",
                        )}
                      />
                      <EyeOffIcon
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
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
                      : "border-slate-300/60",
                    "border !bg-slate-100 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                  ),
                  label: "text-slate-400",
                  input: "focus:outline-none focus:ring-0 !text-slate-500",
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
                    validation.test ? "text-success" : "text-slate-400/80",
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
          <div className="max-w-2xl">
            <ErrorForm errorMessage={mutation.error} />
          </div>
        )}

        <div className="flex w-full max-w-2xl justify-end gap-4">
          <Button
            // disabled={hasValidationError || mutation.isLoading}
            // isLoading={mutation.isLoading}
            onClick={() => nextStep(1)}
            type="button"
            className="gap-1"
            variant="outline"
          >
            <ArrowLeftIcon className="size-4 min-w-4" />
            Paso anterior
          </Button>

          <Button
            disabled={
              (hasValidationError && isModifyPasswordOpen) || mutation.isLoading
            }
            isLoading={mutation.isLoading}
            type="submit"
            className="gap-1"
            variant="success"
          >
            Siguiente paso
            <ArrowRightIcon className="size-4 min-w-4" />
          </Button>
        </div>
      </form>
    </motion.section>
  );
}

export function StepThree({
  session,
  nextStep,
}: {
  session: Pick<User, "email" | "name" | "id">;

  organization?: { id: number; name: string };
  nextStep: (step) => void;
}) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isCreateMemberModalOpen, setIsCreateMemberModalOpen] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState<UsersByOrganization>();
  const [memberToDelete, setMemberToDelete] = useState<UsersByOrganization>();

  const usersOrganizationQuery = useQuery<
    Awaited<ReturnType<typeof getUsersOrganization>>,
    ServerError
  >({
    queryKey: ["users-organization", "all"],
    queryFn: () => getUsersOrganization(),
    retry: false,

    refetchOnWindowFocus: false,
  });

  const mutationCompleteSteps = useMutation<void, ServerError>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.post(`/api/third-step-organization`);
      return data?.data?.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-step"] });
      nextStep(4);

      setTimeout(() => {
        navigate("/home");
      }, 5000);
    },
  });

  return (
    <motion.section
      animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.2 } }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
      className="relative flex h-full w-full flex-col gap-4 pl-16 pt-10"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-3xl font-semibold text-slate-500">
            Miembros de tu organización
          </h3>

          <p className="text-lg text-slate-400/70">
            Agrega los usuarios de tu organización
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-end">
            <Button
              onClick={() => setIsCreateMemberModalOpen(true)}
              type="button"
              variant="success"
              className="gap-1.5"
            >
              <UserPlus2Icon className="size-4 min-w-4 -translate-y-px" />
              Agregar usuario
            </Button>
          </div>
          <div className="h-72 w-full overflow-y-auto">
            <ul className="flex flex-col items-center gap-4">
              {usersOrganizationQuery.data?.map((user) => {
                const firstLetter = user.name.split(" ")[0][0];
                const currentUser = session.id === user.id;

                const secondLetter =
                  user.name.split(" ")[1] !== undefined
                    ? user.name.split(" ")[1][0]
                    : user.name.split(" ")[0][1];

                return (
                  <li
                    key={user.id}
                    className="flex w-full items-center justify-between overflow-hidden rounded-md border-slate-300/70 bg-[#FCFCFC] bg-gradient-to-br from-transparent via-transparent to-slate-100 p-3 shadow"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 p-2">
                        <span className="font-medium uppercase text-primary">
                          {firstLetter}
                          {secondLetter}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-400">
                          {user.name} {currentUser && "(Tú)"}
                        </span>
                        <span className="text-sm text-slate-300">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {!currentUser && (
                      <div className="flex items-center gap-4 text-slate-400/50">
                        <SquarePenIcon
                          onClick={() => setMemberToUpdate(user)}
                          className="size-5 min-w-5 translate-y-px cursor-pointer transition-all hover:text-slate-400"
                        />
                        <Trash2Icon
                          onClick={() => setMemberToDelete(user)}
                          className="size-5 min-w-5 cursor-pointer transition-all hover:text-danger"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {mutationCompleteSteps.isError && (
          <div className="max-w-2xl">
            <ErrorForm errorMessage={mutationCompleteSteps.error} />
          </div>
        )}

        <div className="flex w-full max-w-2xl justify-end gap-4">
          <Button
            onClick={() => nextStep(2)}
            type="button"
            className="gap-1"
            variant="outline"
          >
            <ArrowLeftIcon className="size-4 min-w-4" />
            Paso anterior
          </Button>
          <Button
            onClick={() => mutationCompleteSteps.mutate()}
            disabled={mutationCompleteSteps.isLoading}
            isLoading={mutationCompleteSteps.isLoading}
            type="button"
            className="gap-1"
            variant="success"
          >
            <CircleCheckBigIcon className="size-4 min-w-4" />
            Finalizar
          </Button>
        </div>
      </div>

      {isCreateMemberModalOpen && (
        <CreateUserModal
          isOpen={isCreateMemberModalOpen}
          onClose={() => setIsCreateMemberModalOpen(false)}
        />
      )}

      {memberToUpdate && (
        <UpdateUserModal
          user={memberToUpdate}
          isOpen={!!memberToUpdate}
          onClose={() => setMemberToUpdate(undefined)}
        />
      )}

      {memberToDelete && (
        <DeleteMemberModal
          user={memberToDelete}
          isOpen={!!memberToDelete}
          onClose={() => setMemberToDelete(undefined)}
        />
      )}
    </motion.section>
  );
}
