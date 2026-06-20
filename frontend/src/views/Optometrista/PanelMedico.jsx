import React, { useState, useEffect } from 'react';

function PanelMedico({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('pacientes');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  
  // Extraemos el ID del médico logueado garantizando fallback numérico para la Foreign Key
  const idMedico = usuario?.id_usuario || usuario?.id || 1;
  
  // Pacientes e Historial Clínico
  const [listaPacientes, setListaPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [historialPaciente, setHistorialPaciente] = useState([]);
  
  // Estado para el buzón de recomendaciones personales (TEST_VISUAL con tipo='Reporte Médico')
  const [notaClinica, setNotaClinica] = useState('');
  const [mensajeExitoHistorial, setMensajeExitoHistorial] = useState(false);
  
  // Estados para el Muro de Consejos Generales (TABLA NOTICIA)
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [textoNoticia, setTextoNoticia] = useState('');
  const [archivoNoticia, setArchivoNoticia] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorPublicacion, setErrorPublicacion] = useState('');
  const [publicacionesAnteriores, setPublicacionesAnteriores] = useState([]);

  // Estados para el Perfil Médico
  const [publicacionesPerfil, setPublicacionesPerfil] = useState([]);
  const [nuevaNotaPerfil, setNuevaNotaPerfil] = useState('');
  const [mensajeExitoPerfil, setMensajeExitoPerfil] = useState(false);
  
  // 1. Cargar Pacientes Asignados
  useEffect(() => {
    const cargarPacientes = async () => {
      if (!idMedico) return;
      setCargando(true);
      try {
        const response = await fetch(`http://localhost:3000/api/medico/${idMedico}/pacientes`);
        if (!response.ok) throw new Error('Error al conectar con la API');
        const data = await response.json();
        setListaPacientes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
        setListaPacientes([]);
      } finally {
        setCargando(false);
      }
    };
    
    if (vistaActiva === 'pacientes') {
      cargarPacientes();
    }
  }, [vistaActiva, idMedico]);

  // 2. Cargar Historial Clínico Completo del Paciente Seleccionado
  useEffect(() => {
    if (pacienteSeleccionado) {
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      fetch(`http://localhost:3000/api/historial/${idPaciente}`)
        .then(response => response.json())
        .then(data => {
          setHistorialPaciente(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error('Error al obtener historial:', error);
          setHistorialPaciente([]);
        });
    }
  }, [pacienteSeleccionado]);

  // 3. Cargar el Muro de Noticias Generales (Consejos)
  useEffect(() => {
    if (vistaActiva === 'muro') {
      fetch('http://localhost:3000/api/noticias')
        .then(response => response.json())
        .then(data => {
          setPublicacionesAnteriores(Array.isArray(data) ? data : []);
        })
        .catch(error => console.error('Error al cargar el muro:', error));
    }
  }, [vistaActiva]);

  // 4. Cargar Trayectoria Profesional en Mi Perfil
  useEffect(() => {
    if (vistaActiva === 'perfil' && idMedico) {
      fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`)
        .then(res => res.json())
        .then(data => setPublicacionesPerfil(Array.isArray(data) ? data : []))
        .catch(() => setPublicacionesPerfil([]));
    }
  }, [vistaActiva, idMedico]);

  // =======================================================
  // ACCIONES: RECOMENDACIÓN PERSONALIZADA (BUZÓN DEL PACIENTE)
  // =======================================================
  const manejarSubidaHistorial = async (e) => {
    e.preventDefault();
    if (!notaClinica.trim()) return;
    
    try {
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      const response = await fetch(`http://localhost:3000/api/historial/${idPaciente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado: notaClinica, tipo: 'Reporte Médico' })
      });
      
      if (response.ok) {
        const nuevoRegistro = await response.json();
        setHistorialPaciente([nuevoRegistro, ...historialPaciente]);
        setNotaClinica('');
        setMensajeExitoHistorial(true);
        setTimeout(() => setMensajeExitoHistorial(false), 3000);
      }
    } catch (error) {
      alert('Error de red al guardar la recomendación');
    }
  };

  const eliminarRegistroHistorial = async (idRegistro) => {
    if (window.confirm("⚠️ ¿Deseas eliminar permanentemente esta anotación del historial?")) {
      const response = await fetch(`http://localhost:3000/api/historial/${idRegistro}`, { method: 'DELETE' });
      if (response.ok) {
        setHistorialPaciente(historialPaciente.filter(item => (item.id_test || item.id) !== idRegistro));
      }
    }
  };

  // =======================================================
  // ACCIONES: MURO DE CONSEJOS GENERALES (TABLA NOTICIA)
  // =======================================================
  const manejarSubidaMuro = async (e) => {
    e.preventDefault();
    if (!textoNoticia.trim() && !tituloNoticia.trim() && !archivoNoticia) {
      setErrorPublicacion('Debes escribir un contenido o seleccionar un archivo.');
      return; 
    }
    setErrorPublicacion('');
    
    try {
      const formData = new FormData();
      formData.append('titulo', tituloNoticia || 'Consejo Preventivo');
      formData.append('contenido', textoNoticia);
      formData.append('id_autor', idMedico.toString());

      if (archivoNoticia) {
        formData.append('archivo', archivoNoticia);
      }

      const response = await fetch('http://localhost:3000/api/noticias', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Error al insertar en la base de datos');
      
      const nuevaNoticia = await response.json();
      
      setPublicacionesAnteriores([nuevaNoticia, ...publicacionesAnteriores]);
      setMensajeExito(true);
      setTituloNoticia('');
      setTextoNoticia('');
      setArchivoNoticia(null);
      
      if (document.getElementById('input-archivo-muro')) {
        document.getElementById('input-archivo-muro').value = '';
      }
      
      setTimeout(() => setMensajeExito(false), 3000);
    } catch (error) {
      console.error(error);
      setErrorPublicacion('Error de conexión o inconsistencia de columnas al subir la publicación.');
    }
  };

  const eliminarPublicacion = async (id) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar este consejo del muro?")) {
      const response = await fetch(`http://localhost:3000/api/noticias/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setPublicacionesAnteriores(publicacionesAnteriores.filter(pub => (pub.id_noticia || pub.id) !== id));
      }
    }
  };

  // =======================================================
  // ACCIONES: CURRÍCULUM / PERFIL MÉDICO
  // =======================================================
  const agregarPublicacionPerfil = async (e) => {
    e.preventDefault();
    if (!nuevaNotaPerfil.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nuevaNotaPerfil })
      });
      
      if (response.ok) {
        const nuevaNota = await response.json();
        setPublicacionesPerfil([nuevaNota, ...publicacionesPerfil]);
        setNuevaNotaPerfil('');
        setMensajeExitoPerfil(true);
        setTimeout(() => setMensajeExitoPerfil(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Estilos de la interfaz gráfica
  const colorFondoLateral = '#01579B'; 
  const colorTitulos = '#0277BD'; 
  const colorBotonPrincipal = '#0277BD';

  const menuItems = [
    { id: 'pacientes', icono: '👥', texto: 'Mis Pacientes' },
    { id: 'muro', icono: '📢', texto: 'Consejos' },
    { id: 'perfil', icono: '⚙️', texto: 'Mi Perfil Médico' }
  ];

  const renderizarContenido = () => {
    // Vista detallada del Expediente e Historial del Paciente seleccionado
    if (pacienteSeleccionado) {
      return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
          <button onClick={() => setPacienteSeleccionado(null)} style={{ background: colorTitulos, color: '#fff', padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>
            ← Volver a la Lista
          </button>
          
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '25px', marginBottom: '30px', border: '1px solid #e0e0e0' }}>
            <h2 style={{ color: colorTitulos, margin: '0 0 15px 0' }}>👤 Datos del Expediente</h2>
            <p style={{ margin: '5px 0' }}><strong>Nombre del Paciente:</strong> {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidoP}</p>
            <p style={{ margin: '5px 0' }}><strong>Correo de contacto:</strong> {pacienteSeleccionado.correo}</p>
          </div>
          
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ color: colorTitulos, margin: '0 0 15px 0' }}>🔬 Historial Clínico Registrado (TEST_VISUAL)</h3>
            {historialPaciente.length === 0 ? <p style={{ color: '#777' }}>Este paciente no cuenta con registros o exámenes previos.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                {historialPaciente.map(item => (
                  <div key={item.id_test || item.id} style={{ padding: '15px', background: '#F0F8FF', borderRadius: '8px', borderLeft: `4px solid ${colorBotonPrincipal}` }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '15px' }}><strong>{item.tipo}:</strong> {item.resultado}</p>
                    <small style={{ color: '#888' }}>📅 {item.fecha}</small>
                    <button onClick={() => eliminarRegistroHistorial(item.id_test || item.id)} style={{ float: 'right', background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario del Buzón de Recomendación Directa al Paciente */}
          <form onSubmit={manejarSubidaHistorial} style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Añadir Recomendación (Buzón del Paciente)</h3>
            <textarea value={notaClinica} onChange={(e) => setNotaClinica(e.target.value)} rows="3" style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', resize: 'none', fontSize: '15px' }} placeholder="Escribe aquí las recomendaciones médicas específicas. El paciente leerá este mensaje desde su panel..."></textarea>
            <button type="submit" style={{ marginTop: '15px', padding: '12px 25px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Enviar al Paciente</button>
            {mensajeExitoHistorial && <p style={{ color: 'green', marginTop: '10px' }}>✅ Recomendación enviada exitosamente.</p>}
          </form>
        </div>
      );
    }

    // Grid General de Pacientes Registrados
    if (vistaActiva === 'pacientes') {
      return (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <h1 style={{ color: colorTitulos, margin: '0 0 10px 0' }}>👥 Pacientes Asignados</h1>
          <p style={{ color: '#555', margin: '0 0 25px 0' }}>Monitorea el estatus visual y expedientes de los usuarios registrados.</p>
          <input type="text" placeholder="🔍 Buscar paciente por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: '100%', maxWidth: '500px', padding: '12px 15px', marginBottom: '30px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
          
          {cargando ? <p>Conectando con el servidor...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {listaPacientes.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase())).map(p => (
                <div key={p.id_usuario || p.id} onClick={() => setPacienteSeleccionado(p)} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', cursor: 'pointer', border: '1px solid #eee', transition: 'all 0.2s' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: colorTitulos }}>{p.nombre} {p.apellidoP}</h3>
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 15px 0' }}>{p.correo}</p>
                  <button style={{ width: '100%', padding: '10px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Expediente</button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Sección del Muro de Consejos Generales
    if (vistaActiva === 'muro') {
      return (
        <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
          <h1 style={{ color: colorTitulos, marginBottom: '35px' }}>📢 Muro de Novedades</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '50px' }}>
            <h2 style={{ color: colorTitulos, fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Mis Publicaciones Anteriores</h2>
            {publicacionesAnteriores.length === 0 ? (
              <p style={{ color: '#777', fontStyle: 'italic' }}>No se han subido consejos preventivos aún.</p>
            ) : (
              publicacionesAnteriores.map(pub => {
                const idPublicacion = pub.id_noticia || pub.id;
                return (
                  <div key={idPublicacion} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: colorTitulos }}>{pub.titulo}</h3>
                      <button onClick={() => eliminarPublicacion(idPublicacion)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>🗑️ Eliminar</button>
                    </div>
                    <p style={{ color: '#333', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: '0 0 15px 0' }}>{pub.contenido}</p>
                    {(pub.url_multimedia || pub.url_archivo) && <img src={pub.url_multimedia || pub.url_archivo} alt="Adjunto" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', display: 'block', margin: '10px 0' }} />}
                    <small style={{ color: '#999' }}>📅 Publicado: {new Date(pub.fecha_publicacion || pub.fecha).toLocaleDateString('es-ES')}</small>
                  </div>
                );
              })
            )}
          </div>

          <h2>Crear Nueva Publicación General</h2>
          <form onSubmit={manejarSubidaMuro} style={{ background: '#fff', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '15px' }}>
            <input type="text" value={tituloNoticia} onChange={e => setTituloNoticia(e.target.value)} placeholder="Escribe el encabezado o título de la recomendación..." style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '15px' }} />
            <textarea value={textoNoticia} onChange={e => setTextoNoticia(e.target.value)} placeholder="Redacta los consejos sobre la Regla 20-20-20, ergonomía visual o pausas activas para el muro general..." rows="4" style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: '15px', resize: 'none' }}></textarea>
            <input id="input-archivo-muro" type="file" onChange={e => setArchivoNoticia(e.target.files[0])} style={{ marginBottom: '20px' }} />
            
            {errorPublicacion && (
              <div style={{ marginBottom: '15px', padding: '12px', color: '#D32F2F', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>
                ⚠️ {errorPublicacion}
              </div>
            )}
            
            <button type="submit" style={{ width: '100%', padding: '14px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>¡Subir Publicación!</button>
            {mensajeExito && <p style={{ color: 'green', marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>✅ Publicado con éxito</p>}
          </form>
        </div>
      );
    }

    // Configuración Curricular del Perfil Profesional
    if (vistaActiva === 'perfil') {
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
          <h1>👤 Perfil Profesional</h1>
          <form onSubmit={agregarPublicacionPerfil} style={{ background: '#fff', padding: '30px', borderRadius: '12px', marginTop: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
            <textarea value={nuevaNotaPerfil} onChange={(e) => setNuevaNotaPerfil(e.target.value)} placeholder="Añadir trayectoria, cédula o descripción clínica..." rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none', fontSize: '15px', marginTop: '10px' }}></textarea>
            <button type="submit" style={{ marginTop: '15px', padding: '12px 25px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Información</button>
            {mensajeExitoPerfil && <p style={{ color: 'green', marginTop: '10px' }}>✅ Información guardada correctamente.</p>}
          </form>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", sans-serif', overflow: 'hidden' }}>
      <div style={{ width: '320px', background: colorFondoLateral, color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 25px', boxSizing: 'border-box', flexShrink: 0 }}>
        <h2>VisionCare</h2>
        <span style={{ fontSize: '13px', color: '#81D4FA', marginLeft: '12px', fontWeight: 'bold', marginBottom: '40px' }}>PANEL OPTOMETRISTA</span>
        <hr style={{ width: '100%', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '30px', marginTop: '-20px' }} />
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setVistaActiva(item.id); setPacienteSeleccionado(null); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: (vistaActiva === item.id && !pacienteSeleccionado) ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: 'all 0.2s' }}>
              <span>{item.icono}</span> {item.texto}
            </button>
          ))}
        </nav>
        <button onClick={cerrarSesion} style={{ padding: '18px 20px', background: 'transparent', color: '#fff', border: 'none', borderTop: '2px solid rgba(255,255,255,0.15)', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Cerrar Sesión</button>
      </div>
      <div style={{ flex: 1, backgroundColor: '#F4F7F6', padding: '50px 70px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderizarContenido()}
      </div>
    </div>
  );
}

export default PanelMedico;