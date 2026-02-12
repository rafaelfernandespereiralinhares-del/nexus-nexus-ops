import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Target, Save, Download, Upload } from 'lucide-react';
import { validateOrError, metaSchema } from '@/lib/validation';
import { exportToCSV, exportToExcel, parseCSV, parseExcel } from '@/lib/csv';

interface Loja { id: string; nome: string; }

export default function Metas() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [lojaId, setLojaId] = useState('');
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [metaMensal, setMetaMensal] = useState('');
  const [metaDiaria, setMetaDiaria] = useState('');
  const [metas, setMetas] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.empresa_id) return;
    supabase.from('lojas').select('id, nome').eq('empresa_id', profile.empresa_id).eq('ativa', true)
      .then(({ data }) => { if (data) setLojas(data); });
    fetchMetas();
  }, [profile]);

  const fetchMetas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('metas').select('*').eq('empresa_id', profile.empresa_id).order('mes', { ascending: false });
    if (data) setMetas(data);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id) return;
    const v = validateOrError(metaSchema, { loja_id: lojaId, mes, meta_mensal: parseFloat(metaMensal) || 0, meta_diaria: parseFloat(metaDiaria) || 0 });
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const payload = {
      empresa_id: profile.empresa_id,
      loja_id: lojaId,
      mes,
      meta_mensal: parseFloat(metaMensal) || 0,
      meta_diaria: parseFloat(metaDiaria) || 0,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('metas').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('metas').insert(payload));
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editId ? 'Meta atualizada!' : 'Meta cadastrada!' });
      setEditId(null);
      setMetaMensal('');
      setMetaDiaria('');
      fetchMetas();
    }
  };

  const handleEdit = (m: any) => {
    setEditId(m.id);
    setLojaId(m.loja_id);
    setMes(m.mes);
    setMetaMensal(String(m.meta_mensal));
    setMetaDiaria(String(m.meta_diaria));
  };

  const handleExport = () => {
    const data = metas.map(m => ({
      mes: m.mes,
      loja: lojas.find(l => l.id === m.loja_id)?.nome ?? '-',
      meta_mensal: Number(m.meta_mensal).toFixed(2),
      meta_diaria: Number(m.meta_diaria).toFixed(2),
    }));
    const cols = [
      { key: 'mes', label: 'Mês' },
      { key: 'loja', label: 'Loja' },
      { key: 'meta_mensal', label: 'Meta Mensal' },
      { key: 'meta_diaria', label: 'Meta Diária' },
    ];
    exportToCSV(data, 'metas', cols);
    toast({ title: 'Exportado!' });
  };

  const handleExportExcel = () => {
    const data = metas.map(m => ({
      mes: m.mes,
      loja: lojas.find(l => l.id === m.loja_id)?.nome ?? '-',
      meta_mensal: Number(m.meta_mensal).toFixed(2),
      meta_diaria: Number(m.meta_diaria).toFixed(2),
    }));
    const cols = [
      { key: 'mes', label: 'Mês' },
      { key: 'loja', label: 'Loja' },
      { key: 'meta_mensal', label: 'Meta Mensal' },
      { key: 'meta_diaria', label: 'Meta Diária' },
    ];
    exportToExcel(data, 'metas', cols);
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
      const mesVal = row['Mês'] || row['mes'] || row['Mes'];
      const lojaNome = row['Loja'] || row['loja'];
      const metaMensalVal = parseFloat((row['Meta Mensal'] || row['meta_mensal'] || '0').replace(',', '.'));
      const metaDiariaVal = parseFloat((row['Meta Diária'] || row['meta_diaria'] || row['Meta Diaria'] || '0').replace(',', '.'));
      const loja = lojas.find(l => l.nome.toLowerCase() === lojaNome?.toLowerCase());
      if (!mesVal || !loja) continue;
      const { error } = await supabase.from('metas').insert({
        empresa_id: profile.empresa_id,
        loja_id: loja.id,
        mes: mesVal,
        meta_mensal: metaMensalVal,
        meta_diaria: metaDiariaVal,
      });
      if (!error) imported++;
    }
    toast({ title: `${imported} metas importadas de ${rows.length}` });
    if (fileRef.current) fileRef.current.value = '';
    fetchMetas();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Metas</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2" disabled={metas.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2" disabled={metas.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <input type="file" accept=".csv,.xlsx,.xls" ref={fileRef} onChange={handleImport} className="hidden" />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> {editId ? 'Editar' : 'Nova'} Meta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Loja</Label>
              <Select value={lojaId} onValueChange={setLojaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{lojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <Input type="month" value={mes} onChange={e => setMes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta Mensal (R$)</Label>
              <Input type="number" step="0.01" value={metaMensal} onChange={e => setMetaMensal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Meta Diária (R$)</Label>
              <Input type="number" step="0.01" value={metaDiaria} onChange={e => setMetaDiaria(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Salvar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Metas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead className="text-right">Meta Mensal</TableHead>
                <TableHead className="text-right">Meta Diária</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metas.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{m.mes}</TableCell>
                  <TableCell>{lojas.find(l => l.id === m.loja_id)?.nome ?? '-'}</TableCell>
                  <TableCell className="text-right">R$ {Number(m.meta_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">R$ {Number(m.meta_diaria).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => handleEdit(m)}>Editar</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
