/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";

import {
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import {
  CreateClientModal,
  DeleteClientModal,
  UpdateClientModal,
} from "@renderer/components/modals/clients";
import { TableWork } from "@renderer/components/Table";
import { useNavigate } from "react-router";
import { Client, getClients } from "@renderer/hooks/clients";

/* UTILS*/
//Clients table's columns
const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: Client) => item.name,
  },
  {
    label: "Direccion",
    key: "address",
    render: (item: Client) => item.address,
  },
  {
    label: "Numero de telefono",
    key: "phone",
    render: (item: Client) => item.phone,
  },
  {
    label: "Referido por",
    key: "referred_to",
    render: (item: Client) => item.referred_to?.name ?? "-",
  },
  {
    label: "Informacion adicional",
    key: "info",
    render: (item: Client) => item.info ?? "-",
  },
];

//Component starts here
export function ClientSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isClientCreateOpen, setIsClientCreateOpen] = useState(false);
  const [clientToUpdate, setClientToUpdate] = useState<Client>();
  const [clientToDelete, setClientToDelete] = useState<Client>();

  /* QUERIES */
  //
  const clientsQuery = useQuery<
    Awaited<ReturnType<typeof getClients>>,
    ServerError
  >({
    queryFn: () => getClients(),
    queryKey: ["clients", "all"],
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

  const filteredClients = useMemo(() => {
    if (!clientsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return clientsQuery?.data?.filter((client) => {
      let searched = `${client.name}${client.info}${client.address}${client.phone}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [clientsQuery.data, search]);

  const actionOptions: MenuOption<Client>[] = [
    {
      name: "Detalles",
      icon: PaperclipIcon,
      onAction: (client) => navigate(`/clientes/${client?.id}/detalles`),
    },
    {
      name: "Editar",
      icon: SquarePenIcon,
      onAction: (client) => setClientToUpdate(client),
    },
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: (client) => setClientToDelete(client),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <UsersRoundIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Clientes</h1>
        </div>
        <Button
          onClick={() => setIsClientCreateOpen(true)}
          disabled={clientsQuery.isLoading || clientsQuery.isError}
          variant="success"
          className="flex h-8 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar cliente
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden px-6 pt-4">
        <div
          className="flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary" //{cn(cashboxesQuery.isFetching && "opacity-60",
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={clientsQuery.isFetching}
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
          loading={clientsQuery.isFetching}
          error={clientsQuery.error}
          searchInput={search}
          data={filteredClients}
          openModal={() => setIsClientCreateOpen(true)}
          optionsMenu={actionOptions}
        />
      </div>

      {/* ADD CLIENT MODAL */}
      {isClientCreateOpen && clientsQuery.data && (
        <CreateClientModal
          isOpen={isClientCreateOpen}
          onClose={() => setIsClientCreateOpen(false)}
        />
      )}

      {/* ADD CLIENT MODAL */}
      {clientToUpdate && clientsQuery.data && (
        <UpdateClientModal
          isOpen={!!clientToUpdate}
          client={clientToUpdate}
          onClose={() => setClientToUpdate(undefined)}
        />
      )}
      {/* ADD CLIENT MODAL */}
      {clientToDelete && clientsQuery.data && (
        <DeleteClientModal
          isOpen={!!clientToDelete}
          client={clientToDelete}
          onClose={() => setClientToDelete(undefined)}
        />
      )}
    </section>
  );
}
