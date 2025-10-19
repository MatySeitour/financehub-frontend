/* IMPORTS */
import { useRef, useState, useEffect, useMemo } from "react";
import { MenuOption, ServerError } from "@renderer/utils/types";
import { useQuery } from "react-query";

import {
  HandCoinsIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import { cn, strNormalize } from "@renderer/utils";
import { Button } from "@renderer/components/Button";
import { TableWork } from "@renderer/components/Table";
import { useNavigate } from "react-router";
import { getSellers, Seller } from "@renderer/hooks/sellers";
import {
  CreateSellerModal,
  DeleteSellerModal,
  UpdateSellerModal,
} from "../../modals/sellers";

const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: Seller) => item.name,
  },
  {
    label: "Numero de telefono",
    key: "phone",
    render: (item: Seller) => item.phone,
  },
  {
    label: "Informacion adicional",
    key: "info",
    render: (item: Seller) => item.info ?? "-",
  },
];

//Component starts here
export function SellersSection() {
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isSellerCreateOpen, setIsSellerCreateOpen] = useState(false);
  const [sellerToUpdate, setSellerToUpdate] = useState<Seller>();
  const [sellerToDelete, setSellerToDelete] = useState<Seller>();

  /* QUERIES */
  //
  const sellersQuery = useQuery<
    Awaited<ReturnType<typeof getSellers>>,
    ServerError
  >({
    queryFn: () => getSellers(),
    queryKey: ["sellers", "all"],
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

  const filteredSellerss = useMemo(() => {
    if (!sellersQuery?.data) return [];

    const normalizedFilter = strNormalize(search).toLowerCase();

    return sellersQuery?.data?.filter((seller) => {
      let searched = `${seller.name}${seller.info}${seller.referred_to?.name}${seller.phone}`;

      return strNormalize(searched).toLowerCase().includes(normalizedFilter);
    });
  }, [sellersQuery.data, search]);

  const actionOptions: MenuOption<Seller>[] = [
    {
      name: "Detalles",
      icon: PaperclipIcon,
      onAction: (seller) => navigate(`/sellers/${seller?.id}/details`),
    },
    {
      name: "Editar",
      icon: SquarePenIcon,
      onAction: (seller) => setSellerToUpdate(seller),
    },
    {
      name: "Eliminar",
      icon: Trash2Icon,
      onAction: (seller) => setSellerToDelete(seller),
    },
  ];

  return (
    <section className="flex h-full w-full flex-col">
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex h-16 w-full items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-primary-50 bg-primary/5 p-1.5 text-primary">
            <HandCoinsIcon className="size-5 min-w-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-500">Vendedores</h1>
        </div>
        <Button
          onClick={() => setIsSellerCreateOpen(true)}
          disabled={sellersQuery.isLoading || sellersQuery.isError}
          variant="success"
          className="flex h-8 w-44 items-center gap-1 pr-5"
        >
          <PlusIcon className="size-4 min-w-4" />
          Agregar vendedor
        </Button>
      </div>

      <div className="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
        <div
          className={cn(
            sellersQuery.isFetching && "opacity-60",
            "flex h-9 min-h-8 w-96 items-center gap-2 rounded-md border border-slate-300/70 bg-white px-3 py-2 transition-all focus-within:border-primary",
          )}
        >
          <SearchIcon className="size-4 min-w-4 text-slate-400" />
          <input
            ref={searchRef}
            disabled={sellersQuery.isFetching}
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
          loading={sellersQuery.isFetching}
          error={sellersQuery.isError}
          searchInput={search}
          data={filteredSellerss}
          openModal={() => setIsSellerCreateOpen(true)}
          optionsMenu={actionOptions}
        />
      </div>

      {/* ADD SELLER MODAL */}
      {isSellerCreateOpen && sellersQuery.data && (
        <CreateSellerModal
          isOpen={isSellerCreateOpen}
          onClose={() => setIsSellerCreateOpen(false)}
        />
      )}

      {/* ADD SELLER MODAL */}
      {sellerToUpdate && sellersQuery.data && (
        <UpdateSellerModal
          isOpen={!!sellerToUpdate}
          seller={sellerToUpdate}
          onClose={() => setSellerToUpdate(undefined)}
        />
      )}
      {/* ADD SELLER MODAL */}
      {sellerToDelete && sellersQuery.data && (
        <DeleteSellerModal
          isOpen={!!sellerToDelete}
          seller={sellerToDelete}
          onClose={() => setSellerToDelete(undefined)}
        />
      )}
    </section>
  );
}
