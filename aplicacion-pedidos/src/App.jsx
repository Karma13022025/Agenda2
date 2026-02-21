import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from './services/firebase';
import FormularioPedido from './FormularioPedido';
import ListaPedidos from './ListaPedidos';
import VistaCalendario from './VistaCalendario';
import Login from './Login';
import './App.css';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [vista, setVista] = useState('lista');
  
  // 🔍 EL BUSCADOR AHORA VIVE AQUÍ
  const [busqueda, setBusqueda] = useState("");

  const CORREOS_AUTORIZADOS = [
    "balderashoracio93@gmail.com",
    "ximenazapatavega@gmail.com" //
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && CORREOS_AUTORIZADOS.includes(user.email)) {
        setUsuario(user);
      } else {
        if (user) await signOut(auth);
        setUsuario(null);
      }
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "pedidos"), orderBy("fechaEntrega", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPedidos(data);
    });
    return () => unsubscribe();
  }, [usuario]);

  const cerrarSesion = async () => { await signOut(auth); };

  if (cargando) return <div className="cargando">Cargando pastelería... 🍰</div>;
  if (!usuario) return <div className="contenedor-principal"><Login /></div>;

  return (
    <div className="contenedor-principal">
      <div className="header">
        <h1>Pastelería Ximena 🎂</h1>
        <button onClick={cerrarSesion} className="btn-salir">Salir 🚪</button>
      </div>
      
      <div className="grid-layout">
        <div className="columna-izq">
          <FormularioPedido />
        </div>

        <div className="columna-der">
          <div className="selector-vista" style={{marginBottom: '15px', display: 'flex', gap: '10px'}}>
             <button className={`tab-btn ${vista === 'lista' ? 'activa' : ''}`} onClick={() => setVista('lista')}>📑 Lista</button>
             <button className={`tab-btn ${vista === 'calendario' ? 'activa' : ''}`} onClick={() => setVista('calendario')}>📅 Calendario</button>
          </div>

          {vista === 'lista' ? (
            <ListaPedidos 
              pedidosExistentes={pedidos} 
              busqueda={busqueda} 
              setBusqueda={setBusqueda} 
            /> 
          ) : (
            <VistaCalendario 
              pedidos={pedidos} 
              setVista={setVista} 
              setBusqueda={setBusqueda} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;