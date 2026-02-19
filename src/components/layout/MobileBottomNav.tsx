import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, Target, FileCheck, AlertTriangle, CreditCard, Receipt,
  Building2, Users, Brain, Store, UserCog, Megaphone, Wallet, CalendarDays, BarChart3,
  Home, Smartphone, MoreHorizontal, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  color: string;
  bg: string;
}

function useNavItems() {
  const { primaryRole } = useAuth();
  const items: NavItem[] = [];

  if (primaryRole === 'ADMIN') {
    items.push(
      { label: 'Painel Macro', shortLabel: 'Painel', icon: LayoutDashboard, path: '/admin/dashboard', color: 'text-blue-500', bg: 'bg-blue-500/15' },
      { label: 'Dashboard Loja', shortLabel: 'Loja', icon: Store, path: '/loja/dashboard', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
      { label: 'Caixa Diário', shortLabel: 'Caixa', icon: DollarSign, path: '/loja/caixa', color: 'text-green-500', bg: 'bg-green-500/15' },
      { label: 'Conciliação', shortLabel: 'Concil.', icon: FileCheck, path: '/financeiro/conciliacao', color: 'text-violet-500', bg: 'bg-violet-500/15' },
      { label: 'Metas', shortLabel: 'Metas', icon: Target, path: '/financeiro/metas', color: 'text-orange-500', bg: 'bg-orange-500/15' },
      { label: 'Metas Semanais', shortLabel: 'Sem.', icon: CalendarDays, path: '/financeiro/metas-semanais', color: 'text-amber-500', bg: 'bg-amber-500/15' },
      { label: 'Contas a Pagar', shortLabel: 'A Pagar', icon: CreditCard, path: '/financeiro/contas-pagar', color: 'text-red-500', bg: 'bg-red-500/15' },
      { label: 'Contas a Receber', shortLabel: 'A Receber', icon: Receipt, path: '/financeiro/contas-receber', color: 'text-teal-500', bg: 'bg-teal-500/15' },
      { label: 'Custo Casa', shortLabel: 'Custo Casa', icon: Home, path: '/financeiro/custo-casa', color: 'text-cyan-500', bg: 'bg-cyan-500/15' },
      { label: 'Máq. Amarela', shortLabel: 'Máquina', icon: Smartphone, path: '/maquina-amarela', color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
      { label: 'Auditoria', shortLabel: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria', color: 'text-rose-500', bg: 'bg-rose-500/15' },
      { label: 'Funcionários', shortLabel: 'Func.', icon: UserCog, path: '/financeiro/funcionarios', color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
      { label: 'Campanhas', shortLabel: 'Camp.', icon: Megaphone, path: '/financeiro/campanhas', color: 'text-pink-500', bg: 'bg-pink-500/15' },
      { label: 'Folha & DRE', shortLabel: 'Folha', icon: Wallet, path: '/financeiro/folha', color: 'text-lime-600', bg: 'bg-lime-500/15' },
      { label: 'Planejamento', shortLabel: 'DRE', icon: BarChart3, path: '/diretoria/planejamento', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/15' },
      { label: 'Relatório IA', shortLabel: 'IA', icon: Brain, path: '/diretoria/relatorio-ia', color: 'text-purple-500', bg: 'bg-purple-500/15' },
      { label: 'Empresas', shortLabel: 'Empresas', icon: Building2, path: '/admin/empresas', color: 'text-sky-500', bg: 'bg-sky-500/15' },
      { label: 'Lojas', shortLabel: 'Lojas', icon: Store, path: '/admin/lojas', color: 'text-emerald-600', bg: 'bg-emerald-600/15' },
      { label: 'Usuários', shortLabel: 'Usuários', icon: Users, path: '/admin/usuarios', color: 'text-slate-500', bg: 'bg-slate-500/15' },
    );
  }

  if (primaryRole === 'LOJA') {
    items.push(
      { label: 'Dashboard', shortLabel: 'Início', icon: LayoutDashboard, path: '/loja/dashboard', color: 'text-blue-500', bg: 'bg-blue-500/15' },
      { label: 'Caixa Diário', shortLabel: 'Caixa', icon: DollarSign, path: '/loja/caixa', color: 'text-green-500', bg: 'bg-green-500/15' },
      { label: 'Máq. Amarela', shortLabel: 'Máquina', icon: Smartphone, path: '/maquina-amarela', color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
    );
  }

  if (primaryRole === 'FINANCEIRO') {
    items.push(
      { label: 'Dashboard Loja', shortLabel: 'Loja', icon: Store, path: '/loja/dashboard', color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
      { label: 'Caixa Diário', shortLabel: 'Caixa', icon: DollarSign, path: '/loja/caixa', color: 'text-green-500', bg: 'bg-green-500/15' },
      { label: 'Conciliação', shortLabel: 'Concil.', icon: FileCheck, path: '/financeiro/conciliacao', color: 'text-violet-500', bg: 'bg-violet-500/15' },
      { label: 'Metas', shortLabel: 'Metas', icon: Target, path: '/financeiro/metas', color: 'text-orange-500', bg: 'bg-orange-500/15' },
      { label: 'Metas Semanais', shortLabel: 'Sem.', icon: CalendarDays, path: '/financeiro/metas-semanais', color: 'text-amber-500', bg: 'bg-amber-500/15' },
      { label: 'Contas a Pagar', shortLabel: 'A Pagar', icon: CreditCard, path: '/financeiro/contas-pagar', color: 'text-red-500', bg: 'bg-red-500/15' },
      { label: 'Contas a Receber', shortLabel: 'A Receber', icon: Receipt, path: '/financeiro/contas-receber', color: 'text-teal-500', bg: 'bg-teal-500/15' },
      { label: 'Custo Casa', shortLabel: 'Custo', icon: Home, path: '/financeiro/custo-casa', color: 'text-cyan-500', bg: 'bg-cyan-500/15' },
      { label: 'Máq. Amarela', shortLabel: 'Máquina', icon: Smartphone, path: '/maquina-amarela', color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
      { label: 'Auditoria', shortLabel: 'Auditoria', icon: AlertTriangle, path: '/financeiro/auditoria', color: 'text-rose-500', bg: 'bg-rose-500/15' },
      { label: 'Funcionários', shortLabel: 'Func.', icon: UserCog, path: '/financeiro/funcionarios', color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
      { label: 'Campanhas', shortLabel: 'Camp.', icon: Megaphone, path: '/financeiro/campanhas', color: 'text-pink-500', bg: 'bg-pink-500/15' },
      { label: 'Folha & DRE', shortLabel: 'Folha', icon: Wallet, path: '/financeiro/folha', color: 'text-lime-600', bg: 'bg-lime-500/15' },
      { label: 'Planejamento', shortLabel: 'DRE', icon: BarChart3, path: '/financeiro/planejamento', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/15' },
    );
  }

  if (primaryRole === 'DIRETORIA') {
    items.push(
      { label: 'Dashboard', shortLabel: 'Início', icon: LayoutDashboard, path: '/diretoria/dashboard', color: 'text-blue-500', bg: 'bg-blue-500/15' },
      { label: 'Planejamento', shortLabel: 'DRE', icon: BarChart3, path: '/diretoria/planejamento', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/15' },
      { label: 'Relatório IA', shortLabel: 'IA', icon: Brain, path: '/diretoria/relatorio-ia', color: 'text-purple-500', bg: 'bg-purple-500/15' },
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

  const primaryItems = allItems.slice(0, 4);
  const moreItems = allItems.slice(4);

  const handleNav = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-area-inset-bottom shadow-2xl">
      <div className="flex items-stretch justify-around px-1 pt-1 pb-safe">
        {primaryItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200',
                active ? item.bg : 'bg-transparent'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                active ? item.color : 'text-sidebar-foreground/40'
              )}>
                <item.icon className={cn('h-5 w-5 transition-transform duration-200', active && 'scale-110')} />
              </div>
              <span className={cn(
                'text-[9px] font-semibold leading-tight text-center max-w-full truncate transition-colors',
                active ? item.color : 'text-sidebar-foreground/40'
              )}>
                {item.shortLabel}
              </span>
            </button>
          );
        })}

        {/* More button */}
        {moreItems.length > 0 && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-200',
                open ? 'bg-sidebar-accent/30' : 'bg-transparent'
              )}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/40">
                  <MoreHorizontal className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-semibold text-sidebar-foreground/40">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-sidebar text-sidebar-foreground border-sidebar-border rounded-t-3xl max-h-[82vh] px-4">
              <SheetHeader className="pb-3 pt-1">
                <div className="mx-auto w-10 h-1 bg-sidebar-border rounded-full mb-3" />
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-sidebar-foreground font-display text-lg">Menu</SheetTitle>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-sidebar-foreground/90">{profile?.nome}</p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary mt-0.5">{primaryRole}</span>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-4">
                {moreItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={cn(
                        'flex flex-col items-center gap-2.5 p-3.5 rounded-2xl transition-all duration-200 active:scale-95',
                        active ? `${item.bg} ring-1 ring-inset ring-current/20` : 'bg-sidebar-accent/15 hover:bg-sidebar-accent/30'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-11 h-11 rounded-xl',
                        active ? item.bg : 'bg-sidebar-accent/20'
                      )}>
                        <item.icon className={cn('h-6 w-6', active ? item.color : 'text-sidebar-foreground/60')} />
                      </div>
                      <span className={cn(
                        'text-[11px] font-semibold text-center leading-tight',
                        active ? item.color : 'text-sidebar-foreground/70'
                      )}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 pb-2 border-t border-sidebar-border">
                <button
                  onClick={() => { signOut(); navigate('/login'); setOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive bg-destructive/10 font-semibold text-sm active:scale-95 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Sair da conta
                </button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* If few items (LOJA/DIRETORIA), show sair inline */}
        {moreItems.length === 0 && (
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className="flex flex-1 flex-col items-center gap-1 py-2 px-1 rounded-xl text-destructive/60 bg-transparent"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg">
              <LogOut className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-semibold">Sair</span>
          </button>
        )}
      </div>
    </nav>
  );
}
