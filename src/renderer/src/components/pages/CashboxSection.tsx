import { useMediaQueryElement } from "@renderer/hooks/useMediaQueries";
import { cn } from "@renderer/utils";
import { useRef } from "react";
import { CashBox } from "../Cashbox";

export function CashBoxSection() {
  const cashBoxSection = useRef(null);
  const dialogAddCashbox = useRef<HTMLDialogElement>(null);

  const openDialogOpen = () => {
    if (dialogAddCashbox.current) {
      dialogAddCashbox.current.showModal(); // Abre el diálogo de forma modal
    }
  };

  const closeDialogOpen = () => {
    if (dialogAddCashbox.current) {
      dialogAddCashbox.current.close(); // Cierra el diálogo
    }
  };

  const mq = useMediaQueryElement(cashBoxSection);

  return (
    <>
      <div className="flex w-full items-center justify-between border-b px-4 py-2">
        <h2 className="text-2xl font-bold text-slate-500">Cajas</h2>
        <button
          onClick={openDialogOpen}
          className="rounded-lg bg-green-400 p-2 font-semibold text-white transition-all hover:scale-110"
        >
          Agregar cajas
        </button>
      </div>
      <section className="h-full w-full" ref={cashBoxSection}>
        <div
          className={cn(
            "grid h-fit w-full grid-cols-1 flex-col gap-2 rounded-tl-2xl bg-white p-4",
            mq > 1200
              ? "grid-cols-4"
              : mq > 1000
                ? "grid-cols-3"
                : mq > 600
                  ? "grid-cols-2"
                  : "",
          )}
        >
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:00"}
            openingValue={"4.000.000"}
            lastValue={"4.400.000"}
            percentage={10}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"08:30"}
            openingValue={"4.000.000"}
            lastValue={"3.600.000"}
            percentage={-10}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={false}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={false}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={false}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={false}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={false}
          />
          <CashBox
            title={"Caja de pesos"}
            openingTime={"09:30"}
            openingValue={"4.000.000"}
            lastValue={"6.000.000"}
            percentage={50}
            cashState={true}
          />
        </div>
      </section>
      <dialog ref={dialogAddCashbox} className="h-1/3 w-1/4 rounded-lg">
        <div className="flex h-full w-full flex-col items-center justify-evenly px-8 text-slate-500">
          <h3 className="w-full border-b pb-4 text-center text-xl font-semibold">
            Crear una nueva caja
          </h3>
          <label className="flex w-full flex-col gap-1 text-sm">
            Nombre de la caja
            <input
              type="text"
              placeholder="Ej: Pesos - oficina"
              className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400"
            />
          </label>
          <label className="flex w-full flex-col gap-1 text-sm">
            Seleccione una divisa
            <select className="rounded-lg border p-3 shadow-sm outline-none focus:border-green-400">
              <option value="pesos">Pesos</option>
              <option value="dolares">Dolares</option>
              <option value="euros">Euros</option>
            </select>
          </label>
          <div className="flex w-full justify-evenly pt-4 text-center">
            <button
              onClick={closeDialogOpen}
              className="rounded-lg bg-green-400 p-3 text-sm font-semibold text-white transition-all hover:scale-110"
            >
              Aceptar
            </button>
            <button
              className="rounded-lg bg-red-400 p-3 text-sm font-semibold text-white transition-all hover:scale-110"
              onClick={closeDialogOpen}
            >
              Cancelar
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
