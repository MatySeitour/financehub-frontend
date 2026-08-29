/* IMPORTS */
import {
  useRef,
  useState,
  useEffect,
  useMemo,
  SetStateAction,
  Dispatch,
} from "react";
import { ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  CircleOffIcon,
  EllipsisVerticalIcon,
  KeyRoundIcon,
  LockKeyholeOpenIcon,
  PlusIcon,
  SearchIcon,
  SearchXIcon,
  SquarePenIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import { getPermissions, getRoles, Role } from "@renderer/hooks/permissions";
import {
  CreateRoleModal,
  DeleteRoleModal,
  UpdateRoleModal,
} from "@renderer/components/modals/roles";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { ErrorMessage } from "@renderer/components/ErrorMessage";

//Component starts here
export function PermissionsSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [isRoleCreateOpen, setIsRoleCreateOpen] = useState(false);
  const [roleToUpdate, setRoleToUpdate] = useState<Role>();
  const [roleToDelete, setRoleToDelete] = useState<Role>();

  const rolesQuery = useQuery<
    Awaited<ReturnType<typeof getRoles>>,
    ServerError
  >({
    queryFn: () => getRoles(),
    queryKey: ["roles", "all"],
  });

  const permissionsQuery = useQuery<
    Awaited<ReturnType<typeof getPermissions>>,
    ServerError
  >({
    queryFn: () => getPermissions(),
    queryKey: ["permission", "all"],
  });

  const permissionsCount = permissionsQuery.data?.length;

  /// Focus search with Ctrl + f
  useEffect(() => {
    const handleFocusSearch = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleFocusSearch);
    return () => window.removeEventListener("keydown", handleFocusSearch);
  }, []);

  const filteredRoles = useMemo(() => {
    if (!rolesQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return rolesQuery?.data?.filter((role) => {
      let searched = `${role.name}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [rolesQuery.data, search]);

  return (
    <section className="flex h-full w-full flex-col gap-4 px-4">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex max-h-12 min-h-12 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <LockKeyholeOpenIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">
            Roles y permisos
          </h1>
        </div>
        <Button
          onClick={() => setIsRoleCreateOpen(true)}
          disabled={rolesQuery.isLoading || rolesQuery.isError}
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar rol
        </Button>
      </div>

      <div className="flex h-12 w-full flex-col gap-4 overflow-hidden">
        <div
          className={cn(
            rolesQuery.isFetching && "opacity-60",
            "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={rolesQuery.isFetching}
            onChange={(e) => setSearch(e.target.value)}
            className="h-full w-full text-sm text-slate-500 outline-none"
            type="text"
            placeholder="Buscar..."
          />
          <div className="flex items-center gap-1">
            <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
              Ctrl
            </div>
            <p className="text-xs text-slate-500">+</p>
            <div className="flex h-5 items-center rounded-md border border-slate-300 bg-slate-50 px-1 py-0.5 text-xs font-medium text-slate-500">
              F
            </div>
          </div>
        </div>
      </div>

      <div className="h-full w-full overflow-y-auto">
        <ul className="flex h-auto w-full flex-wrap items-center gap-3">
          {rolesQuery.isFetching || permissionsQuery.isFetching ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-28 w-64 animate-pulse rounded-md bg-slate-200"
              />
            ))
          ) : rolesQuery.isError ? (
            <ErrorMessage error={rolesQuery.error} />
          ) : permissionsQuery.isError ? (
            <ErrorMessage error={permissionsQuery.error} />
          ) : filteredRoles.length === 0 && search !== "" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <SearchXIcon className="size-16 min-w-16 text-slate-400" />
              <p className="text-slate-400">
                No hay resultados para <b> {search}</b>...
              </p>
            </div>
          ) : (
            filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                permissionsCount={role.permissions.length ?? 0}
                allPermissionsCount={permissionsCount ?? 0}
                roleToUpdate={setRoleToUpdate}
                roleToDelete={setRoleToDelete}
              />
            ))
          )}
        </ul>
      </div>

      {isRoleCreateOpen && (
        <CreateRoleModal
          isOpen={isRoleCreateOpen}
          onClose={() => setIsRoleCreateOpen(false)}
        />
      )}

      {roleToUpdate && (
        <UpdateRoleModal
          isOpen={!!roleToUpdate}
          onClose={() => setRoleToUpdate(undefined)}
          role={roleToUpdate}
        />
      )}

      {roleToDelete && (
        <DeleteRoleModal
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(undefined)}
          role={roleToDelete}
        />
      )}
    </section>
  );
}

const RoleCard = ({
  role,
  permissionsCount,
  allPermissionsCount,
  roleToUpdate,
  roleToDelete,
}: {
  role: Role;
  permissionsCount: number;
  allPermissionsCount: number;
  roleToUpdate: Dispatch<SetStateAction<Role | undefined>>;
  roleToDelete: Dispatch<SetStateAction<Role | undefined>>;
}) => {
  return (
    <li className="to-slate/100 flex min-w-72 flex-col gap-4 rounded-md border border-slate-300/50 bg-white px-2.5 py-2">
      <div className="flex w-full items-center justify-between">
        <span className="font-medium text-slate-400">{role.name}</span>

        <Dropdown radius="sm" placement="bottom">
          <DropdownTrigger>
            <div className="cursor-pointer rounded-md border border-slate-200 p-1.5 transition-colors hover:border-slate-300">
              <EllipsisVerticalIcon className="size-5 min-w-5 text-slate-400" />
            </div>
          </DropdownTrigger>
          <DropdownMenu className="flex p-1.5">
            {/* Update cashbox option */}
            <DropdownItem
              key="update-cashbox"
              textValue="Editar rol"
              onClick={() => roleToUpdate(role)}
              classNames={{
                title: "!flex !items-center gap-1",
                base: [
                  "rounded-md p-2 font-medium transition-colors",
                  "text-slate-400/70",
                  "data-[hover=true]:bg-slate-300/30",
                  "data-[hover=true]:text-slate-400",
                ].join(" "),
              }}
              className="cursor-pointer p-2 font-medium text-slate-400 transition-all hover:rounded-md hover:bg-slate-100 hover:text-slate-500"
            >
              <SquarePenIcon className="size-3.5 min-w-3.5" />
              <p className="text-xs">Editar rol</p>
            </DropdownItem>

            <DropdownItem
              key="disabled-cashbox"
              textValue="Eliminar rol"
              onClick={() => roleToDelete(role)}
              classNames={{
                title:
                  "!flex !items-center gap-1 !hover:bg-red-500/10 !hover:text-red-500",

                base: [
                  "rounded-md p-2 font-medium transition-colors",
                  "text-danger",
                  "data-[hover=true]:!bg-danger/10",
                  "data-[hover=true]:!text-danger",
                ].join(" "),
                description: "!hover:bg-red-500/10 !hover:text-red-500",
                shortcut: "!hover:bg-red-500/10 !hover:text-red-500",
              }}
              className="!hover:bg-red-500 cursor-pointer p-2 font-semibold text-red-500 transition-all hover:rounded-md"
            >
              <Trash2Icon className="size-3.5 min-w-3.5" />
              <p className="text-xs">Eliminar rol</p>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between text-slate-400/70">
          <div className="flex items-center gap-1 text-sm">
            <KeyRoundIcon className="size-4 min-w-4 text-slate-300" />
            Permisos
          </div>
          {permissionsCount} de {allPermissionsCount}
        </div>

        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UsersRoundIcon className="size-3.5 min-w-3.5 translate-y-px text-slate-400/70" />
            <span className="text-sm text-slate-400/70">Usuarios</span>
          </div>

          {role.users.length === 0 ? (
            <div className="flex items-end gap-1 text-xs text-slate-400/70">
              <CircleOffIcon className="size-4 min-w-4" />
              Sin usuarios asignados
            </div>
          ) : (
            <div className="flex w-full max-w-16 items-center justify-end">
              <ul className="group relative flex w-fit items-center pl-1">
                {role.users.map((user, index) => {
                  const lettersUser =
                    user && user?.name?.split(" ")[1]
                      ? `${user?.name?.split(" ")[0][0]}${
                          user?.name?.split(" ")[1][0]
                        }`
                      : `${user?.name?.split(" ")[0][0]}`;
                  return (
                    <li
                      style={{
                        zIndex: index,
                      }}
                      key={index}
                      data-tooltip-place="top"
                      data-tooltip-id={`user-${user.id}`}
                      className="group-hover:bg-secondary-green/70 hover:!border-secondary-green/10 -ml-1 flex size-[22px] cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white bg-primary p-0.5 transition-all hover:!z-50 hover:scale-[2px] hover:!bg-primary group-hover:border-white"
                    >
                      <p className="text-[0.54rem] uppercase text-white">
                        {lettersUser}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};
