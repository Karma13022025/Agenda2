import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../services/firebase';

export default function Login() {
  const [error, setError] = useState('');

  const iniciarConGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      setError('❌ Hubo un error al conectar con Google.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <div className="formulario-moderno" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ color: '#d81b60', marginTop: 0 }}>🔐 Acceso Privado</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '25px' }}>
          Sistema exclusivo de administración
        </p>
        
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
        
        <button 
          onClick={iniciarConGoogle} 
          style={{ 
            width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', 
            backgroundColor: 'white', color: '#555', fontSize: '1.1rem', fontWeight: 'bold', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.3s'
          }}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
            alt="Google" 
            style={{ width: '20px' }} 
          />
          Entrar con Google
        </button>
      </div>
    </div>
  );
}