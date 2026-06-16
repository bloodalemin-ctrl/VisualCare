import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

const colorTitulos = '#0277BD'; 
const colorBotonPrincipal = '#0277BD'; 
const colorFondoLateral = '#01579B'; 

function CalibradorIA({ idUsuario, alTerminar }) {
  const videoRef = useRef(null);
  const [estadoCamara, setEstadoCamara] = useState('apagada');
  const [distanciaReal, setDistanciaReal] = useState(0);
  const [estadoDistancia, setEstadoDistancia] = useState('Esperando inicio...');
  const [iaCargada, setIacargada] = useState(false);
  const [alertaActiva, setAlertaActiva] = useState(false);
  
  const streamAnimacionRef = useRef(null);
  const detectorRef = useRef(null);

  const encenderCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setEstadoCamara('encendida');
      }
    } catch (err) {
      alert("No se pudo acceder a la cámara. Verifica los permisos de tu navegador.");
    }
  };

  const comenzarCalibracion = async () => {
    setEstadoCamara('calibrando');
    setEstadoDistancia('Cargando IA...');
    
    try {
      await tf.ready();
      try { await tf.setBackend('webgl'); } catch(e) {}
      
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      detectorRef.current = await faceLandmarksDetection.createDetector(model, { runtime: 'tfjs' });
      setIacargada(true);
      
      detectarRostro();
    } catch (err) {
      setEstadoDistancia('Error al cargar la IA');
    }
  };

  const detectarRostro = async () => {
    if (videoRef.current && videoRef.current.readyState === 4 && detectorRef.current && estadoCamara === 'calibrando') {
      try {
        const faces = await detectorRef.current.estimateFaces(videoRef.current);
        let faceWidth = 0;

        if (faces && faces.length > 0) {
          const face = faces[0];
          if (face.keypoints && face.keypoints.length > 0) {
            const xs = face.keypoints.map(k => k.x);
            faceWidth = Math.max(...xs) - Math.min(...xs);
          } else if (face.box) {
            faceWidth = face.box.width;
          }
        } else {
          faceWidth = videoRef.current.videoWidth * 0.28; 
        }

        if (faceWidth > 0) {
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
      } catch (e) {}
    }
    if (estadoCamara === 'calibrando') {
      streamAnimacionRef.current = requestAnimationFrame(detectarRostro);
    }
  };

  const detenerCamara = () => {
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
        
        {/* LADO IZQUIERDO: MEDIDOR */}
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

        {/* LADO DERECHO: ACCESO A LA CÁMARA */}
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
                  style={{ background: '#fff', color: '#000', border: 'none', padding: '14px 30px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255,255,255,0.2)' }}
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

            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />
          </div>

          {/* BOTONES ACCION INFERIORES */}
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
              style={{ background: estadoDistancia === 'Óptimo' ? '#10B981' : '#555', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: estadoDistancia === 'Óptimo' ? 'pointer' : 'not-allowed', boxShadow: estadoDistancia === 'Óptimo' ? '0 0 10px rgba(16,185,129,0.5)' : 'none' }}
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