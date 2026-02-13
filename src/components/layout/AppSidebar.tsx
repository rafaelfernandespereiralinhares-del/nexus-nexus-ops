import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Target, FileCheck, AlertTriangle, CreditCard, Receipt,
  Building2, Users, Brain, LogOut, Store, ChevronLeft, UserCog, Megaphone, Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

export default function AppSidebar() {
  const { primaryRole, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [];

  if (primaryRole === 'ADMIN') {
    navItems.push(
      { label: 'Empresas', icon: Building2, path: '/admin/empresas' },
      { label: 'Lojas', icon: Store, path: '/admin/lojas' },
      { label: 'Usuários', icon: Users, path: '/admin/usuarios' },
      { label: 'Dashboard Loja', icon: LayoutDashboard, path: '/loja/dashboard' },
      { label: 'Caixa Diário', icon: DollarSign, path: '/loja/caixa' },
      { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
      { label: 'Metas', icon: Target, path: '/financeiro/metas' },
      { label: 'Contas a Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
      { label: 'Contas a Receber', icon: Receipt, path: '/financeiro/contas-receber' },
      { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
      { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
      { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
      { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
      { label: 'Dashboard Diretoria', icon: LayoutDashboard, path: '/diretoria/dashboard' },
      { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
    );
  }

  if (primaryRole === 'LOJA') {
    navItems.push(
      { label: 'Dashboard', icon: LayoutDashboard, path: '/loja/dashboard' },
      { label: 'Caixa Diário', icon: DollarSign, path: '/loja/caixa' },
    );
  }

  if (primaryRole === 'FINANCEIRO') {
    navItems.push(
      { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
      { label: 'Metas', icon: Target, path: '/financeiro/metas' },
      { label: 'Contas a Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
      { label: 'Contas a Receber', icon: Receipt, path: '/financeiro/contas-receber' },
      { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
      { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
      { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
      { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
    );
  }

  if (primaryRole === 'DIRETORIA') {
    navItems.push(
      { label: 'Dashboard', icon: LayoutDashboard, path: '/diretoria/dashboard' },
      { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
    );
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-sidebar-primary" />
            <span className="font-display text-lg font-bold text-sidebar-primary">NEXUS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && (
          <div className="mb-2 px-3">
            <p className="text-xs font-medium text-sidebar-foreground/90 truncate">{profile?.nome}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{primaryRole}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { signOut(); navigate('/login'); }}
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Sair'}
        </Button>
      </div>
    </aside>
  );
}
