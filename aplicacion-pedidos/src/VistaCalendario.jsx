import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarioPersonalizado.css';

export default function VistaCalendario({ pedidos, setVista, setBusqueda }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  const pedidosDelDia = pedidos.filter(p => {
    const fechaPedido = new Date(p.fechaEntrega + "T00:00:00");
    return fechaPedido.toDateString() === fechaSeleccionada.toDateString();
  });

  const irAPedido = (nombreCliente) => {
    setBusqueda(nombreCliente); // 🔍 Ponemos el nombre en el buscador
    setVista('lista'); // 📑 Cambiamos a la pestaña de lista
  };

  return (
    <div className="calendario-seccion">
      <div className="card-blanca">
        <h3>📅 Agenda de Entregas</h3>
        <Calendar 
          onChange={setFechaSeleccionada} 
          value={fechaSeleccionada}
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const tienePedido = pedidos.some(p => 
                new Date(p.fechaEntrega + "T00:00:00").toDateString() === date.toDateString()
              );
              return tienePedido ? <div className="punto-pedido"></div> : null;
            }
          }}
        />
      </div>

      <div className="detalle-dia">
        <h4>Pedidos para el {fechaSeleccionada.toLocaleDateString()}:</h4>
        {pedidosDelDia.length > 0 ? (
          pedidosDelDia.map(p => (
            <div 
              key={p.id} 
              className="mini-tarjeta" 
              onClick={() => irAPedido(p.cliente)} // 👈 ¡Teletransporte!
              style={{ cursor: 'pointer' }}
            >
              <strong>{p.cliente}</strong> - {p.sabor} <span>➡️</span>
            </div>
          ))
        ) : (
          <p className="txt-suave">Día libre. ✨</p>
        )}
      </div>
    </div>
  );
}