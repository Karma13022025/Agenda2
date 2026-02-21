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

    // 🛡️ VALIDACIONES DE SEGURIDAD 🛡️
    const precio = Number(precioTotal);
    const anticipo = Number(cantidadAnticipo) || 0;

    // 1. Si puso cantidad en anticipo pero dejó el estado como "Pendiente"
    if (anticipo > 0 && estadoPago === 'Pendiente') {
      alert("⚠️ Error: Si hay una cantidad de anticipo, el estado no puede ser 'Sin anticipo'. Cámbialo a 'Anticipo entregado'.");
      return; // Detiene la ejecución
    }

    // 2. Si puso "Anticipo entregado" pero la cantidad es 0 o está vacía
    if (estadoPago === 'Anticipo' && anticipo <= 0) {
      alert("⚠️ Error: Marcaste 'Anticipo entregado', por favor escribe la cantidad del anticipo.");
      return;
    }

    // 3. Validación extra: Que el anticipo no sea mayor al total
    if (anticipo > precio) {
      alert("⚠️ Error: El anticipo no puede ser mayor al precio total del pastel.");
      return;
    }

    // 4. Si marcó "Liquidado", el anticipo debería ser igual al total (opcional, pero recomendado)
    if (estadoPago === 'Liquidado' && anticipo < precio) {
      const confirmar = window.confirm(`¿Segura que está liquidado? El total es $${precio} y solo anotaste $${anticipo} de pago. ¿Deseas continuar?`);
      if (!confirmar) return;
    }

    setCargando(true);

    try {
      let fotoUrl = "";
      if (imagen) {
        const storageRef = ref(storage, `disenos/${Date.now()}-${imagen.name}`);
        await uploadBytes(storageRef, imagen);
        fotoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "pedidos"), {
        cliente,
        sabor,
        fechaEntrega,
        precioTotal: precio,
        cantidadAnticipo: anticipo,
        estadoPago,
        notas,
        fotoUrl,
        estadoPedido: "Pendiente",
        fechaCreacion: new Date().toISOString()
      });

      // Limpiar campos
      setCliente('');
      setSabor('');
      setFechaEntrega('');
      setPrecioTotal('');
      setCantidadAnticipo('');
      setEstadoPago('Pendiente');
      setNotas('');
      setImagen(null);
      
      alert("✅ ¡Pedido agendado perfectamente!");
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("❌ Hubo un error al guardar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-moderno">
      <h2>📝 Agendar Nuevo Pedido</h2>

      <div className="campo">
        <label>Nombre del Cliente *</label>
        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} required />
      </div>

      <div className="campo">
        <label>Sabor / Tipo de Pastel *</label>
        <input type="text" value={sabor} onChange={(e) => setSabor(e.target.value)} required />
      </div>

      <div className="campo">
        <label>Fecha de Entrega *</label>
        <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} required />
      </div>

      <div className="finanzas-inputs" style={{ display: 'flex', gap: '10px' }}>
        <div className="campo" style={{ flex: 1 }}>
          <label>💰 Precio Total *</label>
          <input type="number" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} required placeholder="0.00" />
        </div>
        <div className="campo" style={{ flex: 1 }}>
          <label>💵 Anticipo</label>
          <input type="number" value={cantidadAnticipo} onChange={(e) => setCantidadAnticipo(e.target.value)} placeholder="0.00" />
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
        <label>Foto (Opcional)</label>
        <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} />
      </div>

      <div className="campo">
        <label>Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)}></textarea>
      </div>

      <button type="submit" className="btn-guardar" disabled={cargando}>
        {cargando ? "⏳ Guardando..." : "Agendar Pedido"}
      </button>
    </form>
  );
}