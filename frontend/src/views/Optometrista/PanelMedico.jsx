import React, { useState, useEffect } from 'react';

function PanelMedico({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('pacientes');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  
  // ID del médico logueado
  const idMedico = usuario?.id_usuario || usuario?.id;
  
  // Pacientes e Historial
  const [listaPacientes, setListaPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [historialPaciente, setHistorialPaciente] = useState([]);
  
  // Estados para edición de historial
  const [editandoHistorialId, setEditandoHistorialId] = useState(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [notaClinica, setNotaClinica] = useState('');
  const [archivoClinico, setArchivoClinico] = useState(null);
  const [mensajeExitoHistorial, setMensajeExitoHistorial] = useState(false);
  
  // Muro de Novedades
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [textoNoticia, setTextoNoticia] = useState('');
  const [archivoNoticia, setArchivoNoticia] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [errorPublicacion, setErrorPublicacion] = useState('');
  const [publicacionesAnteriores, setPublicacionesAnteriores] = useState([]);

  // Perfil Médico - AHORA ES UN MURO DE PUBLICACIONES
  const [publicacionesPerfil, setPublicacionesPerfil] = useState([]);
  const [nuevaNotaPerfil, setNuevaNotaPerfil] = useState('');
  const [nuevoPdfPerfil, setNuevoPdfPerfil] = useState(null);
  const [mensajeExitoPerfil, setMensajeExitoPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  
  // 1. Cargar Pacientes
  useEffect(() => {
    const cargarPacientes = async () => {
      if (!idMedico) return;
      setCargando(true);
      try {
        const response = await fetch(`http://localhost:3000/api/medico/${idMedico}/pacientes`);
        if (!response.ok) throw new Error('Error al cargar pacientes');
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

  // 2. Cargar Historial del Paciente seleccionado
  useEffect(() => {
    if (pacienteSeleccionado) {
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      fetch(`http://localhost:3000/api/historial/${idPaciente}`)
        .then(response => {
          if (!response.ok) throw new Error('Error al cargar historial');
          return response.json();
        })
        .then(data => {
          setHistorialPaciente(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error('Error al cargar el historial del paciente:', error);
          setHistorialPaciente([]);
        });
    }
  }, [pacienteSeleccionado]);

  // 3. Cargar Muro de Novedades
  useEffect(() => {
    if (vistaActiva === 'muro') {
      fetch('http://localhost:3000/api/noticias')
        .then(response => response.json())
        .then(data => {
          console.log("📢 Noticias recibidas desde Node.js:", data);
          setPublicacionesAnteriores(Array.isArray(data) ? data : []);
        })
        .catch(error => console.error('Error al cargar noticias:', error));
    }
  }, [vistaActiva]);

  // 4. Cargar Publicaciones del Perfil Médico
  useEffect(() => {
    if (vistaActiva === 'perfil' && idMedico) {
      cargarPublicacionesPerfil();
    }
  }, [vistaActiva, idMedico]);

  const cargarPublicacionesPerfil = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`);
      if (!response.ok) throw new Error('Error al cargar publicaciones');
      const data = await response.json();
      setPublicacionesPerfil(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar publicaciones del perfil:', error);
      setPublicacionesPerfil([]);
    }
  };

  // ==========================================
  // FUNCIONES DEL HISTORIAL CLÍNICO
  // ==========================================
  
  const manejarSubidaHistorial = async (e) => {
    e.preventDefault();
    if (!notaClinica.trim() && !archivoClinico) {
      alert('Debes escribir una nota o adjuntar un archivo');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('resultado', notaClinica);
      if (archivoClinico) {
        formData.append('archivo', archivoClinico);
      }
      
      const idPaciente = pacienteSeleccionado.id_usuario || pacienteSeleccionado.id;
      const response = await fetch(`http://localhost:3000/api/historial/${idPaciente}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      const nuevoRegistro = await response.json();
      
      setHistorialPaciente([nuevoRegistro, ...historialPaciente]);
      setNotaClinica('');
      setArchivoClinico(null);
      setMensajeExitoHistorial(true);
      
      if (document.getElementById('input-archivo-historial')) {
        document.getElementById('input-archivo-historial').value = '';
      }
      
      setTimeout(() => setMensajeExitoHistorial(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el registro clínico');
    }
  };

  const eliminarRegistroHistorial = async (idRegistro) => {
    if (window.confirm("⚠️ ¿Estás seguro de eliminar este registro clínico de forma permanente?")) {
      try {
        const response = await fetch(`http://localhost:3000/api/historial/${idRegistro}`, { method: 'DELETE' });
        if (response.ok) {
          setHistorialPaciente(historialPaciente.filter(item => item.id !== idRegistro));
        }
      } catch (error) { 
        console.error("Error al eliminar:", error); 
      }
    }
  };

  const guardarEdicionHistorial = async (idRegistro) => {
    try {
      const response = await fetch(`http://localhost:3000/api/historial/${idRegistro}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado: textoEditado })
      });
      
      if (response.ok) {
        setHistorialPaciente(historialPaciente.map(item => 
          item.id === idRegistro ? { ...item, resultado: textoEditado } : item
        ));
        setEditandoHistorialId(null);
      }
    } catch (error) {
      console.error('Error al editar:', error);
    }
  };

  // ==========================================
  // FUNCIONES DEL MURO DE NOVEDADES
  // ==========================================

  const manejarSubidaMuro = async (e) => {
    e.preventDefault();
    if (!tituloNoticia.trim() && !textoNoticia.trim() && !archivoNoticia) {
      setErrorPublicacion('Debes escribir un texto o adjuntar un archivo para poder publicar.');
      setTimeout(() => setErrorPublicacion(''), 3000);
      return; 
    }
    setErrorPublicacion('');
    
    try {
      const formData = new FormData();
      formData.append('titulo', tituloNoticia);
      formData.append('texto', textoNoticia);
      if (archivoNoticia) {
        formData.append('archivo', archivoNoticia);
      }

      const response = await fetch('http://localhost:3000/api/noticias', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Error en el servidor');
      const nuevaPub = await response.json();
      
      setPublicacionesAnteriores([nuevaPub, ...publicacionesAnteriores]);
      setMensajeExito(true);
      setTituloNoticia('');
      setTextoNoticia('');
      setArchivoNoticia(null);
      if(document.getElementById('input-archivo-muro')){
        document.getElementById('input-archivo-muro').value = '';
      }
      
      setTimeout(() => setMensajeExito(false), 3000);
    } catch (error) {
      console.error(error);
      setErrorPublicacion('Error de conexión al subir la publicación.');
    }
  };

  const eliminarPublicacion = async (id) => {
    const confirmacion = window.confirm("⚠️ ¿Estás seguro de que deseas eliminar esta publicación?\n\nLos pacientes ya no podrán verla y esta acción no se puede deshacer.");
    if (confirmacion) {
      try {
        const response = await fetch(`http://localhost:3000/api/noticias/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setPublicacionesAnteriores(publicacionesAnteriores.filter(pub => pub.id !== id));
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  // ==========================================
  // FUNCIONES DEL PERFIL MÉDICO (MURO DE PUBLICACIONES)
  // ==========================================

  const agregarPublicacionPerfil = async (e) => {
    e.preventDefault();
    
    if (!nuevaNotaPerfil.trim() && !nuevoPdfPerfil) {
      setErrorPerfil('Debes escribir una nota o adjuntar un PDF');
      setTimeout(() => setErrorPerfil(''), 3000);
      return;
    }
    
    setErrorPerfil('');
    
    try {
      const formData = new FormData();
      formData.append('texto', nuevaNotaPerfil);
      if (nuevoPdfPerfil) {
        formData.append('pdf', nuevoPdfPerfil);
      }
      formData.append('fecha', new Date().toISOString().split('T')[0]);
      
      const response = await fetch(`http://localhost:3000/api/perfil-medico/${idMedico}/publicaciones`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      const nuevaPublicacion = await response.json();
      setPublicacionesPerfil([nuevaPublicacion, ...publicacionesPerfil]);
      setNuevaNotaPerfil('');
      setNuevoPdfPerfil(null);
      setMensajeExitoPerfil(true);
      
      if (document.getElementById('input-pdf-perfil')) {
        document.getElementById('input-pdf-perfil').value = '';
      }
      
      setTimeout(() => setMensajeExitoPerfil(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      setErrorPerfil('Error al guardar la publicación');
    }
  };

  const eliminarPublicacionPerfil = async (idPublicacion) => {
    if (window.confirm("⚠️ ¿Estás seguro de eliminar esta publicación de tu perfil?")) {
      try {
        const response = await fetch(`http://localhost:3000/api/perfil-medico/publicaciones/${idPublicacion}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setPublicacionesPerfil(publicacionesPerfil.filter(pub => pub.id !== idPublicacion));
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  // ==========================================
  // RENDERIZADO VISUAL
  // ==========================================
  
  const pacientesFiltrados = listaPacientes.filter(paciente => {
    const nombreCompleto = `${paciente.nombre} ${paciente.apellidoP} ${paciente.apellidoM || ''}`.toLowerCase();
    return nombreCompleto.includes(busqueda.toLowerCase());
  });

  const menu = [
    { id: 'pacientes', icono: '👥', texto: 'Mis Pacientes' },
    { id: 'muro', icono: '📢', texto: 'Consejos' },
    { id: 'perfil', icono: '⚙️', texto: 'Mi Perfil Médico' }
  ];

  const colorFondoLateral = '#01579B'; 
  const colorTitulos = '#0277BD'; 
  const colorBotonPrincipal = '#0277BD'; 
  const colorTextoGeneral = '#333333';

  const renderizarContenido = () => {
    // Vista de Historial del Paciente
    if (pacienteSeleccionado) {
      // Separar pruebas y cuestionarios
      const pruebasRealizadas = historialPaciente.filter(item => 
        item.tipo === 'Prueba Visual' || item.tipo === 'Reporte Médico' || item.tipo?.includes('Prueba')
      );
      const cuestionariosRealizados = historialPaciente.filter(item => 
        item.tipo === 'Cuestionario' || item.tipo?.includes('Cuestionario')
      );

      return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Botón volver */}
          <button onClick={() => setPacienteSeleccionado(null)} style={{ 
            background: colorTitulos, 
            color: '#fff', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            border: 'none', 
            cursor: 'pointer', 
            marginBottom: '25px', 
            fontWeight: 'bold', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            ← Volver a la Lista
          </button>
          
          {/* SECCIÓN 1: DATOS DEL PACIENTE */}
          <div style={{ 
            background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)', 
            padding: '30px', 
            borderRadius: '16px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
            marginBottom: '30px',
            border: '1px solid #e0e0e0'
          }}>
            <h2 style={{ 
              color: colorTitulos, 
              marginBottom: '20px', 
              fontSize: '28px',
              borderLeft: `4px solid ${colorBotonPrincipal}`,
              paddingLeft: '15px'
            }}>
              👤 Datos del Paciente
            </h2>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              gap: '20px',
              alignItems: 'flex-start'
            }}>
              {/* Nombre */}
              <div style={{ 
                flex: '1 1 250px',
                minWidth: '200px',
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '10px' 
              }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Nombre completo</p>
                <p style={{ margin: '5px 0 0 0', color: colorTextoGeneral, fontSize: '18px', fontWeight: '500', wordBreak: 'break-word' }}>
                  {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidoP} {pacienteSeleccionado.apellidoM || ''}
                </p>
              </div>
              
              {/* Correo */}
              <div style={{ 
                flex: '2 1 300px',
                minWidth: '250px',
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '10px' 
              }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Correo electrónico</p>
                <p style={{ margin: '5px 0 0 0', color: colorTextoGeneral, fontSize: '18px', fontWeight: '500', wordBreak: 'break-all' }}>
                  {pacienteSeleccionado.correo || 'No registrado'}
                </p>
              </div>
              
              {/* Edad */}
              <div style={{ 
                flex: '0 0 auto',
                background: '#f5f5f5', 
                padding: '15px', 
                borderRadius: '10px',
                minWidth: '100px',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Edad</p>
                <p style={{ margin: '5px 0 0 0', color: colorTextoGeneral, fontSize: '20px', fontWeight: '500', wordBreak: 'break-all' }}>
                  {pacienteSeleccionado.edad || 'No ingresada'}
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PRUEBAS REALIZADAS */}
          <div style={{ 
            marginBottom: '30px',
            background: '#E3F2FD',
            borderRadius: '16px',
            padding: '5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              background: colorTitulos,
              padding: '15px 25px',
              borderRadius: '12px 12px 0 0',
              color: '#fff'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🔬 Pruebas Realizadas
                <span style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '14px',
                  fontWeight: 'normal'
                }}>
                  {pruebasRealizadas.length}
                </span>
              </h2>
            </div>
            
            <div style={{ padding: '25px', background: '#F0F8FF', borderRadius: '0 0 12px 12px' }}>
              {pruebasRealizadas.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px dashed hsla(206, 35%, 48%, 0.81)'
                }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>🔬</span>
                  <p style={{ fontSize: '18px', margin: 0 }}>No se han realizado pruebas aún.</p>
                  <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>Las pruebas aparecerán aquí una vez que el paciente las realice.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {pruebasRealizadas.map((item) => (
                    <div key={item.id} style={{ 
                      background: '#fff', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      borderLeft: `4px solid ${colorBotonPrincipal}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: colorTitulos, fontSize: '18px' }}>
                          {item.resultado ? (item.resultado.substring(0, 100) + (item.resultado.length > 100 ? '...' : '')) : 'Prueba Visual'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#666', background: '#F5F5F5', padding: '4px 10px', borderRadius: '15px' }}>
                            📅 {item.fecha}
                          </span>
                        </div>
                      </div>
                      
                      {item.resultado && (
                        <p style={{ color: '#555', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
                          {item.resultado}
                        </p>
                      )}
                      
                      {item.url_archivo && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                          {item.tipo_archivo === 'pdf' ? (
                            <iframe src={item.url_archivo} title="PDF" style={{ width: '100%', height: '300px', border: '1px solid #ccc', borderRadius: '8px' }} />
                          ) : (
                            <img src={item.url_archivo} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: CUESTIONARIOS REALIZADOS */}
          <div style={{ 
            marginBottom: '30px',
            background: '#E3F2FD',
            borderRadius: '16px',
            padding: '5px',
            boxShadow: '0 2px 8px rgba(63, 162, 187, 0.63)'
          }}>
            <div style={{
              background: colorTitulos,
              padding: '15px 25px',
              borderRadius: '12px 12px 0 0',
              color: '#fff'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📋 Cuestionarios Realizados
                <span style={{ 
                  background: 'rgba(153, 188, 202, 0.51)', 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '14px',
                  fontWeight: 'normal'
                }}>
                  {cuestionariosRealizados.length}
                </span>
              </h2>
            </div>
            
            <div style={{ padding: '25px', background: '#F0F8FF', borderRadius: '0 0 12px 12px' }}>
              {cuestionariosRealizados.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666',
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px dashed hsla(206, 35%, 48%, 0.81)'
                }}>
                  <span style={{ fontSize: '48px', display: 'block', marginBottom: '10px' }}>📋</span>
                  <p style={{ fontSize: '18px', margin: 0 }}>No se han realizado cuestionarios aún.</p>
                  <p style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>Los cuestionarios aparecerán aquí una vez que el paciente los responda.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {cuestionariosRealizados.map((item) => (
                    <div key={item.id} style={{ 
                      background: '#fff', 
                      padding: '20px', 
                      borderRadius: '12px', 
                      borderLeft: `4px solid #4CAF50`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#2E7D32', fontSize: '18px' }}>
                          {item.resultado ? (item.resultado.substring(0, 100) + (item.resultado.length > 100 ? '...' : '')) : 'Cuestionario'}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#666', background: '#F5F5F5', padding: '4px 10px', borderRadius: '15px' }}>
                            📅 {item.fecha}
                          </span>
                        </div>
                      </div>
                      
                      {item.resultado && (
                        <p style={{ color: '#555', fontSize: '14px', marginBottom: '15px', lineHeight: '1.5' }}>
                          {item.resultado}
                        </p>
                      )}
                      
                      {item.url_archivo && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                          {item.tipo_archivo === 'pdf' ? (
                            <iframe src={item.url_archivo} title="PDF" style={{ width: '100%', height: '300px', border: '1px solid #ccc', borderRadius: '8px' }} />
                          ) : (
                            <img src={item.url_archivo} alt="Evidencia" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Vista de Pacientes
    if (vistaActiva === 'pacientes') {
      return (
        <div>
          <h1 style={{ color: colorTitulos, marginBottom: '15px', fontSize: '34px' }}>👥 Pacientes Asignados</h1>
          <p style={{ color: '#555', marginBottom: '25px', fontSize: '20px' }}>Lista de usuarios registrados en el sistema bajo el rol de paciente.</p>
          
          <div style={{ marginBottom: '35px' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar paciente por nombre o apellido..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: '100%', maxWidth: '600px', padding: '15px 20px', border: '3px solid #5090adf1', borderRadius: '10px', fontSize: '18px', outline: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
            />
          </div>
          
          {cargando ? (
            <p style={{ fontSize: '20px', color: '#666' }}>Buscando pacientes en la base de datos...</p>
          ) : pacientesFiltrados.length === 0 ? (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#777', fontSize: '20px', border: '1px solid #eee' }}>
              No se encontraron pacientes registrados con ese nombre.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
              {pacientesFiltrados.map((paciente) => (
                <div key={paciente.id_usuario || paciente.id} onClick={() => setPacienteSeleccionado(paciente)} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ width: '50px', height: '50px', background: colorFondoLateral, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                      {paciente.nombre?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: colorTitulos, fontSize: '20px' }}>{paciente.nombre} {paciente.apellidoP}</h3>
                      <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>{paciente.correo}</p>
                    </div>
                  </div>
                  <button style={{ width: '100%', padding: '10px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                    Ver Historial
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Vista del Muro de Novedades
    if (vistaActiva === 'muro') {
      return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ color: colorTitulos, marginBottom: '15px', fontSize: '34px' }}>📢 Muro de Novedades</h1>
          <p style={{ color: '#555', marginBottom: '35px', fontSize: '20px' }}>Publica recomendaciones preventivas o material multimedia para tus pacientes.</p>
          
          <div style={{ marginBottom: '50px' }}>
            <h2 style={{ color: colorTitulos, fontSize: '26px', borderBottom: '4px solid #5090adf1', paddingBottom: '12px', marginBottom: '20px' }}>
              Mis Publicaciones Anteriores
            </h2>
            {publicacionesAnteriores.length === 0 ? (
              <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '18px', border: '1px dashed #ccc' }}>
                Aún no has publicado nada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {publicacionesAnteriores.map((pub) => {
                  const idPublicacion = pub.id_noticia || pub.id;
                  return (
                    <div key={idPublicacion} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: colorTitulos, fontSize: '24px', flex: 1 }}>
                          {pub.titulo}
                        </h3>
                        <button onClick={() => eliminarPublicacion(idPublicacion)} style={{ flexShrink: 0, background: '#FFEBEE', color: '#D32F2F', border: '1px solid #FFCDD2', borderRadius: '6px', padding: '8px 15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                          🗑️ Eliminar
                        </button>
                      </div>
                      {pub.texto && <p style={{ color: '#110f0f', fontSize: '18px', marginBottom: '15px', whiteSpace: 'pre-wrap' }}>{pub.texto}</p>}
                      <span style={{ fontSize: '14px', color: '#817f7f', background: '#F5F5F5', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', display: 'inline-block' }}>
                        📅 Publicado el: {pub.fecha}
                      </span>
                      {pub.url_archivo && (
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                          {pub.tipo_archivo === 'pdf' ? (
                            <iframe src={pub.url_archivo} title="Vista Previa PDF Muro" style={{ width: '100%', height: '350px', border: '2px solid #ccc', borderRadius: '8px' }} />
                          ) : (
                            <img src={pub.url_archivo} alt="Adjunto del muro" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #ddd', display: 'block', margin: '0 auto' }} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <h2 style={{ color: colorTitulos, fontSize: '26px', marginBottom: '20px' }}>Crear Nueva Publicación</h2>
          <form onSubmit={manejarSubidaMuro} style={{ background: '#fff', padding: '35px', borderRadius: '12px', boxShadow: '0 6px 15px rgba(0,0,0,0.08)' }}>
            <input 
              type="text" 
              value={tituloNoticia}
              onChange={(e) => setTituloNoticia(e.target.value)}
              placeholder="Título de la publicación (Opcional)..." 
              style={{ width: '100%', padding: '16px', marginBottom: '20px', border: '2px solid #eee', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', fontSize: '18px' }} 
            />
            <textarea 
              value={textoNoticia}
              onChange={(e) => setTextoNoticia(e.target.value)}
              placeholder="Redacta las indicaciones clínicas o detalles aquí (Opcional)..." 
              rows="6" 
              style={{ width: '100%', padding: '16px', marginBottom: '20px', border: '2px solid #eee', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', resize: 'none', fontSize: '18px' }}
            ></textarea>
            
            <div style={{ marginBottom: '25px', border: `2px dashed ${colorBotonPrincipal}`, background: '#F1FDFB', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold', color: colorTitulos, fontSize: '18px' }}>
                📎 Adjuntar Archivo (Video, Foto o PDF)
              </label>
              <input 
                id="input-archivo-muro"
                type="file" 
                onChange={(e) => setArchivoNoticia(e.target.files[0])}
                style={{ width: '100%', fontSize: '16px' }}
              />
            </div>

            {errorPublicacion && (
              <div style={{ marginBottom: '15px', padding: '12px', color: '#D32F2F', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', fontWeight: 'bold' }}>
                ⚠️ {errorPublicacion}
              </div>
            )}

            <button type="submit" style={{ width: '100%', padding: '18px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(41, 182, 246, 0.4)' }}>
              ¡Subir Publicación!
            </button>
            
            {mensajeExito && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#E8F5E9', color: '#2E7D32', border: '2px solid #C8E6C9', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                ✅ ¡Se ha subido correctamente!
              </div>
            )}
          </form>
        </div>
      );
    }

    // Vista del Perfil Médico
    if (vistaActiva === 'perfil') {
      return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {/* Cabecera del perfil */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: '120px', height: '120px', background: colorFondoLateral, color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '50px', fontWeight: 'bold', margin: '0 auto 25px auto', border: `4px solid ${colorBotonPrincipal}` }}>
              {usuario.nombre ? usuario.nombre.charAt(0) : 'M'}
            </div>
            <h1 style={{ color: colorTitulos, margin: '0 0 10px 0', fontSize: '38px' }}>Optometrista {usuario.nombre} {usuario.apellidoP} {usuario.apellidoM}</h1>
            <p style={{ background: colorTitulos, color: '#fff', display: 'inline-block', padding: '8px 20px', borderRadius: '25px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1.5px' }}>
              ESPECIALISTA EN SALUD VISUAL
            </p>
          </div>
          
          {/* Formulario para nueva publicación */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ color: colorTitulos, fontSize: '26px', marginBottom: '20px' }}>📝 Agregar nueva publicación</h2>
            <form onSubmit={agregarPublicacionPerfil} style={{ background: '#fff', padding: '35px', borderRadius: '12px', boxShadow: '0 6px 15px rgba(0,0,0,0.08)' }}>
              <textarea 
                value={nuevaNotaPerfil}
                onChange={(e) => setNuevaNotaPerfil(e.target.value)}
                placeholder="Escribe aquí tu experiencia, logros, certificaciones o información profesional..." 
                rows="6" 
                style={{ width: '100%', padding: '16px', marginBottom: '20px', border: '2px solid #eee', borderRadius: '8px', boxSizing: 'border-box', outline: 'none', resize: 'none', fontSize: '18px' }}
              />
      
              <div style={{ marginBottom: '25px', border: `2px dashed ${colorBotonPrincipal}`, background: '#F1FDFB', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontWeight: 'bold', color: colorTitulos, fontSize: '18px' }}>
                  📎 Adjuntar PDF (Certificado, Diploma, etc.)
                </label>
                <input 
                  id="input-pdf-perfil"
                  type="file" 
                  accept="application/pdf"
                  onChange={(e) => setNuevoPdfPerfil(e.target.files[0])}
                  style={{ width: '100%', fontSize: '16px' }}
                />
              </div>

              {errorPerfil && (
                <div style={{ marginBottom: '15px', padding: '12px', color: '#D32F2F', background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '8px', fontWeight: 'bold' }}>
                  ⚠️ {errorPerfil}
                </div>
              )}

              <button type="submit" style={{ width: '100%', padding: '18px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '22px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(41, 182, 246, 0.4)' }}>
                Publicar en mi Perfil
              </button>

              {mensajeExitoPerfil && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#E8F5E9', color: '#2E7D32', border: '2px solid #C8E6C9', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  ✅ Publicación agregada exitosamente
                </div>
              )}
            </form>
          </div>

          {/* Lista de publicaciones del perfil */}
          <div>
            <h2 style={{ color: colorTitulos, fontSize: '26px', marginBottom: '20px', borderBottom: '4px solid #5090adf1', paddingBottom: '10px' }}>
              📋 Mis Publicaciones ({publicacionesPerfil.length})
            </h2>
            
            {publicacionesPerfil.length === 0 ? (
              <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#888', fontSize: '18px', border: '1px dashed #ccc' }}>
                No tienes publicaciones aún. ¡Agrega tu primera publicación arriba!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {publicacionesPerfil.map((pub) => (
                  <div key={pub.id} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                    
                    {/* Cabecera con fecha y botón eliminar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ fontSize: '14px', color: '#666', background: '#F5F5F5', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
                          📅 {pub.fecha}
                        </span>
                      </div>
                      <button 
                        onClick={() => eliminarPublicacionPerfil(pub.id)}
                        style={{ background: '#FFEBEE', color: '#D32F2F', border: '1px solid #FFCDD2', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>

                    {/* Contenido de la publicación */}
                    {pub.texto && (
                      <p style={{ color: '#444', fontSize: '18px', marginBottom: '20px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                        {pub.texto}
                      </p>
                    )}
                    
                    {/* Archivo PDF adjunto */}
                    {pub.url_pdf && (
                      <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px', color: colorTitulos }}>📄 Documento adjunto:</p>
                        <iframe 
                          src={pub.url_pdf} 
                          title="PDF adjunto" 
                          style={{ width: '100%', height: '400px', border: '2px solid #ccc', borderRadius: '8px' }} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      <div style={{ width: '320px', background: colorFondoLateral, color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 25px', boxSizing: 'border-box', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 40px 10px', fontStyle: 'italic', fontSize: '30px', letterSpacing: '1px' }}>VisionCare</h2>
        <span style={{ fontSize: '16px', color: colorBotonPrincipal, marginTop: '-35px', marginBottom: '40px', marginLeft: '12px', fontWeight: 'bold' }}>Panel Optometrista</span>
        <hr style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '30px', marginTop: '-20px' }} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {menu.map((item) => (
            <button key={item.id} onClick={() => { setVistaActiva(item.id); setPacienteSeleccionado(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: (vistaActiva === item.id && !pacienteSeleccionado) ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '20px', fontWeight: (vistaActiva === item.id && !pacienteSeleccionado) ? 'bold' : '500', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '24px' }}>{item.icono}</span> {item.texto}
            </button>
          ))}
        </nav>
        <button onClick={cerrarSesion} style={{ padding: '18px 20px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '20px' }}>
          <span style={{ fontSize: '24px' }}>👤</span> Cerrar Sesión
        </button>
      </div>
      <div style={{ flex: 1, backgroundColor: '#F4F7F6', padding: '50px 70px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderizarContenido()}
      </div>
    </div>
  );
}

export default PanelMedico;