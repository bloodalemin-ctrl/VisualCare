import React, { useState } from 'react';
import Login from './components/Login';

// Importaciones de los otros usuarios
import PanelPaciente from './views/Paciente/PanelPaciente';
import PanelMedico from './views/Optometrista/PanelMedico';

// 👇 1. Modificamos la ruta para que apunte al archivo que creamos
import PanelAdmin from './pages/Admin/AdminDashboard'; 

function App() {
  // 👇 2. TRUCO PARA DISEÑAR: Cambiamos 'null' por un usuario admin temporal. 
  // Cuando termines de diseñar, solo borras este objeto y vuelves a poner 'null'.
  const [usuarioLogeado, setUsuarioLogeado] = useState({ rol: 'admin', nombre: 'Xiadani' });

  if (!usuarioLogeado) {
    return <Login alLogearse={(datos) => setUsuarioLogeado(datos)} />;
  }

  // Repartimos las vistas según el rol
  if (usuarioLogeado.rol === 'admin') {
    return <PanelAdmin usuario={usuarioLogeado} cerrarSesion={() => setUsuarioLogeado(null)} />;
  }

  if (usuarioLogeado.rol === 'optometrista') {
    return <PanelMedico usuario={usuarioLogeado} cerrarSesion={() => setUsuarioLogeado(null)} />;
  }

  // Si no es admin u opto, por defecto será usuario
  return <PanelPaciente usuario={usuarioLogeado} cerrarSesion={() => setUsuarioLogeado(null)} />;
}

export default App;