import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from './services/firebase';

export default function ListaPedidos() {
  const [todosLosPedidos, setTodosLosPedidos] = useState([]);
  const [verHistorial, setVerHistorial] = useState(false); 
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);
  
  // 👇 NUEVO: Estado para el buscador
  const [busqueda, setBusqueda] = useState("");

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

  // --- 📊 CÁLCULOS FINANCIEROS ---
  const totalHistorial = todosLosPedidos
    .filter(p => p.estadoPedido === "Entregado")
    .reduce((sum, p) => sum + (Number(p.precioTotal) || 0), 0);

  const totalAnticiposPendientes = todosLosPedidos
    .filter(p => p.estadoPedido !== "Entregado")
    .reduce((sum, p) => sum + (Number(p.cantidadAnticipo) || 0), 0);

  // --- 🔍 LÓGICA DE FILTRADO ---
  // Filtramos primero por Historial/Pendiente y LUEGO por lo que escribas en el buscador
  const pedidosFiltrados = todosLosPedidos.filter(pedido => {
    const coincideEstado = verHistorial ? pedido.estadoPedido === "Entregado" : pedido.estadoPedido !== "Entregado";
    const coincideNombre = pedido.cliente.toLowerCase().includes(busqueda.toLowerCase());
    return coincideEstado && coincideNombre;
  });

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

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      const pedidoRef = doc(db, "pedidos", pedidoParaEditar.id);
      await updateDoc(pedidoRef, {
        cliente: pedidoParaEditar.cliente,
        sabor: pedidoParaEditar.sabor,
        fechaEntrega: pedidoParaEditar.fechaEntrega,
        precioTotal: Number(pedidoParaEditar.precioTotal),
        cantidadAnticipo: Number(pedidoParaEditar.cantidadAnticipo),
        estadoPago: pedidoParaEditar.estadoPago,
        notas: pedidoParaEditar.notas
      });
      setPedidoParaEditar(null);
      alert("✅ Cambios guardados.");
    } catch (error) {
      alert("❌ Error al guardar.");
    }
  };

  const getColorPago = (estado) => {
    if (estado === 'Liquidado') return '#4caf50';
    if (estado === 'Anticipo') return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="lista-moderna">
      {/* 💰 FINANZAS */}
      <div className="finanzas-grid">
        <div className="card-finanzas historial"><span>Cobrado</span><h3>${totalHistorial.toLocaleString()}</h3></div>
        <div className="card-finanzas anticipos"><span>Anticipos</span><h3>${totalAnticiposPendientes.toLocaleString()}</h3></div>
      </div>

      {/* 🔎 NUEVO: BARRA DE BÚSQUEDA */}
      <div className="buscador-container" style={{ marginBottom: '15px' }}>
        <input 
          type="text" 
          placeholder="🔍 Buscar cliente por nombre..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-buscador"
        />
      </div>

      {/* 📑 TABS */}
      <div className="tabs-container">
        <button className={`tab-btn ${!verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(false)}>📦 Pendientes</button>
        <button className={`tab-btn ${verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(true)}>📚 Historial</button>
      </div>
      
      <div className="grid-pedidos">
        {pedidosFiltrados.map(pedido => (
          <div key={pedido.id} className={`tarjeta-pedido-moderna ${verHistorial ? 'tarjeta-historial' : ''}`}>
            <div className="cabecera-pedido">
              <h3>{pedido.cliente}</h3>
              <span className="fecha-badge">📅 {pedido.fechaEntrega}</span>
            </div>
            <div className="cuerpo-pedido">
              <p><strong>🎂 Pastel:</strong> {pedido.sabor || pedido.pastel}</p>
              <p><strong>💰 Total:</strong> ${pedido.precioTotal || 0} | <strong>💵 Pago:</strong> <span style={{ color: getColorPago(pedido.estadoPago) }}>{pedido.estadoPago}</span></p>
              {pedido.fotoUrl && <img src={pedido.fotoUrl} alt="Pastel" style={{ width: '100%', borderRadius: '12px', marginTop: '10px' }} />}
            </div>
            <div className="pie-pedido" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secundario" onClick={() => setPedidoParaEditar(pedido)}>✏️ Editar</button>
              {!verHistorial && (
                <button 
                  className={`btn-completar ${confirmandoId === pedido.id ? 'btn-confirmar' : ''}`} 
                  onClick={() => marcarComoEntregado(pedido.id)}
                >
                  {confirmandoId === pedido.id ? '⚠️ Confirma' : '✅ Entregado'}
                </button>
              )}
            </div>
          </div>
        ))}
        {pedidosFiltrados.length === 0 && <p className="mensaje-vacio">No se encontraron pedidos con ese nombre.</p>}
      </div>

      {/* 🖼️ MODAL DE EDICIÓN (Mismo código anterior) */}
      {pedidoParaEditar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>✏️ Editar Pedido</h3>
            <form onSubmit={guardarCambios}>
              <div className="campo"><label>Cliente</label><input type="text" value={pedidoParaEditar.cliente} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, cliente: e.target.value})} required /></div>
              <div className="campo"><label>Sabor</label><input type="text" value={pedidoParaEditar.sabor} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, sabor: e.target.value})} required /></div>
              <div className="finanzas-inputs">
                <div className="campo"><label>Precio</label><input type="number" value={pedidoParaEditar.precioTotal} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, precioTotal: e.target.value})} /></div>
                <div className="campo"><label>Anticipo</label><input type="number" value={pedidoParaEditar.cantidadAnticipo} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, cantidadAnticipo: e.target.value})} /></div>
              </div>
              <div className="campo"><label>Notas</label><textarea value={pedidoParaEditar.notas} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, notas: e.target.value})}></textarea></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" className="btn-cancelar" onClick={() => setPedidoParaEditar(null)}>Cancelar</button>
                <button type="submit" className="btn-guardar" style={{ margin: 0, flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}