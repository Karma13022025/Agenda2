import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from '../src/services/firebase';

export default function ListaPedidos() {
  // Ahora guardamos TODOS los pedidos
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  
  // Este estado controla qué pestaña estamos viendo (false = Pendientes, true = Historial)
  const [verHistorial, setVerHistorial] = useState(false); 

  useEffect(() => {
    // Pedimos la información a Firebase ordenada por fecha
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

  const marcarComoEntregado = async (id) => {
    const confirmar = window.confirm("¿Estás segura de que ya entregaste este pastel?");
    if (!confirmar) return;

    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, {
        estadoPedido: "Entregado"
      });
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("❌ Hubo un error al marcar el pedido como entregado.");
    }
  };

  const getColorPago = (estado) => {
    if (estado === 'Liquidado') return '#4caf50';
    if (estado === 'Anticipo') return '#ff9800';
    return '#f44336';
  };

  // 👇 MAGIA AQUÍ: Filtramos la lista en dos grupos diferentes
  const pendientes = todosLosPedidos.filter(p => p.estadoPedido !== "Entregado");
  const historial = todosLosPedidos.filter(p => p.estadoPedido === "Entregado");

  // Decidimos qué grupo mostrar en pantalla según la pestaña que tocaste
  const pedidosAMostrar = verHistorial ? historial : pendientes;

  return (
    <div className="lista-moderna">
      
      {/* --- NUEVO: BARRA DE PESTAÑAS --- */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${!verHistorial ? 'activa' : ''}`} 
          onClick={() => setVerHistorial(false)}
        >
          📦 Pendientes ({pendientes.length})
        </button>
        <button 
          className={`tab-btn ${verHistorial ? 'activa' : ''}`} 
          onClick={() => setVerHistorial(true)}
        >
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
                  <img 
                    src={pedido.fotoUrl} 
                    alt="Diseño del pastel" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '200px', 
                      objectFit: 'cover', 
                      borderRadius: '8px',
                      marginTop: '8px',
                      border: '1px solid #eee'
                    }} 
                  />
                </div>
              )}
            </div>
            
            {/* Si estamos en "Pendientes", mostramos el botón. Si estamos en "Historial", mostramos un texto. */}
            {!verHistorial ? (
              <div className="pie-pedido">
                <button className="btn-completar" onClick={() => marcarComoEntregado(pedido.id)}>
                  ✅ Marcar Entregado
                </button>
              </div>
            ) : (
              <div className="pie-historial">
                🎉 Entregado con éxito
              </div>
            )}

          </div>
        ))}
        
        {pedidosAMostrar.length === 0 && (
          <p className="mensaje-vacio">
            {verHistorial 
              ? "Aún no tienes pedidos entregados en tu historial." 
              : "No hay pedidos pendientes. ¡A vender! 🍰"}
          </p>
        )}
      </div>
    </div>
  );
}