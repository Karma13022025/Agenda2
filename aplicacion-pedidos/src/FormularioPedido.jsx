import { useState } from 'react';
import { collection, addDoc } from "firebase/firestore";
import { db } from './services/firebase';

export default function FormularioPedido() {
  const [cliente, setCliente] = useState('');
  const [sabor, setSabor] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [precioTotal, setPrecioTotal] = useState('');
  const [cantidadAnticipo, setCantidadAnticipo] = useState('');
  const [estadoPago, setEstadoPago] = useState('Pendiente');
  const [notas, setNotas] = useState('');
  const [foto, setFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const IMGBB_API_KEY = "78867f44959776dba58685f514527d5b";

  const mostrarAviso = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const precio = Number(precioTotal);
    const anticipo = Number(cantidadAnticipo) || 0;

    if (anticipo > 0 && estadoPago === 'Pendiente') {
      return mostrarAviso("⚠️ Error: Cambia el estado a 'Anticipo entregado'.", "error");
    }
    if (estadoPago === 'Anticipo' && anticipo <= 0) {
      return mostrarAviso("⚠️ Error: Escribe la cantidad del anticipo.", "error");
    }
    if (anticipo > precio) {
      return mostrarAviso("⚠️ Error: El anticipo no puede ser mayor al total.", "error");
    }

    setGuardando(true);

    try {
      let fotoUrl = "";

      if (foto) {
        const formData = new FormData();
        formData.append('image', foto);

        const respuestaImgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });

        const datosImagen = await respuestaImgbb.json();

        if (datosImagen.success) {
          fotoUrl = datosImagen.data.url;
        } else {
          mostrarAviso("Hubo un detalle con la foto, pero guardaremos el pedido.", "error");
        }
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
        creadoEn: new Date()
      });

      mostrarAviso("✅ ¡Pedido guardado con éxito!", "exito");

      setCliente(''); setSabor(''); setFechaEntrega('');
      setPrecioTotal(''); setCantidadAnticipo('');
      setEstadoPago('Pendiente'); setNotas(''); setFoto(null);
      if (document.getElementById('input-foto')) document.getElementById('input-foto').value = '';

    } catch (error) {
      mostrarAviso("❌ Error al guardar. Revisa tu conexión.", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-moderno">
      {/* 👇 EL AVISO AHORA ESTÁ AQUÍ ADENTRO, DONDE SÍ SE PUEDE VER */}
      {mensaje.texto && (
        <div className={`notificacion-flotante notificacion-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <h2>📝 Agendar nuevo pedido </h2>

      <div className="campo">
        <label>Nombre del Cliente *</label>
        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} required placeholder="Ej: Ximena Zapata" />
      </div>

      <div className="campo">
        <label>Sabor / Tipo de Pastel *</label>
        <input type="text" value={sabor} onChange={(e) => setSabor(e.target.value)} required placeholder="Ej: Chocolate con fresas" />
      </div>

      <div className="campo">
        <label>Fecha de Entrega *</label>
        <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} required />
      </div>

      <div className="finanzas-inputs">
        <div className="campo">
          <label>💰 Precio Total *</label>
          <input type="number" value={precioTotal} onChange={(e) => setPrecioTotal(e.target.value)} required placeholder="0" />
        </div>
        <div className="campo">
          <label>💵 Anticipo</label>
          <input type="number" value={cantidadAnticipo} onChange={(e) => setCantidadAnticipo(e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="campo">
        <label>Estado del Pago</label>
        <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
          <option value="Pendiente">Sin anticipo (Pendiente)</option>
          <option value="Anticipo">Anticipo entregado</option>
          <option value="Liquidado">Totalmente Liquidado</option>
        </select>
      </div>

      <div className="campo">
        <label>Foto del Diseño</label>
        <input id="input-foto" type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />
      </div>

      <div className="campo">
        <label>Notas o Detalles</label>
        <textarea rows="3" value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej: Sin nueces..."></textarea>
      </div>

      <button type="submit" className="btn-guardar" disabled={guardando}>
        {guardando ? '🚀 Subiendo foto y guardando...' : 'Agendar Pedido'}
      </button>
    </form>
  );
}