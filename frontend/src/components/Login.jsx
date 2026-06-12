import React, { useState } from 'react';
import { registrarUsuario, iniciarSesion } from '../services/authService';

function Login({ alLogearse }) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellidoP, setApellidoP] = useState('');
  const [apellidoM, setApellidoM] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', esError: false });

  const handleSubmit = async (event) => {  // Cambiado 'e' por 'event' para evitar confusiones
    event.preventDefault();  // Cambiado 'e' por 'event'
    setMensaje({ texto: '', esError: false });

    // Validación de contraseñas idénticas en el registro
    if (esRegistro && password !== confirmarPassword) {
      setMensaje({ texto: '❌ Las contraseñas no coinciden.', esError: true });
      return;
    }

    // Validación de fecha de nacimiento
    if (esRegistro && !fechaNacimiento) {
      setMensaje({ texto: '❌ Por favor ingresa tu fecha de nacimiento.', esError: true });
      return;
    }

    try {
      if (esRegistro) {
        await registrarUsuario(nombre, apellidoP, apellidoM, correo, password, fechaNacimiento);
        setMensaje({ texto: '¡Registro exitoso! Inicia sesión para continuar.', esError: false });
        setTimeout(() => {
          setEsRegistro(false);
          setConfirmarPassword('');
          setNombre('');
          setApellidoP('');
          setApellidoM('');
          setFechaNacimiento('');
          setCorreo('');
          setPassword('');
          setMensaje({ texto: '', esError: false });
        }, 2000);
      } else {
        const data = await iniciarSesion(correo, password);
        alLogearse(data.usuario);
      }
    } catch (err) {
      setMensaje({ texto: err.message, esError: true });
    }
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#031249',
      backgroundImage: 'radial-gradient(circle at 80% 20%, #082175 0%, #031249 100%)',
      fontFamily: '"Segoe UI", Roboto, sans-serif', margin: 0, overflow: 'auto'
    }}>
      
      {/* Lado Izquierdo - Branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', paddingLeft: '10%', color: '#ffffff' }}>
        <h1 style={{ fontSize: '58px', fontWeight: 'bold', fontStyle: 'italic', margin: '0 0 40px 0', letterSpacing: '2px' }}>
          VisionCare
        </h1>
        <div style={{ position: 'relative', width: '280px', height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', alignSelf: 'center' }}>
          <div style={{ width: '200px', height: '120px', border: '4px solid #64ffda', borderRadius: '100% 0', transform: 'rotate(-45deg)', position: 'absolute' }}></div>
          <div style={{ width: '60px', height: '60px', border: '4px solid #64ffda', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ width: '25px', height: '25px', backgroundColor: '#64ffda', borderRadius: '50%' }}></div>
          </div>
        </div>
        <p style={{ fontSize: '20px', lineHeight: '1.6', maxWidth: '450px', color: '#cbd5e1', textAlign: 'center', alignSelf: 'center' }}>
          Sistema de apoyo de evaluación preventiva visual y detección de Fatiga Informática.
        </p>
      </div>

      {/* Lado Derecho - Formulario */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', paddingRight: '5%', overflowY: 'auto', height: '100vh' }}>
        <div style={{ 
          background: '#ffffff', 
          padding: '45px 50px',
          borderRadius: '12px',
          width: esRegistro ? '500px' : '420px',
          maxWidth: '90%',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)', 
          color: '#333333', 
          margin: 'auto' 
        }}>
          
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#031249' }}>
            {esRegistro ? 'Crear Cuenta' : 'Bienvenido de nuevo'}
          </h2>
          <p style={{ fontSize: '15px', color: '#666666', margin: '0 0 30px 0' }}>
            👤 {esRegistro ? 'Completa todos tus datos para registrarte' : 'Inicia sesión para continuar'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {esRegistro && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Nombre(s) completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Carlos" 
                    required 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                    onFocus={(e) => e.target.style.border = '2px solid #031249'}
                    onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Apellido Paterno</label>
                    <input 
                      type="text" 
                      placeholder="García" 
                      required 
                      value={apellidoP} 
                      onChange={(e) => setApellidoP(e.target.value)} 
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.border = '2px solid #031249'}
                      onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Apellido Materno</label>
                    <input 
                      type="text" 
                      placeholder="López" 
                      required 
                      value={apellidoM} 
                      onChange={(e) => setApellidoM(e.target.value)} 
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      onFocus={(e) => e.target.style.border = '2px solid #031249'}
                      onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    />
                  </div>
                </div>

                {/* Campo de Fecha de Nacimiento */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Fecha de Nacimiento</label>
                  <input 
                    type="date" 
                    required 
                    value={fechaNacimiento} 
                    onChange={(e) => setFechaNacimiento(e.target.value)} 
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={(e) => e.target.style.border = '2px solid #031249'}
                    onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <small style={{ fontSize: '12px', color: '#666', marginTop: '-5px' }}>
                    📅 Esta información nos ayuda a personalizar tu experiencia
                  </small>
                </div>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="tucorreo@ejemplo.com" 
                required 
                value={correo} 
                onChange={(e) => setCorreo(e.target.value)} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none' }}
                onFocus={(e) => e.target.style.border = '2px solid #031249'}
                onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Contraseña</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type={verPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', width: '100%' }}
                  onFocus={(e) => e.target.style.border = '2px solid #031249'}
                  onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                />
                <span 
                  onClick={() => setVerPassword(!verPassword)} 
                  style={{ position: 'absolute', right: '15px', cursor: 'pointer', fontSize: '20px', userSelect: 'none' }}
                >
                  {verPassword ? '🙈' : '👁️'}
                </span>
              </div>
            </div>

            {esRegistro && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '15px', fontWeight: '600', color: '#031249' }}>Confirmar Contraseña</label>
                <input 
                  type={verPassword ? 'text' : 'password'} 
                  placeholder="••••••••••••" 
                  required 
                  value={confirmarPassword} 
                  onChange={(e) => setConfirmarPassword(e.target.value)} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.border = '2px solid #031249'}
                  onBlur={(e) => e.target.style.border = '1px solid #cbd5e1'}
                />
              </div>
            )}

            <button 
              type="submit" 
              style={{ 
                padding: '14px', 
                background: '#ffffff', 
                color: '#333333', 
                border: '2px solid #031249', 
                borderRadius: '30px', 
                cursor: 'pointer', 
                fontWeight: 'bold', 
                fontSize: '16px', 
                marginTop: '15px', 
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#031249'; e.target.style.color = '#ffffff'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.target.style.background = '#ffffff'; e.target.style.color = '#333333'; e.target.style.transform = 'translateY(0)'; }}
            >
              {esRegistro ? '📝 Registrarme' : '🔑 Iniciar Sesión'}
            </button>
          </form>

          {mensaje.texto && (
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: mensaje.esError ? '#ff4d4d' : '#2ed573' }}>
              {mensaje.texto}
            </p>
          )}

          <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '14px' }}>
            {esRegistro ? '¿Ya tienes una cuenta? ' : '¿No tienes una cuenta? '}
            <span 
              onClick={() => { 
                setEsRegistro(!esRegistro); 
                setMensaje({ texto: '', esError: false });
                if (!esRegistro) {
                  setFechaNacimiento('');
                  setNombre('');
                  setApellidoP('');
                  setApellidoM('');
                  setConfirmarPassword('');
                }
              }} 
              style={{ color: '#031249', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
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