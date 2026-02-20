import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard, Download, Upload, SplitSquareHorizontal, Pencil, Trash2 } from 'lucide-react';
import { validateOrError, contaPagarSchema } from '@/lib/validation';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

export default function ContasPagar() {
  const isAdmin = useAuth().hasRole('ADMIN');
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [contas, setContas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ loja_id: '', fornecedor: '', valor: '', vencimento: '', status: 'ABERTO' });
  const [ratear, setRatear] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ loja_id: '', fornecedor: '', valor: '', vencimento: '', status: 'ABERTO' });
    setRatear(false);
    setDialogOpen(true);
  };

  const handleEdit = (conta: any) => {
    setEditingId(conta.id);
    setForm({
      loja_id: conta.loja_id || '',
      fornecedor: conta.fornecedor,
      valor: conta.valor.toString(),
      vencimento: conta.vencimento,
      status: conta.status,
    });
    setRatear(false);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    const { error } = await supabase.from('contas_pagar').delete().eq('id', id);
    if (error) { toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Conta excluída com sucesso!' });
    fetchContas();
  };

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchContas();
  }, [profile]);

  const fetchContas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('contas_pagar').select('*').eq('empresa_id', profile.empresa_id).order('vencimento', { ascending: true });
    if (data) setContas(data);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id) return;

    if (ratear) {
      // Rateio: divide equally among all active stores
      const valorTotal = parseFloat(form.valor);
      if (!form.fornecedor || !valorTotal || !form.vencimento) {
        toast({ title: 'Preencha fornecedor, valor e vencimento', variant: 'destructive' }); return;
      }
      const valorPorLoja = Math.round((valorTotal / lojas.length) * 100) / 100;
      let inserted = 0;
      for (const loja of lojas) {
        const { error } = await supabase.from('contas_pagar').insert({
          empresa_id: profile.empresa_id, loja_id: loja.id,
          fornecedor: form.fornecedor, valor: valorPorLoja,
          vencimento: form.vencimento, status: form.status as any,
        });
        if (!error) inserted++;
      }
      toast({ title: `Conta rateada entre ${inserted} lojas!` });
    } else {
      const v = validateOrError(contaPagarSchema, { loja_id: form.loja_id, fornecedor: form.fornecedor, valor: parseFloat(form.valor), vencimento: form.vencimento });
      if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }

      if (editingId) {
        const { error } = await supabase.from('contas_pagar').update({
          loja_id: form.loja_id,
          fornecedor: form.fornecedor, valor: parseFloat(form.valor),
          vencimento: form.vencimento, status: form.status as any,
        }).eq('id', editingId);
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Conta atualizada!' });
      } else {
        const { error } = await supabase.from('contas_pagar').insert({
          empresa_id: profile.empresa_id, loja_id: form.loja_id,
          fornecedor: form.fornecedor, valor: parseFloat(form.valor),
          vencimento: form.vencimento, status: form.status as any,
        });
        if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
        toast({ title: 'Conta registrada!' });
      }
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ loja_id: '', fornecedor: '', valor: '', vencimento: '', status: 'ABERTO' });
    setRatear(false);
    fetchContas();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('contas_pagar').update({
      status: status as any,
      data_pagamento: status === 'PAGO' ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', id);
    fetchContas();
  };

  const handleExport = () => {
    const data = contas.map(c => ({
      fornecedor: c.fornecedor,
      loja: lojas.find(l => l.id === c.loja_id)?.nome ?? '-',
      valor: Number(c.valor).toFixed(2),
      vencimento: new Date(c.vencimento).toLocaleDateString('pt-BR'),
      status: c.status,
    }));
    const cols = [
      { key: 'fornecedor', label: 'Fornecedor' },
      { key: 'loja', label: 'Loja' },
      { key: 'valor', label: 'Valor' },
      { key: 'vencimento', label: 'Vencimento' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV(data, 'contas_pagar', cols);
    toast({ title: 'Exportado!' });
  };

  const handleExportExcel = () => {
    const data = contas.map(c => ({
      fornecedor: c.fornecedor,
      loja: lojas.find(l => l.id === c.loja_id)?.nome ?? '-',
      valor: Number(c.valor).toFixed(2),
      vencimento: new Date(c.vencimento).toLocaleDateString('pt-BR'),
      status: c.status,
    }));
    const cols = [
      { key: 'fornecedor', label: 'Fornecedor' },
      { key: 'loja', label: 'Loja' },
      { key: 'valor', label: 'Valor' },
      { key: 'vencimento', label: 'Vencimento' },
      { key: 'status', label: 'Status' },
    ];
    exportToExcel(data, 'contas_pagar', cols);
    toast({ title: 'Exportado!' });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.empresa_id) return;
    let rows: Record<string, string>[];
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      ({ rows } = parseExcel(buffer));
    } else {
      const text = await file.text();
      ({ rows } = parseCSV(text));
    }
    if (rows.length === 0) {
      toast({ title: 'Erro', description: 'Arquivo vazio ou inválido', variant: 'destructive' });
      return;
    }
    let imported = 0;
    for (const row of rows) {
      const fornecedor = row['Fornecedor'] || row['fornecedor'] || row['FORNECEDOR'];
      const lojaNome = row['Loja'] || row['loja'] || row['EMPRESA'] || row['Empresa'] || row['empresa'];
      const valorRaw = row['Valor'] || row['valor'] || row['VALOR'] || '0';
      const valor = parseFloat(valorRaw.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.'));
      const vencimento = row['Vencimento'] || row['vencimento'] || row['VENCIMENTO'];
      const statusRaw = (row['Status'] || row['status'] || row['STATUS'] || '').toUpperCase().trim();
      const loja = lojas.find(l => l.nome.toLowerCase().includes(lojaNome?.toLowerCase()) || lojaNome?.toLowerCase().includes(l.nome.toLowerCase()));
      if (!fornecedor || !loja || !valor || !vencimento) continue;
      // Try to parse date - supports DD/MM/YYYY, M/D/YY, YYYY-MM-DD
      let dataISO = vencimento;
      if (vencimento.includes('/')) {
        const parts = vencimento.split('/');
        if (parts.length === 3) {
          const p0 = parseInt(parts[0]), p1 = parseInt(parts[1]), p2 = parseInt(parts[2]);
          // Detect format: if first part > 12, it's DD/MM/YYYY; otherwise M/D/YY or MM/DD/YYYY
          if (p0 > 12) {
            // DD/MM/YYYY
            const year = p2 < 100 ? 2000 + p2 : p2;
            dataISO = `${year}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
          } else {
            // M/D/YY (US format) - common in Excel
            const year = p2 < 100 ? 2000 + p2 : p2;
            dataISO = `${year}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
          }
        }
      }
      const status = statusRaw === 'PAGO' ? 'PAGO' : statusRaw === 'ATRASADO' ? 'ATRASADO' : 'ABERTO';
      const { error } = await supabase.from('contas_pagar').insert({
        empresa_id: profile.empresa_id,
        loja_id: loja.id,
        fornecedor,
        valor,
        vencimento: dataISO,
        status: status as any,
        data_pagamento: status === 'PAGO' ? dataISO : null,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} contas importadas de ${rows.length}` });
    if (fileRef.current) fileRef.current.value = '';
    fetchContas();
  };

  const statusBadge = (s: string) => {
    if (s === 'PAGO') return <Badge className="bg-success text-success-foreground">Pago</Badge>;
    if (s === 'ATRASADO') return <Badge className="bg-danger text-danger-foreground">Atrasado</Badge>;
    return <Badge variant="secondary">Aberto</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Contas a Pagar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={contas.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={contas.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2" onClick={openNewDialog}><Plus className="h-4 w-4" /> Nova Conta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {!editingId && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="ratear" checked={ratear} onCheckedChange={(v) => setRatear(!!v)} />
                    <Label htmlFor="ratear" className="flex items-center gap-1 text-sm cursor-pointer">
                      <SplitSquareHorizontal className="h-4 w-4" /> Ratear entre todas as lojas ({lojas.length})
                    </Label>
                  </div>
                )}
                {(!ratear || editingId) && (
                  <div className="space-y-1.5">
                    <Label>Loja</Label>
                    <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                {ratear && (
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    O valor total será dividido igualmente entre {lojas.length} lojas: <strong>R$ {lojas.length > 0 ? (parseFloat(form.valor || '0') / lojas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</strong> cada
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label>Fornecedor</Label>
                  <Input value={form.fornecedor} onChange={e => setForm(p => ({ ...p, fornecedor: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Valor {ratear ? 'Total' : ''}</Label>
                    <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vencimento</Label>
                    <Input type="date" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.fornecedor}</TableCell>
                  <TableCell>{lojas.find(l => l.id === c.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{new Date(c.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin ? (
                        <Select value={c.status} onValueChange={v => updateStatus(c.id, v)}>
                          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ABERTO">Aberto</SelectItem>
                            <SelectItem value="PAGO">Pago</SelectItem>
                            <SelectItem value="ATRASADO">Atrasado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : c.status !== 'PAGO' ? (
                        <Button variant="ghost" size="sm" onClick={() => updateStatus(c.id, 'PAGO')}>Marcar Pago</Button>
                      ) : null}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contas.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma conta registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
