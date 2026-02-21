import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import FormularioPedido from './FormularioPedido';
import ListaPedidos from './ListaPedidos';
import Login from './Login';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // 👇 LA LISTA VIP: Agrega aquí los correos que pueden entrar
  const CORREOS_AUTORIZADOS = [
    "balderashoracio93@gmail.com", 
    "ximenazapatavega@gmail.com" // Puedes agregar más separándolos con comas
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Revisamos si el correo del usuario está en la lista VIP
        if (CORREOS_AUTORIZADOS.includes(user.email)) {
          setUsuario(user);
        } else {
          await signOut(auth); // Lo sacamos
          setUsuario(null);
          alert(`❌ Acceso denegado. El correo ${user.email} no está en la lista de personal autorizado.`);
        }
      } else {
        setUsuario(null);
      }
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sistema...</div>;

  // Si no está autorizado, le mostramos la pantalla de Login
  if (!usuario) {
    return (
      <div className="contenedor-principal">
        <div className="header">
          <h1>Administración de Pastelería</h1>
        </div>
        <Login />
      </div>
    );
  }

  // Si está autorizado, le mostramos la app completa
  return (
    <div className="contenedor-principal">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Administración de Pastelería</h1>
        <button 
          onClick={cerrarSesion} 
          style={{ background: 'transparent', border: '2px solid #d81b60', color: '#d81b60', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Salir 🚪
        </button>
      </div>
      
      <div className="grid-layout">
        <div className="columna-izq">
          <FormularioPedido />
        </div>
        <div className="columna-der">
          <ListaPedidos />
        </div>
      </div>
    </div>
  );
}

export default App;