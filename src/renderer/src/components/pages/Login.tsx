import { loginUserSchema, UserCredentials } from "@renderer/hooks/user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "react-query";
import axios from "@renderer/hooks/axios";
import { useState } from "react";
import { cn, errorsResponse } from "@renderer/utils";
import { useNavigate } from "react-router";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react";

export function Login() {
  const queryClient = useQueryClient();
  const { AxiosFetch } = axios("http://localhost");

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
      <article className="h-full w-1/3 p-10">
        <div className="flex h-full w-full flex-col justify-center gap-8">
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="h-12 w-12 rounded-md bg-green-300"></div>
            <h1 className="text-2xl font-medium text-slate-600">
              Iniciar sesión
            </h1>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex h-auto w-full flex-col gap-16"
          >
            <div className="flex flex-col gap-6">
              <Input
                isInvalid={errors?.email?.message ? true : false}
                errorMessage={errors?.email?.message}
                {...register("email")}
                name="email"
                id="email"
                classNames={{
                  inputWrapper:
                    "after:bg-green-600 group-data-[has-helper=true]:after:!bg-red-500",
                  input: "!text-slate-500",
                  errorMessage: "text-red-500 font-medium",
                }}
                placeholder=" "
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
                variant="underlined"
                type="string"
              />
              <Input
                isInvalid={errors?.password?.message ? true : false}
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
                id="password"
                className="placeholder:text-slate-200"
                classNames={{
                  inputWrapper:
                    "after:bg-green-600 group-data-[has-helper=true]:after:!bg-red-500",
                  input: "!text-slate-500",
                  errorMessage: "text-red-500 font-medium",
                }}
                placeholder=" "
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
                variant="underlined"
                type={isPasswordVisible ? "text" : "password"}
              />
              <a
                href="/"
                className="w-fit cursor-pointer text-sm text-green-500 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
              {login?.isError && (
                <div className="flex h-12 w-full items-center gap-2 rounded-md bg-red-300/30 px-4">
                  <CircleAlertIcon className="size-8 min-w-8 text-red-500" />
                  <p className="text-sm font-medium text-red-500">
                    {login?.error?.code === "unauthorized"
                      ? "El correo o la contraseña son incorrectos"
                      : login?.error?.code === "server-error"
                        ? "Ha ocurrido un error en el servidor"
                        : "Ha ocurrido un error de conexión"}
                  </p>
                </div>
              )}
            </div>
            <Button
              isLoading={login.isLoading || login.isSuccess}
              type="submit"
              // color="success"

              className="bg-primary text-white"
              radius="sm"
              isDisabled={login.isLoading || login.isSuccess}
            >
              Iniciar sesión
            </Button>
          </form>
        </div>
      </article>
      <article className="h-full w-2/3 p-4">
        <div className="flex h-full w-full flex-col gap-10 rounded-2xl border-slate-200 bg-gradient-to-t from-green-300/80 via-green-300/20 to-green-300/10 py-10 pb-20 pl-16">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
              <div className="hola h-fit w-fit rounded-full bg-gradient-to-b from-green-500 to-green-500/50 px-3.5 py-1.5 text-white">
                <p className="text-xs">Gestion de clientes</p>
              </div>
              <div className="h-fit w-fit rounded-full bg-gradient-to-b from-green-500 to-green-500/50 px-3.5 py-1.5 text-white">
                <p className="text-xs">Gestion de cajas</p>
              </div>
              <div className="h-fit w-fit rounded-full bg-gradient-to-b from-green-500 to-green-500/50 px-3.5 py-1.5 text-white">
                <p className="text-xs">Gestion de empleados</p>
              </div>
            </div>
            <div>
              <p className="text-xl font-medium text-slate-600">
                Llevamos el <b className="text-green-500">control</b> y{" "}
                <b className="text-green-500">administración</b> de las
                operaciones a otro nivel{" "}
              </p>
            </div>
          </div>
          <div className="relative flex h-full w-full overflow-hidden rounded-l-md bg-gradient-to-b from-white via-white to-transparent before:absolute before:bottom-0 before:z-40 before:h-40 before:w-full before:bg-gradient-to-b before:from-transparent before:to-transparent"></div>
        </div>
      </article>
    </div>
  );
}
