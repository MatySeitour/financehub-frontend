import { FaMoneyBillWave } from "react-icons/fa";
import { Button } from "@heroui/react";

export function Home() {
  return (
    <section className="relative flex h-full w-full flex-col gap-6">
      <div className="grid h-1/3 w-full grid-cols-3 gap-6">
        <article className="flex h-full w-full flex-col gap-4 rounded-md bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="rounded-md bg-green-200/40 p-1">
                <FaMoneyBillWave className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-lg font-medium text-slate-500">Dólar blue</p>
            </div>
            <Button
              size="sm"
              color="primary"
              radius="sm"
              className="text-white"
            >
              Recargar
            </Button>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-slate-400">Compra</p>
              <p className="text-xl font-medium text-green-600">$4000</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Venta</p>
              <p className="text-xl font-medium text-green-600">$4000</p>
            </div>
          </div>
        </article>
        <article className="h-full w-full rounded-md bg-white"></article>
        <article className="h-full w-full rounded-md bg-white"></article>
      </div>
    </section>
  );
}
