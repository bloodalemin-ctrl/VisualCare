import React, { useState } from 'react';

function PanelPaciente({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('inicio');

  const menu = [
    { id: 'inicio', icono: '🏠', texto: 'Inicio' },
    { id: 'cvsq', icono: '📊', texto: 'Cuestionario CVS-Q' },
    { id: 'prueba', icono: '👁️', texto: 'Prueba Visual' },
    { id: 'resultados', icono: '📋', texto: 'Resultados' },
    { id: 'historial', icono: '📄', texto: 'Historial' },
    { id: 'configuracion', icono: '⚙️', texto: 'Configuración' }
  ];

  const renderizarContenido = () => {
    if (vistaActiva === 'inicio') {
      return (
        <div>
          <h1 style={{ color: '#031249', marginBottom: '10px' }}>📰 Novedades de la Clínica</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Lee los últimos consejos de tu Optometrista.</p>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', borderLeft: '5px solid #64ffda', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ color: '#333', marginTop: 0 }}>Consejo del día: Regla 20-20-20</h3>
            <p style={{ color: '#666', lineHeight: '1.6' }}>Cada 20 minutos de trabajo frente a la pantalla, mira un objeto a 20 pies (6 metros) de distancia durante al menos 20 segundos para relajar la vista.</p>
            <span style={{ fontSize: '12px', color: '#999', fontWeight: 'bold' }}>Publicado por Dr. Principal</span>
          </div>
        </div>
      );
    }

    if (vistaActiva === 'cvsq') {
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#031249', fontSize: '32px', margin: 0 }}>Cuestionario CVS-Q</h1>
            <div style={{ background: '#a8e6cf', color: '#1b4332', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
              ✔️ PREGUNTA 3 DE 16
            </div>
          </div>
          <div style={{ background: '#fff', padding: '50px', borderRadius: '12px', border: '1px solid #333' }}>
            <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '30px', textAlign: 'center', fontWeight: '500' }}>
              ¿Con qué frecuencia sientes ardor en los ojos?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto' }}>
              {['Nunca', 'Rara Vez', 'A veces', 'Casi Siempre', 'Siempre'].map(opcion => (
                <label key={opcion} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', cursor: 'pointer' }}>
                  <input type="radio" name="cvsq" style={{ transform: 'scale(1.2)' }} /> {opcion}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px' }}>
              <button style={{ padding: '8px 16px', background: '#fff', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓ ANTERIOR</button>
              <button style={{ padding: '8px 16px', background: '#a8e6cf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#1b4332' }}>SIGUIENTE →</button>
            </div>
          </div>
        </div>
      );
    }

    if (vistaActiva === 'configuracion') {
      return (
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ color: '#031249' }}>⚙️ Mi Perfil</h1>
          <div style={{ padding: '30px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '80px', height: '80px', background: '#031249', color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '30px', marginBottom: '20px' }}>
              {usuario.nombre.charAt(0)}
            </div>
            <p><strong>Nombre completo:</strong> {usuario.nombre} {usuario.apellidoP} {usuario.apellidoM}</p>
            <p><strong>Correo electrónico:</strong> {usuario.correo}</p>
            <p><strong>Rol:</strong> Paciente</p>
            <button style={{ marginTop: '20px', padding: '10px 20px', background: '#031249', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Editar Información</button>
          </div>
        </div>
      );
    }

    return <h1 style={{ color: '#031249' }}>Módulo en construcción...</h1>;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '280px', background: '#031249', color: '#fff', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 40px 10px', fontStyle: 'italic' }}>VisionCare</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menu.map((item) => (
            <button key={item.id} onClick={() => setVistaActiva(item.id)}
              style={{ display: 'flex', gap: '15px', padding: '14px 20px', background: vistaActiva === item.id ? '#64ffda' : 'transparent', color: vistaActiva === item.id ? '#031249' : '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', textAlign: 'left' }}>
              <span>{item.icono}</span> {item.texto}
            </button>
          ))}
        </nav>
        <button onClick={cerrarSesion} style={{ padding: '14px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.2)' }}>👤 Cerrar Sesión</button>
      </div>
      <div style={{ flex: 1, backgroundColor: '#f4f7f6', padding: '40px 60px', overflowY: 'auto' }}>
        {renderizarContenido()}
      </div>
    </div>
  );
}

export default PanelPaciente;