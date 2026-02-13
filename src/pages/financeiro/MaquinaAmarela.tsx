import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Smartphone, Trash2 } from 'lucide-react';
import { exportToExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

const TAXAS: Record<string, { label: string; taxa: number }> = {
  DEBITO: { label: 'Débito', taxa: 2.5 },
  CREDITO: { label: 'Crédito à Vista', taxa: 5 },
  PIX: { label: 'PIX', taxa: 2.5 },
  CREDITO_2X: { label: 'Crédito 2x', taxa: 6 },
  CREDITO_3X: { label: 'Crédito 3x', taxa: 7 },
  CREDITO_4X: { label: 'Crédito 4x', taxa: 8 },
  CREDITO_5X: { label: 'Crédito 5x', taxa: 9 },
  CREDITO_6X: { label: 'Crédito 6x', taxa: 10 },
  CREDITO_7X: { label: 'Crédito 7x', taxa: 11 },
  CREDITO_8X: { label: 'Crédito 8x', taxa: 12 },
  CREDITO_9X: { label: 'Crédito 9x', taxa: 13 },
  CREDITO_10X: { label: 'Crédito 10x', taxa: 14 },
};

const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function MaquinaAmarela() {
  const { profile, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const { toast } = useToast();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hoje = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ loja_id: '', data: hoje, descricao: '', tipo_pagamento: 'DEBITO', valor_bruto: '' });

  const [filterMes, setFilterMes] = useState(String(new Date().getMonth()));
  const [filterAno, setFilterAno] = useState(String(new Date().getFullYear()));
  const [filterLoja, setFilterLoja] = useState('todas');

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchEntries();
  }, [profile]);

  const fetchEntries = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('maquina_amarela').select('*')
      .eq('empresa_id', profile.empresa_id).order('data', { ascending: false });
    if (data) setEntries(data);
  };

  const mesStr = `${filterAno}-${String(parseInt(filterMes) + 1).padStart(2, '0')}`;
  const filtered = entries.filter(e => {
    const matchMes = e.data?.startsWith(mesStr);
    const matchLoja = filterLoja === 'todas' || e.loja_id === filterLoja;
    return matchMes && matchLoja;
  });

  // Summary
  const totalBruto = filtered.reduce((s, e) => s + Number(e.valor_bruto), 0);
  const totalTaxa = filtered.reduce((s, e) => s + Number(e.valor_taxa), 0);
  const totalLiquido = filtered.reduce((s, e) => s + Number(e.valor_liquido), 0);

  // Summary by type
  const summaryByType = Object.keys(TAXAS).map(tipo => {
    const items = filtered.filter(e => e.tipo_pagamento === tipo);
    return {
      tipo,
      label: TAXAS[tipo].label,
      taxa: TAXAS[tipo].taxa,
      count: items.length,
      bruto: items.reduce((s, e) => s + Number(e.valor_bruto), 0),
      taxaValor: items.reduce((s, e) => s + Number(e.valor_taxa), 0),
      liquido: items.reduce((s, e) => s + Number(e.valor_liquido), 0),
    };
  }).filter(s => s.count > 0);

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.loja_id || !form.valor_bruto) {
      toast({ title: 'Preencha loja e valor', variant: 'destructive' }); return;
    }
    const bruto = parseFloat(form.valor_bruto);
    const taxaInfo = TAXAS[form.tipo_pagamento];
    const valorTaxa = Math.round(bruto * (taxaInfo.taxa / 100) * 100) / 100;
    const valorLiquido = Math.round((bruto - valorTaxa) * 100) / 100;

    const { error } = await supabase.from('maquina_amarela').insert({
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      data: form.data,
      descricao: form.descricao,
      tipo_pagamento: form.tipo_pagamento as any,
      valor_bruto: bruto,
      taxa_percentual: taxaInfo.taxa,
      valor_taxa: valorTaxa,
      valor_liquido: valorLiquido,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Venda registrada!' });
      setDialogOpen(false);
      setForm({ loja_id: form.loja_id, data: hoje, descricao: '', tipo_pagamento: 'DEBITO', valor_bruto: '' });
      fetchEntries();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('maquina_amarela').delete().eq('id', id);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Excluído!' }); fetchEntries(); }
  };

  const handleExport = () => {
    const data = filtered.map(e => ({
      data: new Date(e.data).toLocaleDateString('pt-BR'),
      loja: lojas.find(l => l.id === e.loja_id)?.nome ?? '-',
      descricao: e.descricao,
      tipo: TAXAS[e.tipo_pagamento]?.label || e.tipo_pagamento,
      valor_bruto: Number(e.valor_bruto).toFixed(2),
      taxa: `${Number(e.taxa_percentual)}%`,
      valor_taxa: Number(e.valor_taxa).toFixed(2),
      valor_liquido: Number(e.valor_liquido).toFixed(2),
    }));
    exportToExcel(data, `maquina_amarela_${mesStr}`, [
      { key: 'data', label: 'Data' }, { key: 'loja', label: 'Loja' },
      { key: 'descricao', label: 'Descrição' }, { key: 'tipo', label: 'Tipo' },
      { key: 'valor_bruto', label: 'Valor Bruto' }, { key: 'taxa', label: 'Taxa' },
      { key: 'valor_taxa', label: 'Valor Taxa' }, { key: 'valor_liquido', label: 'Valor Líquido' },
    ]);
  };

  // Preview calculation
  const previewBruto = parseFloat(form.valor_bruto || '0');
  const previewTaxa = TAXAS[form.tipo_pagamento]?.taxa || 0;
  const previewValorTaxa = Math.round(previewBruto * (previewTaxa / 100) * 100) / 100;
  const previewLiquido = Math.round((previewBruto - previewValorTaxa) * 100) / 100;

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-warning" /> Máquina Amarela
          </h1>
          <p className="text-sm text-muted-foreground">Controle de vendas e taxas da maquininha</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="gap-2">
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Venda</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar Venda na Máquina</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Loja</Label>
                    <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição (opcional)</Label>
                  <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Venda acessório" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo de Pagamento</Label>
                    <Select value={form.tipo_pagamento} onValueChange={v => setForm(p => ({ ...p, tipo_pagamento: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TAXAS).map(([key, { label, taxa }]) => (
                          <SelectItem key={key} value={key}>{label} ({taxa}%)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor Bruto (R$)</Label>
                    <Input type="number" step="0.01" value={form.valor_bruto}
                      onChange={e => setForm(p => ({ ...p, valor_bruto: e.target.value }))} placeholder="0,00" />
                  </div>
                </div>
                {previewBruto > 0 && (
                  <Card className="bg-muted/50">
                    <CardContent className="py-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Taxa ({previewTaxa}%)</p>
                        <p className="font-bold text-destructive">{fmt(previewValorTaxa)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Bruto</p>
                        <p className="font-bold">{fmt(previewBruto)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Líquido</p>
                        <p className="font-bold text-success">{fmt(previewLiquido)}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Button onClick={handleSave} className="w-full">Registrar Venda</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterLoja} onValueChange={setFilterLoja}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as lojas</SelectItem>
            {lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterMes} onValueChange={setFilterMes}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{meses.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterAno} onValueChange={setFilterAno}>
          <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Bruto</p>
          <p className="text-2xl font-bold">{fmt(totalBruto)}</p>
          <p className="text-xs text-muted-foreground mt-1">{filtered.length} vendas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Taxas</p>
          <p className="text-2xl font-bold text-destructive">- {fmt(totalTaxa)}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalBruto > 0 ? ((totalTaxa / totalBruto) * 100).toFixed(1) : 0}% média</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Líquido</p>
          <p className="text-2xl font-bold text-success">{fmt(totalLiquido)}</p>
          <p className="text-xs text-muted-foreground mt-1">Valor que entra na conta</p>
        </CardContent></Card>
      </div>

      {/* Summary by Type */}
      {summaryByType.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Relatório por Tipo de Pagamento</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-center">Taxa</TableHead>
                  <TableHead className="text-right">Valor Taxa</TableHead>
                  <TableHead className="text-right font-bold">Líquido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryByType.map(s => (
                  <TableRow key={s.tipo}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    <TableCell className="text-center">{s.count}</TableCell>
                    <TableCell className="text-right">{fmt(s.bruto)}</TableCell>
                    <TableCell className="text-center">{s.taxa}%</TableCell>
                    <TableCell className="text-right text-destructive">{fmt(s.taxaValor)}</TableCell>
                    <TableCell className="text-right font-bold text-success">{fmt(s.liquido)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/30">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-center">{filtered.length}</TableCell>
                  <TableCell className="text-right">{fmt(totalBruto)}</TableCell>
                  <TableCell className="text-center">{totalBruto > 0 ? ((totalTaxa / totalBruto) * 100).toFixed(1) : 0}%</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(totalTaxa)}</TableCell>
                  <TableCell className="text-right text-success">{fmt(totalLiquido)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Entries Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
                <TableHead className="text-right font-bold">Líquido</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{lojas.find(l => l.id === e.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell>{e.descricao || '—'}</TableCell>
                  <TableCell>{TAXAS[e.tipo_pagamento]?.label || e.tipo_pagamento}</TableCell>
                  <TableCell className="text-right">{fmt(Number(e.valor_bruto))}</TableCell>
                  <TableCell className="text-center">{Number(e.taxa_percentual)}%</TableCell>
                  <TableCell className="text-right text-destructive">{fmt(Number(e.valor_taxa))}</TableCell>
                  <TableCell className="text-right font-bold text-success">{fmt(Number(e.valor_liquido))}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Nenhum lançamento neste período</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
