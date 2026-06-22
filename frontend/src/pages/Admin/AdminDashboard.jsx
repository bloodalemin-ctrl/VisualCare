import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ usuario, pacientes }) => {
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

  // ==========================================
  // NUEVOS ESTADOS PARA EL HISTORIAL CLÍNICO
  // ==========================================
  const [modalHistorial, setModalHistorial] = useState(false);
  const [pacienteActivo, setPacienteActivo] = useState(null);
  const [datosHistorial, setDatosHistorial] = useState({ tests: [], reportes: [] });

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

  // ==========================================
  // FUNCIÓN PARA ABRIR EL HISTORIAL CLÍNICO
  // ==========================================
  const verHistorial = async (paciente) => {
    setPacienteActivo(paciente);
    try {
      const respuesta = await fetch(`http://localhost:3000/api/admin/pacientes/${paciente.id}/historial`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setDatosHistorial(datos); // Guardamos tests y reportes en la memoria
        setModalHistorial(true);  // Abrimos la ventana
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
    if (vistaActiva === 'medicos') cerrarFormulario();
  }, [vistaActiva]);

  const renderizarContenido = () => {
    switch (vistaActiva) {
      
      case 'inicio':
        return (
          <div style={{ fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#1e3a8a', letterSpacing: '-0.5px', fontSize: '28px', marginBottom: '10px' }}>Resumen del Sistema</h1>
            <p style={{ color: '#64748b', marginBottom: '30px', fontSize: '16px' }}>Estado actual de VisualCare.</p>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', backgroundColor: '#ffffff', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '20px' }}>🤒</div>
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '15px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pacientes Registrados</h3>
                </div>
                <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold', color: '#1d4ed8' }}>{listaPacientes.length}</p>
                <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>En la base de datos</p>
              </div>

              <div style={{ flex: 1, minWidth: '240px', backgroundColor: '#ffffff', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '20px' }}>👥</div>
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '15px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios del Sistema</h3>
                </div>
                <p style={{ fontSize: '48px', margin: 0, fontWeight: 'bold', color: '#1d4ed8' }}>{listaMedicos.length}</p>
                <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Doctores y Admins</p>
              </div>
            </div>
          </div>
        );

      case 'medicos':
        if (mostrarFormulario) {
          return (
            <div>
              <h3>{medicoEditando ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
              <form onSubmit={guardarMedico} style={{ display: 'grid', gap: '15px', maxWidth: '500px', marginTop: '20px' }}>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Nombre(s):</label><input type="text" name="nombre" value={nuevoMedico.nombre} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Rol en el sistema:</label><select name="rol" value={nuevoMedico.rol} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'white' }}><option value="optometrista">Optometrista (Doctor)</option><option value="paciente">Paciente</option><option value="admin">Administrador</option></select></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px' }}>Apellido Paterno:</label><input type="text" name="apellidoP" value={nuevoMedico.apellidoP} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '5px' }}>Apellido Materno:</label><input type="text" name="apellidoM" value={nuevoMedico.apellidoM} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                </div>
                {nuevoMedico.rol === 'optometrista' && (<div><label style={{ display: 'block', marginBottom: '5px' }}>Cédula Profesional:</label><input type="text" name="cedula" value={nuevoMedico.cedula} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>)}
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento:</label><input type="date" name="fechaNacimiento" value={nuevoMedico.fechaNacimiento} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '5px' }}>Correo Electrónico:</label><input type="email" name="correo" value={nuevoMedico.correo} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                {!medicoEditando && (<div><label style={{ display: 'block', marginBottom: '5px' }}>Contraseña Provisional:</label><input type="password" name="password" value={nuevoMedico.password} onChange={manejarCambioInput} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>)}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}><button type="submit" style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{medicoEditando ? 'Guardar Cambios' : 'Guardar Usuario'}</button><button type="button" onClick={cerrarFormulario} style={{ backgroundColor: '#95a5a6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button></div>
              </form>
            </div>
          );
        }
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Gestión de Usuarios</h3>
              <button onClick={() => setMostrarFormulario(true)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar Usuario</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}><th style={{ padding: '12px' }}>ID</th><th style={{ padding: '12px' }}>Nombre Completo</th><th style={{ padding: '12px' }}>Cédula</th><th style={{ padding: '12px' }}>Correo</th><th style={{ padding: '12px' }}>Acciones</th></tr></thead>
              <tbody>{listaMedicos.length === 0 ? (<tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No hay usuarios registrados...</td></tr>) : (listaMedicos.map((medico) => (<tr key={medico.id} style={{ borderBottom: '1px solid #dee2e6' }}><td style={{ padding: '12px' }}>{medico.id}</td><td style={{ padding: '12px' }}>{medico.nombre} {medico.apellidoP} {medico.apellidoM}</td><td style={{ padding: '12px' }}>{medico.cedula || 'N/A'}</td><td style={{ padding: '12px' }}>{medico.correo}</td><td style={{ padding: '12px' }}><button onClick={() => prepararEdicion(medico)} style={{ marginRight: '10px', color: '#3498db', border: 'none', background: 'none', cursor: 'pointer' }}>Editar</button><button onClick={() => eliminarMedico(medico.id)} style={{ color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer' }}>Eliminar</button></td></tr>)))}</tbody>
            </table>
          </div>
        );
      
      // ==========================================
      // VISTA: PACIENTES ACTUALIZADA CON BOTÓN
      // ==========================================
      case 'pacientes':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a' }}>Directorio de Pacientes Registrados</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Visualización general de los usuarios dados de alta en el sistema.</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', color: '#475569' }}>ID</th>
                  <th style={{ padding: '12px', color: '#475569' }}>Nombre Completo</th>
                  <th style={{ padding: '12px', color: '#475569' }}>Correo Electrónico</th>
                  <th style={{ padding: '12px', color: '#475569' }}>Fecha de Nacimiento</th>
                  <th style={{ padding: '12px', color: '#475569' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {listaPacientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                      No hay pacientes registrados en la base de datos...
                    </td>
                  </tr>
                ) : (
                  listaPacientes.map((paciente) => (
                    <tr key={paciente.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{paciente.id}</td>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#1e293b' }}>{paciente.nombre} {paciente.apellidoP} {paciente.apellidoM}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{paciente.correo}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES') : 'No especificada'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {/* AQUÍ ESTÁ EL BOTÓN CON LA MAGIA */}
                        <button onClick={() => verHistorial(paciente)} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
                          Ver Historial
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      case 'noticias':
        return (
          <div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '20px' }}>Publicar Nueva Noticia</h3>
            
            {/* Formulario para crear noticia */}
            <form 
  onSubmit={async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // IMPORTANTE: Aquí inyectamos el ID del usuario logueado (que recibes como prop)
    formData.append('id_autor', usuario.id); 

    try {
      const response = await fetch('http://localhost:3000/api/noticias', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert("¡Publicado con éxito!");
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
  style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}
>
  <input type="text" name="titulo" placeholder="Título de la noticia" required style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px' }} />
  <textarea name="contenido" placeholder="Contenido de la noticia" required style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', height: '100px' }}></textarea>
  
  <label style={{ display: 'block', marginBottom: '5px' }}>Adjuntar archivo (Imagen/Video/PDF):</label>
  <input type="file" name="archivo" accept="image/*,video/*,application/pdf" style={{ marginBottom: '15px' }} />
  
  <button type="submit" style={{ backgroundColor: '#0e5aa7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Publicar en el Muro</button>
</form>

            <h3 style={{ color: '#1e3a8a' }}>Noticias Activas</h3>
            {/* Aquí podrías agregar un fetch para mostrar la lista de noticias existentes */}
            <p style={{ color: '#64748b' }}>Las noticias que publiques aquí aparecerán automáticamente en el muro de los pacientes.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '250px', backgroundColor: '#1e3a8a', color: 'white', padding: '20px' }}>
        <h2 onClick={() => setVistaActiva('inicio')} style={{ cursor: 'pointer', fontSize: '22px', fontWeight: 'bold' }}>VisualCare Admin</h2>
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '30px' }}>
          <li onClick={() => setVistaActiva('medicos')} style={{ margin: '15px 0', padding: '10px', borderRadius: '5px', cursor: 'pointer', backgroundColor: vistaActiva === 'medicos' ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: vistaActiva === 'medicos' ? '600' : 'normal' }}>👥 Usuarios</li>
          <li onClick={() => setVistaActiva('pacientes')} style={{ margin: '15px 0', padding: '10px', borderRadius: '5px', cursor: 'pointer', backgroundColor: vistaActiva === 'pacientes' ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: vistaActiva === 'pacientes' ? '600' : 'normal' }}>🤒 Pacientes</li>
          <li onClick={() => setVistaActiva('noticias')} style={{ margin: '15px 0', padding: '10px', borderRadius: '5px', cursor: 'pointer', backgroundColor: vistaActiva === 'noticias' ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: vistaActiva === 'noticias' ? '600' : 'normal' }}>📰 Noticias</li>
        </ul>
      </aside>

      <main style={{ flex: 1, backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
        <header style={{ backgroundColor: 'white', padding: '15px 30px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ color: '#475569', fontSize: '14px' }}>
            Hola, Administrador | <button style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: '600', marginLeft: '10px' }}>Cerrar sesión</button>
          </span>
        </header>

        <div style={{ padding: '30px' }}>
          <div style={{ padding: '25px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {renderizarContenido()}
          </div>
        </div>
      </main>

      {/* ========================================== */}
      {/* VENTANA FLOTANTE (MODAL) DEL HISTORIAL   */}
      {/* ========================================== */}
      {modalHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
            
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e3a8a' }}>
                Historial Clínico: <span style={{ color: '#475569', fontWeight: 'normal' }}>{pacienteActivo?.nombre} {pacienteActivo?.apellidoP}</span>
              </h2>
              <button onClick={() => setModalHistorial(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
            </div>

            {/* SECCIÓN 1: Tests Visuales */}
            <h3 style={{ color: '#1d4ed8', borderBottom: '1px solid #bfdbfe', paddingBottom: '5px', marginTop: '0' }}>Resultados de Tests Visuales</h3>
            {datosHistorial.tests.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '30px' }}>El paciente no tiene tests visuales registrados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Tipo de Test</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {datosHistorial.tests.map((test) => (
                    <tr key={test.id_test} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', color: '#64748b' }}>{test.fecha ? new Date(test.fecha).toLocaleDateString('es-ES') : 'N/A'}</td>
                      <td style={{ padding: '10px', fontWeight: '500' }}>{test.tipo}</td>
                      <td style={{ padding: '10px' }}>{test.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* SECCIÓN 2: Reportes Médicos */}
            <h3 style={{ color: '#1d4ed8', borderBottom: '1px solid #bfdbfe', paddingBottom: '5px' }}>Reportes Médicos (PDF)</h3>
            {datosHistorial.reportes.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>El paciente no tiene reportes médicos generados.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', color: '#475569' }}>ID Reporte</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {datosHistorial.reportes.map((reporte) => (
                    <tr key={reporte.id_reporte} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>#{reporte.id_reporte}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{reporte.fecha ? new Date(reporte.fecha).toLocaleDateString('es-ES') : 'N/A'}</td>
                      <td style={{ padding: '10px' }}>
                        {reporte.ruta_pdf ? (
                          <a 
                            href={`http://localhost:3000${reporte.ruta_pdf}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'inline-block', backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}
                          >
                            📄 Abrir PDF
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;