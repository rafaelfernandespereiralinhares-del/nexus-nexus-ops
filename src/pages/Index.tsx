import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const { session, loading, primaryRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) { navigate('/login', { replace: true }); return; }
    switch (primaryRole) {
      case 'ADMIN': navigate('/admin/dashboard', { replace: true }); break;
      case 'DIRETORIA': navigate('/diretoria/dashboard', { replace: true }); break;
      case 'FINANCEIRO': navigate('/financeiro/conciliacao', { replace: true }); break;
      case 'LOJA': navigate('/loja/dashboard', { replace: true }); break;
      default: navigate('/login', { replace: true });
    }
  }, [loading, session, primaryRole, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
