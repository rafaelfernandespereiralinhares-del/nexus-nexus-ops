import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Briefcase, TrendingDown, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Funcionario {
  id: string; nome: string; cargo: string; loja_id: string; vinculo: string;
  salario: number; passagem: number; ajuda_custo: number; ativo: boolean;
}
interface Loja { id: string; nome: string; }

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', '#10b981', '#06b6d4', '#8b5cf6'];

export default function FolhaPagamento() {
  const { profile } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    Promise.all([
      supabase.from('funcionarios').select('*').eq('empresa_id', profile.empresa_id).eq('ativo', true),
      supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id),
    ]).then(([fRes, lRes]) => {
      if (fRes.data) setFuncionarios(fRes.data as any);
      if (lRes.data) setLojas(lRes.data);
    });
  }, [profile]);

  const stats = useMemo(() => {
    const folhaBruta = funcionarios.reduce((s, f) => s + Number(f.salario), 0);
    const passagens = funcionarios.reduce((s, f) => s + Number(f.passagem), 0);
    const ajudas = funcionarios.reduce((s, f) => s + Number(f.ajuda_custo), 0);
    const custoDireto = folhaBruta + passagens + ajudas;
    const fgts = folhaBruta * 0.08;
    const inss = folhaBruta * 0.075;
    const decimo = folhaBruta / 12;
    const ferias = (folhaBruta / 12) * (4 / 3);
    const custoTotal = custoDireto + fgts + inss + decimo + ferias;

    return { folhaBruta, passagens, ajudas, custoDireto, fgts, inss, decimo, ferias, custoTotal };
  }, [funcionarios]);

  const barData = useMemo(() => {
    const byLoja: Record<string, { salarios: number; passagens: number }> = {};
    funcionarios.forEach(f => {
      const nome = lojas.find(l => l.id === f.loja_id)?.nome || 'Sem loja';
      if (!byLoja[nome]) byLoja[nome] = { salarios: 0, passagens: 0 };
      byLoja[nome].salarios += Number(f.salario) + Number(f.ajuda_custo);
      byLoja[nome].passagens += Number(f.passagem);
    });
    return Object.entries(byLoja).map(([nome, v]) => ({ nome, ...v }));
  }, [funcionarios, lojas]);

  const pieData = useMemo(() => {
    if (stats.custoTotal === 0) return [];
    return [
      { name: 'Salários', value: stats.folhaBruta },
      { name: 'Férias (prov.)', value: stats.ferias },
      { name: '13º (prov.)', value: stats.decimo },
      { name: 'INSS (est.)', value: stats.inss },
      { name: 'FGTS (est.)', value: stats.fgts },
      { name: 'Passagens', value: stats.passagens },
    ].filter(d => d.value > 0);
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Folha de Pagamento & DRE</h1>
        <p className="text-sm text-muted-foreground">Demonstrativo de custos com pessoal — {new Date().getFullYear()}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Folha Bruta</p>
              <p className="text-xl font-bold">{fmt(stats.folhaBruta)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Custo Direto</p>
              <p className="text-xl font-bold">{fmt(stats.custoDireto)}</p>
              <p className="text-xs text-muted-foreground">Salário+Passagem+Ajuda</p>
            </div>
            <Briefcase className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Custo c/ Encargos</p>
              <p className="text-xl font-bold">{fmt(stats.custoTotal)}</p>
              <p className="text-xs text-muted-foreground">Inclui FGTS, INSS, 13º, Férias</p>
            </div>
            <TrendingDown className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Colaboradores Ativos</p>
              <p className="text-xl font-bold">{funcionarios.length}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground/40" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Custo por Loja (Detalhado)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="salarios" fill="hsl(var(--primary))" name="Salários" stackId="a" />
                <Bar dataKey="passagens" fill="hsl(var(--warning))" name="Passagens" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Composição de Custos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* DRE Table */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">DRE — Demonstrativo de Resultado (Pessoal)</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-bold"><span>Salários Contratuais</span><span>{fmt(stats.folhaBruta)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) Salário Família</span><span>R$ 0,00</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) Ajuda de Custo</span><span>{fmt(stats.ajudas)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) Passagens</span><span>{fmt(stats.passagens)}</span></div>
            <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>= Custo Direto com Pessoal</span><span>{fmt(stats.custoDireto)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) FGTS Estimado (8%)</span><span className="text-primary">{fmt(stats.fgts)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) INSS Estimado (7,5%)</span><span className="text-primary">{fmt(stats.inss)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) Provisão 13º Salário</span><span className="text-primary">{fmt(stats.decimo)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>(+) Provisão Férias (1/12 + 1/3)</span><span className="text-primary">{fmt(stats.ferias)}</span></div>
            <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>= CUSTO TOTAL MENSAL COM PESSOAL</span><span className="text-destructive">{fmt(stats.custoTotal)}</span></div>
            <div className="flex justify-between pl-4 text-muted-foreground"><span>Custo Anual Projetado (x12)</span><span>{fmt(stats.custoTotal * 12)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Folha Analítica */}
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4 font-medium">Folha Analítica por Colaborador</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Vínculo</TableHead>
                <TableHead className="text-right">Salário</TableHead>
                <TableHead className="text-right">Passagem</TableHead>
                <TableHead className="text-right">Ajuda</TableHead>
                <TableHead className="text-right font-bold">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.map(f => {
                const custo = Number(f.salario) + Number(f.passagem) + Number(f.ajuda_custo);
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nome}</TableCell>
                    <TableCell>{f.cargo}</TableCell>
                    <TableCell>{lojas.find(l => l.id === f.loja_id)?.nome ?? '-'}</TableCell>
                    <TableCell><Badge variant="outline">{f.vinculo}</Badge></TableCell>
                    <TableCell className="text-right">{fmt(Number(f.salario))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.passagem))}</TableCell>
                    <TableCell className="text-right">{fmt(Number(f.ajuda_custo))}</TableCell>
                    <TableCell className="text-right font-bold">{fmt(custo)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
