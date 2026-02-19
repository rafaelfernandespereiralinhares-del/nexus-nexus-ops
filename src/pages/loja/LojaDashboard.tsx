import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Target, TrendingUp, ArrowRight, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type ChartType = 'bar' | 'line' | 'pie';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const fmtShort = (v: number) => {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return `R$ ${v.toFixed(0)}`;
};

export default function LojaDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<{ meta_diaria: number; meta_mensal: number } | null>(null);
  const [realizadoHoje, setRealizadoHoje] = useState(0);
  const [fechamentoStatus, setFechamentoStatus] = useState<string | null>(null);
  const [historicoSemana, setHistoricoSemana] = useState<{ dia: string; valor: number; meta: number }[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');

  useEffect(() => {
    if (!profile?.loja_id || !profile?.empresa_id) return;
    const hoje = new Date().toISOString().slice(0, 10);
    const mes = hoje.slice(0, 7);

    const fetchData = async () => {
      const [metaRes, fechRes] = await Promise.all([
        supabase.from('metas').select('meta_diaria, meta_mensal').eq('loja_id', profile.loja_id!).eq('mes', mes).single(),
        supabase.from('fechamentos').select('total_entradas, status').eq('loja_id', profile.loja_id!).eq('data', hoje).is('deleted_at', null).single(),
      ]);
      if (metaRes.data) setMeta(metaRes.data as any);
      if (fechRes.data) {
        setRealizadoHoje(Number(fechRes.data.total_entradas) || 0);
        setFechamentoStatus(fechRes.data.status as string);
      }

      // Load last 7 days for chart
      const dias: { dia: string; valor: number; meta: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dataStr = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
        dias.push({ dia: label, valor: 0, meta: metaRes.data?.meta_diaria ?? 0 });
        const { data: fech } = await supabase.from('fechamentos')
          .select('total_entradas').eq('loja_id', profile.loja_id!).eq('data', dataStr).is('deleted_at', null).single();
        if (fech) dias[dias.length - 1].valor = Number(fech.total_entradas) || 0;
      }
      setHistoricoSemana(dias);
    };
    fetchData();
  }, [profile]);

  const pctAtingido = meta?.meta_diaria ? Math.min((realizadoHoje / Number(meta.meta_diaria)) * 100, 100) : 0;

  const pieData = [
    { name: 'Realizado', value: realizadoHoje },
    { name: 'Restante', value: Math.max(0, (meta?.meta_diaria ?? 0) - realizadoHoje) },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {fmtShort(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {pieData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#e2e8f0'} />)}
            </Pie>
            <Tooltip formatter={(v: any) => fmt(v)} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={historicoSemana} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="valor" name="Realizado" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="meta" name="Meta" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // bar (default)
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={historicoSemana} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="meta" name="Meta" fill="#f59e0b" radius={[4, 4, 0, 0]} opacity={0.5} />
          <Bar dataKey="valor" name="Realizado" radius={[4, 4, 0, 0]}>
            {historicoSemana.map((entry, i) => (
              <Cell key={i} fill={entry.valor >= entry.meta ? '#10b981' : entry.valor >= entry.meta * 0.7 ? '#3b82f6' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resultados do dia</p>
        </div>
        <Button onClick={() => navigate('/loja/caixa')} className="gap-2 text-sm h-9">
          <DollarSign className="h-4 w-4" /> Caixa <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[11px] font-medium text-muted-foreground">Meta Diária</span>
            </div>
            <div className="text-base font-bold text-foreground leading-tight">
              {fmtShort(meta?.meta_diaria ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium text-muted-foreground">Realizado</span>
            </div>
            <div className="text-base font-bold text-foreground leading-tight">
              {fmtShort(realizadoHoje)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 ${pctAtingido >= 100 ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5' : pctAtingido >= 70 ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5' : 'bg-gradient-to-br from-red-500/10 to-red-600/5'}`}>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className={`h-3.5 w-3.5 ${pctAtingido >= 100 ? 'text-emerald-500' : pctAtingido >= 70 ? 'text-amber-500' : 'text-red-500'}`} />
              <span className="text-[11px] font-medium text-muted-foreground">% Meta</span>
            </div>
            <div className={`text-base font-bold leading-tight ${pctAtingido >= 100 ? 'text-emerald-600' : pctAtingido >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
              {pctAtingido.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progresso da meta diária</span>
          <span className="font-semibold">{pctAtingido.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pctAtingido >= 100 ? 'bg-emerald-500' : pctAtingido >= 70 ? 'bg-blue-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(pctAtingido, 100)}%` }}
          />
        </div>
      </div>

      {/* Chart card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Últimos 7 dias</CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="Barras"
              >
                <BarChart2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="Linha"
              >
                <LineChartIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`p-1.5 rounded-lg transition-all ${chartType === 'pie' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="Pizza"
              >
                <PieChartIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {chartType === 'pie' && (
            <p className="text-xs text-muted-foreground">Meta vs. realizado hoje</p>
          )}
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {renderChart()}
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Status do Caixa</span>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${
                fechamentoStatus === 'ABERTO' ? 'bg-amber-400 animate-pulse' :
                fechamentoStatus?.startsWith('CONCILIADO_OK') ? 'bg-emerald-500' :
                fechamentoStatus?.includes('DIVERGENCIA') ? 'bg-red-500' :
                fechamentoStatus ? 'bg-blue-500' : 'bg-muted-foreground'
              }`} />
              <span className="text-sm font-semibold">{
                fechamentoStatus === 'ABERTO' ? 'Aberto' :
                fechamentoStatus === 'FECHADO_PENDENTE_CONCILIACAO' ? 'Fechado' :
                fechamentoStatus === 'CONCILIADO_OK' ? 'Conciliado ✓' :
                fechamentoStatus?.includes('DIVERGENCIA') ? 'Divergência' :
                fechamentoStatus === 'REABERTO' ? 'Reaberto' :
                'Sem lançamento'
              }</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
