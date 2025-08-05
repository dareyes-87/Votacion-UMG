// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";

import HomePage from "@/pages/HomePage";
import VotarPage from "@/pages/Votacion";
import ResultadosPage from "@/pages/ResultadosLive";
import CrearEventoPage from "@/pages/AdminDashboard";
import MisVotacionesPage from "@/pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="votar" element={<VotarPage />} />
            <Route path="resultados" element={<ResultadosPage />} />
            <Route path="admin" element={<CrearEventoPage />} />
            <Route path="mis-votaciones" element={<MisVotacionesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
