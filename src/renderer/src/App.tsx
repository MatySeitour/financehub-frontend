import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ProtectedLayout } from "./components/layouts/ProtectedLayout";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={"/inicio"} />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/inicio" element={<main className="w-full h-full bg-green-200">Estamos en home</main>} />
          <Route path="/clientes" element={<main className="w-full h-full bg-green-200">Estamos en clientes</main>} />
          <Route path="/vendedores" element={<main className="w-full h-full bg-green-200">Estamos en vendedores</main>} />
          <Route path="/prestamos" element={<main className="w-full h-full bg-green-200">Estamos en prestamos</main>} />
          <Route path="/cajas" element={<main className="w-full h-full bg-green-200">Estamos en cajas</main>} />
          <Route path="/operaciones" element={<main className="w-full h-full bg-green-200">Estamos en operaciones</main>} />
          <Route path="/configuracion" element={<main className="w-full h-full bg-green-200">Estamos en configuracion</main>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
