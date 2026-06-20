import React, { useState, useEffect } from 'react';

function PanelMedico({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('pacientes');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  
  // Extraemos el ID y aseguramos un fallback numérico
  const idMedico = usuario?.id_usuario || usuario?.id || 1;
  
  // Estados Generales
  const [listaPacientes, setListaPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [historialPaciente, setHistorialPaciente] = useState([]);
  
  // Estados: Observaciones Clínicas
  const [notaClinica, setNotaClinica] = useState('');
  const [mensajeExitoHistorial, setMensajeExitoHistorial] = useState(false);
  
  // Estados: Muro de Novedades (NOTICIA)
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [textoNoticia, setTextoNoticia] = useState('');
  const [archivoNoticia, setArchivoNoticia] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorPublicacion, setErrorPublicacion] = useState('');
  const [publicacionesAnteriores, setPublicacionesAnteriores] = useState([]);

  // Estados: Perfil Profesional
  const [publicacionesPerfil, setPublicacionesPerfil] = useState([]);
  const [nuevaNotaPerfil, setNuevaNotaPerfil] = useState('');
  const [mensajeExitoPerfil, setMensajeExitoPerfil] = useState(false);

  // 1. Cargar Pacientes
  useEffect(() => {
    const cargarPacientes = async () => {
      setCargando(true);
      try {
        const response = await fetch(`http://localhost:3000/api/medico/${idMedico}/pacientes`);
        if (!response.ok) throw new Error('Error de conexión');
        const data = await response.json();
        setListaPacientes(Array.isArray(data) ? data : []);
      } catch (error) {
        setListaPacientes([]);
      } finally {
        setCargando(false);
      }
    };
    if (vistaActiva === 'pacientes') cargarPacientes();
  }, [vistaActiva, idMedico]);

  // 2. Cargar Historial
  useEffect(() => {
    if (pacienteSeleccionado) {
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      fetch(`http://localhost:3000/api/historial/${idPaciente}`)
        .then(res => res.json())
        .then(data => setHistorialPaciente(Array.isArray(data) ? data : []))
        .catch(() => setHistorialPaciente([]));
    }
  }, [pacienteSeleccionado]);

  // 3. Cargar Muro
  useEffect(() => {
    if (vistaActiva === 'muro') {
      fetch('http://localhost:3000/api/noticias')
        .then(res => res.json())
        .then(data => setPublicacionesAnteriores(Array.isArray(data) ? data : []))
        .catch(() => setPublicacionesAnteriores([]));
    }
  }, [vistaActiva]);

  // 4. Cargar Perfil Médico
  useEffect(() => {
    if (vistaActiva === 'perfil') {
      fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`)
        .then(res => res.json())
        .then(data => setPublicacionesPerfil(Array.isArray(data) ? data : []))
        .catch(() => setPublicacionesPerfil([]));
    }
  }, [vistaActiva, idMedico]);

  // ==========================================
  // 🔥 BLINDAJE: SUBIDA AL MURO DE NOVEDADES
  // ==========================================
  const manejarSubidaMuro = async (e) => {
    e.preventDefault();
    if (!textoNoticia.trim() && !tituloNoticia.trim() && !archivoNoticia) {
      setErrorPublicacion('Debes escribir un contenido o seleccionar un archivo.');
      return; 
    }
    setErrorPublicacion('');
    
    try {
      const formData = new FormData();
      // Aseguramos que siempre lleve strings válidos
      formData.append('titulo', tituloNoticia || 'Consejo Visual');
      formData.append('contenido', textoNoticia || '');
      formData.append('id_autor', idMedico.toString()); // Forzamos conversión a string para el envío

      if (archivoNoticia) {
        formData.append('archivo', archivoNoticia);
      }

      const response = await fetch('http://localhost:3000/api/noticias', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(errorDetails.error || 'Falla en BD');
      }
      
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
      setErrorPublicacion('Error al subir: Verifica que MySQL esté corriendo correctamente en WAMP.');
    }
  };

  const eliminarPublicacion = async (id) => {
    if (window.confirm("⚠️ ¿Deseas eliminar este consejo del muro?")) {
      const res = await fetch(`http://localhost:3000/api/noticias/${id}`, { method: 'DELETE' });
      if (res.ok) setPublicacionesAnteriores(publicacionesAnteriores.filter(pub => (pub.id_noticia || pub.id) !== id));
    }
  };

  // ==========================================
  // OTRAS ACCIONES (Historial y Perfil)
  // ==========================================
  const manejarSubidaHistorial = async (e) => {
    e.preventDefault();
    if (!notaClinica.trim()) return;
    try {
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      const res = await fetch(`http://localhost:3000/api/historial/${idPaciente}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado: notaClinica, tipo: 'Reporte Médico' })
      });
      if (res.ok) {
        const nuevo = await res.json();
        setHistorialPaciente([nuevo, ...historialPaciente]);
        setNotaClinica('');
        setMensajeExitoHistorial(true);
        setTimeout(() => setMensajeExitoHistorial(false), 3000);
      }
    } catch (error) {}
  };

  const eliminarRegistroHistorial = async (idRegistro) => {
    if (window.confirm("¿Eliminar este registro clínico?")) {
      const res = await fetch(`http://localhost:3000/api/historial/${idRegistro}`, { method: 'DELETE' });
      if (res.ok) setHistorialPaciente(historialPaciente.filter(item => item.id !== idRegistro));
    }
  };

  const agregarPublicacionPerfil = async (e) => {
    e.preventDefault();
    if (!nuevaNotaPerfil.trim()) return;
    try {
      const res = await fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: nuevaNotaPerfil })
      });
      if (res.ok) {
        const n = await res.json();
        setPublicacionesPerfil([n, ...publicacionesPerfil]);
        setNuevaNotaPerfil('');
        setMensajeExitoPerfil(true);
        setTimeout(() => setMensajeExitoPerfil(false), 3000);
      }
    } catch (e) {}
  };

  // Diseño
  const colorFondoLateral = '#01579B'; const colorTitulos = '#0277BD'; const colorBotonPrincipal = '#0277BD';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", sans-serif', overflow: 'hidden' }}>
      <div style={{ width: '320px', background: colorFondoLateral, color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 25px', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 10px 10px', fontStyle: 'italic', fontSize: '28px' }}>VisionCare</h2>
        <span style={{ fontSize: '13px', color: '#81D4FA', marginLeft: '12px', fontWeight: 'bold', marginBottom: '40px' }}>PANEL OPTOMETRISTA</span>
        <hr style={{ width: '100%', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '30px', marginTop: '-20px' }} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <button onClick={() => { setVistaActiva('pacientes'); setPacienteSeleccionado(null); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: (vistaActiva === 'pacientes' && !pacienteSeleccionado) ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}><span>👥</span> Mis Pacientes</button>
          <button onClick={() => { setVistaActiva('muro'); setPacienteSeleccionado(null); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: vistaActiva === 'muro' ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}><span>📢</span> Consejos</button>
          <button onClick={() => { setVistaActiva('perfil'); setPacienteSeleccionado(null); }} style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: vistaActiva === 'perfil' ? 'rgba(255,255,255,0.18)' : 'transparent', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '18px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}><span>⚙️</span> Mi Perfil</button>
        </nav>
        <button onClick={cerrarSesion} style={{ padding: '18px 20px', background: 'transparent', color: '#fff', border: 'none', borderTop: '2px solid rgba(255,255,255,0.15)', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}>🚪 Cerrar Sesión</button>
      </div>
      
      <div style={{ flex: 1, backgroundColor: '#F4F7F6', padding: '50px 70px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {pacienteSeleccionado ? (
          <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
            <button onClick={() => setPacienteSeleccionado(null)} style={{ background: colorTitulos, color: '#fff', padding: '10px 20px', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>← Volver</button>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '25px', marginBottom: '30px', border: '1px solid #e0e0e0' }}>
              <h2 style={{ color: colorTitulos, margin: '0 0 15px 0' }}>👤 Datos del Expediente</h2>
              <p><strong>Nombre:</strong> {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidoP}</p>
              <p><strong>Correo:</strong> {pacienteSeleccionado.correo}</p>
            </div>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
              <h3 style={{ color: colorTitulos, margin: '0 0 15px 0' }}>🔬 Historial Clínico Registrado</h3>
              {historialPaciente.map(item => (
                <div key={item.id_test || item.id} style={{ padding: '15px', background: '#F0F8FF', borderRadius: '8px', borderLeft: `4px solid ${colorBotonPrincipal}`, marginBottom: '10px' }}>
                  <p><strong>{item.tipo}:</strong> {item.resultado}</p><small>{item.fecha}</small>
                  <button onClick={() => eliminarRegistroHistorial(item.id_test || item.id)} style={{ float: 'right', background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontWeight: 'bold' }}>Eliminar</button>
                </div>
              ))}
            </div>
            <form onSubmit={manejarSubidaHistorial} style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h3>Añadir Nueva Observación</h3>
              <textarea value={notaClinica} onChange={e => setNotaClinica(e.target.value)} rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none' }} placeholder="Escribe aquí las observaciones..."></textarea>
              <button type="submit" style={{ marginTop: '15px', padding: '12px 25px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Observación</button>
            </form>
          </div>
        ) : vistaActiva === 'pacientes' ? (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h1 style={{ color: colorTitulos, margin: '0 0 25px 0' }}>👥 Pacientes Asignados</h1>
            <input type="text" placeholder="🔍 Buscar paciente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: '100%', maxWidth: '500px', padding: '12px', marginBottom: '30px', borderRadius: '8px', border: '1px solid #ccc' }} />
            {cargando ? <p>Cargando...</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                {listaPacientes.filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase())).map(p => (
                  <div key={p.id_usuario || p.id} onClick={() => setPacienteSeleccionado(p)} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', cursor: 'pointer', border: '1px solid #eee' }}>
                    <h3 style={{ margin: '0 0 5px 0', color: colorTitulos }}>{p.nombre} {p.apellidoP}</h3>
                    <p style={{ color: '#666', margin: '0 0 15px 0' }}>{p.correo}</p>
                    <button style={{ width: '100%', padding: '10px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Abrir Expediente</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : vistaActiva === 'muro' ? (
          <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
            <h1 style={{ color: colorTitulos, marginBottom: '35px' }}>📢 Muro de Novedades</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', marginBottom: '50px' }}>
              <h2 style={{ color: colorTitulos, fontSize: '22px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Mis Publicaciones</h2>
              {publicacionesAnteriores.map(pub => (
                <div key={pub.id_noticia || pub.id} style={{ background: '#fff', padding: '25px', borderRadius: '12px', border: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: colorTitulos }}>{pub.titulo}</h3>
                    <button onClick={() => eliminarPublicacion(pub.id_noticia || pub.id)} style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Eliminar</button>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{pub.contenido}</p>
                  {pub.url_multimedia && <img src={pub.url_multimedia} alt="Adjunto" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', margin: '10px 0' }} />}
                  <small style={{ color: '#999' }}>📅 {new Date(pub.fecha_publicacion || pub.fecha).toLocaleDateString()}</small>
                </div>
              ))}
            </div>

            <h2 style={{ color: colorTitulos, fontSize: '22px' }}>Crear Nueva Publicación</h2>
            <form onSubmit={manejarSubidaMuro} style={{ background: '#fff', padding: '35px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginTop: '15px' }}>
              <input type="text" value={tituloNoticia} onChange={e => setTituloNoticia(e.target.value)} placeholder="Escribe el encabezado..." style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
              <textarea value={textoNoticia} onChange={e => setTextoNoticia(e.target.value)} placeholder="Redacta los consejos..." rows="5" style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', resize: 'none' }}></textarea>
              <div style={{ marginBottom: '20px', padding: '15px', background: '#F8FAFC', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                <input id="input-archivo-muro" type="file" onChange={e => setArchivoNoticia(e.target.files[0])} style={{ fontSize: '14px' }} />
              </div>
              {errorPublicacion && <div style={{ marginBottom: '15px', padding: '12px', color: '#D32F2F', background: '#FFEBEE', borderRadius: '6px', fontWeight: 'bold' }}>⚠️ {errorPublicacion}</div>}
              <button type="submit" style={{ width: '100%', padding: '14px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>¡Subir Publicación!</button>
              {mensajeExito && <p style={{ color: 'green', marginTop: '15px', fontWeight: 'bold', textAlign: 'center' }}>✅ ¡Sincronizado con éxito!</p>}
            </form>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
            <h1 style={{ color: colorTitulos }}>⚙️ Mi Perfil Profesional</h1>
            <form onSubmit={agregarPublicacionPerfil} style={{ background: '#fff', padding: '30px', borderRadius: '12px', marginTop: '20px' }}>
              <textarea value={nuevaNotaPerfil} onChange={e => setNuevaNotaPerfil(e.target.value)} placeholder="Añadir trayectoria..." rows="4" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', resize: 'none' }}></textarea>
              <button type="submit" style={{ marginTop: '15px', padding: '12px 25px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar Información</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelMedico;