import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from './services/firebase';

export default function ListaPedidos({ pedidosExistentes, busqueda, setBusqueda }) {
  const [confirmandoId, setConfirmandoId] = useState(null);
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);
  const [pedidoABorrar, setPedidoABorrar] = useState(null);
  const [notificacion, setNotificacion] = useState({ texto: "", tipo: "" });
  const [fotoZoom, setFotoZoom] = useState(null);
  const [verHistorial, setVerHistorial] = useState(false);

  // 👇 NUEVO: Estado para guardar el mes seleccionado (Por defecto el mes actual)
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoy = new Date();
    // Formato YYYY-MM (Ejemplo: 2026-02)
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  const mostrarAviso = (texto, tipo = "exito") => {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion({ texto: "", tipo: "" }), 3000);
  };

  const regresarAPendiente = async (id) => {
    try {
      const pedidoRef = doc(db, "pedidos", id);
      await updateDoc(pedidoRef, { estadoPedido: "Pendiente" });
      mostrarAviso("⏪ Pedido movido a pendientes");
    } catch (error) { mostrarAviso("❌ Error al mover", "error"); }
  };

  const ejecutarBorrado = async () => {
    try {
      await deleteDoc(doc(db, "pedidos", pedidoABorrar.id));
      setPedidoABorrar(null);
      mostrarAviso("🗑️ Pedido eliminado");
    } catch (e) { mostrarAviso("❌ Error al borrar", "error"); }
  };

  const marcarComoEntregado = async (id) => {
    if (confirmandoId !== id) {
      setConfirmandoId(id);
      setTimeout(() => setConfirmandoId(null), 3000);
      return;
    }
    try {
      await updateDoc(doc(db, "pedidos", id), { estadoPedido: "Entregado" });
      setConfirmandoId(null);
      mostrarAviso("✅ ¡Pedido entregado!");
    } catch (error) { mostrarAviso("❌ Error al actualizar", "error"); }
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
      mostrarAviso("✅ Cambios guardados");
    } catch (error) { mostrarAviso("❌ Error al guardar", "error"); }
  };

  const getColorPago = (estado) => {
    if (estado === 'Liquidado') return '#4caf50';
    if (estado === 'Anticipo') return '#ff9800';
    return '#f44336';
  };

  // --- 📊 CÁLCULOS INTELIGENTES ---
  const totalHistorial = pedidosExistentes
    .filter(p => p.estadoPedido === "Entregado" && p.fechaEntrega.startsWith(mesFiltro)) // 👈 Solo suma los del mes seleccionado
    .reduce((sum, p) => sum + (Number(p.precioTotal) || 0), 0);

  const totalAnticiposPendientes = pedidosExistentes
    .filter(p => p.estadoPedido !== "Entregado") // Los pendientes se suman todos
    .reduce((sum, p) => sum + (Number(p.cantidadAnticipo) || 0), 0);

  // --- 🔍 FILTRADO DE LA LISTA ---
  const pedidosFiltrados = pedidosExistentes.filter(pedido => {
    const coincideNombre = pedido.cliente.toLowerCase().includes(busqueda.toLowerCase());
    
    if (verHistorial) {
      // Si estamos en el historial, filtramos por el mes seleccionado
      const coincideMes = pedido.fechaEntrega.startsWith(mesFiltro);
      return pedido.estadoPedido === "Entregado" && coincideNombre && coincideMes;
    } else {
      // Si estamos en pendientes, mostramos todo lo pendiente
      return pedido.estadoPedido !== "Entregado" && coincideNombre;
    }
  });

  return (
    <div className="lista-moderna">
      {notificacion.texto && <div className={`notificacion-flotante notificacion-${notificacion.tipo}`}>{notificacion.texto}</div>}

      {/* 👇 NUEVO: CONTROL DE MES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#d81b60', fontSize: '1.2rem' }}>Resumen Financiero</h3>
        <input 
          type="month" 
          value={mesFiltro} 
          onChange={(e) => setMesFiltro(e.target.value)} 
          style={{ 
            padding: '8px 12px', 
            borderRadius: '10px', 
            border: '2px solid #fce4ec', 
            color: '#d81b60', 
            fontWeight: 'bold',
            fontFamily: 'inherit',
            background: 'white',
            outline: 'none'
          }}
        />
      </div>

      <div className="finanzas-grid">
        <div className="card-finanzas historial">
          <span>Cobrado en el mes</span> {/* 👈 Actualizamos el texto */}
          <h3>${totalHistorial.toLocaleString()}</h3>
        </div>
        <div className="card-finanzas anticipos">
          <span>Total Anticipos</span>
          <h3>${totalAnticiposPendientes.toLocaleString()}</h3>
        </div>
      </div>

      <div className="buscador-container" style={{ marginBottom: '15px' }}>
        <input type="text" placeholder="🔍 Buscar cliente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="input-buscador" />
      </div>

      <div className="tabs-container">
        <button className={`tab-btn ${!verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(false)}>📦 Pendientes</button>
        <button className={`tab-btn ${verHistorial ? 'activa' : ''}`} onClick={() => setVerHistorial(true)}>📚 Historial</button>
      </div>
      
      <div className="grid-pedidos">
        {pedidosFiltrados.map(pedido => (
          <div key={pedido.id} className={`tarjeta-pedido-moderna ${verHistorial ? 'tarjeta-historial' : ''}`}>
            <div className="cabecera-pedido">
              <h3>{pedido.cliente}</h3>
              <button className="btn-borrar-icono" onClick={() => setPedidoABorrar(pedido)}>🗑️</button>
            </div>
            
            <div className="cuerpo-pedido">
              <span className="fecha-badge">📅 {pedido.fechaEntrega}</span>
              <p style={{marginTop: '10px'}}><strong>🎂 Pastel:</strong> {pedido.sabor}</p>
              <p><strong>💰 Total:</strong> ${pedido.precioTotal || 0} | <strong>💵 Pago:</strong> <span style={{ color: getColorPago(pedido.estadoPago) }}>{pedido.estadoPago}</span></p>
              
              {pedido.fotoUrl && (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={pedido.fotoUrl} 
                    alt="Pastel" 
                    onClick={() => setFotoZoom(pedido.fotoUrl)}
                    style={{ width: '100%', borderRadius: '12px', marginTop: '10px', cursor: 'zoom-in', display: 'block' }} 
                  />
                </div>
              )}
            </div>
            
            <div className="pie-pedido" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="btn-secundario" onClick={() => setPedidoParaEditar(pedido)}>✏️ Editar</button>
              
              {!verHistorial ? (
                <button 
                  className={`btn-completar ${confirmandoId === pedido.id ? 'btn-confirmar' : ''}`} 
                  onClick={() => marcarComoEntregado(pedido.id)}
                >
                  {confirmandoId === pedido.id ? '⚠️ Confirma' : '✅ Entregado'}
                </button>
              ) : (
                <button 
                  className="btn-secundario" 
                  onClick={() => regresarAPendiente(pedido.id)}
                  style={{ border: '1px solid #ff69b4', color: '#d81b60' }}
                >
                  ⏪ Deshacer
                </button>
              )}
            </div>
          </div>
        ))}

        {pedidosFiltrados.length === 0 && (
          <div className="estado-vacio">
            <div className="icono-vacio">
              {!verHistorial ? "✨" : "📦"}
            </div>
            <h3>{!verHistorial ? "¡Día libre!" : "Aún no hay entregas"}</h3>
            <p>
              {!verHistorial 
                ? "No tienes pedidos pendientes o que coincidan con tu búsqueda. ¡Tómate un respiro o agenda uno nuevo!" 
                : "No hay pasteles entregados registrados en este mes. ¡A hornear se ha dicho!"}
            </p>
          </div>
        )}
      </div>

      {/* MODALES DE EDICIÓN Y ZOOM... (Se mantienen intactos) */}
      {fotoZoom && (
        <div className="modal-overlay" onClick={() => setFotoZoom(null)} style={{ background: 'rgba(0,0,0,0.9)', zIndex: 3000 }}>
          <div style={{ position: 'relative', width: '95%', maxWidth: '800px', display: 'flex', justifyContent: 'center' }}>
             <img src={fotoZoom} alt="Zoom" style={{ width: '100%', borderRadius: '8px', maxHeight: '85vh', objectFit: 'contain' }} />
             <button onClick={() => setFotoZoom(null)} style={{ position: 'absolute', top: '-40px', right: '0', background: 'white', border: 'none', padding: '8px 15px', borderRadius: '50px', fontWeight: 'bold' }}>CERRAR ×</button>
          </div>
        </div>
      )}

      {pedidoABorrar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{textAlign: 'center'}}>
            <h3 style={{color: '#d81b60'}}>¿Borrar pedido?</h3>
            <p>Se eliminará permanentemente.</p>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className="btn-cancelar" onClick={() => setPedidoABorrar(null)}>No, volver</button>
              <button className="btn-borrar-confirmar" onClick={ejecutarBorrado}>Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

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
              <div className="campo">
                <label>Estado del Pago</label>
                <select value={pedidoParaEditar.estadoPago} onChange={(e) => setPedidoParaEditar({...pedidoParaEditar, estadoPago: e.target.value})}>
                    <option value="Pendiente">Sin anticipo</option>
                    <option value="Anticipo">Anticipo entregado</option>
                    <option value="Liquidado">Totalmente Liquidado</option>
                </select>
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