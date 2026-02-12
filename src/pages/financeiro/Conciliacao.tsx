import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileCheck, Download } from 'lucide-react';
import { exportToCSV, parseCSV } from '@/lib/csv';

interface Loja { id: string; nome: string; }

export default function Conciliacao() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaId, setLojaId] = useState('');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [valorCol, setValorCol] = useState('');
  const [conciliacoes, setConciliacoes] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    supabase.from('conciliacoes').select('*').eq('empresa_id', profile.empresa_id).order('data', { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setConciliacoes(data); });
  }, [profile]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { rows, columns: cols } = parseCSV(text);
    if (rows.length > 0) {
      setColumns(cols);
      setParsedRows(rows);
    } else {
      toast({ title: 'Erro', description: 'Arquivo vazio ou formato inválido. Use CSV.', variant: 'destructive' });
    }
  };

  const handleConciliar = async () => {
    if (!lojaId || !valorCol || !profile?.empresa_id) return;
    const totalPdv = parsedRows.reduce((sum, r) => sum + (parseFloat(r[valorCol]) || 0), 0);

    const { data: fech } = await supabase.from('fechamentos').select('total_entradas')
      .eq('loja_id', lojaId).eq('data', data).is('deleted_at', null).single();

    const valorCaixa = fech ? Number(fech.total_entradas) : 0;
    const diferenca = totalPdv - valorCaixa;
    const statusCalc = diferenca === 0 ? 'OK' : 'DIVERGENCIA';

    const { error } = await supabase.from('conciliacoes').insert({
      empresa_id: profile.empresa_id,
      loja_id: lojaId,
      data,
      valor_pdv: totalPdv,
      valor_caixa: valorCaixa,
      status: statusCalc as any,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conciliação registrada!' });
      setParsedRows([]);
      setColumns([]);
      const { data: updated } = await supabase.from('conciliacoes').select('*').eq('empresa_id', profile.empresa_id).order('data', { ascending: false }).limit(50);
      if (updated) setConciliacoes(updated);
    }
  };

  const handleExport = () => {
    const csvData = conciliacoes.map(c => ({
      data: new Date(c.data).toLocaleDateString('pt-BR'),
      loja: lojas.find(l => l.id === c.loja_id)?.nome ?? '-',
      valor_pdv: Number(c.valor_pdv).toFixed(2),
      valor_caixa: Number(c.valor_caixa).toFixed(2),
      diferenca: Number(c.diferenca).toFixed(2),
      status: c.status,
    }));
    exportToCSV(csvData, 'conciliacoes', [
      { key: 'data', label: 'Data' },
      { key: 'loja', label: 'Loja' },
      { key: 'valor_pdv', label: 'Valor PDV' },
      { key: 'valor_caixa', label: 'Valor Caixa' },
      { key: 'diferenca', label: 'Diferença' },
      { key: 'status', label: 'Status' },
    ]);
    toast({ title: 'Exportado!' });
  };

  const statusBadge = (s: string) => {
    if (s === 'OK') return <Badge className="bg-success text-success-foreground">OK</Badge>;
    if (s === 'DIVERGENCIA') return <Badge className="bg-danger text-danger-foreground">Divergência</Badge>;
    return <Badge variant="secondary">Análise</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Conciliação Alterdata</h1>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Importar Arquivo PDV</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={lojaId} onValueChange={setLojaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Arquivo CSV/Excel</Label>
              <Input type="file" accept=".csv" ref={fileRef} onChange={handleFile} />
            </div>
          </div>

          {columns.length > 0 && (
            <div className="space-y-3">
              <div className="max-w-xs space-y-1.5">
                <Label>Coluna de Valor PDV</Label>
                <Select value={valorCol} onValueChange={setValorCol}>
                  <SelectTrigger><SelectValue placeholder="Selecione a coluna" /></SelectTrigger>
                  <SelectContent>{columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">{parsedRows.length} registros encontrados</p>
              <Button onClick={handleConciliar} disabled={!valorCol || !lojaId} className="gap-2">
                <FileCheck className="h-4 w-4" /> Conciliar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Conciliações</CardTitle>
            <Button variant="outline" onClick={handleExport} className="gap-2" disabled={conciliacoes.length === 0}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Valor PDV</TableHead>
                <TableHead className="text-right">Valor Caixa</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conciliacoes.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{lojas.find(l => l.id === c.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.valor_pdv).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.valor_caixa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">R$ {Number(c.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                </TableRow>
              ))}
              {conciliacoes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma conciliação registrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
