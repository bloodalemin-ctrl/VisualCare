import React, { useState, useEffect } from 'react';

// Paleta de colores unificada (Tomada de PanelPaciente)
const colorFondoLateral = '#01579B'; 
const colorTitulos = '#0277BD'; 
const colorBotonPrincipal = '#0277BD'; 
const colorTextoGeneral = '#333333';

const AdminDashboard = ({ usuario, cerrarSesion }) => {
  const [vistaActiva, setVistaActiva] = useState('inicio');
  
  // Estados para Médicos/Usuarios
  const [listaMedicos, setListaMedicos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [medicoEditando, setMedicoEditando] = useState(null);
  
  const [nuevoMedico, setNuevoMedico] = useState({
    nombre: '', apellidoP: '', apellidoM: '', correo: '', password: '', cedula: '', fechaNacimiento: '', rol: 'optometrista'
  });

  // Estado para Pacientes
  const [listaPacientes, setListaPacientes] = useState([]);

  // Estados para el Historial
  const [modalHistorial, setModalHistorial] = useState(false);
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [datosHistorial, setDatosHistorial] = useState({ tests: [], reportes: [] });

  // Estados para el Muro (Noticias)
  const [listaNoticias, setListaNoticias] = useState([]);
  const [noticiaEditando, setNoticiaEditando] = useState(null);

  const menu = [
    { id: 'inicio', icono: '📊', texto: 'Resumen' },
    { id: 'medicos', icono: '👥', texto: 'Usuarios' },
    { id: 'pacientes', icono: '🤒', texto: 'Pacientes' },
    { id: 'noticias', icono: '📢', texto: 'Publicar Noticia' },
    { id: 'muro', icono: '🧱', texto: 'Gestión del Muro' }
  ];

  // --- FUNCIONES DEL MURO ---
  const obtenerNoticiasDesdeBD = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/noticias');
      const datos = await respuesta.json();
      setListaNoticias(datos);
    } catch (error) {
      console.error('Error al obtener noticias:', error);
    }
  };

  const eliminarNoticia = async (id) => {
    if (window.confirm("¿Segura que deseas eliminar esta publicación del muro?")) {
      await fetch(`http://localhost:3000/api/noticias/${id}`, { method: 'DELETE' });
      alert("Publicación eliminada");
      obtenerNoticiasDesdeBD(); 
    }
  };

  // --- FUNCIONES DE MÉDICOS/USUARIOS ---
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
    const confirmar = window.confirm("¿Estás segura de que deseas eliminar este usuario del sistema?");
    if (confirmar) {
      try {
        const respuesta = await fetch(`http://localhost:3000/api/admin/medicos/${id}`, { method: 'DELETE' });
        if (respuesta.ok) {
          alert("Usuario eliminado correctamente");
          obtenerMedicosDesdeBD(); 
        } else {
          alert("Hubo un problema al intentar eliminar.");
        }
      } catch (error) {
        console.error('Error al conectar con el servidor:', error);
      }
    }
  };

  const manejarCambioInput = (e) => {
    const { name, value } = e.target;
    if (name === 'rol' && value !== 'optometrista') {
      setNuevoMedico({ ...nuevoMedico, [name]: value, cedula: '' });
    } else {
      setNuevoMedico({ ...nuevoMedico, [name]: value });
    }
  };

  const prepararEdicion = (medico) => {
    const fechaFormateada = medico.fecha_nacimiento ? new Date(medico.fecha_nacimiento).toISOString().split('T')[0] : '';
    setNuevoMedico({
      nombre: medico.nombre, apellidoP: medico.apellidoP, apellidoM: medico.apellidoM,
      correo: medico.correo, password: '', cedula: medico.cedula || '', fechaNacimiento: fechaFormateada, rol: medico.rol || 'optometrista'
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
        alert(medicoEditando ? "¡Usuario actualizado exitosamente!" : "¡Usuario registrado exitosamente!");
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
    setNuevoMedico({ nombre: '', apellidoP: '', apellidoM: '', correo: '', password: '', cedula: '', fechaNacimiento: '', rol: 'optometrista' });
  };

  // --- FUNCIONES DE PACIENTES ---
  const obtenerPacientesDesdeBD = async () => {
    try {
      const respuesta = await fetch('http://localhost:3000/api/admin/pacientes');
      const datos = await respuesta.json();
      setListaPacientes(datos); 
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
    }
  };

  const verHistorial = async (paciente) => {
    setPacienteActivo(paciente);
    try {
      const respuesta = await fetch(`http://localhost:3000/api/admin/pacientes/${paciente.id}/historial`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setDatosHistorial(datos);
        setModalHistorial(true);
      } else {
        alert("No se pudo cargar el historial.");
      }
    } catch (error) {
      console.error('Error al obtener historial:', error);
    }
  };

  // --- CONTROLADOR DE VISTAS (useEffect) ---
  useEffect(() => {
    obtenerMedicosDesdeBD();
    obtenerPacientesDesdeBD();
    if (vistaActiva === 'muro') obtenerNoticiasDesdeBD();
    if (vistaActiva === 'medicos') cerrarFormulario();
  }, [vistaActiva]);

  const renderizarContenido = () => {
    switch (vistaActiva) {
      case 'inicio':
        return (
          <div style={{ animation: 'fadeIn 0.4s', maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ color: colorTitulos, marginBottom: '10px', fontSize: '34px' }}>¡Hola, {usuario?.nombre || 'Administrador'}! 👋</h1>
            <h2 style={{ color: colorTitulos, fontSize: '24px', borderBottom: `3px solid ${colorBotonPrincipal}`, paddingBottom: '10px', marginBottom: '25px' }}>Resumen del Sistema</h2>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${colorBotonPrincipal}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ padding: '8px', background: '#E3F2FD', borderRadius: '8px', fontSize: '24px' }}>🤒</div>
                  <h3 style={{ margin: 0, color: colorTitulos, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Pacientes Registrados</h3>
                </div>
                <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold', color: colorTextoGeneral }}>{listaPacientes.length}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>En la base de datos</p>
              </div>
              <div style={{ flex: 1, minWidth: '240px', background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${colorBotonPrincipal}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ padding: '8px', background: '#E3F2FD', borderRadius: '8px', fontSize: '24px' }}>👥</div>
                  <h3 style={{ margin: 0, color: colorTitulos, fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Usuarios del Sistema</h3>
                </div>
                <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold', color: colorTextoGeneral }}>{listaMedicos.length}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>Doctores y Admins</p>
              </div>
            </div>
          </div>
        );

      case 'medicos':
        if (mostrarFormulario) {
          return (
            <div style={{ animation: 'fadeIn 0.3s', maxWidth: '600px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, fontSize: '28px', marginBottom: '20px' }}>{medicoEditando ? '✏️ Editar Usuario' : '➕ Registrar Nuevo Usuario'}</h2>
              <form onSubmit={guardarMedico} style={{ display: 'grid', gap: '15px' }}>
                <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Nombre(s):</label><input type="text" name="nombre" value={nuevoMedico.nombre} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Rol en el sistema:</label><select name="rol" value={nuevoMedico.rol} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: 'white', fontSize: '16px' }}><option value="optometrista">Optometrista (Doctor)</option><option value="paciente">Paciente</option><option value="admin">Administrador</option><option value="usuario">Usuario General</option></select></div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Apellido Paterno:</label><input type="text" name="apellidoP" value={nuevoMedico.apellidoP} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Apellido Materno:</label><input type="text" name="apellidoM" value={nuevoMedico.apellidoM} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>
                </div>
                {nuevoMedico.rol === 'optometrista' && (<div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Cédula Profesional:</label><input type="text" name="cedula" value={nuevoMedico.cedula} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>)}
                <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Fecha de Nacimiento:</label><input type="date" name="fechaNacimiento" value={nuevoMedico.fechaNacimiento} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Correo Electrónico:</label><input type="email" name="correo" value={nuevoMedico.correo} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>
                {!medicoEditando && (<div><label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: colorTextoGeneral }}>Contraseña Provisional:</label><input type="password" name="password" value={nuevoMedico.password} onChange={manejarCambioInput} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }} /></div>)}
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button type="submit" style={{ flex: 1, background: colorBotonPrincipal, color: '#fff', padding: '15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>{medicoEditando ? 'Guardar Cambios' : 'Guardar Usuario'}</button>
                  <button type="button" onClick={cerrarFormulario} style={{ flex: 1, background: '#ECEFF1', color: '#333', padding: '15px', borderRadius: '8px', border: '1px solid #CCC', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Cancelar</button>
                </div>
              </form>
            </div>
          );
        }
        return (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: `3px solid ${colorBotonPrincipal}`, paddingBottom: '10px' }}>
              <h2 style={{ color: colorTitulos, fontSize: '24px', margin: 0 }}>👥 Gestión de Usuarios</h2>
              <button onClick={() => setMostrarFormulario(true)} style={{ background: colorBotonPrincipal, color: '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>+ Agregar Usuario</button>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #E0E0E0' }}>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>ID</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Nombre Completo</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Rol</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Cédula</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Correo</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaMedicos.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay usuarios registrados...</td></tr>
                  ) : (
                    listaMedicos.map((medico) => (
                      <tr key={medico.id} style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '15px' }}>{medico.id}</td>
                        <td style={{ padding: '15px', fontWeight: '500' }}>{medico.nombre} {medico.apellidoP} {medico.apellidoM}</td>
                        <td style={{ padding: '15px', textTransform: 'capitalize', fontWeight: 'bold', color: colorTitulos }}>{medico.rol}</td>
                        <td style={{ padding: '15px', color: '#666' }}>{medico.cedula || 'N/A'}</td>
                        <td style={{ padding: '15px', color: '#666' }}>{medico.correo}</td>
                        <td style={{ padding: '15px' }}>
                          <button onClick={() => prepararEdicion(medico)} style={{ marginRight: '10px', color: '#F57C00', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Editar</button>
                          <button onClick={() => eliminarMedico(medico.id)} style={{ color: '#D32F2F', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'pacientes':
        return (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <h2 style={{ color: colorTitulos, fontSize: '24px', borderBottom: `3px solid ${colorBotonPrincipal}`, paddingBottom: '10px', marginBottom: '25px' }}>🤒 Directorio de Pacientes</h2>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F5F5F5', borderBottom: '2px solid #E0E0E0' }}>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>ID</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Nombre Completo</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Correo Electrónico</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Fecha Nacimiento</th>
                    <th style={{ padding: '15px', color: colorTextoGeneral }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaPacientes.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No hay pacientes registrados...</td></tr>
                  ) : (
                    listaPacientes.map((paciente) => (
                      <tr key={paciente.id} style={{ borderBottom: '1px solid #EEE' }}>
                        <td style={{ padding: '15px' }}>{paciente.id}</td>
                        <td style={{ padding: '15px', fontWeight: '500' }}>{paciente.nombre} {paciente.apellidoP} {paciente.apellidoM}</td>
                        <td style={{ padding: '15px', color: '#666' }}>{paciente.correo}</td>
                        <td style={{ padding: '15px', color: '#666' }}>{paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A'}</td>
                        <td style={{ padding: '15px' }}>
                          <button onClick={() => verHistorial(paciente)} style={{ background: '#E3F2FD', color: colorBotonPrincipal, padding: '8px 15px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Ver Expediente</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'noticias':
        return (
          <div style={{ animation: 'fadeIn 0.4s', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: colorTitulos, fontSize: '28px', marginBottom: '20px' }}>📢 Publicar Nueva Noticia</h2>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                formData.append('id_autor', usuario.id); 

                try {
                  const response = await fetch('http://localhost:3000/api/noticias', { method: 'POST', body: formData });
                  if (response.ok) {
                    alert("¡Publicado con éxito en el Muro!");
                    e.target.reset();
                  } else {
                    const errorData = await response.json();
                    alert("Error al publicar: " + errorData.error);
                  }
                } catch (error) {
                  alert("Error de conexión con el servidor");
                }
              }} 
              encType="multipart/form-data" 
              style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `6px solid ${colorBotonPrincipal}` }}
            >
              <input type="text" name="titulo" placeholder="Escribe el encabezado o título de la recomendación..." required style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '20px', border: '1px solid #CCC', borderRadius: '8px', fontSize: '16px' }} />
              <textarea name="contenido" placeholder="Redacta los consejos sobre la Regla 20-20-20, ergonomía visual o pausas activas para el muro general..." required style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '20px', height: '120px', border: '1px solid #CCC', borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', color: colorTextoGeneral }}>Adjuntar archivo (Imagen/Video/PDF):</label>
              <input type="file" name="archivo" accept="image/*,video/*,application/pdf" style={{ marginBottom: '25px', fontSize: '16px' }} />
              <button type="submit" style={{ background: colorBotonPrincipal, color: '#fff', padding: '15px 30px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', width: '100%' }}>¡Subir Publicación!</button>
            </form>
          </div>
        );

      case 'muro':
        return (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <h2 style={{ color: colorTitulos, fontSize: '24px', borderBottom: `3px solid ${colorBotonPrincipal}`, paddingBottom: '10px', marginBottom: '25px' }}>🧱 Gestión del Muro</h2>
            
            {/* FORMULARIO DE EDICIÓN FLOTANTE */}
            {noticiaEditando && (
              <div style={{ marginBottom: '30px', padding: '30px', background: '#FFF3E0', borderRadius: '12px', borderLeft: '6px solid #FF9800', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: '#E65100', fontSize: '22px' }}>✏️ Editando Publicación Anterior</h3>
                  <button onClick={() => setNoticiaEditando(null)} style={{ background: '#FFCC80', color: '#E65100', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar Edición</button>
                </div>
                <form 
                  id="formEditarNoticia"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                      const response = await fetch(`http://localhost:3000/api/noticias/${noticiaEditando}`, { method: 'PUT', body: formData });
                      if (response.ok) {
                        alert("¡Noticia actualizada!");
                        setNoticiaEditando(null);
                        obtenerNoticiasDesdeBD(); 
                      }
                    } catch (error) {
                      alert("Error de conexión");
                    }
                  }}
                  encType="multipart/form-data"
                >
                  <input type="text" name="titulo" id="editTitulo" required style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #FFB74D', borderRadius: '8px', fontSize: '16px' }} />
                  <textarea name="contenido" id="editContenido" required style={{ display: 'block', width: '100%', padding: '12px', marginBottom: '15px', height: '100px', border: '1px solid #FFB74D', borderRadius: '8px', fontSize: '16px', fontFamily: 'inherit' }}></textarea>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#E65100' }}>Cambiar archivo (Opcional):</label>
                  <input type="file" name="archivo" accept="image/*,video/*,application/pdf" style={{ marginBottom: '20px' }} />
                  <button type="submit" style={{ background: '#F57C00', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Guardar Cambios</button>
                </form>
              </div>
            )}

            {/* LISTA DE NOTICIAS TIPO TARJETAS (IGUAL AL PACIENTE) */}
            {listaNoticias.length === 0 ? (
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#666', border: '1px dashed #ccc' }}>
                El muro está vacío. No hay publicaciones activas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {listaNoticias.map((noti) => (
                  <div key={noti.id_noticia} style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `6px solid ${colorBotonPrincipal}` }}>
                    
                    {/* ENCABEZADO DE LA TARJETA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                      <h3 style={{ margin: '0', color: colorTitulos, fontSize: '20px' }}>{noti.titulo}</h3>
                      <span style={{ fontSize: '14px', color: '#01579B', fontWeight: 'bold', background: '#E3F2FD', padding: '6px 14px', borderRadius: '6px' }}>
                        👤 {noti.doctor_nombre || 'Especialista'}
                      </span>
                    </div>

                    {/* CONTENIDO TEXTUAL */}
                    {noti.contenido && <p style={{ fontSize: '16px', color: colorTextoGeneral, whiteSpace: 'pre-wrap', lineHeight: '1.5', marginBottom: '20px' }}>{noti.contenido}</p>}
                    
                    {/* REPRODUCTOR MULTIMEDIA */}
                    {(noti.url_multimedia || noti.url_archivo) && (
                      <div style={{ marginTop: '15px', marginBottom: '20px' }}>
                        {noti.tipo_multimedia === 'pdf' ? (
                          <iframe src={noti.url_multimedia} style={{ width: '100%', height: '350px', border: '1px solid #eee', borderRadius: '8px' }} />
                        ) : noti.tipo_multimedia === 'video' ? (
                          <video src={noti.url_multimedia || noti.url_archivo} controls style={{ width: '100%', borderRadius: '8px', maxHeight: '450px', backgroundColor: '#000' }}>
                            Tu navegador no soporta videos.
                          </video>
                        ) : (
                          <img src={noti.url_multimedia || noti.url_archivo} style={{ maxWidth: '100%', borderRadius: '8px' }} />
                        )}
                      </div>
                    )}

                    {/* PIE DE TARJETA: FECHA Y BOTONES DE EDICIÓN */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #EEE' }}>
                      <span style={{ fontSize: '13px', background: '#F5F5F5', padding: '6px 12px', borderRadius: '4px', color: '#666', fontWeight: '500' }}>
                        📅 {noti.fecha_publicacion ? new Date(noti.fecha_publicacion).toLocaleDateString('es-ES') : 'N/A'}
                      </span>
                      
                      {/* BOTONES ADMINISTRATIVOS */}
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => {
                          setNoticiaEditando(noti.id_noticia);
                          setTimeout(() => {
                            document.getElementById('editTitulo').value = noti.titulo;
                            document.getElementById('editContenido').value = noti.contenido;
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }, 100);
                        }} style={{ background: '#FFF3E0', color: '#E65100', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }}>
                          ✏️ Editar
                        </button>
                        
                        <button onClick={() => eliminarNoticia(noti.id_noticia)} style={{ background: '#FFEBEE', color: '#D32F2F', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }}>
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", sans-serif', overflow: 'hidden' }}>
      
      {/* MENÚ LATERAL ESTILO PACIENTE */}
      <div style={{ width: '320px', background: colorFondoLateral, color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 25px', boxSizing: 'border-box', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 40px 10px', fontStyle: 'italic', fontSize: '30px' }}>VisionCare</h2>
        <span style={{ fontSize: '16px', color: '#81D4FA', marginTop: '-35px', marginBottom: '40px', marginLeft: '12px', fontWeight: 'bold' }}>Módulo Administrador</span>
        <hr style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '30px', marginTop: '-20px' }} />
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {menu.map(m => (
            <button key={m.id} onClick={() => setVistaActiva(m.id)} 
              style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: vistaActiva === m.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: vistaActiva === m.id ? 'bold' : '500', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '22px' }}>{m.icono}</span> {m.texto}
            </button>
          ))}
        </nav>
        
        <button onClick={cerrarSesion} style={{ padding: '18px 20px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '20px' }}>
          <span style={{ fontSize: '22px' }}>🚪</span> Cerrar Sesión
        </button>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div style={{ flex: 1, backgroundColor: '#F4F7F6', padding: '50px 70px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderizarContenido()}
      </div>

      {/* MODAL HISTORIAL CON NUEVOS COLORES */}
      {modalHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, animation: 'fadeIn 0.3s' }}>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: '"Segoe UI", sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${colorBotonPrincipal}`, paddingBottom: '15px', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: colorTitulos, fontSize: '24px' }}>Expediente de <span style={{ color: colorTextoGeneral, fontWeight: 'normal' }}>{pacienteActivo?.nombre} {pacienteActivo?.apellidoP}</span></h2>
              <button onClick={() => setModalHistorial(false)} style={{ background: 'none', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#999' }}>&times;</button>
            </div>
            
            <h3 style={{ color: colorTitulos, borderBottom: '1px solid #E0E0E0', paddingBottom: '5px', marginTop: '0', fontSize: '20px' }}>Resultados de Pruebas Visuales</h3>
            {datosHistorial.tests.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic', marginBottom: '30px' }}>No hay pruebas registradas.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', textAlign: 'left' }}>
                <thead><tr style={{ background: '#F5F5F5' }}><th style={{ padding: '12px', color: colorTextoGeneral }}>Fecha</th><th style={{ padding: '12px', color: colorTextoGeneral }}>Prueba</th><th style={{ padding: '12px', color: colorTextoGeneral }}>Diagnóstico</th></tr></thead>
                <tbody>
                  {datosHistorial.tests.map((test) => (
                    <tr key={test.id_test} style={{ borderBottom: '1px solid #EEE' }}><td style={{ padding: '12px', color: '#666' }}>{test.fecha ? new Date(test.fecha).toLocaleDateString('es-ES') : 'N/A'}</td><td style={{ padding: '12px', fontWeight: 'bold', color: colorTitulos }}>{test.tipo}</td><td style={{ padding: '12px', color: colorTextoGeneral }}>{test.resultado}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 style={{ color: colorTitulos, borderBottom: '1px solid #E0E0E0', paddingBottom: '5px', fontSize: '20px' }}>Reportes Clínicos (PDF)</h3>
            {datosHistorial.reportes.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No hay documentos generados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead><tr style={{ background: '#F5F5F5' }}><th style={{ padding: '12px', color: colorTextoGeneral }}>ID</th><th style={{ padding: '12px', color: colorTextoGeneral }}>Fecha</th><th style={{ padding: '12px', color: colorTextoGeneral }}>Descarga</th></tr></thead>
                <tbody>
                  {datosHistorial.reportes.map((reporte) => (
                    <tr key={reporte.id_reporte} style={{ borderBottom: '1px solid #EEE' }}><td style={{ padding: '12px' }}>#{reporte.id_reporte}</td><td style={{ padding: '12px', color: '#666' }}>{reporte.fecha ? new Date(reporte.fecha).toLocaleDateString('es-ES') : 'N/A'}</td><td style={{ padding: '12px' }}>{reporte.ruta_pdf ? (<a href={`http://localhost:3000${reporte.ruta_pdf}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: colorBotonPrincipal, color: 'white', padding: '8px 15px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>📄 Ver PDF</a>) : (<span style={{ color: '#999' }}>Sin archivo</span>)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;