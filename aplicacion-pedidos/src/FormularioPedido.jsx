import { useState } from 'react';
import { collection, addDoc } from "firebase/firestore"; 
import { db } from '../src/services/firebase';

export default function FormularioPedido() {
  const [cliente, setCliente] = useState('');
  const [sabor, setSabor] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [estadoPago, setEstadoPago] = useState('Sin anticipo'); 
  const [cantidadAnticipo, setCantidadAnticipo] = useState('');
  const [notas, setNotas] = useState('');
  const [foto, setFoto] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // 👇 PEGA TU LLAVE DE IMGBB AQUÍ ADENTRO 👇
  const IMGBB_API_KEY = "78867f44959776dba58685f514527d5b";

  const guardarPedido = async (e) => {
    e.preventDefault();
    if (!cliente || !sabor || !fechaEntrega) {
      return alert("⚠️ Llena al menos el nombre, sabor y fecha.");
    }

    setGuardando(true);

    try {
      let fotoUrl = "";

      // 1. Si hay foto, la subimos a ImgBB totalmente gratis
      if (foto) {
        const formData = new FormData();
        formData.append('image', foto);

        const respuestaImgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        });

        const datosImagen = await respuestaImgbb.json();
        
        // Obtenemos el link público de la foto
        if (datosImagen.success) {
          fotoUrl = datosImagen.data.url;
        } else {
          alert("Hubo un detalle subiendo la foto, pero guardaremos el pedido.");
        }
      }

      // 2. Guardamos en Firestore (tu base de datos gratuita de Google)
      await addDoc(collection(db, "pedidos"), {
        cliente,
        sabor,
        fechaEntrega,
        estadoPago,
        cantidadAnticipo: estadoPago === 'Anticipo' ? Number(cantidadAnticipo) : 0,
        notas,
        fotoUrl, // <-- Guardamos el link de ImgBB aquí
        estadoPedido: "Pendiente",
        creadoEn: new Date()
      });
      
      alert("✅ ¡Pedido y foto agendados con éxito!");
      
      // Limpiamos todo
      setCliente(''); setSabor(''); setFechaEntrega('');
      setEstadoPago('Sin anticipo'); setCantidadAnticipo(''); 
      setNotas(''); setFoto(null);
      document.getElementById('input-foto').value = ''; 
      
    } catch (error) {
      alert("❌ Hubo un error al guardar. Revisa la consola.");
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardarPedido} className="formulario-moderno">
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

      <div className="campo">
        <label>Foto del Diseño</label>
        <input id="input-foto" type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} />
      </div>

      <div className="campo-pago">
        <label>Estado del Pago</label>
        <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value)}>
          <option value="Sin anticipo">Sin anticipo</option>
          <option value="Anticipo">Dejó Anticipo</option>
          <option value="Liquidado">Totalmente Liquidado</option>
        </select>
      </div>

      {estadoPago === 'Anticipo' && (
        <div className="campo">
          <label>¿Cuánto dio de anticipo? ($)</label>
          <input type="number" min="0" value={cantidadAnticipo} onChange={(e) => setCantidadAnticipo(e.target.value)} />
        </div>
      )}

      <div className="campo">
        <label>Notas o Detalles Adicionales</label>
        <textarea rows="3" value={notas} onChange={(e) => setNotas(e.target.value)}></textarea>
      </div>

      <button type="submit" className="btn-guardar" disabled={guardando}>
        {guardando ? 'Subiendo foto y guardando...' : 'Agendar Pedido'}
      </button>
    </form>
  );
}