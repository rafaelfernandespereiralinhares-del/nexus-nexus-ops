import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Wrench, Trophy } from 'lucide-react';

interface Campanha {
  id: string; nome: string; produto_servico: string; tipo: string;
  meta_quantidade: number; progresso: number; data_inicio: string; data_fim: string; ativa: boolean;
}

export default function CampanhasVendas() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState('todas');
  const [form, setForm] = useState({
    nome: '', produto_servico: '', tipo: 'MENSAL',
    meta_quantidade: '', data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!profile?.empresa_id) return;
    fetchCampanhas();
  }, [profile]);

  const fetchCampanhas = async () => {
    if (!profile?.empresa_id) return;
    const { data } = await supabase.from('campanhas').select('*').eq('empresa_id', profile.empresa_id).order('created_at', { ascending: false });
    if (data) setCampanhas(data as any);
  };

  const handleSave = async () => {
    if (!profile?.empresa_id || !form.nome) {
      toast({ title: 'Preencha o nome', variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('campanhas').insert({
      empresa_id: profile.empresa_id,
      nome: form.nome,
      produto_servico: form.produto_servico,
      tipo: form.tipo as any,
      meta_quantidade: parseInt(form.meta_quantidade) || 0,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Campanha criada!' });
      setDialogOpen(false);
      setForm({ nome: '', produto_servico: '', tipo: 'MENSAL', meta_quantidade: '', data_inicio: new Date().toISOString().slice(0, 10), data_fim: new Date().toISOString().slice(0, 10) });
      fetchCampanhas();
    }
  };

  const filtered = campanhas.filter(c => {
    if (tab === 'todas') return true;
    if (tab === 'diarias') return c.tipo === 'DIARIA';
    if (tab === 'semanais') return c.tipo === 'SEMANAL';
    if (tab === 'mensais') return c.tipo === 'MENSAL';
    return true;
  });

  const tipoBadge = (t: string) => {
    if (t === 'DIARIA') return <Badge variant="outline">Diária</Badge>;
    if (t === 'SEMANAL') return <Badge variant="outline">Semanal</Badge>;
    return <Badge variant="outline">Mensal</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Campanhas de Vendas</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de campanhas por produto e serviço</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Produto/Serviço</Label>
                <Input value={form.produto_servico} onChange={e => setForm(p => ({ ...p, produto_servico: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIARIA">Diária</SelectItem>
                      <SelectItem value="SEMANAL">Semanal</SelectItem>
                      <SelectItem value="MENSAL">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Meta (unidades)</Label>
                <Input type="number" value={form.meta_quantidade} onChange={e => setForm(p => ({ ...p, meta_quantidade: e.target.value }))} />
              </div>
              <Button onClick={handleSave} className="w-full">Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Auto campaign banner */}
      <Card className="border-primary/30">
        <CardContent className="flex items-start gap-3 pt-6">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="font-medium">Campanha Automática — Manutenção de Celular</p>
            <p className="text-sm text-muted-foreground">Top 3 funcionários com mais serviços de manutenção no mês. Comissão gerada automaticamente.</p>
            <p className="mt-2 text-sm text-primary">Nenhum serviço de manutenção registrado ainda.</p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="diarias">Diárias</TabsTrigger>
          <TabsTrigger value="semanais">Semanais</TabsTrigger>
          <TabsTrigger value="mensais">Mensais</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-4">
          {filtered.map(c => {
            const pct = c.meta_quantidade > 0 ? Math.round((c.progresso / c.meta_quantidade) * 100) : 0;
            return (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.produto_servico} · {new Date(c.data_inicio).toLocaleDateString('pt-BR')} a {new Date(c.data_fim).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tipoBadge(c.tipo)}
                      <Badge variant={pct >= 100 ? 'default' : 'destructive'} className="text-xs">{pct}%</Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span>{c.progresso} / {c.meta_quantidade} unidades</span>
                    </div>
                    <Progress value={pct} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhuma campanha encontrada</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
