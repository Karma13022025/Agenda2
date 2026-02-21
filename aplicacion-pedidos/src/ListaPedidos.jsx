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

  // --- 📊 CÁLCULOS DE FINANZAS ---
  const totalHistorial = todosLosPedidos
    .filter(p => p.estadoPedido === "Entregado")
    .reduce((sum, p) => sum + (Number(p.precioTotal) || 0), 0);

  const totalAnticiposPendientes = todosLosPedidos
    .filter(p => p.estadoPedido !== "Entregado")
    .reduce((sum, p) => sum + (Number(p.cantidadAnticipo) || 0), 0);

  // --- ✅ LÓGICA DE ENTREGA (Doble toque para iPhone) ---
  const marcarComoEntregado = async (id) => {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      setTimeout(() => setConfirmandoId(null), 3000);
      return;
    }

    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, {
        estadoPedido: "Entregado"
      });
      setConfirmandoId(null);
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("❌ Hubo un error al marcar como entregado.");
    }
  };

  const getColorPago = (estado) => {
    if (estado === 'Liquidado') return '#4caf50';
    if (estado === 'Anticipo') return '#ff9800';
    return '#f44336';
  };

  const pendientes = todosLosPedidos.filter(p => p.estadoPedido !== "Entregado");
  const historial = todosLosPedidos.filter(p => p.estadoPedido === "Entregado");
  const pedidosAMostrar = verHistorial ? historial : pendientes;

  return (
    <div className="lista-moderna">
      
      {/* 💰 PANEL DE FINANZAS */}
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

      {/* 📑 PESTAÑAS */}
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
              
              <p>
                <strong>💰 Precio Total:</strong> ${pedido.precioTotal || 0}
              </p>

              <p>
                <strong>💵 Pago:</strong> 
                <span style={{ color: getColorPago(pedido.estadoPago), fontWeight: 'bold', marginLeft: '5px' }}>
                  {pedido.estadoPago}
                </span>
                {pedido.estadoPago === 'Anticipo' && ` ($${pedido.cantidadAnticipo})`}
              </p>

              {pedido.notas && (
                <div className="notas-caja">
                  <strong>📝 Notas:</strong> <p>{pedido.notas}</p>
                </div>
              )}

              {/* 📸 AQUÍ APARECE LA FOTO DE IMGBB */}
              {pedido.fotoUrl && (
                <div style={{ marginTop: '15px' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#666' }}>📸 Diseño de referencia:</strong>
                  <img 
                    src={pedido.fotoUrl} 
                    alt="Diseño del pastel" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '250px', 
                      objectFit: 'cover', 
                      borderRadius: '12px', 
                      marginTop: '8px', 
                      border: '1px solid #eee',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} 
                  />
                </div>
              )}
            </div>
            
            {!verHistorial ? (
              <div className="pie-pedido">
                <button 
                  className={`btn-completar ${confirmandoId === pedido.id ? 'btn-confirmar' : ''}`} 
                  onClick={() => marcarComoEntregado(pedido.id)}
                >
                  {confirmandoId === pedido.id ? '⚠️ Toca de nuevo para confirmar' : '✅ Marcar Entregado'}
                </button>
              </div>
            ) : (
              <div className="pie-historial">🎉 Pedido Finalizado con Éxito</div>
            )}

          </div>
        ))}
        
        {pedidosAMostrar.length === 0 && (
          <p className="mensaje-vacio">
            {verHistorial ? "No hay pedidos entregados todavía." : "No tienes pedidos pendientes. ¡A descansar! 🍰"}
          </p>
        )}
      </div>
    </div>
  );
}