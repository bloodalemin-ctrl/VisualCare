import React, { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('inicio');
  
  // Estados para Médicos
  const [listaMedicos, setListaMedicos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState(null);
  const [nuevoMedico, setNuevoMedico] = useState({
    nombre: '', apellidoP: '', apellidoM: '', correo: '', password: '', cedula: '', fechaNacimiento: ''
  });

  // NUEVO: Estado para Pacientes
  const [listaPacientes, setListaPacientes] = useState([]);

  // --- FUNCIONES DE MÉDICOS ---
  const obtenerMedicosDesdeBD = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/admin/medicos');
      const datos = await respuesta.json();
      setListaMedicos(datos); 
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    }
  };

  const eliminarMedico = async (id) => {
    const confirmar = window.confirm("¿Estás segura de que deseas eliminar este médico del sistema?");
    if (confirmar) {
      try {
        const respuesta = await fetch(`http://localhost:3000/api/admin/medicos/${id}`, { method: 'DELETE' });
        if (respuesta.ok) {
          alert("Médico eliminado correctamente");
          obtenerMedicosDesdeBD(); 
        } else {
          alert("Hubo un problema al intentar eliminar al médico.");
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
      }
    }
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoMedico({ ...nuevoMedico, [name]: value });
  };

  const prepararEdicion = (medico) => {
    const fechaFormateada = medico.fecha_nacimiento ? new Date(medico.fecha_nacimiento).toISOString().split('T')[0] : '';
    setNuevoMedico({
      nombre: medico.nombre, apellidoP: medico.apellidoP, apellidoM: medico.apellidoM,
      correo: medico.correo, password: '', cedula: medico.cedula || '', fechaNacimiento: fechaFormateada
    });
    setMedicoEditando(medico.id);
    setMostrarFormulario(true);
  };

  const guardarMedico = async (e) => {
    e.preventDefault(); 
    const metodo = medicoEditando ? 'PUT' : 'POST';
    const url = medicoEditando ? `http://localhost:3000/api/admin/medicos/${medicoEditando}` : 'http://localhost:3000/api/admin/medicos';

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMedico)
      });

      if (respuesta.ok) {
        alert(medicoEditando ? "¡Médico actualizado exitosamente!" : "¡Médico registrado exitosamente!");
        cerrarFormulario();
        obtenerMedicosDesdeBD(); 
      } else {
        alert("Hubo un error al guardar los datos.");
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setMedicoEditando(null);
    setNuevoMedico({ nombre: '', apellidoP: '', apellidoM: '', correo: '', password: '', cedula: '', fechaNacimiento: '' });
  };

  // --- NUEVA FUNCIÓN DE PACIENTES ---
  const obtenerPacientesDesdeBD = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/admin/pacientes');
      const datos = await respuesta.json();
      setListaPacientes(datos); 
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    }
  };

  // --- CONTROLADOR DE VISTAS (useEffect) ---
  useEffect(() => {
    if (vistaActiva === 'medicos') {
      obtenerMedicosDesdeBD();
      cerrarFormulario();
    } else if (vistaActiva === 'pacientes') {
      // Si la pestaña es pacientes, vamos a buscar su información
      obtenerPacientesDesdeBD();
    }
  }, [vistaActiva]);

  const renderizarContenido = () => {
    switch (vistaActiva) {
      case 'medicos':
        if (mostrarFormulario) {
          return (
            <div>
              <h3>{medicoEditando ? 'Editar Médico' : 'Registrar Nuevo Médico'}</h3>
              <form onSubmit={guardarMedico} style={{ display: 'grid', gap: '15px', maxWidth: '500px', marginTop: '20px' }}>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Nombre(s):</label><input type="text" name="nombre" value={nuevoMedico.nombre} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px' }}>Apellido Paterno:</label><input type="text" name="apellidoP" value={nuevoMedico.apellidoP} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px' }}>Apellido Materno:</label><input type="text" name="apellidoM" value={nuevoMedico.apellidoM} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                </div>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Cédula Profesional:</label><input type="text" name="cedula" value={nuevoMedico.cedula} onChange={manejarCambioInput} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento:</label><input type="date" name="fechaNacimiento" value={nuevoMedico.fechaNacimiento} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Correo Electrónico:</label><input type="email" name="correo" value={nuevoMedico.correo} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                {!medicoEditando && (
                  <div><label style={{ display: 'block', marginBottom: '5px' }}>Contraseña Provisional:</label><input type="password" name="password" value={nuevoMedico.password} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{medicoEditando ? 'Guardar Cambios' : 'Guardar Médico'}</button>
                  <button type="button" onClick={cerrarFormulario} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                </div>
              </form>
            </div>
          );
        }
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Gestión de Médicos</h3>
              <button onClick={() => setMostrarFormulario(true)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar Médico</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px' }}>ID</th><th style={{ padding: '12px' }}>Nombre Completo</th><th style={{ padding: '12px' }}>Cédula</th><th style={{ padding: '12px' }}>Correo</th><th style={{ padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaMedicos.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No hay médicos registrados...</td></tr>
                ) : (
                  listaMedicos.map((medico) => (
                    <tr key={medico.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{medico.id}</td>
                      <td style={{ padding: '12px' }}>{medico.nombre} {medico.apellidoP} {medico.apellidoM}</td>
                      <td style={{ padding: '12px' }}>{medico.cedula || 'Sin especificar'}</td>
                      <td style={{ padding: '12px' }}>{medico.correo}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => prepararEdicion(medico)} style={{ marginRight: '10px', color: '#3498db', border: 'none', background: 'none', cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => eliminarMedico(medico.id)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      
      // NUEVA VISTA: PACIENTES
      case 'pacientes':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Directorio de Pacientes Registrados</h3>
              <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '5px' }}>Visualización general de los usuarios dados de alta en el sistema.</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Nombre Completo</th>
                  <th style={{ padding: '12px' }}>Correo Electrónico</th>
                  <th style={{ padding: '12px' }}>Fecha de Nacimiento</th>
                </tr>
              </thead>
              <tbody>
                {listaPacientes.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>
                      No hay pacientes registrados en la base de datos...
                    </td>
                  </tr>
                ) : (
                  listaPacientes.map((paciente) => (
                    <tr key={paciente.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{paciente.id}</td>
                      <td style={{ padding: '12px' }}>{paciente.nombre} {paciente.apellidoP} {paciente.apellidoM}</td>
                      <td style={{ padding: '12px' }}>{paciente.correo}</td>
                      <td style={{ padding: '12px' }}>
                        {/* Formateamos la fecha para que se vea bonita (ej. 15/08/1998) */}
                        {paciente.fecha_nacimiento 
                          ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES') 
                          : 'No especificada'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'noticias':
        return <div><h3>Publicar Noticias</h3><p>Aquí irá el formulario para subir noticias o avisos.</p></div>;
      default:
        return (
          <div>
            <h1>Bienvenido al Panel</h1>
            <p>Selecciona una opción del menú lateral para gestionar el sistema.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px' }}>
        <h2 onClick={() => setVistaActiva('inicio')} style={{ cursor: 'pointer' }}>VisualCare Admin</h2>
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '30px' }}>
          <li onClick={() => setVistaActiva('medicos')} style={{ margin: '15px 0', cursor: 'pointer', fontWeight: vistaActiva === 'medicos' ? 'bold' : 'normal' }}>👥 Médicos</li>
          <li onClick={() => setVistaActiva('pacientes')} style={{ margin: '15px 0', cursor: 'pointer', fontWeight: vistaActiva === 'pacientes' ? 'bold' : 'normal' }}>🤒 Pacientes</li>
          <li onClick={() => setVistaActiva('noticias')} style={{ margin: '15px 0', cursor: 'pointer', fontWeight: vistaActiva === 'noticias' ? 'bold' : 'normal' }}>📰 Noticias</li>
        </ul>
      </aside>

      <main style={{ flex: 1, backgroundColor: '#f4f6f9', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', padding: '15px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <span>Hola, Administrador | <button style={{ border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar sesión</button></span>
        </header>

        <div style={{ padding: '30px' }}>
          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {renderizarContenido()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;