import { ContextMenuState, MenuOption } from "@renderer/utils/types";
import {
  closeContextMenuHandler,
  cn,
  dynamicSort,
  openContextMenuHandler,
} from "@renderer/utils/index";
import {
  HeaderCellSort,
  useSort,
} from "@table-library/react-table-library/sort";
import {
  Table,
  Header,
  HeaderRow,
  Body,
  Row,
  Cell,
  TableNode,
} from "@table-library/react-table-library/table";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { ErrorResponse, ModalState } from "@renderer/utils/types";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";
import { Button } from "@heroui/react";
import {
  ArrowDownAZIcon,
  ArrowUpAZIcon,
  ArrowUpDownIcon,
  CircleAlertIcon,
  GlobeLockIcon,
  Grid2x2PlusIcon,
  PlusIcon,
  SearchXIcon,
} from "lucide-react";

type Column<T> = {
  label: string | ReactNode;
  key: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  enabledContextMenu?: (bol?: any) => void;
};

type TableProps<T extends TableNode> = {
  data: T[] | undefined;
  loading: boolean;
  error: any;
  searchInput: string;
  columns: Column<T>[];
  optionsMenu?: MenuOption[] | null;
  openModal: ((s: ModalState) => void) | null;
  selectRowID?: Dispatch<SetStateAction<number | undefined>>;
};

function TableWork<T extends TableNode>({
  columns,
  optionsMenu,
  openModal,
  selectRowID,
  loading,
  error,
  searchInput,
  data,
}: TableProps<T>) {
  const table = useRef(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    visible: false,
  });
  const columnsLength = columns.length - 1;

  let percentageNumber = "";

  if (!percentageNumber) {
    for (let i = 0; i < columnsLength; i++) {
      percentageNumber += "15% ";
    }
  }

  const useTableTheme = () => {
    return useTheme([
      getTheme(),
      {
        Table: `
          --data-table-library_grid-template-columns:  ${percentageNumber} minmax(150px, 1fr);
            overflow-y: auto;
        `,
      },
    ]);
  };

  const theme = useTableTheme();

  const sortFns = columns.reduce((acc: any, column: any) => {
    acc[column.key] = (array: any[]) => dynamicSort(array, column.key, "asc");
    return acc;
  }, {});

  const sort = useSort(
    { nodes: data || [] },
    {
      onChange: undefined,
    },
    {
      sortIcon: {
        margin: "6px",
        iconDefault: <ArrowUpDownIcon className="size-4 min-w-4" />,
        iconUp: <ArrowUpAZIcon className="size-4 min-w-4" />,
        iconDown: <ArrowDownAZIcon className="size-4 min-w-4" />,
      },
      sortFns,
    },
  );

  if (loading) {
    return <TableLoading />;
  }

  if (error) {
    return <TableError error={error} />;
  }

  if (data?.length === 0 && searchInput === "") {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <Grid2x2PlusIcon className="size-24 text-slate-500" />
        <p className="text-lg text-slate-500">No hay datos cargados aún</p>
        <Button
          className="flex w-64 items-center gap-1"
          onClick={() => openModal && openModal("agregar")}
        >
          <PlusIcon className="h-4 w-4" />
          Agregar
        </Button>
      </div>
    );
  }

  if (data?.length === 0 && searchInput !== "") {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <SearchXIcon className="size-20 text-slate-600" />
        <p className="text-slate-600">
          No hay resultados para <b> {searchInput}</b>...
        </p>
      </div>
    );
  }

  return (
    <>
      {data?.length !== 0 && (
        <>
          <Table
            ref={table}
            id="table-container"
            layout={
              columnsLength > 4
                ? { custom: true, horizontalScroll: true }
                : undefined
            }
            sort={sort}
            data={{ nodes: data }}
            theme={theme}
          >
            {(tableList: T[]) => (
              <>
                <Header>
                  <HeaderRow className="!uppercase !text-slate-500">
                    {columns.map((column, index) => (
                      <HeaderCellSort
                        className={cn(
                          "!h-12 border-b border-t border-slate-200 !bg-slate-100 !text-xs",
                          index === 0 && "rounded-tl-md border-l",
                          index === columns.length - 1 &&
                            "custom-header-last rounded-tr-md border-r",
                        )}
                        resize={index === columns.length - 1 ? false : true}
                        sortKey={column.key}
                        key={column.key}
                      >
                        {column.label}
                      </HeaderCellSort>
                    ))}
                  </HeaderRow>
                </Header>
                <Body>
                  {tableList.map((item, index) => (
                    <Row
                      id={`row-${item.id}`}
                      className={cn(
                        "cursor-pointer text-xs transition-colors hover:bg-slate-200/20",
                      )}
                      onClick={(item, e) => {
                        const hasEnableMenu = columns.some(
                          (column) => column.enabledContextMenu,
                        );

                        const enableMenu = columns.some((column) =>
                          column.enabledContextMenu
                            ? column.enabledContextMenu(item)
                            : false,
                        );

                        if (enableMenu || !hasEnableMenu) {
                          selectRowID && selectRowID(Number(item.id));
                          openContextMenuHandler(e, setContextMenu);
                        }
                      }}
                      onDoubleClick={(item) => {
                        const hasEnableMenu = columns.some(
                          (column) => column.enabledContextMenu,
                        );

                        const enableMenu = columns.some((column) =>
                          column.enabledContextMenu
                            ? column.enabledContextMenu(item)
                            : false,
                        );

                        if (enableMenu || !hasEnableMenu) {
                          closeContextMenuHandler(setContextMenu);
                          selectRowID && selectRowID(Number(item.id));
                          openModal && openModal("editar");
                        }
                      }}
                      key={item.id}
                      item={item}
                    >
                      {columns.map((column) => (
                        <Cell
                          className={cn(
                            index === tableList.length - 1 &&
                              "first:rounded-bl-md last:rounded-br-md",
                            "!h-12 min-h-12 border-b !border-slate-300/70 text-xs text-slate-400 first:!border-l last:!border-r",
                            column.className,
                          )}
                          key={`${item.id}-${column.key}`}
                        >
                          {column.render
                            ? column.render(item)
                            : item[column.key]}
                        </Cell>
                      ))}
                    </Row>
                  ))}
                </Body>
              </>
            )}
          </Table>

          {contextMenu.show && openModal && optionsMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              isOpen={contextMenu.show && contextMenu.visible}
              onCloseContextMenu={() => closeContextMenuHandler(setContextMenu)}
              options={optionsMenu}
              parentRef={table}
            />
          )}
        </>
      )}
    </>
  );
}

export function TableLoading() {
  return (
    <div className="h-80 w-full">
      <div className="h-10 rounded-md border border-slate-200 !bg-slate-200/40"></div>
      <div className="grid grid-cols-6 gap-4 bg-white pt-2">
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="h-8 w-full animate-skeletonTable rounded-md bg-slate-200/80"></div>
        </div>
      </div>
    </div>
  );
}

function TableError({ error }: { error: ErrorResponse }) {
  if (error.code === "connection-error") {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <GlobeLockIcon className="h-20 w-20 text-red-500" />
        <h4 className="text-xl text-red-500">
          Ha ocurrido un error de conexión
        </h4>
      </div>
    );
  }

  if (error.code === "zod_validation") {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <CircleAlertIcon className="h-20 w-20 text-red-500" />
        <h4 className="text-xl text-red-500">{error?.message}</h4>
      </div>
    );
  }

  // if (error.code === "unauthorized") {
  //   return (
  //     <Modal className="max-w-lg" isOpen={true}>
  //       <div className="flex h-full min-h-72 w-full flex-col items-center justify-center gap-8">
  //         <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-200/40 p-2 shadow-sm">
  //           <FaUserLargeSlash className="size-12 min-w-12 text-red-500" />
  //         </div>
  //         <div className="flex flex-col items-center justify-center gap-2">
  //           <p className="text-2xl font-semibold text-slate-600">
  //             Parece que tu sesión ha expirado
  //           </p>
  //           <p className="text-sm font-medium text-slate-500">
  //             Por favor, vuelve a iniciar sesión
  //           </p>
  //         </div>
  //         <Button
  //           onClick={() => router.push("/login")}
  //           className="w-full"
  //           size={"lg"}
  //           color="primary"
  //         >
  //           Iniciar sesión
  //         </Button>
  //       </div>
  //     </Modal>
  //   );
  // }

  return (
    <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
      <CircleAlertIcon className="h-20 w-20 text-red-500" />
      <h4 className="text-xl text-red-500">
        Ha ocurrido un error en el servidor
      </h4>
    </div>
  );
}

export { TableWork };

function ContextMenu({
  x,
  y,
  onCloseContextMenu,
  options,
  isOpen,
}: {
  x: number;
  y: number;
  onCloseContextMenu: any;
  parentRef: any;
  options: MenuOption[];
  isOpen: boolean;
}) {
  // const router = useRouter();
  const menuStyle = {
    top: `${y}px`,
    left: `${x}px`,
  };

  useEffect(() => {
    const clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const contextMenu = document.getElementById("menuOptions");
      const modalContainer = document.getElementById("modal-container");

      const isInsideTableHeadRow = target.closest('[role="gridcell"]');
      const isInsideModal = modalContainer?.contains(target);

      if (
        !contextMenu?.contains(target) &&
        !isInsideTableHeadRow &&
        !isInsideModal
      ) {
        onCloseContextMenu();

        const elementSelected =
          document.getElementsByClassName("row-selected")[0];
        if (elementSelected) {
          elementSelected.classList.remove("row-selected");
        }
      }
    };

    document.addEventListener("mousedown", clickListener);

    return () => {
      document.removeEventListener("mousedown", clickListener);
    };
  }, []);

  const handleMenuClick = (option: MenuOption) => {
    option.onAction();

    onCloseContextMenu();
    // router.push(`${option.route}`);
  };

  const closeMenuWhenSelectOption = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if ((event.target as HTMLDivElement).closest(".menu-option") !== null) {
      onCloseContextMenu();
    }
  };

  return (
    <>
      <div
        style={menuStyle}
        onClick={(e) => closeMenuWhenSelectOption(e)}
        id="menuOptions"
        className={cn(
          "pointer-events-none absolute top-0 z-[999999] h-auto w-auto min-w-40 translate-x-2 overflow-hidden rounded-md border border-slate-200 bg-white p-1 opacity-0 shadow-xl",
          isOpen && "pointer-events-auto opacity-100 transition-opacity",
        )}
      >
        <span className="select-none pl-2 text-[0.65rem] font-medium text-slate-500">
          Acciones
        </span>
        <ul className="flex h-full w-full flex-col gap-0.5 px-1 pt-2 text-slate-400">
          {options.map((option: any) => (
            <li
              onClick={() => {
                handleMenuClick(option);
              }}
              className={cn(
                "menu-option flex w-full cursor-pointer items-center justify-start gap-2 rounded-sm p-2 text-xs hover:bg-slate-200/40",
                (option.name.toLowerCase() === "eliminar" ||
                  option?.state === "danger") &&
                  "hover:bg-red-200/40",
                option?.state === "success" && "hover:bg-green-200/30",
              )}
              key={option.name}
            >
              {option.icon && (
                <option.icon
                  className={cn(
                    "size-4 min-w-4 text-slate-400",
                    option.name.toLowerCase() === "eliminar" && "text-red-400",
                  )}
                />
              )}
              <p
                className={cn(
                  "tracking-wide",
                  (option.name.toLowerCase() === "eliminar" ||
                    option?.state === "danger") &&
                    "text-red-400",
                  option?.state === "success" && "text-secondary-green",
                )}
              >
                {option.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
