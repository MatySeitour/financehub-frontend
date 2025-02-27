import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Login } from "./components/pages/Login";
import { lazy, Suspense } from "react";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { Home } from "./components/pages/Home";
import OrganizationOnboarding from "./components/pages/OrganizationOnboarding";

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
          <Route path="/" element={<Navigate to={"/home"} />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route
              path="/create-organization"
              element={<OrganizationOnboarding />}
            />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/home" element={<Home />} />
            <Route
              path="/clientes"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en clientes
                </main>
              }
            />
            <Route
              path="/vendedores"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en vendedores
                </main>
              }
            />
            <Route
              path="/prestamos"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en prestamos
                </main>
              }
            />
            <Route
              path="/cajas"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en cajas
                </main>
              }
            />
            <Route
              path="/operaciones"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en operaciones
                </main>
              }
            />
            <Route
              path="/configuracion"
              element={
                <main className="h-full w-full bg-green-200">
                  Estamos en configuracion
                </main>
              }
            />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
