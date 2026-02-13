import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Download, Upload } from 'lucide-react';
import { validateOrError, auditoriaSchema } from '@/lib/validation';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

export default function Auditoria() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ loja_id: '', tipo: '', descricao: '', valor: '', status: 'ABERTA' });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchAuditorias();
  }, [profile]);

  const fetchAuditorias = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('auditorias').select('*').eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false });
    if (data) setAuditorias(data);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id) return;
    const v = validateOrError(auditoriaSchema, { loja_id: form.loja_id, tipo: form.tipo, descricao: form.descricao || undefined, valor: form.valor ? parseFloat(form.valor) : undefined });
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const { error } = await supabase.from('auditorias').insert({
      empresa_id: profile.empresa_id,
      loja_id: form.loja_id,
      tipo: form.tipo,
      descricao: form.descricao,
      valor: form.valor ? parseFloat(form.valor) : null,
      status: form.status as any,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Ocorrência registrada!' });
      setDialogOpen(false);
      setForm({ loja_id: '', tipo: '', descricao: '', valor: '', status: 'ABERTA' });
      fetchAuditorias();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('auditorias').update({ status: status as any }).eq('id', id);
    fetchAuditorias();
  };

  const handleExport = () => {
    const data = auditorias.map(a => ({
      data: new Date(a.created_at).toLocaleDateString('pt-BR'),
      loja: lojas.find(l => l.id === a.loja_id)?.nome ?? '-',
      tipo: a.tipo,
      descricao: a.descricao ?? '',
      valor: a.valor ? Number(a.valor).toFixed(2) : '',
      status: a.status,
    }));
    const cols = [
      { key: 'data', label: 'Data' },
      { key: 'loja', label: 'Loja' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descricao', label: 'Descrição' },
      { key: 'valor', label: 'Valor' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV(data, 'auditorias', cols);
    toast({ title: 'Exportado!' });
  };

  const handleExportExcel = () => {
    const csvData = auditorias.map(a => ({
      data: new Date(a.created_at).toLocaleDateString('pt-BR'),
      loja: lojas.find(l => l.id === a.loja_id)?.nome ?? '-',
      tipo: a.tipo,
      descricao: a.descricao ?? '',
      valor: a.valor ? Number(a.valor).toFixed(2) : '',
      status: a.status,
    }));
    const cols = [
      { key: 'data', label: 'Data' },
      { key: 'loja', label: 'Loja' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descricao', label: 'Descrição' },
      { key: 'valor', label: 'Valor' },
      { key: 'status', label: 'Status' },
    ];
    exportToExcel(csvData, 'auditorias', cols);
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
      const lojaNome = row['Loja'] || row['loja'];
      const tipo = row['Tipo'] || row['tipo'];
      const descricao = row['Descrição'] || row['descricao'] || row['Descricao'] || '';
      const valorStr = row['Valor'] || row['valor'] || '';
      const valor = valorStr ? parseFloat(valorStr.replace(',', '.')) : null;
      const loja = lojas.find(l => l.nome.toLowerCase() === lojaNome?.toLowerCase());
      if (!tipo || !loja) continue;
      const { error } = await supabase.from('auditorias').insert({
        empresa_id: profile.empresa_id,
        loja_id: loja.id,
        tipo,
        descricao: descricao || null,
        valor: valor && !isNaN(valor) ? valor : null,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} ocorrências importadas de ${rows.length}` });
    if (fileRef.current) fileRef.current.value = '';
    fetchAuditorias();
  };

  const statusBadge = (s: string) => {
    if (s === 'RESOLVIDA') return <Badge className="bg-success text-success-foreground">Resolvida</Badge>;
    if (s === 'EM_ANALISE') return <Badge className="bg-warning text-warning-foreground">Em Análise</Badge>;
    return <Badge className="bg-danger text-danger-foreground">Aberta</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Auditoria</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={auditorias.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={auditorias.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Ocorrência</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Loja</Label>
                  <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Input value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} placeholder="Ex: Falta de caixa" />
                </div>
                <div className="space-y-1.5">
                  <Label>Descrição</Label>
                  <Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (opcional)</Label>
                  <Input type="number" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
                </div>
                <Button onClick={handleSave} className="w-full">Registrar</Button>
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
                <TableHead>Data</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditorias.map(a => (
                <TableRow key={a.id}>
                  <TableCell>{new Date(a.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{lojas.find(l => l.id === a.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell>{a.tipo}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{a.descricao}</TableCell>
                  <TableCell className="text-right">{a.valor ? `R$ ${Number(a.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                  <TableCell>{statusBadge(a.status)}</TableCell>
                  <TableCell>
                    <Select value={a.status} onValueChange={v => updateStatus(a.id, v)}>
                      <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABERTA">Aberta</SelectItem>
                        <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                        <SelectItem value="RESOLVIDA">Resolvida</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {auditorias.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma ocorrência registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
