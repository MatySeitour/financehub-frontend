/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";
import {
  BanknoteArrowUpIcon,
  CircleCheckBigIcon,
  CircleDotDashedIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Undo2Icon,
  UsersRoundIcon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import { TableWork } from "@renderer/components/Table";
import { useNavigate, useParams } from "react-router";
import {
  CheckingAccount,
  getCheckingAccountsClient,
} from "@renderer/hooks/checkingAccounts";
import { z } from "zod";
import { format } from "date-fns";
import {
  CreateCheckingAccountModal,
  DeleteCheckingAccountModal,
  PaidCheckingAccountModal,
  UpdateCheckingAccountModal,
} from "@renderer/components/modals/checkingAccounts";
import { getCashboxes } from "@renderer/hooks/cashboxes";
import { Tooltip } from "@heroui/react";

const COLUMNS = [
  {
    label: "Fecha de generación",
    key: "loanDate",
    render: (item: CheckingAccount) => format(item.loanDate, "dd/MM/yyyy"),
  },
  {
    label: "Monto a transferir",
    key: "amountBorrowed",
    render: (item: CheckingAccount) => (
      <span className="font-medium text-warning">
        ${item.amountBorrowed.toLocaleString("es-AR")}
      </span>
    ),
  },
  {
    label: "Monto a recibir",
    key: "amountGross",
    render: (item: CheckingAccount) => (
      <span className="font-medium text-primary">
        ${item.amountGross.toLocaleString("es-AR")}
      </span>
    ),
  },
  {
    label: "Porcentaje",
    key: "percentage",
    render: (item: CheckingAccount) => `%${item.percentage}`,
  },
  {
    label: "Pagado",
    key: "isPaid",
    render: (item: CheckingAccount) =>
      item.isPaid ? (
        <div className="flex items-center gap-1.5 text-sm text-primary">
          <CircleCheckBigIcon className="size-4 min-w-4" />
          Pagado
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-yellow-500">
          <CircleDotDashedIcon className="size-4 min-w-4" />
          Pendiente
        </div>
      ),
  },
];

//Component starts here
export function CheckingAccountClientSection() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isValidClientID = z.string().catch("").parse(id);
  const clientID = +isValidClientID;

  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [isCreateCheckingAccount, setIsCreateCheckingAccountOpen] =
    useState(false);
  const [checkingAccountToUpdate, setCheckingAccountToUpdate] =
    useState<CheckingAccount>();
  const [checkingAccountToDelete, setCheckingAccountToDelete] =
    useState<CheckingAccount>();
  const [checkingAccountToPaid, setCheckingAccountToPaid] =
    useState<CheckingAccount>();

  const checkingAccountsQuery = useQuery<
    Awaited<ReturnType<typeof getCheckingAccountsClient>>,
    ServerError
  >({
    queryFn: () => getCheckingAccountsClient(clientID),
    queryKey: ["checking-account-client", clientID],
  });

  const cashboxesQuery = useQuery<
    Awaited<ReturnType<typeof getCashboxes>>,
    ServerError
  >({
    queryKey: ["cashboxes", "all"],
    queryFn: getCashboxes,
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

  const filteredCheckingAccounts = useMemo(() => {
    if (!checkingAccountsQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return checkingAccountsQuery?.data?.filter((checkingAccount) => {
      let searched = `${checkingAccount.client.name}${checkingAccount.amountBorrowed}${checkingAccount.amountGross}${checkingAccount.loanDate}${checkingAccount.percentage}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [checkingAccountsQuery.data, search]);

  const options: MenuOption<CheckingAccount>[] = [
    {
      name: "Pagar",
      icon: BanknoteArrowUpIcon,
      onAction: (item) => setCheckingAccountToPaid(item),
      isDisabled: (item) => !item?.isPaid,
    },
    {
      name: "Editar",
      icon: Trash2Icon,
      onAction: (item) => setCheckingAccountToUpdate(item),
      isDisabled: (item) => !item?.isPaid,
    },
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: (item) => setCheckingAccountToDelete(item),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Tooltip
            closeDelay={0}
            className="rounded-md border-slate-400 text-xs text-slate-400"
            content="Volver"
          >
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer p-1.5 text-slate-300 transition-all hover:text-slate-400"
            >
              <Undo2Icon className="size-5 min-w-5" />
            </div>
          </Tooltip>
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
              <UsersRoundIcon className="size-5 min-w-5" />
            </div>
            <h1 className="text-xl font-semibold text-slate-500">
              Cuenta corriente de{" "}
              {checkingAccountsQuery.data
                ? checkingAccountsQuery.data[0].client.name
                : ""}
            </h1>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateCheckingAccountOpen(true)}
          disabled={
            checkingAccountsQuery.isLoading || checkingAccountsQuery.isError
          }
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar CTA/CTE
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        <div
          className={cn(
            checkingAccountsQuery.isFetching && "opacity-60",
            "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={checkingAccountsQuery.isFetching}
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
          loading={checkingAccountsQuery.isFetching}
          error={checkingAccountsQuery.error}
          searchInput={search}
          data={filteredCheckingAccounts}
          openModal={() => setIsCreateCheckingAccountOpen(true)}
          optionsMenu={options}
        />
      </div>

      {isCreateCheckingAccount && checkingAccountsQuery.data && (
        <CreateCheckingAccountModal
          isOpen={isCreateCheckingAccount}
          onClose={() => setIsCreateCheckingAccountOpen(false)}
          client={{
            id: clientID,
            name: checkingAccountsQuery.data[0].client.name,
          }}
          cashboxes={cashboxesQuery.data ?? []}
        />
      )}

      {checkingAccountToUpdate && checkingAccountsQuery.data && (
        <UpdateCheckingAccountModal
          isOpen={!!checkingAccountToUpdate}
          onClose={() => setCheckingAccountToUpdate(undefined)}
          client={{
            id: clientID,
            name: checkingAccountsQuery.data[0].client.name,
          }}
          cashboxes={cashboxesQuery.data ?? []}
          checkingAccount={checkingAccountToUpdate}
        />
      )}

      {checkingAccountToDelete && checkingAccountsQuery.data && (
        <DeleteCheckingAccountModal
          isOpen={!!checkingAccountToDelete}
          onClose={() => setCheckingAccountToDelete(undefined)}
          checkingAccount={checkingAccountToDelete}
        />
      )}

      {checkingAccountToPaid && checkingAccountsQuery.data && (
        <PaidCheckingAccountModal
          isOpen={!!checkingAccountToPaid}
          onClose={() => setCheckingAccountToPaid(undefined)}
          checkingAccount={checkingAccountToPaid}
        />
      )}
    </section>
  );
}
