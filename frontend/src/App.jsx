import React, { useState } from 'react';
import Login from './components/Login';
// importacion a las carpetas correspondientes
// aqui hay que poner los modulos de cada usuario 
import PanelPaciente from './views/Paciente/PanelPaciente';
import PanelMedico from './views/Optometrista/PanelMedico';
import PanelAdmin from './views/Admin/PanelAdmin';

function App() {
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
// si no es admin o opto por defecto sera usuario 
  return <PanelPaciente usuario={usuarioLogeado} cerrarSesion={() => setUsuarioLogeado(null)} />;
}

export default App;