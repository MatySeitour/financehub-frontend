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
  forwardRef,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import {
  ContextMenuState,
  MenuOption,
  ModalState,
} from "@renderer/utils/types";
import { PiTableLight } from "react-icons/pi";
import { LuPlus } from "react-icons/lu";
import { MdError } from "react-icons/md";
import { TbWorldCancel } from "react-icons/tb";
import { useTheme } from "@table-library/react-table-library/theme";
import { getTheme } from "@table-library/react-table-library/baseline";

type Column<T> = {
  label: string;
  key: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
};

type TableWorkingProps<T extends TableNode> = {
  data: T[] | undefined;
  // query: UseQueryResult<T[] | undefined, any>; // DESCOMENTAR CUANDO HAYA BACKEND
  query: any;
  columns: Column<T>[];
  optionsMenu?: MenuOption[] | null;
  openModal: ((s: ModalState) => void) | null;
  selectRowID: Dispatch<SetStateAction<number | undefined>>;
};

interface ContextMenuProps {
  x: number;
  y: number;
  onCloseContextMenu: () => void;
  parentRef: React.RefObject<HTMLElement>;
  options: Array<MenuOption>;
  setModalState: (state: ModalState) => void;
  isOpen: boolean;
}

function TableWorking<T extends TableNode>({
  columns,
  optionsMenu,
  openModal,
  selectRowID,
  query,
  data,
}: TableWorkingProps<T>) {
  const table = useRef<HTMLDivElement>(null);
  const menuRef = useRef(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    show: false,
    x: 0,
    y: 0,
    visible: false,
  });
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleRowClick = (rowId: number) => {
    setSelectedRow((prev) => (prev === rowId ? null : rowId));
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (table.current && !table.current.contains(event.target as Node)) {
      setSelectedRow(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

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
        HeaderRow: `
            color: #687387;
            font-size: 12px;
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
            border-top: 1px solid red;
          `,

        Table: `
          --data-table-library_grid-template-columns:  ${percentageNumber} minmax(150px, 1fr);
          overflow-y: auto;
          height: 100%;
        `,
        Header: `
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
          `,
        Row: `
            border-right: 1px solid #dddc;
          `,
        Cell: `
            padding: 6px;
            color: #8b94a5;
            font-weight: 500;
          `,
        HeaderCell: `
            font-weight: 500;
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
        margin: "0px",
        iconDefault: <FaSort fontSize="small" />,
        iconUp: <FaSortUp fontSize="small" />,
        iconDown: <FaSortDown fontSize="small" />,
      },
      sortFns,
    },
  );

  if (query.isLoading || query.isFetching) {
    return <TableLoading />;
  }

  if (query.error) {
    return <TableError error={query.error} />;
  }

  if (query.data?.length === 0) {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <div>
          <PiTableLight className="h-24 w-24 text-slate-500" />
        </div>
        <p className="text-lg text-slate-500">No hay datos cargados aún</p>
        <button
          className="flex w-64 items-center gap-1"
          onClick={() => openModal && openModal("agregar")}
        >
          <LuPlus className="h-4 w-4" />
          Agregar
        </button>
      </div>
    );
  }

  return (
    <article className="h-full w-full overflow-hidden p-4">
      <div
        className="h-full max-h-full overflow-auto"
        ref={table}
        onClick={(e: any) => {
          openContextMenuHandler(e, setContextMenu);
        }}
        id="table-container"
      >
        <Table
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
                <HeaderRow>
                  {columns.map((column, index) => (
                    <HeaderCellSort
                      className={cn(
                        "h-10 border-b border-t border-slate-200 !bg-slate-100",
                        index === 0 && "rounded-l-md border-l",
                        index === columns.length - 1 &&
                          "custom-header-last rounded-r-md border-r",
                      )}
                      resize={index === columns.length - 1 ? false : true}
                      sortKey={column.key}
                      key={column.label}
                    >
                      {column.label}
                    </HeaderCellSort>
                  ))}
                </HeaderRow>
              </Header>
              <Body>
                {tableList.map((item) => (
                  <Row
                    className={cn(
                      "cursor-pointer text-xs transition-colors hover:bg-slate-200/50",
                      selectedRow === item.id && "!bg-slate-200/50",
                    )}
                    onClick={(item) => {
                      selectRowID(Number(item.id));
                      handleRowClick(Number(item.id));
                    }}
                    key={item.id}
                    item={item}
                  >
                    {columns.map((column) => (
                      <Cell
                        className={cn("h-12 text-xs", column.className)}
                        key={`${item.id}-${column.key}`}
                      >
                        {column.render ? column.render(item) : item[column.key]}
                      </Cell>
                    ))}
                  </Row>
                ))}
              </Body>
            </>
          )}
        </Table>
      </div>
      {contextMenu.show && openModal && optionsMenu && (
        <ContextMenu
          ref={menuRef}
          x={contextMenu.x}
          y={contextMenu.y}
          isOpen={contextMenu.show && contextMenu.visible}
          setModalState={openModal}
          onCloseContextMenu={() => closeContextMenuHandler(setContextMenu)}
          options={optionsMenu}
          parentRef={table}
        />
      )}
    </article>
  );
}

function TableLoading() {
  return (
    <div className="h-80 w-full">
      <div className="h-10 rounded-md border border-slate-200 !bg-slate-200/40"></div>
      <div className="grid grid-cols-6 gap-4 bg-white pt-2">
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
        <div className="flex items-center justify-center p-1 px-2">
          <div className="animate-skeletonTable h-8 w-full rounded-md bg-slate-200/80"></div>
        </div>
      </div>
    </div>
  );
}

function TableError({ error }: { error: any }) {
  if (error.code === "connection-error") {
    return (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
        <TbWorldCancel className="h-20 w-20 text-red-500" />
        <h4 className="text-xl text-red-500">
          Ha ocurrido un error de conexión
        </h4>
      </div>
    );
  }

  return (
    <div className="flex h-80 w-full flex-col items-center justify-center gap-4">
      <MdError className="h-20 w-20 text-red-500" />
      <h4 className="text-xl text-red-500">
        Ha ocurrido un error en el servidor
      </h4>
    </div>
  );
}

const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(
  (
    { x, y, onCloseContextMenu, parentRef, options, setModalState, isOpen },
    ref,
  ) => {
    const menuStyle = {
      top: `${y}px`,
      left: `${x}px`,
    };

    useEffect(() => {
      const clickListener = (event: any) => {
        const menuParent = parentRef?.current;
        const contextMenu = document.getElementById("menuOptions");
        if (
          !menuParent?.contains(event.target as Node) &&
          !contextMenu?.contains(event.target as Node)
        ) {
          onCloseContextMenu();
          const elementSelected =
            document.getElementsByClassName("row-selected")[0];
          if (elementSelected)
            elementSelected?.classList?.remove("row-selected");
        }
      };

      document.addEventListener("mousedown", clickListener);

      return () => {
        document.removeEventListener("mousedown", clickListener);
      };
    }, [parentRef, onCloseContextMenu]);

    const handleMenuClick = (option: MenuOption) => {
      if (!option.route) return;
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
      <div
        ref={ref}
        style={menuStyle}
        onClick={(e) => closeMenuWhenSelectOption(e)}
        id="menuOptions"
        className={cn(
          "pointer-events-none absolute top-0 z-[999999] h-auto w-40 translate-x-2 overflow-hidden rounded-md border border-slate-200 bg-white p-1 opacity-0 shadow-xl",
          isOpen && "pointer-events-auto opacity-100 transition-opacity",
        )}
      >
        <span className="select-none pl-2 text-[0.65rem] text-slate-600">
          Acciones
        </span>
        <ul className="flex h-full w-full flex-col gap-0.5 pt-2 text-slate-600">
          {options.map((option: any) => (
            <li
              onClick={() => {
                handleMenuClick(option);
                setModalState(option.name.toLowerCase());
              }}
              className={cn(
                "menu-option flex w-full cursor-pointer items-center justify-start gap-2 rounded-sm p-2 text-xs font-medium hover:bg-slate-200/40",
                option.name.toLowerCase() === "eliminar" &&
                  "hover:bg-red-200/40",
              )}
              key={option.name}
            >
              <option.icon className="size-5 min-w-5" />
              <p
                className={cn(
                  "tracking-wide",
                  option.name.toLowerCase() === "eliminar" && "text-red-400",
                )}
              >
                {option.name}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

export { TableWorking };
