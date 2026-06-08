import React, { useState } from 'react';

function PanelAdmin({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('inicio');

  const menu = [
    { id: 'inicio', icono: '📊', texto: 'Dashboard General' },
    { id: 'usuarios', icono: '👥', texto: 'Gestión de Usuarios' },
    { id: 'reportes', icono: '📁', texto: 'Reportes e Historial' },
    { id: 'noticias', icono: '📰', texto: 'Ver Muro de Noticias' }
  ];

  const renderizarContenido = () => {
    if (vistaActiva === 'inicio') {
      return (
        <div>
          <h1 style={{ color: '#3b0764' }}>📊 Dashboard General</h1>
          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b0764', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h3>Total Usuarios</h3><h2 style={{ fontSize: '36px', margin: 0 }}>124</h2>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e0aaff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h3>Optometristas</h3><h2 style={{ fontSize: '36px', margin: 0 }}>5</h2>
            </div>
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #2ed573', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h3>Reportes Generados</h3><h2 style={{ fontSize: '36px', margin: 0 }}>89</h2>
            </div>
          </div>
        </div>
      );
    }

    if (vistaActiva === 'usuarios') {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: '#3b0764' }}>👥 Gestión de Usuarios</h1>
            <button style={{ padding: '10px 20px', background: '#3b0764', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar Nuevo Usuario</button>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>1</td><td>Ale Benitez</td><td>admin@visioncare.com</td><td>Admin</td>
                  <td>
                    <button style={{ marginRight: '10px', background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                    <button style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>2</td><td>Gabriel Hurtado</td><td>doc@visioncare.com</td><td>Optometrista</td>
                  <td>
                    <button style={{ marginRight: '10px', background: '#f1c40f', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                    <button style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (vistaActiva === 'reportes') {
      return (
        <div>
          <h1 style={{ color: '#3b0764' }}>📁 Historial y Reportes Globales</h1>
          <p style={{ color: '#666' }}>Registro de toda la actividad de evaluaciones visuales del sistema.</p>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <p>Reporte_CVSQ_Paciente_12.pdf - <em>Generado hoy</em></p>
            <p>Reporte_PruebaVisual_Paciente_08.pdf - <em>Generado ayer</em></p>
          </div>
        </div>
      );
    }

    return <h1 style={{ color: '#3b0764' }}>Módulo en construcción...</h1>;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '280px', background: '#1e1b4b', color: '#fff', display: 'flex', flexDirection: 'column', padding: '30px 20px', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 40px 10px', color: '#e0aaff' }}>AdminCare</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menu.map((item) => (
            <button key={item.id} onClick={() => setVistaActiva(item.id)}
              style={{ display: 'flex', gap: '15px', padding: '14px 20px', background: vistaActiva === item.id ? '#e0aaff' : 'transparent', color: vistaActiva === item.id ? '#1e1b4b' : '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold', textAlign: 'left' }}>
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

export default PanelAdmin;