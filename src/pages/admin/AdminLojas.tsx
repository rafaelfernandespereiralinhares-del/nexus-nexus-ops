import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Store } from 'lucide-react';
import { validateOrError, lojaSchema } from '@/lib/validation';

export default function AdminLojas() {
  const { toast } = useToast();
  const [lojas, setLojas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', empresa_id: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [l, e] = await Promise.all([
      supabase.from('lojas').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('id, nome'),
    ]);
    if (l.data) setLojas(l.data);
    if (e.data) setEmpresas(e.data);
  };

  const handleSave = async () => {
    const v = validateOrError(lojaSchema, form);
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const { error } = await supabase.from('lojas').insert({
      nome: form.nome,
      empresa_id: form.empresa_id,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Loja criada!' });
      setDialogOpen(false);
      setForm({ nome: '', empresa_id: '' });
      fetchAll();
    }
  };

  const toggleAtiva = async (id: string, ativa: boolean) => {
    await supabase.from('lojas').update({ ativa: !ativa }).eq('id', id);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Lojas</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Loja</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Loja</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Select value={form.empresa_id} onValueChange={v => setForm(p => ({ ...p, empresa_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome da Loja</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Loja Centro" />
              </div>
              <Button onClick={handleSave} className="w-full">Criar Loja</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lojas.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell>{empresas.find(e => e.id === l.empresa_id)?.nome ?? '-'}</TableCell>
                  <TableCell>
                    <Badge className={l.ativa ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                      {l.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(l.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleAtiva(l.id, l.ativa)}>
                      {l.ativa ? 'Desativar' : 'Ativar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {lojas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma loja cadastrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
