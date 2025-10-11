import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Login } from "./components/pages/Login";
import { lazy, Suspense } from "react";

import { AuthLayout } from "@components/layouts/AuthLayout";
import { Home } from "@components/pages/Home";
import { CashBoxSection } from "./components/pages/cashboxes";
import { OrganizationOnboarding } from "./components/pages/OrganizationOnboarding";
import { CashBoxHistorySection } from "./components/pages/cashboxes/history";
import { HistorySection } from "./components/pages/cashboxes/history/details";
import { HistoryCurrentSection } from "./components/pages/cashboxes/history/current";
import { OperationsSection } from "./components/pages/Operations";
import { ClientDetailsSection } from "./components/pages/clients/details";
import { ClientSection } from "./components/pages/clients";

const ProtectedLayout = lazy(
  () => import("./components/layouts/ProtectedLayout"),
);

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-white">
            <span className="border-secondary-green border-b-fourth-green relative inline-block h-12 w-12 animate-rotateFull rounded-[50%] border-4 after:absolute after:left-1/2 after:top-1/2 after:h-14 after:w-14 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-[50%] after:border-4 after:border-transparent"></span>
          </div>
        }
      >
        <Routes>
          {/* Redirect home */}
          <Route path="/" element={<Navigate to={"/home"} />} />

          {/* Auth */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route
              path="/create-organization"
              element={<OrganizationOnboarding />}
            />
          </Route>

          {/* ------------ Main routes ------------ */}
          <Route element={<ProtectedLayout />}>
            {/* Home */}
            <Route path="/home" element={<Home />} />

            {/* Clients */}
            <Route path="/clientes" element={<ClientSection />} />

            {/* Clients Details */}
            <Route
              path="/clientes/:id/detalles"
              element={<ClientDetailsSection />}
            />

            {/* Sellers */}
            <Route
              path="/vendedores"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en vendedores
                </main>
              }
            />

            {/* Loans */}
            <Route
              path="/prestamos"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en prestamos
                </main>
              }
            />

            {/* Cashboxes */}
            <Route path="/cajas" element={<CashBoxSection />} />

            {/* Cashboxes history */}
            <Route
              path="/cajas/:id/history"
              element={<CashBoxHistorySection />}
            />

            {/* Cashboxes current history */}
            <Route
              path="/cajas/:id/history/current"
              element={<HistoryCurrentSection />}
            />

            {/* Cashbox history */}
            <Route
              path="/cajas/:id/history/:historyID"
              element={<HistorySection />}
            />
            <Route path="/operaciones" element={<OperationsSection />} />
            <Route
              path="/configuracion"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en configuracion
                </main>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
