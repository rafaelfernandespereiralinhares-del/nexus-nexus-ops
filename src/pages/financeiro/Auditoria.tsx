import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, AlertTriangle } from 'lucide-react';

interface Loja { id: string; nome: string; }

export default function Auditoria() {
  const { profile } = useAuth();
  const { toast } = useToast();
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

  const statusBadge = (s: string) => {
    if (s === 'RESOLVIDA') return <Badge className="bg-success text-success-foreground">Resolvida</Badge>;
    if (s === 'EM_ANALISE') return <Badge className="bg-warning text-warning-foreground">Em Análise</Badge>;
    return <Badge className="bg-danger text-danger-foreground">Aberta</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Auditoria</h1>
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
