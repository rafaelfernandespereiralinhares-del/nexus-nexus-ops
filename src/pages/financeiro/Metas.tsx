import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Target, Save } from 'lucide-react';
import { validateOrError, metaSchema } from '@/lib/validation';

interface Loja { id: string; nome: string; }

export default function Metas() {
  const { profile } = useAuth();
  const { toast } = useToast();
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

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Metas</h1>

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
