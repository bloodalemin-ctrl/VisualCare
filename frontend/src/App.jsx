import React, { useState } from 'react';
import Login from './components/Login';

// Importaciones de los otros usuarios
import PanelPaciente from './views/Paciente/PanelPaciente';
import PanelMedico from './views/Optometrista/PanelMedico';

// Importación de tu panel de administrador
import PanelAdmin from './pages/Admin/AdminDashboard'; 

function App() {
  // Se quitó el truco temporal. Ahora el sistema arranca sin nadie logeado (null)
  // para forzar a que pasen por la pantalla de Login real.
  const [usuarioLogeado, setUsuarioLogeado] = useState(null);

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

  // Si no es admin u opto, por defecto será usuario (paciente)
  return <PanelPaciente usuario={usuarioLogeado} cerrarSesion={() => setUsuarioLogeado(null)} />;
}

export default App;