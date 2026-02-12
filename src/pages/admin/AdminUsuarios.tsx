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
import { Plus, Users } from 'lucide-react';
import { validateOrError, usuarioSchema } from '@/lib/validation';

export default function AdminUsuarios() {
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', password: '', empresa_id: '', loja_id: '', role: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [u, e, l, r] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('empresas').select('id, nome'),
      supabase.from('lojas').select('id, nome, empresa_id'),
      supabase.from('user_roles').select('*'),
    ]);
    const rolesMap: Record<string, string[]> = {};
    (r.data || []).forEach((role: any) => {
      if (!rolesMap[role.user_id]) rolesMap[role.user_id] = [];
      rolesMap[role.user_id].push(role.role);
    });
    const enriched = (u.data || []).map((p: any) => ({ ...p, roles: rolesMap[p.user_id] || [] }));
    setUsuarios(enriched);
    if (e.data) setEmpresas(e.data);
    if (l.data) setLojas(l.data);
  };

  const handleCreate = async () => {
    const v = validateOrError(usuarioSchema, form);
    if (v) { toast({ title: 'Validação', description: v, variant: 'destructive' }); return; }
    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
      body: {
        email: form.email,
        password: form.password,
        nome: form.nome,
        empresa_id: form.empresa_id || null,
        loja_id: form.loja_id || null,
        role: form.role,
      },
    });

    if (fnError) {
      toast({ title: 'Erro', description: fnError.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Usuário criado!' });
    setDialogOpen(false);
    setForm({ nome: '', email: '', password: '', empresa_id: '', loja_id: '', role: '' });
    fetchAll();
  };

  const filteredLojas = lojas.filter(l => l.empresa_id === form.empresa_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Usuário</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Select value={form.empresa_id} onValueChange={v => setForm(p => ({ ...p, empresa_id: v, loja_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loja (opcional)</Label>
                <Select value={form.loja_id} onValueChange={v => setForm(p => ({ ...p, loja_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>{filteredLojas.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DIRETORIA">Diretoria</SelectItem>
                    <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                    <SelectItem value="LOJA">Loja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Usuário</Button>
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
                <TableHead>Email</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{empresas.find(e => e.id === u.empresa_id)?.nome ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">{u.roles.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={u.ativo ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
