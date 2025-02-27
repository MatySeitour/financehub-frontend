import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { useMediaQueries, mqs } from "@renderer/hooks/useMediaQueries";
import {
  getCurrentStep,
  getUsersOrganization,
  RegisterUser,
  registerUserSchema,
  User,
  UsersByOrganization,
  userSchema,
} from "@renderer/hooks/user";
import { cn, errorsResponse } from "@renderer/utils";
import { ServerError } from "@renderer/utils/types";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaCheck,
  FaCheckCircle,
  FaInfoCircle,
  FaRegTrashAlt,
  FaUserCircle,
  FaUserEdit,
} from "react-icons/fa";
import {
  FaCircleInfo,
  FaEllipsis,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaUserPlus,
  FaXmark,
} from "react-icons/fa6";
import { IoIosWarning, IoMdCheckmark } from "react-icons/io";
import {
  MdError,
  MdHomeFilled,
  MdModeEdit,
  MdOutlineError,
} from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { z } from "zod";
import { Chip } from "../Chip";
import { Link } from "react-router";

type OrganizationName = z.infer<typeof organizationNameSchema>;
const organizationNameSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Debe tener al menos 3 caracteres" })
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñ]+$/, { message: "Solo se permiten letras" }),
});

type FirstStepResponse = {
  success: boolean;
  message: string;
  data: {
    organization: {
      name: string;
      step: number;
    };
    user: { name: string; email: string };
  };
};

const rolesColors = new Map([
  ["admin", "#1C9"],
  ["empleado", "#06F"],
]);

const userDefaultValue = {
  id: undefined,
  email: "",
  password: "",
  name: "",
  role_id: undefined,
};

export default function OrganizationOnboarding() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const mq = useMediaQueries();

  const [currentStep, setCurrentStep] = useState(1);
  const [usersOrganization, setUsersOrganization] =
    useState<UsersByOrganization[]>();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const addUserOptions = useDisclosure();
  const updateUserOptions = useDisclosure();
  const deleteUserOptions = useDisclosure();

  const [memberData, setMemberData] = useState<
    UsersByOrganization | undefined
  >();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationName>({
    resolver: zodResolver(organizationNameSchema),
  });

  const stepTwo = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
  });
  const stepThreeForm = useForm<User>({
    resolver: zodResolver(userSchema),
    defaultValues: userDefaultValue,
  });

  const password =
    currentStep === 2
      ? stepTwo.watch("password", "")
      : stepThreeForm.watch("password", "");

  const validations = [
    { test: password.length >= 8, text: "Al menos 8 carácteres" },
    { test: /[0-9]/.test(password), text: "Al menos un número" },
    { test: /[A-Z]/.test(password), text: "Al menos una mayúscula" },
  ];

  const currentStepQuery = useQuery<
    Awaited<ReturnType<typeof getCurrentStep>>,
    ServerError
  >({
    queryKey: ["current-step"],
    queryFn: () => getCurrentStep(),
    onSuccess: (data) => {
      setCurrentStep(data?.step ?? 1);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const usersOrganizationQuery = useQuery<
    Awaited<ReturnType<typeof getUsersOrganization>>,
    ServerError
  >({
    queryKey: ["users-organization"],
    queryFn: () => getUsersOrganization(),
    enabled: currentStep === 3 && !!currentStep,
    retry: false,
    onSuccess: (data) => {
      setUsersOrganization(data || []);
    },
    refetchOnWindowFocus: false,
  });

  const mutationFirstStep = useMutation<
    FirstStepResponse,
    ServerError,
    OrganizationName
  >({
    mutationFn: async (organization: OrganizationName) => {
      try {
        const { data } = await AxiosFetch.post(
          `/api/create-organization`,
          organization,
        );
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: (data: FirstStepResponse) => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      setCurrentStep(data?.data?.organization?.step);
      stepTwo?.setValue("name", data?.data?.user?.name);
      stepTwo?.setValue("email", data?.data?.user?.email);
    },
  });

  const mutationSecondStep = useMutation<
    FirstStepResponse,
    ServerError,
    RegisterUser
  >({
    mutationFn: async (user: RegisterUser) => {
      try {
        const { data } = await AxiosFetch.post(
          "/api/second-step-organization",
          user,
        );
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: (data: FirstStepResponse) => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      setCurrentStep(data?.data?.organization?.step);
    },
  });

  const mutationCreateMember = useMutation<void, ServerError, User>({
    mutationFn: async (user: User) => {
      try {
        const { data } = await AxiosFetch.post(
          `/api/organization-add-user`,
          user,
        );
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-organization"] });
      addUserOptions.onClose();
    },
  });

  const mutationUpdateUser = useMutation<void, ServerError, User>({
    mutationFn: async (user: User) => {
      try {
        const { data } = await AxiosFetch.put(`/api/update-user`, user);
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-organization"] });
      updateUserOptions.onClose();
      stepThreeForm.reset(userDefaultValue);
    },
  });

  const mutationDeleteUser = useMutation<void, ServerError, number>({
    mutationFn: async (userID: number) => {
      try {
        const { data } = await AxiosFetch.delete(`/api/delete-user/${userID}`);
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-organization"] });
      deleteUserOptions.onClose();
    },
  });

  const mutationCompleteSteps = useMutation<OrganizationName, ServerError>({
    mutationFn: async () => {
      try {
        const { data } = await AxiosFetch.post(`/api/third-step-organization`);
        return data?.data?.organization;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-step"] });
      setCurrentStep(4);
    },
  });

  const firstStep = (data: OrganizationName) => {
    mutationFirstStep.mutate(data);
  };
  const secondStep = (data: RegisterUser) => {
    mutationSecondStep.mutate(data);
  };
  const threeStep = (data: User) => {
    mutationCreateMember.mutate(data);
  };
  const updateUser = (data: User) => {
    mutationUpdateUser.mutate(data);
  };
  const deleteUser = () => {
    if (memberData?.id) mutationDeleteUser.mutate(memberData?.id);
  };

  const hasValidationError = validations.some((testing) => !testing?.test);

  return (
    <article className="relative flex h-screen w-full overflow-hidden bg-gradient-to-tr from-slate-200 via-slate-50 to-slate-200">
      <div className="after:background-onboarding onboarding-title relative flex h-full w-full justify-center gap-4 after:absolute after:top-0 after:z-10 after:h-28 after:w-full">
        {mq != 0 && (
          <div className="flex h-full w-full flex-col items-center gap-10">
            <AnimatePresence>
              {currentStep <= 3 ? (
                <motion.div
                  exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
                  className="relative flex w-auto flex-col items-center justify-center gap-8 pt-28"
                >
                  <div className="relative z-20 flex items-center text-4xl font-medium text-slate-600 2xl:text-4xl">
                    <motion.p
                      className=""
                      transition={{ delay: 1.4 }}
                      initial={{ opacity: 0 }}
                      animate={
                        !currentStepQuery?.isLoading &&
                        !currentStepQuery?.isFetching &&
                        !mutationCompleteSteps.isSuccess && { opacity: 1 }
                      }
                    >
                      Te damos la bienvenida a{" "}
                    </motion.p>
                    <div className="flex flex-col">
                      <motion.b
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        initial={{
                          translateY: 200,
                          opacity: 0,
                          x: mq != 0 && mq < mqs.xxl ? 0 : -200,
                        }}
                        animate={
                          (currentStepQuery?.isLoading ||
                            currentStepQuery?.isFetching) &&
                          !mutationCompleteSteps.isSuccess &&
                          mq != 0
                            ? {
                                opacity: 1,
                                scale: [1.5, 1.5],
                                x: mq != 0 && mq < mqs.xxl ? 0 : -200,
                              }
                            : {
                                opacity: 1,
                                scale: [1.5, 1.5, 1],
                                translateY: [200, 200, 0],
                                x: [
                                  mq != 0 && mq < mqs.xxl ? 0 : -200,
                                  mq != 0 && mq < mqs.xxl ? 0 : -200,
                                  8,
                                ],
                              }
                        }
                        className="onboarding-text inline-block"
                      >
                        {" "}
                        Financehub
                      </motion.b>
                      <AnimatePresence>
                        {(currentStepQuery?.isLoading ||
                          currentStepQuery?.isFetching) &&
                          !mutationCompleteSteps.isSuccess && (
                            <motion.div
                              transition={{ delay: 0.5 }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{
                                opacity: 0,
                                transition: { duration: 0.2, delay: 0 },
                              }}
                              className={cn(
                                "flex h-full w-full translate-y-[220px] items-center justify-center",
                                mq != 0 && mq > mqs.xxl && "-translate-x-full",
                              )}
                            >
                              <span className="relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 border-primary border-b-primary/20 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {!currentStepQuery?.isLoading &&
                    !currentStepQuery?.isFetching &&
                    !mutationCompleteSteps.isSuccess && (
                      <motion.p
                        transition={{ delay: 1.6 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-medium text-slate-400"
                      >
                        Completa los siguientes pasos para poder empezar a
                        gestionar nuestro servicio
                      </motion.p>
                    )}
                </motion.div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    transition={{ delay: 0.5 }}
                    initial={{ opacity: 0 }}
                    animate={currentStep > 3 && { opacity: 1 }}
                    className="h-full w-full"
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center gap-12">
                      <p className="text-4xl font-medium text-slate-600">
                        Bienvenido{" "}
                        <b className="onboarding-text inline-block">
                          {mutationCompleteSteps?.data?.name}
                        </b>
                      </p>
                      <div className="flex flex-col items-center gap-6">
                        <p className="text-xl font-medium text-slate-500">
                          Ya pódes empezar a disfrutar de nuestro servicio
                        </p>
                        <Link to={"/home"}>
                          <Button
                            color="success"
                            className="rounded-md text-white"
                          >
                            <MdHomeFilled className="size-6 min-w-6" />
                            Ir a dashboard
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </AnimatePresence>

            {/* Error current step  */}
            {currentStepQuery?.isError && (
              <motion.div
                transition={{ delay: 1.8 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full w-full items-start justify-center"
              >
                <div className="flex h-64 w-full max-w-2xl flex-col items-center justify-center gap-6 px-4">
                  <MdError className="size-16 min-w-16 text-red-500" />
                  <p className="text-xl font-medium text-red-500">
                    {currentStepQuery?.error?.code === "connection-error"
                      ? "Ha ocurrido un error de conexión"
                      : "Ha ocurrido un error en el servidor"}
                  </p>
                </div>
              </motion.div>
            )}

            {currentStep <= 3 && !currentStepQuery?.isError && (
              <AnimatePresence>
                <motion.div
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.2, delay: 0 },
                  }}
                  className="relative h-full w-full"
                >
                  {!currentStepQuery?.isLoading &&
                    !currentStepQuery?.isFetching &&
                    !mutationCompleteSteps.isSuccess && (
                      <AnimatePresence>
                        {/* Step one */}
                        {currentStep === 1 && (
                          <motion.form
                            exit={{ opacity: 0, y: -100 }}
                            onSubmit={handleSubmit(firstStep)}
                            className="absolute top-0 flex h-full w-full items-start justify-center"
                          >
                            {!currentStepQuery?.isLoading &&
                              !currentStepQuery?.isFetching && (
                                <motion.div
                                  transition={{ delay: 1.8 }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex h-auto min-h-72 w-full max-w-2xl flex-col justify-between gap-10 rounded-md border-8 border-slate-200/60 bg-white p-4"
                                >
                                  <div className="flex flex-col gap-6">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 p-1 pr-1.5 text-primary">
                                        <p className="text-xl">1</p>
                                      </div>
                                      <p className="font-semibold text-slate-500">
                                        Escribe el nombre de tu organización
                                      </p>
                                    </div>
                                    <Input
                                      isInvalid={
                                        errors?.name?.message ? true : false
                                      }
                                      {...register("name")}
                                      placeholder="Ej: Microsoft"
                                      className="w-full text-slate-400 placeholder:text-slate-300"
                                      classNames={{
                                        input:
                                          "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                        mainWrapper:
                                          "w-full max-w-full focus-within:border-primary",
                                        inputWrapper:
                                          "focus-within:!border-primary border",
                                        base: "outline-none",
                                      }}
                                      type="text"
                                      radius="sm"
                                      variant={"bordered"}
                                    />
                                    <div
                                      className={cn(
                                        "flex h-auto w-full items-center gap-2 rounded-md bg-slate-300/40 p-2 transition-colors",
                                        errors?.name && "bg-red-500/20",
                                      )}
                                    >
                                      <FaInfoCircle
                                        className={cn(
                                          "size-5 min-w-5 text-slate-400 transition-colors",
                                          errors?.name && "text-red-500",
                                        )}
                                      />
                                      <p
                                        className={cn(
                                          "text-sm text-slate-400 transition-colors",
                                          errors?.name && "text-red-500",
                                        )}
                                      >
                                        El nombre debe contener sólo letras y al
                                        menos 3 carácteres.
                                      </p>
                                    </div>
                                  </div>
                                  {mutationFirstStep?.isError && (
                                    <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                                      <MdError className="size-8 min-w-8 text-red-500" />
                                      <p className="text-sm font-medium text-red-500">
                                        {mutationFirstStep?.error?.code ===
                                        "connection-error"
                                          ? "Ha ocurrido un error de conexión"
                                          : "Ha ocurrido un error en el servidor"}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end">
                                    <Button
                                      disabled={mutationFirstStep.isLoading}
                                      isLoading={mutationFirstStep.isLoading}
                                      type="submit"
                                      color="primary"
                                      radius="sm"
                                    >
                                      Siguiente
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                          </motion.form>
                        )}

                        {/* Step two */}
                        {currentStep === 2 && (
                          <motion.form
                            animate={
                              currentStep === 2 && {
                                opacity: [1, 1],
                                y: [100, 0],
                              }
                            }
                            exit={{ opacity: 0, y: -100 }}
                            onSubmit={stepTwo.handleSubmit(secondStep)}
                            className="absolute top-0 flex h-full w-full items-start justify-center"
                          >
                            {!currentStepQuery?.isLoading &&
                              !currentStepQuery?.isFetching && (
                                <motion.div
                                  transition={{ delay: 1.8 }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex min-h-72 w-full max-w-3xl flex-col justify-between gap-6 rounded-md border-8 border-slate-200/60 bg-white p-4"
                                >
                                  <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 p-1 pr-1.5 text-primary">
                                        <p className="text-xl">2</p>
                                      </div>
                                      <p className="font-semibold text-slate-500">
                                        Modifica tu perfil
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <Input
                                        {...stepTwo.register("name")}
                                        label={
                                          <label className="text-xs font-medium text-primary/90">
                                            Nombre de usuario
                                          </label>
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        defaultValue={
                                          currentStepQuery?.data?.user?.name ??
                                          stepTwo?.getValues("name")
                                        }
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                        }}
                                        type="text"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <Input
                                        {...stepTwo.register("email")}
                                        label={
                                          <label className="text-xs font-medium text-primary/90">
                                            Correo eléctronico
                                          </label>
                                        }
                                        defaultValue={
                                          currentStepQuery?.data?.user?.email ??
                                          stepTwo?.getValues("email")
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                        }}
                                        type="email"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                    </div>
                                    <Input
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
                                            <FaEye
                                              onClick={() =>
                                                setIsPasswordVisible(
                                                  !isPasswordVisible,
                                                )
                                              }
                                              className={cn(
                                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                !isPasswordVisible && "hidden",
                                              )}
                                            />
                                            <FaEyeSlash
                                              onClick={() =>
                                                setIsPasswordVisible(
                                                  !isPasswordVisible,
                                                )
                                              }
                                              className={cn(
                                                "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                isPasswordVisible && "hidden",
                                              )}
                                            />
                                          </div>
                                        </Tooltip>
                                      }
                                      {...stepTwo.register("password")}
                                      label={
                                        <label className="text-xs font-medium text-primary/90">
                                          Contraseña
                                        </label>
                                      }
                                      placeholder="Escribe una contraseña nueva si deseas cambiar la actual"
                                      labelPlacement="outside"
                                      className="w-full text-slate-400"
                                      classNames={{
                                        input:
                                          "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                        mainWrapper:
                                          "w-full max-w-full focus-within:border-primary",
                                        inputWrapper: cn(
                                          "focus-within:!border-primary border",
                                          stepTwo?.watch("password") &&
                                            hasValidationError &&
                                            "border-danger",
                                        ),

                                        base: "outline-none",
                                      }}
                                      type={
                                        isPasswordVisible ? "text" : "password"
                                      }
                                      radius="sm"
                                      variant={"bordered"}
                                    />

                                    <div
                                      className={cn(
                                        "relative flex h-auto w-full items-center gap-2 overflow-hidden rounded-md px-3 py-2 transition-colors",
                                        !stepTwo?.watch("password") &&
                                          "bg-yellow-100/40",
                                        stepTwo?.watch("password") &&
                                          hasValidationError &&
                                          "bg-danger/20",
                                        stepTwo?.watch("password") &&
                                          !hasValidationError &&
                                          "bg-primary/10",
                                      )}
                                    >
                                      {!stepTwo?.watch("password") ? (
                                        <IoIosWarning
                                          className={cn(
                                            "size-6 min-w-6 text-yellow-500 transition-colors",
                                            stepTwo?.formState?.errors?.name &&
                                              "text-red-500",
                                          )}
                                        />
                                      ) : stepTwo?.watch("password") &&
                                        !hasValidationError ? (
                                        <FaCheckCircle
                                          className={cn(
                                            "size-6 min-w-6 text-primary transition-colors",
                                          )}
                                        />
                                      ) : (
                                        <MdOutlineError
                                          className={cn(
                                            "size-6 min-w-6 text-danger transition-colors",
                                          )}
                                        />
                                      )}
                                      <p
                                        className={cn(
                                          "absolute left-12 top-1/2 -translate-y-1/2 text-sm text-yellow-500 transition-all",

                                          stepTwo.watch("password") &&
                                            "-translate-y-44",
                                        )}
                                      >
                                        Escribe una nueva contraseña <b>SOLO</b>{" "}
                                        si deseas cambiar la actual
                                      </p>

                                      <div
                                        className={cn(
                                          "absolute left-12 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-medium text-danger transition-all",
                                          !stepTwo.watch("password") &&
                                            "translate-y-44",
                                          stepTwo?.watch("password") &&
                                            !hasValidationError &&
                                            "text-primary",
                                        )}
                                      >
                                        <p>La contraseña debe tener: </p>
                                        <ul className="flex items-center gap-1">
                                          {validations.map((validation) => (
                                            <li
                                              className="flex items-center gap-0.5 text-xs"
                                              key={validation?.text}
                                            >
                                              {!validation?.test ? (
                                                <FaXmark className="size-3 min-w-3 text-danger/80" />
                                              ) : (
                                                <IoMdCheckmark className="size-3 min-w-3 text-primary" />
                                              )}
                                              <p
                                                className={cn(
                                                  validation?.test &&
                                                    "text-primary",
                                                )}
                                              >
                                                {validation?.text}
                                              </p>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  {mutationSecondStep?.isError && (
                                    <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                                      <MdError className="size-8 min-w-8 text-red-500" />
                                      <p className="text-sm font-medium text-red-500">
                                        {mutationSecondStep?.error?.code ===
                                        "connection-error"
                                          ? "Ha ocurrido un error de conexión"
                                          : "Ha ocurrido un error en el servidor"}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end">
                                    <Button
                                      isDisabled={
                                        mutationSecondStep.isLoading ||
                                        (stepTwo?.watch("password") !== "" &&
                                          stepTwo?.watch("password") !=
                                            undefined &&
                                          hasValidationError)
                                      }
                                      isLoading={mutationSecondStep.isLoading}
                                      type="submit"
                                      color="primary"
                                      radius="sm"
                                    >
                                      Siguiente
                                    </Button>
                                  </div>
                                </motion.div>
                              )}
                          </motion.form>
                        )}

                        {/* Step three */}
                        {currentStep === 3 && (
                          <motion.article
                            animate={
                              currentStep === 3 && {
                                opacity: [1, 1],
                                y: [100, 0],
                              }
                            }
                            exit={{ opacity: 0, y: -100 }}
                            onSubmit={stepTwo.handleSubmit(secondStep)}
                            className="absolute top-0 flex h-full w-full items-start justify-center"
                          >
                            {!currentStepQuery?.isLoading &&
                              !currentStepQuery?.isFetching && (
                                <motion.div
                                  transition={{
                                    delay: mutationSecondStep.isSuccess
                                      ? 0
                                      : 1.8,
                                  }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex h-full max-h-96 min-h-72 w-full max-w-3xl flex-col justify-between gap-2 rounded-md border-8 border-slate-200/60 bg-white p-4"
                                >
                                  <div className="flex h-full flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 p-1 pr-1.5 text-primary">
                                        <p className="text-xl">3</p>
                                      </div>
                                      <div className="flex w-full items-center justify-between">
                                        <div className="flex w-full flex-col items-start justify-center">
                                          <p className="font-semibold text-slate-500">
                                            Miembros de la organización
                                          </p>
                                          <p className="text-xs text-slate-400">
                                            Pódes hacerlo más tarde si lo deseas
                                          </p>
                                        </div>
                                        <Button
                                          onPress={addUserOptions.onOpen}
                                          className="h-8 w-fit min-w-fit rounded-md bg-green-700 px-2 !text-xs text-white"
                                        >
                                          <FaPlus className="size-3 min-w-3 text-white" />
                                          Agregar miembro
                                        </Button>
                                      </div>
                                    </div>
                                    {usersOrganizationQuery?.isLoading ||
                                    usersOrganizationQuery?.isFetching ? (
                                      <div className="flex h-full w-full flex-col gap-1">
                                        <div className="flex h-10 w-full items-center justify-between p-2">
                                          <span className="h-full w-64 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                          <span className="h-full w-32 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                        </div>
                                        <div className="flex h-10 w-full items-center justify-between p-2">
                                          <span className="h-full w-64 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                          <span className="h-full w-32 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                        </div>
                                        <div className="flex h-10 w-full items-center justify-between p-2">
                                          <span className="h-full w-64 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                          <span className="h-full w-32 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                        </div>
                                        <div className="flex h-10 w-full items-center justify-between p-2">
                                          <span className="h-full w-64 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                          <span className="h-full w-32 animate-skeletonTable rounded-md bg-slate-200/80"></span>
                                        </div>
                                      </div>
                                    ) : (
                                      <ul className="h-full w-full overflow-y-auto">
                                        {usersOrganization?.map((user) => (
                                          <li
                                            key={user?.name}
                                            className="mb-2 flex h-auto w-full justify-between rounded-md border border-slate-300/40 p-2"
                                          >
                                            <div className="flex items-center gap-3">
                                              <FaUserCircle className="size-7 min-w-7 text-slate-400" />
                                              <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                  <p className="text-sm font-semibold text-slate-500">
                                                    {user?.name}{" "}
                                                    {user?.role === "admin" &&
                                                      "(tu)"}
                                                  </p>
                                                  <Chip
                                                    style={{
                                                      backgroundColor: `${rolesColors?.get(user?.role)}2`,
                                                      color: `${rolesColors?.get(user?.role)}`,
                                                    }}
                                                    className="flex h-auto min-w-16 justify-center py-0.5 text-center text-[0.65rem] font-medium capitalize"
                                                    size="sm"
                                                  >
                                                    {user?.role}
                                                  </Chip>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400">
                                                  {user?.email}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-center gap-4">
                                              {user?.role !== "admin" && (
                                                <Popover
                                                  radius="sm"
                                                  placement="top"
                                                  showArrow={true}
                                                >
                                                  <PopoverTrigger>
                                                    <div className="cursor-pointer rounded-md border border-slate-200 p-1.5 transition-colors hover:border-slate-300">
                                                      <div>
                                                        <FaEllipsis className="size-5 min-w-5 text-slate-400" />
                                                      </div>
                                                    </div>
                                                  </PopoverTrigger>
                                                  <PopoverContent className="p-1.5">
                                                    <div className="flex flex-col gap-1">
                                                      <div
                                                        onClick={() => {
                                                          setMemberData(user);
                                                          stepThreeForm?.reset({
                                                            ...user,
                                                          });
                                                          updateUserOptions.onOpen();
                                                        }}
                                                        className="flex cursor-pointer items-center gap-2 p-2 font-medium text-slate-400/70 transition-all hover:rounded-md hover:bg-slate-100 hover:text-slate-500"
                                                      >
                                                        <MdModeEdit className="h-3.5 min-w-3" />
                                                        <p className="text-xs">
                                                          Editar usuario
                                                        </p>
                                                      </div>
                                                      <div
                                                        onClick={() => {
                                                          deleteUserOptions.onOpen();
                                                          setMemberData(user);
                                                        }}
                                                        className="flex cursor-pointer items-center gap-2 p-2 font-medium text-slate-400/70 transition-all hover:rounded-md hover:bg-red-500/10 hover:text-red-500"
                                                      >
                                                        <FaRegTrashAlt className="size-3 min-w-3" />
                                                        <p className="text-xs">
                                                          Eliminar usuario
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </PopoverContent>
                                                </Popover>
                                              )}
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-end">
                                    <Button
                                      onPress={() =>
                                        mutationCompleteSteps.mutate()
                                      }
                                      isDisabled={
                                        mutationCompleteSteps?.isLoading
                                      }
                                      isLoading={
                                        mutationCompleteSteps.isLoading
                                      }
                                      type="submit"
                                      color="primary"
                                      radius="sm"
                                    >
                                      Finalizar
                                    </Button>
                                  </div>
                                </motion.div>
                              )}

                            {/* Add member */}
                            <Modal
                              backdrop="opaque"
                              radius="sm"
                              size="3xl"
                              isOpen={addUserOptions.isOpen}
                              className="!my-0 py-2"
                              onOpenChange={(isOpen) => {
                                addUserOptions.onOpenChange();
                                if (!isOpen)
                                  stepThreeForm.reset(userDefaultValue);
                              }}
                            >
                              <ModalContent className="gap-2">
                                {(onClose) => (
                                  <>
                                    <ModalHeader className="flex h-auto items-center gap-3">
                                      <div className="h-full w-fit rounded-md border border-slate-200 p-2">
                                        <FaUserPlus className="size-6 min-w-6 text-slate-400" />
                                      </div>
                                      <div className="flex w-fit flex-col justify-center">
                                        <p className="text-base text-slate-500">
                                          Crear miembro
                                        </p>
                                        <p className="text-xs font-medium text-slate-400">
                                          Agrega un miembro a tu organización
                                        </p>
                                      </div>
                                    </ModalHeader>
                                    <ModalBody>
                                      <Input
                                        placeholder=" "
                                        isInvalid={
                                          stepThreeForm?.formState?.errors?.name
                                            ?.message
                                            ? true
                                            : false
                                        }
                                        errorMessage={
                                          stepThreeForm?.formState?.errors?.name
                                            ?.message
                                        }
                                        {...stepThreeForm.register("name")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Nombre de usuario
                                          </label>
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                          errorMessage:
                                            "text-red-500 font-medium text-[0.7rem]",
                                        }}
                                        type="text"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <Input
                                        isInvalid={
                                          stepThreeForm?.formState?.errors
                                            ?.email?.message
                                            ? true
                                            : false
                                        }
                                        errorMessage={
                                          stepThreeForm?.formState?.errors
                                            ?.email?.message
                                        }
                                        placeholder=" "
                                        {...stepThreeForm.register("email")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Correo eléctronico
                                          </label>
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                          errorMessage:
                                            "text-red-500 font-medium text-[0.7rem]",
                                        }}
                                        type="email"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <Input
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
                                              <FaEye
                                                onClick={() =>
                                                  setIsPasswordVisible(
                                                    !isPasswordVisible,
                                                  )
                                                }
                                                className={cn(
                                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                  !isPasswordVisible &&
                                                    "hidden",
                                                )}
                                              />
                                              <FaEyeSlash
                                                onClick={() =>
                                                  setIsPasswordVisible(
                                                    !isPasswordVisible,
                                                  )
                                                }
                                                className={cn(
                                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                  isPasswordVisible && "hidden",
                                                )}
                                              />
                                            </div>
                                          </Tooltip>
                                        }
                                        {...stepThreeForm.register("password")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Contraseña
                                          </label>
                                        }
                                        placeholder=" "
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper: cn(
                                            "focus-within:!border-primary border",
                                            stepThreeForm?.watch("password") &&
                                              hasValidationError &&
                                              "border-danger",
                                          ),

                                          base: "outline-none",
                                        }}
                                        type={
                                          isPasswordVisible
                                            ? "text"
                                            : "password"
                                        }
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <div className="flex h-auto items-center rounded-md bg-slate-100 p-3 font-medium text-danger/80 transition-all">
                                        <div className="flex items-center gap-2">
                                          <FaCircleInfo className="size-3.5 min-w-3.5 text-slate-400" />
                                          <p className="text-xs text-slate-400">
                                            La contraseña debe tener:
                                          </p>
                                        </div>
                                        <ul
                                          className={cn(
                                            "flex gap-1 pl-1",
                                            !hasValidationError &&
                                              "text-primary",
                                          )}
                                        >
                                          {validations.map((validation) => (
                                            <li
                                              className="flex items-center gap-0.5 text-xs"
                                              key={validation?.text}
                                            >
                                              {!validation?.test ? (
                                                <FaXmark className="size-3 min-w-3 text-danger/80" />
                                              ) : (
                                                <IoMdCheckmark className="size-3 min-w-3 text-primary" />
                                              )}
                                              <p
                                                className={cn(
                                                  validation?.test &&
                                                    "text-primary",
                                                )}
                                              >
                                                {validation?.text}
                                              </p>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <Input
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
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                        }}
                                        type="text"
                                        value={"Empleado"}
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      {mutationCreateMember?.isError && (
                                        <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                                          <MdError className="size-8 min-w-8 text-red-500" />
                                          <p className="text-sm font-medium text-red-500">
                                            {mutationCreateMember?.error
                                              ?.code === "connection-error"
                                              ? "Ha ocurrido un error de conexión"
                                              : "Ha ocurrido un error en el servidor"}
                                          </p>
                                        </div>
                                      )}
                                    </ModalBody>
                                    <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                                      <Button
                                        onPress={() => {
                                          onClose();
                                        }}
                                        className="border border-slate-300 bg-white font-medium text-slate-500"
                                        radius="sm"
                                      >
                                        Cerrar
                                      </Button>
                                      <Button
                                        isLoading={
                                          mutationCreateMember?.isLoading
                                        }
                                        isDisabled={
                                          mutationCreateMember?.isLoading
                                        }
                                        onPress={() => {
                                          stepThreeForm?.setValue("role_id", 2);
                                          stepThreeForm.handleSubmit(
                                            threeStep,
                                          )();
                                        }}
                                        type="submit"
                                        radius="sm"
                                        color="primary"
                                      >
                                        Crear miembro
                                      </Button>
                                    </ModalFooter>
                                  </>
                                )}
                              </ModalContent>
                            </Modal>

                            {/* Update member */}
                            <Modal
                              backdrop="opaque"
                              radius="sm"
                              size="3xl"
                              isOpen={updateUserOptions.isOpen}
                              className="!my-0 py-2"
                              onOpenChange={(isOpen) => {
                                updateUserOptions.onOpenChange();
                                if (!isOpen)
                                  stepThreeForm.reset(userDefaultValue);
                              }}
                            >
                              <ModalContent className="gap-2">
                                {(onClose) => (
                                  <>
                                    <ModalHeader className="flex h-auto items-center gap-3">
                                      <div className="h-full w-fit rounded-md border border-slate-200 p-2">
                                        <FaUserEdit className="size-6 min-w-6 text-slate-400" />
                                      </div>
                                      <div className="flex w-fit flex-col justify-center">
                                        <p className="text-base text-slate-500">
                                          Modificar miembro
                                        </p>
                                        <p className="text-xs font-medium text-slate-400">
                                          Modificar a <b>{memberData?.name}</b>
                                        </p>
                                      </div>
                                    </ModalHeader>
                                    <ModalBody>
                                      <Input
                                        placeholder=" "
                                        isInvalid={
                                          stepThreeForm?.formState?.errors?.name
                                            ?.message
                                            ? true
                                            : false
                                        }
                                        errorMessage={
                                          stepThreeForm?.formState?.errors?.name
                                            ?.message
                                        }
                                        {...stepThreeForm.register("name")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Nombre de usuario
                                          </label>
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                          errorMessage:
                                            "text-red-500 font-medium text-[0.7rem]",
                                        }}
                                        type="text"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <Input
                                        isInvalid={
                                          stepThreeForm?.formState?.errors
                                            ?.email?.message
                                            ? true
                                            : false
                                        }
                                        errorMessage={
                                          stepThreeForm?.formState?.errors
                                            ?.email?.message
                                        }
                                        placeholder=" "
                                        {...stepThreeForm.register("email")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Correo eléctronico
                                          </label>
                                        }
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                          errorMessage:
                                            "text-red-500 font-medium text-[0.7rem]",
                                        }}
                                        type="email"
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <Input
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
                                              <FaEye
                                                onClick={() =>
                                                  setIsPasswordVisible(
                                                    !isPasswordVisible,
                                                  )
                                                }
                                                className={cn(
                                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                  !isPasswordVisible &&
                                                    "hidden",
                                                )}
                                              />
                                              <FaEyeSlash
                                                onClick={() =>
                                                  setIsPasswordVisible(
                                                    !isPasswordVisible,
                                                  )
                                                }
                                                className={cn(
                                                  "size-5 min-w-5 cursor-pointer text-slate-400 transition-colors hover:text-green-600",
                                                  isPasswordVisible && "hidden",
                                                )}
                                              />
                                            </div>
                                          </Tooltip>
                                        }
                                        {...stepThreeForm.register("password")}
                                        label={
                                          <label className="text-xs font-medium text-green-700">
                                            Contraseña
                                          </label>
                                        }
                                        placeholder=" "
                                        labelPlacement="outside"
                                        className="w-full text-slate-400"
                                        classNames={{
                                          input:
                                            "w-full max-w-full focus:border-primary placeholder:text-slate-400/70",
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper: cn(
                                            "focus-within:!border-primary border",
                                            stepThreeForm?.watch("password") &&
                                              hasValidationError &&
                                              "border-danger",
                                          ),

                                          base: "outline-none",
                                        }}
                                        type={
                                          isPasswordVisible
                                            ? "text"
                                            : "password"
                                        }
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                      <div className="flex h-auto items-center rounded-md bg-slate-100 p-3 font-medium text-danger/80 transition-all">
                                        <div className="flex items-center gap-2">
                                          <FaCircleInfo className="size-3.5 min-w-3.5 text-slate-400" />
                                          <p className="text-xs text-slate-400">
                                            La contraseña debe tener:
                                          </p>
                                        </div>
                                        <ul
                                          className={cn(
                                            "flex gap-1 pl-1",
                                            !hasValidationError &&
                                              "text-primary",
                                          )}
                                        >
                                          {validations.map((validation) => (
                                            <li
                                              className="flex items-center gap-0.5 text-xs"
                                              key={validation?.text}
                                            >
                                              {!validation?.test ? (
                                                <FaXmark className="size-3 min-w-3 text-danger/80" />
                                              ) : (
                                                <IoMdCheckmark className="size-3 min-w-3 text-primary" />
                                              )}
                                              <p
                                                className={cn(
                                                  validation?.test &&
                                                    "text-primary",
                                                )}
                                              >
                                                {validation?.text}
                                              </p>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                      <Input
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
                                          mainWrapper:
                                            "w-full max-w-full focus-within:border-primary",
                                          inputWrapper:
                                            "focus-within:!border-primary border",
                                          base: "outline-none",
                                        }}
                                        type="text"
                                        value={"Empleado"}
                                        radius="sm"
                                        variant={"bordered"}
                                      />
                                    </ModalBody>
                                    <ModalFooter className="flex h-auto w-full gap-4 border-t border-slate-300/70">
                                      <Button
                                        onPress={() => {
                                          onClose();
                                          setMemberData(undefined);
                                        }}
                                        className="border border-slate-300 bg-white font-medium text-slate-500"
                                        radius="sm"
                                      >
                                        Cerrar
                                      </Button>
                                      <Button
                                        isLoading={
                                          mutationUpdateUser?.isLoading
                                        }
                                        isDisabled={
                                          mutationUpdateUser?.isLoading
                                        }
                                        onPress={() => {
                                          stepThreeForm?.setValue("role_id", 1);
                                          stepThreeForm.handleSubmit(
                                            updateUser,
                                          )();
                                        }}
                                        type="submit"
                                        radius="sm"
                                        color="primary"
                                      >
                                        Confirmar
                                      </Button>
                                    </ModalFooter>
                                  </>
                                )}
                              </ModalContent>
                            </Modal>

                            {/* Delete member */}
                            <Modal
                              backdrop="opaque"
                              radius="sm"
                              size="xl"
                              isOpen={deleteUserOptions.isOpen}
                              className="!my-0 py-2"
                              onOpenChange={(isOpen) => {
                                deleteUserOptions.onOpenChange();
                                if (!isOpen)
                                  stepThreeForm.reset(userDefaultValue);
                              }}
                            >
                              <ModalContent className="h-auto gap-2 bg-gradient-to-t from-red-200/50 via-white to-white">
                                {(onClose) => (
                                  <>
                                    <ModalHeader className="flex h-auto items-center gap-3">
                                      <div className="flex h-auto w-full flex-col items-center justify-center gap-2">
                                        <div className="flex items-center rounded-full bg-red-200/30 p-4">
                                          <IoIosWarning className="size-12 min-w-12 text-danger" />
                                        </div>
                                        <p className="text-base text-slate-500">
                                          Eliminar usuario
                                        </p>
                                        <p className="text-sm font-normal text-slate-400">
                                          ¿Estás seguro que quieres eliminar a{" "}
                                          <b className="font-medium text-slate-500">
                                            {memberData?.name}
                                          </b>
                                          ?
                                        </p>
                                      </div>
                                    </ModalHeader>
                                    {mutationDeleteUser?.isError && (
                                      <div className="flex items-center justify-center px-8">
                                        <div className="flex h-12 w-full items-center gap-2 rounded-md border border-red-300 bg-gradient-to-b from-red-100/30 via-red-200/40 to-red-200/70 px-4">
                                          <MdError className="size-8 min-w-8 text-red-500" />
                                          <p className="text-sm font-medium text-red-500">
                                            {mutationDeleteUser?.error?.code ===
                                            "connection-error"
                                              ? "Ha ocurrido un error de conexión"
                                              : "Ha ocurrido un error en el servidor"}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
                                      <Button
                                        isLoading={
                                          mutationDeleteUser?.isLoading
                                        }
                                        isDisabled={
                                          mutationDeleteUser?.isLoading
                                        }
                                        onPress={deleteUser}
                                        type="submit"
                                        radius="sm"
                                        color="danger"
                                      >
                                        Eliminar miembro
                                      </Button>
                                      <Button
                                        onPress={() => {
                                          onClose();
                                        }}
                                        className="min-w-32 border border-slate-300 bg-white font-medium text-slate-500"
                                        radius="sm"
                                      >
                                        Cerrar
                                      </Button>
                                    </ModalFooter>
                                  </>
                                )}
                              </ModalContent>
                            </Modal>
                          </motion.article>
                        )}
                      </AnimatePresence>
                    )}
                </motion.div>
              </AnimatePresence>
            )}

            <AnimatePresence>
              {currentStep <= 3 && (
                <motion.div
                  exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
                  transition={{
                    opacity: { duration: 0.2, delay: 1.8 },
                  }}
                  initial={{ opacity: 0 }}
                  animate={
                    !currentStepQuery?.isLoading &&
                    !currentStepQuery?.isFetching &&
                    !mutationCompleteSteps?.isSuccess && { opacity: 1 }
                  }
                  className="relative bottom-0 hidden h-96 w-full max-w-2xl 2xl:flex"
                >
                  <div
                    className={cn(
                      "relative h-0.5 w-full bg-slate-200 after:absolute after:top-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all",
                      currentStep === 2 && "after:w-1/2",
                      currentStep === 3 && "after:w-full",
                    )}
                  >
                    <div
                      className={cn(
                        "relative -left-0 -top-0 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-primary bg-white p-2 transition-colors",
                        currentStep > 1 && "bg-primary",
                      )}
                    >
                      <div className="relative">
                        <FaCheck
                          className={cn(
                            "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                            currentStep > 1 && "-translate-y-1/2",
                          )}
                        />
                        <p
                          className={cn(
                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-primary transition-all",
                            currentStep > 1 && "-translate-y-24",
                          )}
                        >
                          1
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "absolute -top-8 left-24 -translate-x-full -translate-y-full text-nowrap text-sm font-medium text-slate-500 transition-colors",
                        currentStep > 1 && "text-primary",
                      )}
                    >
                      Nombre de la organización
                    </p>
                    <div
                      className={cn(
                        "absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border bg-slate-200 p-2",
                        currentStep === 2 && "border-primary bg-white",
                        currentStep > 2 && "border-primary bg-primary",
                      )}
                    >
                      <div className="relative">
                        <FaCheck
                          className={cn(
                            "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                            currentStep > 2 && "-translate-y-1/2",
                          )}
                        />
                        <p
                          className={cn(
                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-slate-500 transition-all",
                            currentStep > 2 && "-translate-y-24",
                            currentStep === 2 && "text-primary",
                          )}
                        >
                          2
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "absolute -top-8 right-[180px] -translate-x-full -translate-y-full text-nowrap text-sm font-medium text-slate-500 transition-colors",
                        currentStep > 2 && "text-primary",
                        currentStep < 2 && "opacity-40",
                      )}
                    >
                      Modificar perfil
                    </p>
                    <div
                      className={cn(
                        "absolute right-0 top-full z-10 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center overflow-hidden rounded-full border bg-slate-200 p-2 transition-colors",
                        currentStep > 3 && "bg-primary",
                        currentStep === 3 && "border-primary bg-white",
                      )}
                    >
                      <div className="relative">
                        <FaCheck
                          className={cn(
                            "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                            currentStep > 3 && "-translate-y-1/2",
                          )}
                        />
                        <p
                          className={cn(
                            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-slate-500 transition-all",
                            currentStep > 3 && "-translate-y-24",
                            currentStep === 3 && "text-primary",
                          )}
                        >
                          3
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "absolute -top-8 right-2 -translate-y-full translate-x-1/2 text-nowrap text-sm font-medium text-slate-500 transition-colors",
                        currentStep > 3 && "text-primary",
                        currentStep < 3 && "opacity-40",
                      )}
                    >
                      Agregar miembros
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {currentStep <= 3 && (
            <motion.div
              exit={{ opacity: 0, transition: { duration: 0.2, delay: 0 } }}
              transition={{ delay: 1.8 }}
              initial={{ opacity: 0 }}
              animate={
                !currentStepQuery?.isLoading &&
                !currentStepQuery?.isFetching &&
                !mutationCompleteSteps?.isSuccess && { opacity: 1 }
              }
              className="flex h-full max-h-96 w-96 items-center justify-start pt-40 2xl:hidden"
            >
              <div
                className={cn(
                  "relative h-full w-0.5 bg-slate-200 after:absolute after:top-0 after:h-0 after:w-full after:bg-primary after:transition-all",
                  currentStep === 2 && "after:h-1/2",
                  currentStep === 3 && "after:h-full",
                )}
              >
                <div
                  className={cn(
                    "absolute -left-0 -top-0 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border border-primary bg-white p-2 transition-colors",
                    currentStep > 1 && "bg-primary",
                  )}
                >
                  <div className="relative">
                    <FaCheck
                      className={cn(
                        "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                        currentStep > 1 && "-translate-y-1/2",
                      )}
                    />
                    <p
                      className={cn(
                        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-primary transition-all",
                        currentStep > 1 && "-translate-y-24",
                      )}
                    >
                      1
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "absolute -right-7 -top-3 translate-x-full text-nowrap text-xs font-medium text-slate-500 transition-colors",
                    currentStep > 1 && "text-primary",
                  )}
                >
                  Nombre de la organización
                </p>
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border bg-slate-200 p-2",
                    currentStep === 2 && "border-primary bg-white",
                    currentStep > 2 && "border-primary bg-primary",
                  )}
                >
                  <div className="relative">
                    <FaCheck
                      className={cn(
                        "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                        currentStep > 2 && "-translate-y-1/2",
                      )}
                    />
                    <p
                      className={cn(
                        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-slate-500 transition-all",
                        currentStep > 2 && "-translate-y-24",
                        currentStep === 2 && "text-primary",
                      )}
                    >
                      2
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "absolute -right-7 top-1/2 -translate-y-2 translate-x-full text-nowrap text-xs font-medium text-slate-500 transition-colors",
                    currentStep > 2 && "text-primary",
                    currentStep < 2 && "opacity-40",
                  )}
                >
                  Modificar perfil
                </p>
                <div
                  className={cn(
                    "absolute right-0 top-full z-10 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center overflow-hidden rounded-full border bg-slate-200 p-2 transition-colors",
                    currentStep > 3 && "border-primary bg-primary",
                    currentStep === 3 && "border-primary bg-white",
                  )}
                >
                  <div className="relative">
                    <FaCheck
                      className={cn(
                        "absolute -top-1/2 left-1/2 size-4 min-w-4 -translate-x-1/2 translate-y-full text-white transition-all",
                        currentStep > 3 && "-translate-y-1/2",
                      )}
                    />
                    <p
                      className={cn(
                        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-slate-500 transition-all",
                        currentStep > 3 && "-translate-y-24",
                        currentStep === 3 && "text-primary",
                      )}
                    >
                      3
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "absolute -right-7 top-full -translate-y-2 translate-x-full text-nowrap text-xs font-medium text-slate-500 transition-colors",
                    currentStep > 3 && "text-primary",
                    currentStep < 3 && "opacity-40",
                  )}
                >
                  Agregar miembros
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
