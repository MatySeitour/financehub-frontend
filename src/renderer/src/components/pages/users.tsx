/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  KeyRoundIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";

import { TableWork } from "@renderer/components/Table";
import {
  getUsersOrganization,
  UsersByOrganization,
} from "@renderer/hooks/user";
import { CreateUserModal, UpdateUserModal } from "../modals/onboarding";

/* UTILS*/
//Clients table's columns
const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: UsersByOrganization) => item.name,
  },
  {
    label: "Email",
    key: "address",
    render: (item: UsersByOrganization) => item.email,
  },
  {
    label: "Rol",
    key: "phone",
    render: (item: UsersByOrganization) => (
      <div className="flex items-center gap-1 font-semibold uppercase text-slate-400">
        <KeyRoundIcon className="size-3.5 min-w-3.5 text-slate-400/80" />
        {item.role.name}

        {item.isOwner && <span className="text-primary">(Dueño)</span>}
      </div>
    ),
  },
];

//Component starts here
export function UsersSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [isUserCreateOpen, setIsUserCreateOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<UsersByOrganization>();
  // const [userToDelete, setUserToDelete] = useState<UsersByOrganization>();

  /* QUERIES */
  //
  const usersQuery = useQuery<
    Awaited<ReturnType<typeof getUsersOrganization>>,
    ServerError
  >({
    queryFn: () => getUsersOrganization(),
    queryKey: ["users-organization", "all"],
  });

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

  const filteredUsers = useMemo(() => {
    if (!usersQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return usersQuery?.data?.filter((user) => {
      let searched = `${user.name}${user.role}${user.email}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [usersQuery.data, search]);

  const actionOptions: MenuOption<UsersByOrganization>[] = [
    {
      name: "Editar",
      icon: SquarePenIcon,
      onAction: (user) => setUserToUpdate(user),
    },
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: () => console.log(),
      // onAction: (user) => setUserToDelete(user),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col gap-4 px-4">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex max-h-12 min-h-12 w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <UsersRoundIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Usuarios</h1>
        </div>
        <Button
          onClick={() => setIsUserCreateOpen(true)}
          disabled={usersQuery.isLoading || usersQuery.isError}
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar usuario
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
        <div
          className={cn(
            usersQuery.isFetching && "opacity-60",
            "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={usersQuery.isFetching}
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

        {/* TABLE'S CONTAINER */}
        <TableWork
          columns={COLUMNS}
          loading={usersQuery.isFetching}
          error={usersQuery.error}
          searchInput={search}
          data={filteredUsers}
          openModal={() => setIsUserCreateOpen(true)}
          optionsMenu={actionOptions}
        />
      </div>

      {/* ADD USER MODAL */}
      {isUserCreateOpen && usersQuery.data && (
        <CreateUserModal
          isOpen={isUserCreateOpen}
          onClose={() => setIsUserCreateOpen(false)}
        />
      )}

      {userToUpdate && (
        <UpdateUserModal
          user={userToUpdate}
          isOpen={!!userToUpdate}
          onClose={() => setUserToUpdate(undefined)}
        />
      )}
    </section>
  );
}
