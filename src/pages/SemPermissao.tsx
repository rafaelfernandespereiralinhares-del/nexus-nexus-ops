import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function SemPermissao() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <ShieldX className="mx-auto h-16 w-16 text-danger" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Sem Permissão</h1>
        <p className="mt-2 text-muted-foreground">Você não tem acesso a esta página.</p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  );
}
