import { loginUserSchema, UserCredentials } from "@renderer/hooks/user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { useState } from "react";
import { cn, errorsResponse } from "@renderer/utils";
import { useNavigate } from "react-router";
import { Input } from "@heroui/react";
import { Tooltip } from "@heroui/react";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "../Button";
import { getYear } from "date-fns";
import logo from "../../assets/sintelia.png";
export function Login() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCredentials>({
    resolver: zodResolver(loginUserSchema),
  });

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const login = useMutation<void, any, UserCredentials>({
    mutationFn: async (userCredentials: UserCredentials) => {
      try {
        const { data } = await AxiosFetch.post(`/api/login`, userCredentials);
        return data;
      } catch (error) {
        errorsResponse(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      navigate("/home");
    },
  });

  const onSubmit = (userCredentials: UserCredentials) => {
    login.mutate(userCredentials);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex h-full w-full justify-center p-10">
        <div className="flex h-full w-full max-w-lg flex-col justify-center gap-12">
          <h1 className="text-left text-3xl font-medium text-slate-500">
            Iniciar sesión
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex h-auto w-full flex-col gap-16"
          >
            <div className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex flex-col gap-1">
                <Input
                  errorMessage={errors?.email?.message}
                  {...register("email")}
                  name="email"
                  labelPlacement="outside-top"
                  id="email"
                  placeholder=" "
                  className="focus:outline-none focus:ring-0 focus-visible:ring-0"
                  classNames={{
                    inputWrapper: cn(
                      errors.password
                        ? "border-red-500 "
                        : "border-slate-300/60",
                      "border !bg-slate-100 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                    ),
                    label: "text-slate-400",
                    input: "focus:outline-none focus:ring-0 !text-slate-500",
                  }}
                  label={
                    <label
                      className={cn(
                        "text-slate-400/80",
                        errors?.email?.message && "text-red-500",
                      )}
                      htmlFor="email"
                    >
                      Correo eléctronico
                    </label>
                  }
                  type="string"
                />

                {errors?.email?.message && (
                  <span className="text-xs font-medium text-red-500">
                    {errors?.email?.message}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
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
                        : "border-slate-300/60",
                      "border !bg-slate-100 rounded-md hover:!bg-transparent data-[hover=true]:!bg-slate-100 data-[focus=true]:!border-primary/60 data-[focus=true]:!outline-none  data-[focus=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0 data-[focus=true]:!border-green-500",
                    ),
                    label: "text-slate-400",
                    input: "focus:outline-none focus:ring-0 !text-slate-500",
                  }}
                  label={
                    <label
                      className={cn(
                        "text-slate-400/80",
                        errors?.password?.message && "text-red-500",
                      )}
                      htmlFor="password"
                    >
                      Contraseña
                    </label>
                  }
                  type={isPasswordVisible ? "text" : "password"}
                />
                {errors?.password?.message && (
                  <span className="text-xs font-medium text-red-500">
                    {errors?.password?.message}
                  </span>
                )}
              </div>

              {/* Forgot password link */}
              <a
                href="/"
                className="w-fit cursor-pointer text-sm text-green-500 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
              {login.isError && (
                <div className="flex w-full items-center gap-2 rounded-md border border-red-400/70 bg-red-200/20 p-3">
                  <CircleAlertIcon className="size-5 min-w-5 text-red-500" />
                  <p className="text-sm font-medium text-red-500">
                    {login.error.message}
                  </p>
                </div>
              )}
            </div>

            <Button
              isLoading={login.isLoading || login.isSuccess}
              disabled={login.isLoading || login.isSuccess}
              variant="success"
            >
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex h-full w-full items-center justify-center p-4">
        <span className="absolute top-0 z-0 h-1/3 w-0.5 bg-gradient-to-b from-primary/70 to-transparent 2xl:h-2/5" />
        <span className="absolute bottom-0 h-1/3 w-0.5 bg-gradient-to-t from-primary/70 to-transparent 2xl:h-2/5" />

        <div className="flex h-auto min-h-32 translate-x-12 flex-col justify-center overflow-hidden">
          <div className="flex items-center">
            <span className="onboarding-text text-5xl font-extrabold text-slate-200 2xl:text-6xl">
              Finance
            </span>
            <b className="onboarding-text inline-block text-5xl font-extrabold 2xl:text-6xl">
              {" "}
              hub
            </b>
          </div>
          <span className="text-xl font-medium text-slate-400/70">
            Sistema de gestión de cajas y operaciones
          </span>
        </div>
      </div>

      <a
        href="https://www.linkedin.com/company/sintelia/"
        target="_blank"
        className="absolute bottom-4 left-10 flex flex-col items-center justify-center gap-1.5 text-nowrap font-medium text-slate-400"
      >
        <img src={logo} className="h-10 w-24 object-contain" />
        <span className="text-xs">
          © {getYear(new Date())} <b className="text-slate-400">Sintelia</b>
        </span>
      </a>
    </div>
  );
}
