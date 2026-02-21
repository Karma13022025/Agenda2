import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from './services/firebase';

export default function ListaPedidos() {
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false); 
  const [confirmandoId, setConfirmandoId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("fechaEntrega", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pedidosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTodosLosPedidos(pedidosData);
    });
    return () => unsubscribe();
  }, []);

  // --- 📊 LÓGICA DE FINANZAS ---
  
  // 1. Sumamos lo que ya se entregó (Historial)
  const totalHistorial = todosLosPedidos
    .filter(p => p.estadoPedido === "Entregado")
    .reduce((sum, p) => sum + (Number(p.precioTotal) || 0), 0);

  // 2. Sumamos los anticipos de lo que aún no entregas
  const totalAnticiposPendientes = todosLosPedidos
    .filter(p => p.estadoPedido !== "Entregado")
    .reduce((sum, p) => sum + (Number(p.cantidadAnticipo) || 0), 0);

  const marcarComoEntregado = async (id) => {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      setTimeout(() => setConfirmandoId(null), 3000);
      return;
    }
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, { estadoPedido: "Entregado" });
      setConfirmandoId(null);
    } catch (error) {
      alert("❌ Error al actualizar.");
    }
  };

  const pendientes = todosLosPedidos.filter(p => p.estadoPedido !== "Entregado");
  const historial = todosLosPedidos.filter(p => p.estadoPedido === "Entregado");
  const pedidosAMostrar = verHistorial ? historial : pendientes;

  return (
    <div className="lista-moderna">
      
      {/* --- NUEVO: PANEL DE FINANZAS --- */}
      <div className="finanzas-grid">
        <div className="card-finanzas historial">
          <span>Cobrado (Historial)</span>
          <h3>${totalHistorial.toLocaleString()}</h3>
        </div>
        <div className="card-finanzas anticipos">
          <span>Anticipos en mano</span>
          <h3>${totalAnticiposPendientes.toLocaleString()}</h3>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${!verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(false)}>
          📦 Pendientes ({pendientes.length})
        </button>
        <button className={`tab-btn ${verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(true)}>
          📚 Historial ({historial.length})
        </button>
      </div>
      
      <div className="grid-pedidos">
        {pedidosAMostrar.map(pedido => (
          <div key={pedido.id} className={`tarjeta-pedido-moderna ${verHistorial ? 'tarjeta-historial' : ''}`}>
            <div className="cabecera-pedido">
              <h3>{pedido.cliente}</h3>
              <span className="fecha-badge">📅 {pedido.fechaEntrega}</span>
            </div>
            <div className="cuerpo-pedido">
              <p><strong>🎂 Pastel:</strong> {pedido.sabor || pedido.pastel}</p>
              <p><strong>💰 Total:</strong> ${pedido.precioTotal}</p>
              <p><strong>💵 Estado:</strong> {pedido.estadoPago} {pedido.estadoPago === 'Anticipo' && `($${pedido.cantidadAnticipo})`}</p>
            </div>
            {!verHistorial ? (
              <div className="pie-pedido">
                <button 
                  className={`btn-completar ${confirmandoId === pedido.id ? 'btn-confirmar' : ''}`} 
                  onClick={() => marcarComoEntregado(pedido.id)}
                >
                  {confirmandoId === pedido.id ? '⚠️ Toca para confirmar' : '✅ Entregado'}
                </button>
              </div>
            ) : (
              <div className="pie-historial">🎉 Pedido Finalizado</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}