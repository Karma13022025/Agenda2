import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from '../services/firebase';

export default function ListaPedidos() {
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false); 
  
  // 👇 NUEVO: Estado para saber qué botón estamos confirmando
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

  // 👇 NUEVA LÓGICA DEL BOTÓN (Doble toque sin usar window.confirm)
  const marcarComoEntregado = async (id) => {
    // Si es el primer toque, lo marcamos como "esperando confirmación"
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      // Opcional: Si se arrepiente y no lo toca de nuevo en 3 segundos, regresa a la normalidad
      setTimeout(() => setConfirmandoId(null), 3000);
      return;
    }

    // Si es el segundo toque, ahora sí guardamos en Firebase
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, {
        estadoPedido: "Entregado"
      });
      setConfirmandoId(null); // Limpiamos
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("❌ Hubo un error. Revisa tu conexión.");
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
              <p><strong>🎂 Sabor/Diseño:</strong> {pedido.sabor || pedido.pastel}</p>
              
              <p>
                <strong>💰 Pago:</strong> 
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

              {pedido.fotoUrl && (
                <div style={{ marginTop: '15px' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#555' }}>📸 Diseño de referencia:</strong>
                  <img src={pedido.fotoUrl} alt="Diseño del pastel" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px', border: '1px solid #eee'}} />
                </div>
              )}
            </div>
            
            {!verHistorial ? (
              <div className="pie-pedido">
                {/* 👇 EL BOTÓN AHORA CAMBIA DE TEXTO Y COLOR 👇 */}
                <button 
                  className={`btn-completar ${confirmandoId === pedido.id ? 'btn-confirmar' : ''}`} 
                  onClick={() => marcarComoEntregado(pedido.id)}
                >
                  {confirmandoId === pedido.id ? '⚠️ Toca de nuevo para confirmar' : '✅ Marcar Entregado'}
                </button>
              </div>
            ) : (
              <div className="pie-historial">🎉 Entregado con éxito</div>
            )}

          </div>
        ))}
        
        {pedidosAMostrar.length === 0 && (
          <p className="mensaje-vacio">
            {verHistorial ? "Aún no tienes pedidos entregados en tu historial." : "No hay pedidos pendientes. ¡A vender! 🍰"}
          </p>
        )}
      </div>
    </div>
  );
}