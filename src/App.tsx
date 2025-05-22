import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase'; // Import the flag

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffcccc', 
        color: '#cc0000', 
        textAlign: 'center', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>Application Configuration Error</h1>
        <p style={{ fontSize: '1.2em' }}>Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or invalid.</p>
        <p style={{ fontSize: '1em' }}>Please check your <code>.env</code> file or your hosting environment configuration and restart the application.</p>
        <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#555' }}>Refer to the project documentation for more details on setting up environment variables.</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}