import './App.css';
import FormularioPedido from './FormularioPedido';
import ListaPedidos from './ListaPedidos';

function App() {
  return (
    <div className="contenedor-principal">
      <header className="header">
        <h1>Administración de Pastelería</h1>
      </header>
      
      <main className="grid-layout">
        <section className="columna-izq">
          <FormularioPedido />
        </section>
        
        <section className="columna-der">
          <ListaPedidos />
        </section>
      </main>
    </div>
  );
}

export default App;