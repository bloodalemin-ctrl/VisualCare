import React, { useState } from 'react';
import { registrarUsuario, iniciarSesion } from '../services/authService';

function Login({ alLogearse }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellidoP, setApellidoP] = useState('');
  const [apellidoM, setApellidoM] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState(''); // <-- NUEVO ESTADO
  const [verPassword, setVerPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', esError: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', esError: false });

    // Validación de contraseñas idénticas en el registro
    if (esRegistro && password !== confirmarPassword) {
      setMensaje({ texto: '❌ Las contraseñas no coinciden.', esError: true });
      return;
    }

    try {
      if (esRegistro) {
        await registrarUsuario(nombre, apellidoP, apellidoM, correo, password);
        setMensaje({ texto: '¡Registro exitoso! Inicia sesión para continuar.', esError: false });
        setTimeout(() => {
          setEsRegistro(false);
          setConfirmarPassword('');
          setMensaje({ texto: '', esError: false });
        }, 2000);
      } else {
        const data = await iniciarSesion(correo, password);
        alLogearse(data.usuario); // da acceso al panel correspondiente
      }
    } catch (err) {
      setMensaje({ texto: err.message, esError: true });
    }
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#031249',
      backgroundImage: 'radial-gradient(circle at 80% 20%, #082175 0%, #031249 100%)',
      fontFamily: '"Segoe UI", Roboto, sans-serif', margin: 0, overflow: 'hidden'
    }}>
      
      {/* Lado Izquierdo - Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: '10%', color: '#ffffff' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', fontStyle: 'italic', margin: '0 0 40px 0', letterSpacing: '1px' }}>
          VisionCare
        </h1>
        <div style={{ position: 'relative', width: '240px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px', alignSelf: 'center' }}>
          <div style={{ width: '180px', height: '100px', border: '4px solid #64ffda', borderRadius: '100% 0', transform: 'rotate(-45deg)', position: 'absolute' }}></div>
          <div style={{ width: '50px', height: '50px', border: '4px solid #64ffda', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#64ffda', borderRadius: '50%' }}></div>
          </div>
        </div>
        <p style={{ fontSize: '18px', lineHeight: '1.6', maxWidth: '400px', color: '#cbd5e1', textAlign: 'center', alignSelf: 'center' }}>
          Sistema de apoyo de evaluación preventiva visual y detección de Fátiga Informática.
        </p>
      </div>

      {/* Lado Derecho - Formulario */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '5%', overflowY: 'auto', height: '100vh' }}>
        <div style={{ background: '#ffffff', padding: '30px 35px', borderRadius: '4px', width: '360px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', color: '#333333', margin: 'auto' }}>
          
          <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#031249' }}>
            {esRegistro ? 'Registrarse' : 'Bienvenido de nuevo'}
          </h2>
          <p style={{ fontSize: '13px', color: '#666666', margin: '0 0 20px 0' }}>
            👤 {esRegistro ? 'Completa tus datos para continuar' : 'Inicia sesión para continuar'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {esRegistro && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Nombre(s)</label>
                  <input type="text" placeholder="Tu(s) nombre(s)" required value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Apellido Paterno</label>
                    <input type="text" placeholder="Paterno" required value={apellidoP} onChange={(e) => setApellidoP(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Apellido Materno</label>
                    <input type="text" placeholder="Materno" required value={apellidoM} onChange={(e) => setApellidoM(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Usuario (Correo)</label>
              <input type="email" placeholder="correo@ejemplo.com" required value={correo} onChange={(e) => setCorreo(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input type={verPassword ? 'text' : 'password'} placeholder="••••••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none', width: '100%' }} />
                <span onClick={() => setVerPassword(!verPassword)} style={{ position: 'absolute', right: '15px', cursor: 'pointer', fontSize: '16px', userSelect: 'none' }}>👁️</span>
              </div>
            </div>

            {/* CUADRO NUEVO: Confirmar Contraseña (Solo se ve en registro) */}
            {esRegistro && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#031249' }}>Confirmar Contraseña</label>
                <input type={verPassword ? 'text' : 'password'} placeholder="••••••••••••" required value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: '1px solid #b2bec3', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              </div>
            )}

            <button type="submit" style={{ 
              padding: '12px', background: '#ffffff', color: '#333333', border: '2px solid #333333', borderRadius: '20px', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', marginTop: '10px', transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.target.style.background = '#031249'; e.target.style.color = '#fff'; }}
            onMouseOut={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#333'; }}
            >
              {esRegistro ? 'Registrarme' : 'Iniciar Sesión'}
            </button>
          </form>

          {mensaje.texto && (
            <p style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: mensaje.esError ? '#ff4d4d' : '#2ed573' }}>
              {mensaje.texto}
            </p>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            {esRegistro ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
            <span 
              onClick={() => { setEsRegistro(!esRegistro); setMensaje({ texto: '', esError: false }); }} 
              style={{ color: '#2ed573', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {esRegistro ? 'Inicia sesión aquí' : 'Regístrate aquí'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;