import { useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from './services/firebase';

export default function FormularioPedido() {
  const [cliente, setCliente] = useState('');
  const [sabor, setSabor] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [cantidadAnticipo, setCantidadAnticipo] = useState('');
  const [estadoPago, setEstadoPago] = useState('Pendiente');
  const [notas, setNotas] = useState('');
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      let fotoUrl = "";

      // Si el usuario seleccionó una imagen, la subimos a Firebase Storage
      if (imagen) {
        const storageRef = ref(storage, `disenos/${Date.now()}-${imagen.name}`);
        await uploadBytes(storageRef, imagen);
        fotoUrl = await getDownloadURL(storageRef);
      }

      // Guardamos el pedido en Firestore
      await addDoc(collection(db, "pedidos"), {
        cliente,
        sabor,
        fechaEntrega,
        precioTotal: Number(precioTotal), // Convertimos a número para las finanzas
        cantidadAnticipo: Number(cantidadAnticipo) || 0,
        estadoPago,
        notas,
        fotoUrl,
        estadoPedido: "Pendiente", // Todos los pedidos nacen como pendientes
        fechaCreacion: new Date().toISOString()
      });

      // Limpiamos el formulario después de guardar
      setCliente('');
      setSabor('');
      setFechaEntrega('');
      setPrecioTotal('');
      setCantidadAnticipo('');
      setEstadoPago('Pendiente');
      setNotas('');
      setImagen(null);
      
      alert("✅ ¡Pedido agendado con éxito!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("❌ Hubo un error al guardar el pedido.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-moderno">
      <h2>📝 Agendar Nuevo Pedido</h2>

      <div className="campo">
        <label>Nombre del Cliente *</label>
        <input 
          type="text" 
          value={cliente} 
          onChange={(e) => setCliente(e.target.value)} 
          required 
          placeholder="Ej: Ximena Zapata"
        />
      </div>

      <div className="campo">
        <label>Sabor / Tipo de Pastel *</label>
        <input 
          type="text" 
          value={sabor} 
          onChange={(e) => setSabor(e.target.value)} 
          required 
          placeholder="Ej: Chocolate con fresas"
        />
      </div>

      <div className="campo">
        <label>Fecha de Entrega *</label>
        <input 
          type="date" 
          value={fechaEntrega} 
          onChange={(e) => setFechaEntrega(e.target.value)} 
          required 
        />
      </div>

      {/* --- NUEVOS CAMPOS DE DINERO --- */}
      <div className="finanzas-inputs" style={{ display: 'flex', gap: '10px' }}>
        <div className="campo" style={{ flex: 1 }}>
          <label>💰 Precio Total *</label>
          <input 
            type="number" 
            value={precioTotal} 
            onChange={(e) => setPrecioTotal(e.target.value)} 
            required 
            placeholder="0.00"
          />
        </div>
        <div className="campo" style={{ flex: 1 }}>
          <label>💵 Anticipo</label>
          <input 
            type="number" 
            value={cantidadAnticipo} 
            onChange={(e) => setCantidadAnticipo(e.target.value)} 
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="campo">
        <label>Estado del Pago</label>
        <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
          <option value="Pendiente">Sin anticipo (Pendiente)</option>
          <option value="Anticipo">Anticipo entregado</option>
          <option value="Liquidado">Liquidado (Pagado completo)</option>
        </select>
      </div>

      <div className="campo">
        <label>Foto del Diseño (Opcional)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setImagen(e.target.files[0])} 
        />
      </div>

      <div className="campo">
        <label>Notas o Detalles Adicionales</label>
        <textarea 
          value={notas} 
          onChange={(e) => setNotas(e.target.value)} 
          placeholder="Ej: Sin nueces, escribir 'Feliz Cumpleaños'..."
        ></textarea>
      </div>

      <button type="submit" className="btn-guardar" disabled={cargando}>
        {cargando ? "⏳ Guardando..." : "Agendar Pedido"}
      </button>
    </form>
  );
}