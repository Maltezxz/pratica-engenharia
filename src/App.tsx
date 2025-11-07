import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';


function AppContent() {

  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    );
  }


  const component = user ? <Dashboard /> : <Login />;

  return component;
}

function App() {

  try {
    return (
      <AuthProvider>
        <RefreshProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </RefreshProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('❌ Erro no App:', error);
    return (
      <div style={{ padding: '40px', fontFamily: 'system-ui', textAlign: 'center' }}>
        <h1 style={{ color: '#e74c3c' }}>❌ Erro Fatal</h1>
        <p style={{ color: '#666' }}>{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        <p style={{ fontSize: '14px', color: '#999' }}>Veja o console para detalhes</p>
      </div>
    );
  }
}

export default App;
