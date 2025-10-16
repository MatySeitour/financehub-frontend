import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Login } from "./components/pages/Login";
import { lazy, Suspense } from "react";

import { AuthLayout } from "@components/layouts/AuthLayout";
import { Home } from "@components/pages/Home";
import { CashBoxSection } from "./components/pages/cashboxes";
import { LoansSection } from "./components/pages/loans";
import { OrganizationOnboarding } from "./components/pages/OrganizationOnboarding";
import { CashBoxHistorySection } from "./components/pages/cashboxes/history";
import { HistorySection } from "./components/pages/cashboxes/history/details";
import { HistoryCurrentSection } from "./components/pages/cashboxes/history/current";
import { OperationsSection } from "./components/pages/Operations";
import { ClientDetailsSection } from "./components/pages/clients/details";
import { ClientSection } from "./components/pages/clients";
import { SellersSection } from "./components/pages/sellers";
import { SellerDetailsSection } from "./components/pages/sellers/details";
import { LoanDetailsSection } from "./components/pages/loans/details";

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

            {/* ------------ Clients ------------ */}
            {/* Clients */}
            <Route path="/clients" element={<ClientSection />} />

            {/* Clients Details */}
            <Route
              path="/clients/:id/details"
              element={<ClientDetailsSection />}
            />
            {/* -------------------------------- */}

            {/* ------------ Sellers ------------ */}
            <Route path="/sellers" element={<SellersSection />} />

            {/* Sellers Details*/}
            <Route
              path="/sellers/:id/details"
              element={<SellerDetailsSection />}
            />
            {/* -------------------------------- */}

            {/* Loans */}
            <Route path="/loans" element={<LoansSection />} />

            {/* Loans Details */}
            <Route path="/loans/:id/details" element={<LoanDetailsSection />} />

            {/* Cashboxes */}
            <Route path="/boxes" element={<CashBoxSection />} />

            {/* Cashboxes history */}
            <Route
              path="/boxes/:id/history"
              element={<CashBoxHistorySection />}
            />

            {/* Cashboxes current history */}
            <Route
              path="/boxes/:id/history/current"
              element={<HistoryCurrentSection />}
            />

            {/* Cashbox history */}
            <Route
              path="/boxes/:id/history/:historyID"
              element={<HistorySection />}
            />

            {/* Operations */}
            <Route path="/operations" element={<OperationsSection />} />

            {/* Settings */}
            <Route
              path="/settings"
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
