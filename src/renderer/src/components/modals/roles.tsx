import {
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@renderer/hooks/axios";
import { cn, getErrorMessage } from "@renderer/utils";
import { ModalProps, ServerError } from "@renderer/utils/types";
import { CircleAlertIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";
import z from "zod";
import { Button } from "../Button";
import { Mandatory } from "../Mandatory";
import {
  getDependents,
  getDeps,
  permissionDescriptions,
  PermissionName,
  permissionNames,
  permissionNamesToSpanish,
  permissions,
  permissionsSchema,
  permissionToSpanish,
  TPermission,
} from "@renderer/utils/permission";
import { Role } from "@renderer/hooks/permissions";
import { ErrorForm } from "../ErrorMessage";

type Input = z.infer<typeof inputSchema>;
const inputSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El rol debe tener un nombre" })
    .max(100, { message: "Maximo 100 caracteres" }),
  permissions: z
    .set(permissionsSchema)
    .min(1, { message: "Es necesario proveer al menos un permiso" }),
});

export function CreateRoleModal({ isOpen, onClose }: ModalProps) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    control,
    register,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      name: "",
      permissions: new Set(),
    },
  });

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      console.log(body);
      const permissionsBody = [...body.permissions];
      const { data } = await AxiosFetch.post(`/api/v1/roles`, {
        name: body.name,
        permissions: permissionsBody,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado con éxito", {
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
      size="5xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <KeyRoundIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <span className="text-lg text-slate-500">Crear rol</span>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex flex-col gap-4">
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

                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Permisos <Mandatory />
                    </label>

                    <Controller
                      control={control}
                      name="permissions"
                      render={({ field: { onChange, value } }) => (
                        <div className="flex w-full flex-col">
                          <div className="grid h-auto max-h-72 w-full gap-3 overflow-y-auto pr-2 lg:grid-cols-2">
                            {permissionNames.map((p) => {
                              return (
                                <RoleModalPermission
                                  key={p}
                                  p={p}
                                  value={value}
                                  onChange={onChange}
                                />
                              );
                            })}
                          </div>

                          {errors.permissions && (
                            <p className="text-xs font-medium text-red-500">
                              {errors.permissions.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
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

export function UpdateRoleModal({
  isOpen,
  onClose,
  role,
}: ModalProps & { role: Role }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const {
    formState: { errors },
    handleSubmit,
    control,
    register,
  } = useForm<Input>({
    resolver: zodResolver(inputSchema),
    defaultValues: {
      name: role.name,
      permissions: new Set(role.permissions),
    },
  });

  const mutation = useMutation<Input, ServerError, Input>({
    mutationFn: async (body) => {
      console.log(body);
      const permissionsBody = [...body.permissions];
      const { data } = await AxiosFetch.put(`/api/v1/roles/${role.id}`, {
        name: body.name,
        permissions: permissionsBody,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol modificado con éxito", {
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
      size="5xl"
      isOpen={isOpen}
      onOpenChange={onClose}
    >
      <ModalContent className="flex flex-col gap-2">
        {(onClose) => (
          <>
            <ModalHeader className="flex h-auto items-center gap-3">
              <KeyRoundIcon className="size-8 min-w-8 text-slate-500" />
              <div className="flex w-fit flex-col justify-center">
                <span className="text-lg text-slate-500">Crear rol</span>
              </div>
            </ModalHeader>

            <form
              className="flex flex-col gap-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <ModalBody className="py-0">
                <div className="flex flex-col gap-4">
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

                  <div className="flex w-full flex-col gap-1">
                    <label htmlFor="name" className="text-sm text-slate-500">
                      Permisos <Mandatory />
                    </label>

                    <Controller
                      control={control}
                      name="permissions"
                      render={({ field: { onChange, value } }) => (
                        <div className="flex w-full flex-col">
                          <div className="grid h-auto max-h-72 w-full gap-3 overflow-y-auto pr-2 lg:grid-cols-2">
                            {permissionNames.map((p) => {
                              return (
                                <RoleModalPermission
                                  key={p}
                                  p={p}
                                  value={value}
                                  onChange={onChange}
                                />
                              );
                            })}
                          </div>

                          {errors.permissions && (
                            <p className="text-xs font-medium text-red-500">
                              {errors.permissions.message}
                            </p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>

                {mutation.isError && (
                  <div className="flex w-full items-center gap-2 rounded-md border border-red-500 bg-red-200/20 p-2">
                    <CircleAlertIcon className="size-3.5 min-w-3.5 text-red-500" />
                    <p className="text-sm text-red-500">
                      {getErrorMessage(mutation.error)}
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

export function DeleteRoleModal({
  isOpen,
  onClose,
  role,
}: ModalProps & { role: Role }) {
  const { AxiosFetch } = axios(import.meta.env.VITE_API_BACKEND_URL);
  const queryClient = useQueryClient();

  const mutation = useMutation<void, ServerError, void>({
    mutationFn: async () => {
      const { data } = await AxiosFetch.delete(`/api/v1/roles/${role.id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Se ha eliminado un rol", {
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
                <span className="text-xl text-danger">Eliminar rol</span>
                <span className="text-balance text-center text-sm font-normal text-red-500">
                  ¿Estás seguro que quieres eliminar el rol {role.name}?
                </span>
              </div>
            </ModalHeader>

            {mutation.isError && (
              <div className="max-w-2xl">
                <ErrorForm errorMessage={mutation.error} />
              </div>
            )}

            <ModalFooter className="flex h-auto w-full items-center justify-center gap-4 py-2">
              <Button
                isLoading={mutation?.isLoading}
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

function RoleModalPermission({
  p,
  value,
  onChange,
}: {
  p: PermissionName;
  value: Set<TPermission>;
  onChange: (...event: any[]) => void;
}) {
  const readPerm = `${p}:READ` as TPermission;
  const writePerm = `${p}:CREATE` as TPermission;
  const updatePerm = `${p}:UPDATE` as TPermission;
  const deletePerm = `${p}:DELETE` as TPermission;

  return (
    <div
      key={p}
      className="flex h-auto w-full flex-col gap-4 truncate rounded-md border border-slate-200 bg-[#FBFBFB] px-4 pb-3 pt-2.5"
    >
      {/* Name and description */}
      <div className="flex h-full w-auto flex-col">
        <span className="font-normal uppercase tracking-wider text-slate-400">
          {permissionNamesToSpanish[p]}
        </span>
        <p className="truncate text-sm text-slate-400/70">
          {permissionDescriptions[p]}
        </p>
      </div>

      {/* Checks */}
      <div className="flex h-auto w-auto flex-row items-center justify-end gap-6">
        {/* Read */}
        {permissions.includes(readPerm) && (
          <div
            onClick={() => {
              if (value.has(readPerm)) {
                value.delete(readPerm);
                getDependents(readPerm).forEach((dep) => {
                  value.delete(dep);
                });
                return onChange(new Set(value));
              }

              const dependencies = getDeps(readPerm);
              onChange(new Set([...value, readPerm, ...dependencies]));
            }}
            className="flex w-fit cursor-pointer select-none items-center gap-2"
          >
            <Checkbox
              aria-label={readPerm}
              isSelected={value.has(readPerm)}
              onValueChange={() => {
                if (value.has(readPerm)) {
                  value.delete(readPerm);
                  getDependents(readPerm).forEach((dep) => {
                    value.delete(dep);
                  });
                  return onChange(new Set(value));
                }

                const dependencies = getDeps(readPerm);
                onChange(new Set([...value, readPerm, ...dependencies]));
              }}
              radius="lg"
              className="text-xs"
              classNames={{
                label: "text-slate-500 text-xs",
                base: "rounded-md",
                wrapper: " rounded-md ",
              }}
            >
              {" "}
              {permissionToSpanish[readPerm].split(" ")[0]}
            </Checkbox>
          </div>
        )}

        {/* Write */}
        {permissions.includes(writePerm) && (
          <div
            onClick={() => {
              if (value.has(writePerm)) {
                value.delete(writePerm);
                getDependents(writePerm).forEach((dep) => {
                  value.delete(dep);
                });
                return onChange(new Set(value));
              }

              const dependencies = getDeps(writePerm);
              onChange(new Set([...value, writePerm, ...dependencies]));
            }}
            className="flex w-fit cursor-pointer select-none items-center gap-2"
          >
            <Checkbox
              aria-label={writePerm}
              isSelected={value.has(writePerm)}
              onValueChange={() => {
                if (value.has(writePerm)) {
                  value.delete(writePerm);
                  getDependents(writePerm).forEach((dep) => {
                    value.delete(dep);
                  });
                  return onChange(new Set(value));
                }

                const dependencies = getDeps(writePerm);
                onChange(new Set([...value, writePerm, ...dependencies]));
              }}
              radius="lg"
              className="text-xs"
              classNames={{
                label: " text-slate-500 text-xs",
                base: "rounded-md",
                wrapper: " rounded-md ",
              }}
            >
              {" "}
              {permissionToSpanish[writePerm].split(" ")[0]}
            </Checkbox>
          </div>
        )}

        {/* Update */}
        {permissions.includes(updatePerm) && (
          <div
            onClick={() => {
              if (value.has(updatePerm)) {
                value.delete(updatePerm);
                getDependents(updatePerm).forEach((dep) => {
                  value.delete(dep);
                });
                return onChange(new Set(value));
              }

              const dependencies = getDeps(updatePerm);
              onChange(new Set([...value, updatePerm, ...dependencies]));
            }}
            className="flex w-fit cursor-pointer select-none items-center gap-2"
          >
            <Checkbox
              aria-label={updatePerm}
              isSelected={value.has(updatePerm)}
              onValueChange={() => {
                if (value.has(updatePerm)) {
                  value.delete(updatePerm);
                  getDependents(updatePerm).forEach((dep) => {
                    value.delete(dep);
                  });
                  return onChange(new Set(value));
                }

                const dependencies = getDeps(updatePerm);
                onChange(new Set([...value, updatePerm, ...dependencies]));
              }}
              radius="lg"
              className="text-xs"
              classNames={{
                label: " text-slate-500 text-xs",
                base: "rounded-md",
                wrapper: " rounded-md ",
              }}
            >
              {" "}
              {permissionToSpanish[updatePerm].split(" ")[0]}
            </Checkbox>
          </div>
        )}

        {/* Delete */}
        {permissions.includes(deletePerm) && (
          <div
            onClick={() => {
              if (value.has(deletePerm)) {
                value.delete(deletePerm);
                getDependents(deletePerm).forEach((dep) => {
                  value.delete(dep);
                });
                return onChange(new Set(value));
              }

              const dependencies = getDeps(deletePerm);
              onChange(new Set([...value, deletePerm, ...dependencies]));
            }}
            className="flex w-fit cursor-pointer select-none items-center gap-2"
          >
            <Checkbox
              aria-label={deletePerm}
              isSelected={value.has(deletePerm)}
              onValueChange={() => {
                if (value.has(deletePerm)) {
                  value.delete(deletePerm);
                  getDependents(deletePerm).forEach((dep) => {
                    value.delete(dep);
                  });
                  return onChange(new Set(value));
                }

                const dependencies = getDeps(deletePerm);
                onChange(new Set([...value, deletePerm, ...dependencies]));
              }}
              radius="lg"
              className="text-xs"
              classNames={{
                label: " text-slate-500 text-xs",
                base: "rounded-md",
                wrapper: " rounded-md ",
              }}
            >
              {" "}
              {permissionToSpanish[deletePerm].split(" ")[0]}
            </Checkbox>
          </div>
        )}
      </div>
    </div>
  );
}
