import React, { useState, useEffect } from 'react';

function PanelMedico({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('pacientes');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [listaPacientes, setListaPacientes] = useState([]); // <-- ESTADO PARA LOS PACIENTES REALES
  const [cargando, setCargando] = useState(true);

  // Llamada a la API al cargar el componente
  useEffect(() => {
    fetch('http://localhost:3000/api/pacientes')
      .then(response => response.json())
      .then(data => {
        setListaPacientes(data);
        setCargando(false);
      })
      .catch(error => {
        console.error('Error al traer pacientes:', error);
        setCargando(false);
      });
  }, [vistaActiva]); // Se refresca si cambia de vista

  const menu = [
    { id: 'pacientes', icono: '👥', texto: 'Mis Pacientes' },
    { id: 'muro', icono: '📢', texto: 'Muro de Novedades' },
    { id: 'perfil', icono: '⚙️', texto: 'Mi Perfil Médico' }
  ];

  const renderizarContenido = () => {
    if (pacienteSeleccionado) {
      return (
        <div>
          <button onClick={() => setPacienteSeleccionado(null)} style={{ background: '#031249', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>
            ← Volver a la Lista
          </button>
          <h1 style={{ color: '#031249', marginBottom: '20px', fontSize: '28px' }}>📂 Historial Clínico</h1>
          
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Expediente Digital</h3>
            <p style={{ fontSize: '15px' }}><strong>Paciente:</strong> {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidoP} {pacienteSeleccionado.apellidoM}</p>
            <p style={{ fontSize: '15px' }}><strong>Correo:</strong> {pacienteSeleccionado.correo}</p>
            <hr style={{ border: '0.5px solid #eee', margin: '20px 0' }} />
        </div>
        </div>
      );
    }

    if (vistaActiva === 'pacientes') {
      return (
        <div>
          <h1 style={{ color: '#031249', marginBottom: '10px', fontSize: '28px' }}>👥 Pacientes Asignados</h1>
          <p style={{ color: '#666', marginBottom: '25px' }}>Lista de usuarios registrados en el sistema bajo el rol de paciente.</p>
          
          {cargando ? (
            <p>Buscando pacientes en la base de datos...</p>
          ) : listaPacientes.length === 0 ? (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', textAlign: 'center', color: '#999' }}>
              No hay usuarios registrados con el rol de "usuario" en este momento.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {listaPacientes.map((paciente) => (
                <div key={paciente.id_usuario} style={{ background: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderTop: '4px solid #64ffda' }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#031249' }}>{paciente.nombre} {paciente.apellidoP}</h3>
                  <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>{paciente.correo}</p>
                  <button 
                    onClick={() => setPacienteSeleccionado(paciente)} 
                    style={{ width: '100%', padding: '10px', background: '#f1f5f9', color: '#031249', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Revisar Historial
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (vistaActiva === 'muro') {
      return (
        <div style={{ maxWidth: '800px' }}>
          <h1 style={{ color: '#031249', marginBottom: '10px', fontSize: '28px' }}>📢 Publicar Comunicado Sanitario</h1>
          <p style={{ color: '#666', marginBottom: '25px' }}>Escribe recomendaciones preventivas de higiene ocular que aparecerán en el Inicio de tus pacientes.</p>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <input type="text" placeholder="Título del consejo..." style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', outline: 'none' }} />
            <textarea placeholder="Redacta las indicaciones clínicas..." rows="5" style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', outline: 'none', resize: 'none' }}></textarea>
            <button style={{ padding: '12px 24px', background: '#031249', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Lanzar Publicación</button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h1 style={{ color: '#031249' }}>⚙️ Mi Perfil Médico</h1>
        <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p><strong>Médico Especialista:</strong> {usuario.nombre} {usuario.apellidoP}</p>
          <p><strong>Cédula Profesional:</strong> {usuario.cedula || 'Verificando...'}</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      <div style={{ width: '280px', background: '#031249', color: '#fff', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxSizing: 'border-box', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 40px 10px', fontStyle: 'italic', fontSize: '24px', letterSpacing: '1px' }}>VisionCheck</h2>
        <span style={{ fontSize: '12px', color: '#64ffda', marginTop: '-35px', marginBottom: '40px', marginLeft: '12px' }}>Panel Optometrista</span>
        <hr style={{ width: '100%', border: '0.5px solid rgba(255,255,255,0.1)', marginBottom: '20px', marginTop: '-20px' }} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menu.map((item) => (
            <button key={item.id} onClick={() => { setVistaActiva(item.id); setPacienteSeleccionado(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 20px', background: (vistaActiva === item.id && !pacienteSeleccionado) ? 'rgba(255,255,255,0.15)' : 'transparent', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: (vistaActiva === item.id && !pacienteSeleccionado) ? 'bold' : '500', textAlign: 'left', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '18px' }}>{item.icono}</span> {item.texto}
            </button>
          ))}
        </nav>
        <button onClick={cerrarSesion} style={{ padding: '14px 20px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '18px' }}>👤</span> Cerrar Sesión
        </button>
      </div>
      <div style={{ flex: 1, backgroundColor: '#f4f7f6', padding: '40px 60px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderizarContenido()}
      </div>
    </div>
  );
}

export default PanelMedico;