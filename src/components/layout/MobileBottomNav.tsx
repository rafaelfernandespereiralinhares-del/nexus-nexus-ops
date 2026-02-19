import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Target, FileCheck, AlertTriangle, CreditCard, Receipt,
  Building2, Users, Brain, Store, UserCog, Megaphone, Wallet, CalendarDays, BarChart3,
  Home, Smartphone, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

function useNavItems() {
  const { primaryRole } = useAuth();
  const items: NavItem[] = [];

  if (primaryRole === 'ADMIN') {
    items.push(
      { label: 'Painel', icon: LayoutDashboard, path: '/admin/dashboard' },
      { label: 'Loja', icon: Store, path: '/loja/dashboard' },
      { label: 'Caixa', icon: DollarSign, path: '/loja/caixa' },
      { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
      { label: 'Metas', icon: Target, path: '/financeiro/metas' },
      { label: 'Metas Sem.', icon: CalendarDays, path: '/financeiro/metas-semanais' },
      { label: 'A Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
      { label: 'A Receber', icon: Receipt, path: '/financeiro/contas-receber' },
      { label: 'Custo Casa', icon: Home, path: '/financeiro/custo-casa' },
      { label: 'Máq. Amarela', icon: Smartphone, path: '/maquina-amarela' },
      { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
      { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
      { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
      { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
      { label: 'Planejamento', icon: BarChart3, path: '/diretoria/planejamento' },
      { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
      { label: 'Empresas', icon: Building2, path: '/admin/empresas' },
      { label: 'Lojas', icon: Store, path: '/admin/lojas' },
      { label: 'Usuários', icon: Users, path: '/admin/usuarios' },
    );
  }

  if (primaryRole === 'LOJA') {
    items.push(
      { label: 'Dashboard', icon: LayoutDashboard, path: '/loja/dashboard' },
      { label: 'Caixa', icon: DollarSign, path: '/loja/caixa' },
      { label: 'Máq. Amarela', icon: Smartphone, path: '/maquina-amarela' },
    );
  }

  if (primaryRole === 'FINANCEIRO') {
    items.push(
      { label: 'Loja', icon: Store, path: '/loja/dashboard' },
      { label: 'Caixa', icon: DollarSign, path: '/loja/caixa' },
      { label: 'Conciliação', icon: FileCheck, path: '/financeiro/conciliacao' },
      { label: 'Metas', icon: Target, path: '/financeiro/metas' },
      { label: 'Metas Sem.', icon: CalendarDays, path: '/financeiro/metas-semanais' },
      { label: 'A Pagar', icon: CreditCard, path: '/financeiro/contas-pagar' },
      { label: 'A Receber', icon: Receipt, path: '/financeiro/contas-receber' },
      { label: 'Custo Casa', icon: Home, path: '/financeiro/custo-casa' },
      { label: 'Máq. Amarela', icon: Smartphone, path: '/maquina-amarela' },
      { label: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria' },
      { label: 'Funcionários', icon: UserCog, path: '/financeiro/funcionarios' },
      { label: 'Campanhas', icon: Megaphone, path: '/financeiro/campanhas' },
      { label: 'Folha & DRE', icon: Wallet, path: '/financeiro/folha' },
      { label: 'Planejamento', icon: BarChart3, path: '/financeiro/planejamento' },
    );
  }

  if (primaryRole === 'DIRETORIA') {
    items.push(
      { label: 'Dashboard', icon: LayoutDashboard, path: '/diretoria/dashboard' },
      { label: 'Planejamento', icon: BarChart3, path: '/diretoria/planejamento' },
      { label: 'Relatório IA', icon: Brain, path: '/diretoria/relatorio-ia' },
    );
  }

  return items;
}

export default function MobileBottomNav() {
  const { profile, primaryRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const allItems = useNavItems();

  // Show first 4 items as primary tabs, rest in "More" sheet
  const primaryItems = allItems.slice(0, 4);
  const moreItems = allItems.slice(4);

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {primaryItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 flex-1',
                active
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground/50'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', active && 'scale-110')} />
              <span className="text-[10px] font-medium truncate w-full text-center leading-tight">{item.label}</span>
            </button>
          );
        })}

        {/* More button */}
        {moreItems.length > 0 && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-sidebar-foreground/50 flex-1">
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-medium">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-sidebar text-sidebar-foreground border-sidebar-border rounded-t-2xl max-h-[80vh]">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sidebar-foreground font-display">Menu</SheetTitle>
                  <div className="text-right">
                    <p className="text-xs font-medium text-sidebar-foreground/90">{profile?.nome}</p>
                    <p className="text-xs text-sidebar-foreground/50">{primaryRole}</p>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-2 overflow-y-auto pb-8">
                {moreItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'bg-sidebar-accent/20 text-sidebar-foreground/70 hover:bg-sidebar-accent/40'
                      )}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-sidebar-border">
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { signOut(); navigate('/login'); setOpen(false); }}
                >
                  Sair da conta
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* If few items, show logout inline */}
        {moreItems.length === 0 && (
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-destructive/70 flex-1"
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        )}
      </div>
    </nav>
  );
}
