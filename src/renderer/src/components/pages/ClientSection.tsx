/* IMPORTS */
import { Button } from "@heroui/react";
import { useRef, useState, useEffect } from "react";
import { TableWork } from "../Table";
import { contextMenuBasicOptions } from "@renderer/utils";
import { MenuOption, ModalState } from "@renderer/utils/types";
import { GoPaperclip } from "react-icons/go";

/* DATA TYPES */
//Modals to open
type ModalStateClients = ModalState | "detalles";
//Loan example of what i will recieve from the API
type ClientExample = {
  id: number;
  name: string;
  address: string;
  phoneNumber: number;
  referredBy: string;
  description: string;
};
type OperationsExample = {
  id: number;
  date: Date;
  operationType: string;
  currency: string;
  amount: number;
  price: number;
  total: number;
};

/* UTILS*/
//Clients table's columns
const COLUMNS = [
  {
    label: "Nombre",
    key: "name",
    render: (item: ClientExample) => item.name,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Direccion",
    key: "address",
    render: (item: ClientExample) => item.address,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Numero de telefono",
    key: "phoneNumber",
    render: (item: ClientExample) => item.phoneNumber,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Referido por",
    key: "referredBy",
    render: (item: ClientExample) => item.referredBy,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Informacion adicional",
    key: "description",
    render: (item: ClientExample) => item.description,
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
//Clients detail table's columns
const COLUMNS_OPERATIONS_DETAIL = [
  {
    label: "Fecha",
    key: "date",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Tipo de operacion",
    key: "operationType",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Divisa",
    key: "date",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Monto",
    key: "amount",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Precio",
    key: "price",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
  {
    label: "Total",
    key: "total",
    render: "",
    // enabledContextMenu: () => (dataExcel.length === 0 ? true : false),
  },
];
//Custom menu options
const contextMenuOption: MenuOption[] = [
  {
    name: "Detalles",
    icon: GoPaperclip,
    route: undefined,
  },
] as const;
//Original simulation of what y will recieve from the API
const originalClients: ClientExample[] = [
  {
    id: 1,
    name: "Gisela",
    address: "Sulivan y Centenario",
    phoneNumber: 1145259875,
    referredBy: "Alejandro",
    description: "Locales en libertad, Av. Eva Peron en frente de el pinito.",
  },
  {
    id: 2,
    name: "Carlos",
    address: "Av. Rivadavia 8400",
    phoneNumber: 1134567890,
    referredBy: "Karina",
    description: "Dueño de local de ropa deportiva, a media cuadra del Coto.",
  },
  {
    id: 3,
    name: "Romina",
    address: "Mitre y Las Heras",
    phoneNumber: 1167894321,
    referredBy: "Facundo",
    description: "Local de regalería y bazar, frente a la farmacia.",
  },
  {
    id: 4,
    name: "Luciano",
    address: "Calle 12 Nº 234",
    phoneNumber: 1154321987,
    referredBy: "Patricio",
    description: "Repartidor que también presta a conocidos del barrio.",
  },
  {
    id: 5,
    name: "Soledad",
    address: "Juan B. Justo 675",
    phoneNumber: 1144982211,
    referredBy: "Nacho",
    description: "Vive en PH, trabaja vendiendo productos de limpieza.",
  },
  {
    id: 6,
    name: "Bruno",
    address: "Eva Perón y Cañada de Gómez",
    phoneNumber: 1178945632,
    referredBy: "Tiago",
    description: "Tiene un maxikiosco frente al club San Martín.",
  },
  {
    id: 7,
    name: "Laura",
    address: "Ruta 21 km 24",
    phoneNumber: 1141123344,
    referredBy: "Fernando",
    description: "Hace venta ambulante en la feria los fines de semana.",
  },
  {
    id: 8,
    name: "Matías",
    address: "Av. San Martín 1200",
    phoneNumber: 1165437890,
    referredBy: "Karina",
    description: "Mecánico en taller familiar, cliente constante.",
  },
  {
    id: 9,
    name: "Verónica",
    address: "Fray Cayetano 450",
    phoneNumber: 1132145687,
    referredBy: "Cesar",
    description: "Tiene almacén en barrio El Progreso.",
  },
  {
    id: 10,
    name: "Diego",
    address: "Pedro Goyena 1345",
    phoneNumber: 1122233445,
    referredBy: "Alejandro",
    description: "Trabaja con fletes y hace changas en la zona.",
  },
];

/* FUNCTIONS */

//Component starts here
export function ClientSection() {
  /* STATES */
  //Manipulate the filter that search for client or seller
  const [searchText, setSearchText] = useState("");
  //Save the id of the selected row
  const [rowID, setRowID] = useState<number>();
  //Open or close the details client modal
  const [modalState, setModalState] = useState<ModalStateClients>("");

  /* REFs */
  //add loans container ref
  const dialogAddClient = useRef<HTMLDialogElement>(null);
  //clients details container ref
  const dialogClientDetail = useRef<HTMLDialogElement>(null);

  /* USE EFFECT */
  //Opens the client details modal
  useEffect(() => {
    if (modalState === "detalles") {
      openDialog(dialogClientDetail);
    }
  }, [modalState]);

  /* EVENT HANDLERS */
  //Handle how every dialog is opened
  function openDialog(dialog) {
    if (dialog.current) {
      dialog.current.showModal(); // Open the dialog
    }
  }
  //Handle how every dialog is closed
  function closeDialog(dialog) {
    if (dialog.current) {
      dialog.current.close(); // Close the dialog
    }
  }
  //
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  /* UTILS */

  /* FUNCTIONS */
  //Recieves all filters and returns the filtered data
  const filteredData = originalClients.filter((item) => {
    // Si no hay texto de búsqueda, mostrar todos los clientes
    if (!searchText.trim()) {
      return true;
    }

    // Filtrar por nombre (case insensitive)
    return item.name.toLowerCase().includes(searchText.toLowerCase().trim());
  });

  const selectedRow = filteredData.find((row) => row.id === rowID);

  return (
    <>
      {/* TOP OPTION'S CONTAINER */}
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <h2 className="text-2xl font-bold text-slate-500">CLIENTES</h2>
        <Button
          onPress={() => openDialog(dialogAddClient)}
          color="success"
          className="rounded-md text-white"
        >
          Nuevo cliente
        </Button>
      </div>
      {/* CLIENTS'S SECTION CONTAINER */}
      <section className="h-full w-full">
        {/* FILTERS'S CONTAINER */}
        <div className="flex h-fit w-full flex-col gap-4 px-6 py-4 text-sm text-slate-400">
          {/* SEARCH FILTER CONTAINER */}
          <div className="flex w-full gap-16">
            <label className="flex w-full basis-1/3 flex-col gap-1 text-slate-500 focus-within:text-green-600">
              Buscar por nombre
              <input
                value={searchText}
                onChange={handleSearchTextChange}
                list="clientsList"
                placeholder="Nombre del cliente.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
        </div>
        {/* TABLE'S CONTAINER */}
        <div className="relative flex-grow overflow-hidden px-6 pb-4">
          <TableWork
            columns={COLUMNS}
            loading={false}
            error={false}
            searchInput={""}
            data={filteredData}
            openModal={setModalState}
            optionsMenu={[...contextMenuOption, ...contextMenuBasicOptions]}
            selectRowID={setRowID}
          />
        </div>
      </section>
      {/* ADD CLIENT MODAL */}
      <dialog
        ref={dialogAddClient}
        className="h-fit w-1/2 rounded-lg shadow-lg"
      >
        {/* FORM'S CONTAINER */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex h-full w-full flex-col items-center justify-evenly px-8 py-4 text-slate-500"
        >
          {/* TITLE'S CONTAINER */}
          <h3 className="w-full border-b pb-4 text-center text-xl font-semibold">
            Crear un nuevo cliente
          </h3>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Nombre
              <input
                required
                placeholder="Ej: Eduardo Perez"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Direccion
              <input
                placeholder="Ej: Juncal 262"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <div className="flex w-full flex-row items-center justify-center gap-2 pt-4">
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Telefono
              <input
                type="number"
                placeholder="Ej: 1134865214"
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
            <label className="flex basis-1/2 flex-col gap-1 text-sm focus-within:text-green-600">
              Referido
              <input
                list="sellersList"
                placeholder="Nombre del vendedor.."
                className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
              />
            </label>
          </div>
          <label className="flex w-full flex-col gap-1 pt-4 text-sm focus-within:text-green-600">
            Informacion adicional
            <textarea
              placeholder="Por ejemplo: Casa de rejas verdes"
              className="max-h-40 min-h-14 rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          {/* END MODAL CONTAINER */}
          <div className="flex w-full justify-evenly gap-2 pt-4 text-center">
            <Button
              type="submit"
              onPress={() => closeDialog(dialogAddClient)}
              color="success"
              className="w-full rounded-md text-white"
            >
              Aceptar
            </Button>
            <Button
              type="reset"
              onPress={() => closeDialog(dialogAddClient)}
              color="danger"
              className="w-full rounded-md text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </dialog>
      {/* CLIENTS DETAIL MODAL */}
      <dialog
        ref={dialogClientDetail}
        className="h-fit w-1/2 rounded-lg px-8 py-4 text-slate-600"
      >
        {/* TITLE'S CONTAINER */}
        <p className="w-full place-content-center items-center border-b pb-4 text-center text-xl font-semibold">
          {selectedRow?.name}
        </p>
        {/* INFO CONTAINER */}
        <div className="flex flex-row gap-4 border-b px-4 pb-6 pt-4">
          <label className="flex w-full flex-col gap-1 text-slate-500 focus-within:text-green-600">
            <div className="flex items-center gap-2">
              <span>Total de operaciones:</span>
            </div>
            <select className="rounded-lg text-slate-400 border p-3 shadow-sm outline-none focus:border-green-400">
              <option value="">Seleccionar divisa</option>
              <option value="pesos">Seleccionar pesos</option>
              <option value="dolares">Seleccionar dolares</option>
              <option value="reales">Seleccionar reales</option>
              <option value="euros">Seleccionar euros</option>
            </select>
          </label>
          <label className="flex w-full flex-col gap-1 text-slate-500 focus-within:text-green-600">
            <div className="flex items-center gap-2">
              <span>Total de prestamos:</span>
            </div>
            <select className="rounded-lg border text-slate-400 p-3 shadow-sm outline-none focus:border-green-400">
              <option value="">Seleccionar divisa</option>
              <option value="pesos">Seleccionar pesos</option>
              <option value="dolares">Seleccionar dolares</option>
              <option value="reales">Seleccionar reales</option>
              <option value="euros">Seleccionar euros</option>
            </select>
          </label>
        </div>
        {/* DETAIL TABLE CONTAINER */}
        <div className="flex flex-row gap-4 p-4">
          <label className="flex w-1/2 flex-col gap-1 text-slate-500 focus-within:text-green-600">
            <div className="flex items-center gap-2">
              <span>Filtrar por tipo de movimiento:</span>
            </div>
            <select className="rounded-lg border text-slate-400 p-3 shadow-sm outline-none focus:border-green-400">
              <option value="operations">Operaciones</option>
              <option value="loans">Prestamos</option>
            </select>
          </label>
          <label className="flex w-1/2 flex-col gap-1 text-slate-500 focus-within:text-green-600">
            <div className="flex items-center gap-2">
              <span>Ganancia total:</span>
            </div>
            <select className="rounded-lg border p-3 shadow-sm text-slate-400 outline-none focus:border-green-400">
              <option value="">Seleccionar divisa</option>
              <option value="pesos">Seleccionar pesos</option>
              <option value="dolares">Seleccionar dolares</option>
              <option value="reales">Seleccionar reales</option>
              <option value="euros">Seleccionar euros</option>
            </select>
          </label>
        </div>
        <div className="relative flex-grow overflow-hidden p-4 px-6">
          <TableWork
            columns={COLUMNS_OPERATIONS_DETAIL}
            loading={false}
            error={false}
            searchInput={""}
            data={[]}
            openModal={null}
            optionsMenu={[]}
          />
        </div>
        <button
          onClick={() => {
            setModalState("");
            closeDialog(dialogClientDetail);
          }}
        >
          cerrar
        </button>
      </dialog>
      {/* DATALIST FOR SEARCH SELLERS INPUT */}
      <datalist id="sellersList">
        <option value="Alejandro"></option>
        <option value="Karina"></option>
        <option value="Patricio"></option>
        <option value="Fernando"></option>
        <option value="Facundo"></option>
        <option value="Nacho"></option>
        <option value="Tiago"></option>
        <option value="Cesar"></option>
      </datalist>
    </>
  );
}
