import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SemPermissao from "./pages/SemPermissao";

import AdminEmpresas from "./pages/admin/AdminEmpresas";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

import LojaDashboard from "./pages/loja/LojaDashboard";
import CaixaDiario from "./pages/loja/CaixaDiario";

import Conciliacao from "./pages/financeiro/Conciliacao";
import Metas from "./pages/financeiro/Metas";
import ContasPagar from "./pages/financeiro/ContasPagar";
import ContasReceber from "./pages/financeiro/ContasReceber";
import Auditoria from "./pages/financeiro/Auditoria";

import DiretoriaDashboard from "./pages/diretoria/DiretoriaDashboard";
import RelatorioIA from "./pages/diretoria/RelatorioIA";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sem-permissao" element={<SemPermissao />} />

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout /></ProtectedRoute>}>
              <Route path="/admin/empresas" element={<AdminEmpresas />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            </Route>

            {/* Loja */}
            <Route element={<ProtectedRoute allowedRoles={['LOJA']}><AppLayout /></ProtectedRoute>}>
              <Route path="/loja/dashboard" element={<LojaDashboard />} />
              <Route path="/loja/caixa" element={<CaixaDiario />} />
            </Route>

            {/* Financeiro */}
            <Route element={<ProtectedRoute allowedRoles={['FINANCEIRO']}><AppLayout /></ProtectedRoute>}>
              <Route path="/financeiro/conciliacao" element={<Conciliacao />} />
              <Route path="/financeiro/metas" element={<Metas />} />
              <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
              <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
              <Route path="/financeiro/auditoria" element={<Auditoria />} />
            </Route>

            {/* Diretoria */}
            <Route element={<ProtectedRoute allowedRoles={['DIRETORIA']}><AppLayout /></ProtectedRoute>}>
              <Route path="/diretoria/dashboard" element={<DiretoriaDashboard />} />
              <Route path="/diretoria/relatorio-ia" element={<RelatorioIA />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
