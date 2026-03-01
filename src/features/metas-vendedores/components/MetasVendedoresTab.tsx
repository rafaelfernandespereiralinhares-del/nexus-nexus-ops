import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Trophy, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetaVendedor, Funcionario, Loja } from '../types';

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const ESCALAS = [
  { value: '12x36_0900_2100', label: '12x36 (09h-21h)' },
  { value: '6x1_seg_sab_1340_2200', label: '6x1 Seg-Sáb (13:40-22:00)' },
  { value: '6x1_folga_quarta_trabalha_dom_1340_2200', label: '6x1 Folga Qua + Dom' },
  { value: 'comercial', label: 'Comercial' },
];

export function MetasVendedoresTab() {
  const { profile, primaryRole } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const [filterMes, setFilterMes] = useState(String(now.getMonth()));
  const [filterAno, setFilterAno] = useState(String(now.getFullYear()));
  const [filterLoja, setFilterLoja] = useState('todas');
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [metas, setMetas] = useState<MetaVendedor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    funcionario_id: '',
    loja_id: '',
    escala: 'comercial',
    qtd_unidades_reais_mes: '26',
    horas_liquidas_mes: '184',
    meta_mensal: '',
    meta_por_unidade: '',
  });

  const mesStr = `${filterAno}-${String(parseInt(filterMes) + 1).padStart(2, '0')}`;

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    supabase.from('funcionarios').select('id, nome, loja_id, cargo, ativo').eq('empresa_id', profile.empresa_id).eq('ativo', true)
      .then(({ data }) => { if (data) setFuncionarios(data as Funcionario[]); });
  }, [profile]);

  useEffect(() => {
    fetchMetas();
  }, [profile, filterMes, filterAno]);

  const fetchMetas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await (supabase.from('metas_vendedores' as any).select('*')
      .eq('empresa_id', profile.empresa_id).eq('mes', mesStr) as any);
    if (data) setMetas(data as MetaVendedor[]);
  };

  const filtered = filterLoja === 'todas' ? metas : metas.filter(m => m.loja_id === filterLoja);

  // Group by loja
  const lojaGroups = lojas.filter(l => filterLoja === 'todas' || l.id === filterLoja).map(loja => ({
    loja,
    vendedores: filtered.filter(m => m.loja_id === loja.id),
  })).filter(g => g.vendedores.length > 0);

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.funcionario_id || !form.loja_id) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    const metaMensal = parseFloat(form.meta_mensal) || 0;
    const qtdUnidades = parseInt(form.qtd_unidades_reais_mes) || 26;
    const metaPorUnidade = metaMensal / qtdUnidades;
    // Auto-calculate weekly with standard weights
    const pesos = [0.35, 0.25, 0.2, 0.2];
    
    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      funcionario_id: form.funcionario_id,
      mes: mesStr,
      escala: form.escala,
      qtd_unidades_reais_mes: qtdUnidades,
      horas_liquidas_mes: parseFloat(form.horas_liquidas_mes) || 0,
      meta_mensal: metaMensal,
      meta_semanal_s1: metaMensal * pesos[0],
      meta_semanal_s2: metaMensal * pesos[1],
      meta_semanal_s3: metaMensal * pesos[2],
      meta_semanal_s4: metaMensal * pesos[3],
      meta_por_unidade: metaPorUnidade,
      faixa_premio_30: metaPorUnidade * 1.0,
      faixa_premio_50: metaPorUnidade * 1.2,
      faixa_premio_80: metaPorUnidade * 1.5,
      faixa_premio_120: metaPorUnidade * 2.0,
      min_semanal_s1: metaMensal * pesos[0] * 0.7,
      min_semanal_s2: metaMensal * pesos[1] * 0.7,
      min_semanal_s3: metaMensal * pesos[2] * 0.7,
      min_semanal_s4: metaMensal * pesos[3] * 0.7,
      min_mensal: metaMensal * 0.7,
    };

    const { error } = await (supabase.from('metas_vendedores' as any).upsert(payload as any, { onConflict: 'empresa_id,loja_id,funcionario_id,mes' }) as any);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Meta do vendedor salva!' });
      setDialogOpen(false);
      fetchMetas();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from('metas_vendedores' as any).delete().eq('id', id) as any);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Meta excluída!' }); fetchMetas(); }
  };

  const totalMetaLoja = (lojaId: string) => filtered.filter(m => m.loja_id === lojaId).reduce((s, m) => s + Number(m.meta_mensal), 0);
  const totalRealizadoLoja = (lojaId: string) => filtered.filter(m => m.loja_id === lojaId).reduce((s, m) => s + Number(m.realizado_mensal), 0);

  return (
    <div className="space-y-4">
      {/* Filters + Add */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLoja} onValueChange={setFilterLoja}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Lojas</SelectItem>
            {lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 ml-auto"><Plus className="h-4 w-4" /> Nova Meta Vendedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Meta Individual – {meses[parseInt(filterMes)]} {filterAno}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Loja</Label>
                <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Funcionário (Vendedor)</Label>
                <Select value={form.funcionario_id} onValueChange={v => setForm(p => ({ ...p, funcionario_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {funcionarios.filter(f => !form.loja_id || f.loja_id === form.loja_id).map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome} – {f.cargo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Escala</Label>
                  <Select value={form.escala} onValueChange={v => setForm(p => ({ ...p, escala: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESCALAS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Unidades no Mês</Label>
                  <Input type="number" value={form.qtd_unidades_reais_mes} onChange={e => setForm(p => ({ ...p, qtd_unidades_reais_mes: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Meta Mensal (R$)</Label>
                  <Input type="number" step="0.01" value={form.meta_mensal} onChange={e => setForm(p => ({ ...p, meta_mensal: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Horas Líquidas/Mês</Label>
                  <Input type="number" step="0.01" value={form.horas_liquidas_mes} onChange={e => setForm(p => ({ ...p, horas_liquidas_mes: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar Meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards per loja */}
      {lojaGroups.map(({ loja, vendedores }) => {
        const totalMeta = totalMetaLoja(loja.id);
        const totalReal = totalRealizadoLoja(loja.id);
        const pct = totalMeta > 0 ? Math.round((totalReal / totalMeta) * 100) : 0;
        return (
          <Card key={loja.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  {loja.nome}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{vendedores.length} vendedores</Badge>
                  <Badge variant={pct >= 100 ? 'default' : pct >= 70 ? 'secondary' : 'destructive'}>{pct}%</Badge>
                </div>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Meta Loja: {fmt(totalMeta)}</span>
                <span>Realizado: {fmt(totalReal)}</span>
              </div>
              <Progress value={Math.min(pct, 100)} className="h-2 mt-2" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Escala</TableHead>
                    <TableHead className="text-right">Meta Mensal</TableHead>
                    <TableHead className="text-right">Meta/Unidade</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead className="text-center">Faixas Prêmio</TableHead>
                    {primaryRole === 'ADMIN' && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedores.map(v => {
                    const func = funcionarios.find(f => f.id === v.funcionario_id);
                    const realPct = Number(v.meta_mensal) > 0 ? Math.round((Number(v.realizado_mensal) / Number(v.meta_mensal)) * 100) : 0;
                    const escLabel = ESCALAS.find(e => e.value === v.escala)?.label || v.escala;
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{func?.nome ?? '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{escLabel}</Badge></TableCell>
                        <TableCell className="text-right">{fmt(Number(v.meta_mensal))}</TableCell>
                        <TableCell className="text-right">{fmt(Number(v.meta_por_unidade))}</TableCell>
                        <TableCell className="text-right">{fmt(Number(v.realizado_mensal))}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={realPct >= 100 ? 'default' : realPct >= 70 ? 'secondary' : 'destructive'}>
                            {realPct}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center flex-wrap">
                            <Badge variant="outline" className="text-xs">R${Number(v.faixa_premio_30).toFixed(0)}→30</Badge>
                            <Badge variant="outline" className="text-xs">R${Number(v.faixa_premio_50).toFixed(0)}→50</Badge>
                            <Badge variant="outline" className="text-xs">R${Number(v.faixa_premio_80).toFixed(0)}→80</Badge>
                            <Badge variant="outline" className="text-xs">R${Number(v.faixa_premio_120).toFixed(0)}→120</Badge>
                          </div>
                        </TableCell>
                        {primaryRole === 'ADMIN' && (
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(v.id)}>Excluir</Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {lojaGroups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhuma meta de vendedor cadastrada para {meses[parseInt(filterMes)]} {filterAno}</p>
      )}
    </div>
  );
}
