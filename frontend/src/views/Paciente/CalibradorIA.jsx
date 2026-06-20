import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl'; // Importamos WebGL, pero no lo forzamos
import * as blazeface from '@tensorflow-models/blazeface';

function CalibradorIA({ idUsuario, alTerminar }) {
  const videoRef = useRef(null);
  const [estadoCamara, setEstadoCamara] = useState('apagada'); 
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [estadoDistancia, setEstadoDistancia] = useState('Esperando inicio...');
  const [iaCargada, setIacargada] = useState(false);
  const [alertaActiva, setAlertaActiva] = useState(false);
  
  // REFERENCIAS CLAVE PARA EVITAR EL "STALE CLOSURE" DE REACT
  const streamAnimacionRef = useRef(null);
  const detectorRef = useRef(null);
  const calibrandoRef = useRef(false); // <--- Este es el interruptor maestro infalible

  const encenderCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setEstadoCamara('encendida');
        };
      }
    } catch (err) {
      alert("No se pudo acceder a la cámara. Verifica los permisos de tu navegador.");
    }
  };

  const comenzarCalibracion = async () => {
    setEstadoCamara('calibrando');
    calibrandoRef.current = true; // Encendemos el interruptor maestro
    setEstadoDistancia('Activando red neuronal...');
    
    try {
      // Dejamos que TensorFlow decida el mejor backend (WebGL o CPU) para que no se congele
      await tf.ready(); 
      
      // Cargamos BlazeFace
      detectorRef.current = await blazeface.load();
      setIacargada(true);
      
      // Iniciamos el ciclo de lectura
      detectarRostro();
    } catch (err) {
      setEstadoDistancia('Error al cargar la IA. Reintenta.');
      console.error("Error inicializando TF:", err);
    }
  };

  const detectarRostro = async () => {
    // Si apagamos la calibración o no hay video, detenemos el ciclo
    if (!calibrandoRef.current || !videoRef.current || !detectorRef.current) return;

    if (videoRef.current.readyState >= 2) {
      try {
        // Obtenemos los rostros (el false indica que nos devuelva arreglos numéricos, no tensores pesados)
        const faces = await detectorRef.current.estimateFaces(videoRef.current, false);
        
        if (faces && faces.length > 0) {
          const face = faces[0];
          
          // BlazeFace nos da las coordenadas [x, y] de la caja del rostro
          const topLeft = face.topLeft;
          const bottomRight = face.bottomRight;
          
          // Calculamos el ancho de la cara restando las coordenadas X
          const faceWidth = bottomRight[0] - topLeft[0];
          
          if (faceWidth > 0) {
            // Fórmula calibrada. Si te marca muy lejos, baja este número; si te marca muy cerca, súbelo.
            let calcCm = Math.round(9200 / faceWidth);
            
            if (calcCm > 150) calcCm = 150;
            if (calcCm < 10) calcCm = 10;
            
            setDistanciaReal(calcCm);

            if (calcCm < 40) {
              setEstadoDistancia('Muy Cerca');
              setAlertaActiva(true);
            } else if (calcCm >= 40 && calcCm <= 60) {
              setEstadoDistancia('Óptimo');
              setAlertaActiva(false);
            } else {
              setEstadoDistancia('Muy Lejos');
              setAlertaActiva(false);
            }
          }
        } else {
          setEstadoDistancia('Rostro no detectado');
          setAlertaActiva(false);
        }
      } catch (e) {
        console.error("Fallo leyendo el frame:", e);
      }
    }
    
    // Solo pedimos el siguiente frame si el interruptor sigue encendido
    if (calibrandoRef.current) {
      streamAnimacionRef.current = requestAnimationFrame(detectarRostro);
    }
  };

  const detenerCamara = () => {
    calibrandoRef.current = false; // Apagamos el interruptor maestro inmediatamente
    if (streamAnimacionRef.current) cancelAnimationFrame(streamAnimacionRef.current);
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setEstadoCamara('apagada');
    setIacargada(false);
    setDistanciaReal(0);
    setEstadoDistancia('Esperando inicio...');
    setAlertaActiva(false);
  };

  useEffect(() => {
    return () => detenerCamara();
  }, []);

  return (
    <div style={{ animation: 'fadeIn 0.4s', maxWidth: '1000px', margin: '0 auto', background: '#050A30', padding: '40px', borderRadius: '16px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        
        {/* SECCIÓN IZQUIERDA: INDICADORES */}
        <div style={{ flex: '1 1 40%', minWidth: '300px' }}>
          <h1 style={{ fontSize: '32px', fontStyle: 'italic', margin: '0 0 10px 0', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>CALIBRACIÓN DE<br/>DISTANCIA CON IA</h1>
          <p style={{ fontSize: '16px', color: '#ccc' }}>La IA verificará que te encuentres a la distancia correcta para realizar las pruebas.</p>
          
          <div style={{ background: '#111827', padding: '25px', borderRadius: '12px', marginTop: '30px', border: '1px solid #374151' }}>
            <p style={{ color: '#9CA3AF', margin: '0 0 10px 0' }}>Distancia actual</p>
            <div style={{ fontSize: '50px', fontWeight: 'bold', color: estadoDistancia === 'Óptimo' ? '#10B981' : '#F59E0B', marginBottom: '15px' }}>
              {distanciaReal} <span style={{ fontSize: '20px' }}>cm</span>
            </div>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>
              Estado: <span style={{ color: estadoDistancia === 'Óptimo' ? '#10B981' : '#EF4444' }}>● {estadoDistancia}</span>
            </p>

            <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', display: 'flex', overflow: 'hidden', marginBottom: '5px' }}>
              <div style={{ width: '30%', background: '#EF4444', opacity: estadoDistancia === 'Muy Cerca' ? 1 : 0.4 }}></div>
              <div style={{ width: '40%', background: '#10B981', opacity: estadoDistancia === 'Óptimo' ? 1 : 0.4 }}></div>
              <div style={{ width: '30%', background: '#F59E0B', opacity: estadoDistancia === 'Muy Lejos' ? 1 : 0.4 }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280' }}>
              <span>&lt; 40 cm</span><span>40 cm - 60 cm</span><span>70 cm &gt;</span>
            </div>
          </div>

          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>INDICACIONES</h3>
            <div style={{ background: '#fff', color: '#000', padding: '15px', borderRadius: '4px', fontWeight: '500' }}>
              <p style={{ margin: '0 0 5px 0', borderBottom: '1px dotted #ccc', paddingBottom: '5px' }}>1. Activa la cámara en el recuadro de la derecha.</p>
              <p style={{ margin: '0 0 5px 0', borderBottom: '1px dotted #ccc', paddingBottom: '5px' }}>2. Haz clic en el botón verde "Comenzar Calibración".</p>
              <p style={{ margin: 0 }}>3. Aléjate o acércate hasta conseguir el estado Óptimo.</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN DERECHA: CÁMARA */}
        <div style={{ flex: '1 1 45%', minWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontStyle: 'italic', marginBottom: '20px', letterSpacing: '1px' }}>ACCESO A LA CÁMARA</h2>
          
          <div style={{ 
            width: '100%', height: '350px', background: '#000', borderRadius: '12px', position: 'relative', overflow: 'hidden',
            boxShadow: estadoCamara !== 'apagada' ? '0 0 15px #00F0FF, inset 0 0 15px #FF00FF' : 'none',
            border: '2px solid #333'
          }}>
            {estadoCamara === 'apagada' && (
              <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20, background: '#111' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); encenderCamara(); }} 
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '14px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                >
                  Activar Cámara
                </button>
              </div>
            )}

            {estadoCamara === 'encendida' && (
              <div style={{ position: 'absolute', bottom: '20px', width: '100%', display: 'flex', justifyContent: 'center', zIndex: 20 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); comenzarCalibracion(); }} 
                  style={{ background: '#10B981', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 12px #10B981' }}
                >
                  Comenzar Calibración
                </button>
              </div>
            )}

            {estadoCamara === 'calibrando' && !iaCargada && (
              <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 15 }}>
                Cargando Red Neuronal Biométrica...
              </div>
            )}

            {alertaActiva && (
              <div style={{ position: 'absolute', top: '10px', width: '90%', left: '5%', background: 'rgba(239, 68, 68, 0.9)', padding: '10px', borderRadius: '8px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                ⚠️ ALERTA: DEMASIADO CERCA DE LA PANTALLA
              </div>
            )}

            <video 
              ref={videoRef} 
              width="640" 
              height="480"
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '30px' }}>
            <button 
              onClick={() => { detenerCamara(); encenderCamara(); }}
              style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              REINTENTAR
            </button>
            <button 
              onClick={() => { alTerminar(distanciaReal); detenerCamara(); }}
              disabled={estadoDistancia !== 'Óptimo'}
              style={{ background: estadoDistancia === 'Óptimo' ? '#10B981' : '#555', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: estadoDistancia === 'Óptimo' ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}
            >
              CONTINUAR
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CalibradorIA;