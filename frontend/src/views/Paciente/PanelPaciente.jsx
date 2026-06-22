import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importación segura para la tabla del PDF
import CalibradorIA from './CalibradorIA'; 

const colorFondoLateral = '#01579B'; 
const colorTitulos = '#0277BD'; 
const colorBotonPrincipal = '#0277BD'; 
const colorTextoGeneral = '#333333';

const preguntasCVSQ = [
  "¿Con qué frecuencia sientes ardor en los ojos?",
  "¿Con qué frecuencia sientes picor o comezón en los ojos?",
  "¿Con qué frecuencia tienes sensación de cuerpo extraño o 'arenilla'?",
  "¿Con qué frecuencia presentas lagrimeo?",
  "¿Con qué frecuencia notas un parpadeo excesivo?",
  "¿Con qué frecuencia presentas enrojecimiento ocular?",
  "¿Con qué frecuencia sientes dolor en los ojos?",
  "¿Con qué frecuencia sientes pesadez en los párpados?",
  "¿Con qué frecuencia sientes sequedad ocular?",
  "¿Con qué frecuencia presentas visión borrosa?",
  "¿Con qué frecuencia ves doble (visión doble)?",
  "¿Con qué frecuencia tienes dificultad para enfocar al mirar de cerca?",
  "¿Con qué frecuencia notas aumento de sensibilidad a la luz?",
  "¿Con qué frecuencia ves halos de colores alrededor de las luces?",
  "¿Con qué frecuencia tienes la sensación de que tu vista empeora?",
  "¿Con qué frecuencia presentas dolor de cabeza?"
];

function PanelPaciente({ usuario, cerrarSesion }) {
  const [vistaActiva, setVistaActiva] = useState('inicio');

  // --- ESTADOS: MURO ---
  const [noticias, setNoticias] = useState([]);
  const [cargandoNoticias, setCargandoNoticias] = useState(true);

  // --- ESTADOS: HISTORIAL DEL PACIENTE ---
  const [historialMedico, setHistorialMedico] = useState([]);

  // --- ESTADOS: CVS-Q ---
  const [testComenzado, setTestComenzado] = useState(false);
  const [testFinalizado, setTestFinalizado] = useState(false);
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [resultadoCVSQ, setResultadoCVSQ] = useState(null);
  const [respuestas, setRespuestas] = useState(() => Array(16).fill(null).map(() => ({ frecuencia: null, intensidad: null })));

  // --- ESTADOS: CALIBRACIÓN E IA ---
  const [pasoPrueba, setPasoPrueba] = useState('intro'); 
  const [avisoAceptado, setAvisoAceptado] = useState(false);
  const [distanciaReal, setDistanciaReal] = useState(0); 
  const [faseTestVisual, setFaseTestVisual] = useState(0); 
  
  // Agregamos motilidad al estado
  const [resultadosTests, setResultadosTests] = useState({ 
    bicromatico: '', 
    agudeza: 0, 
    contraste: 0,
    amsler: '',
    astigmatismo: '',
    motilidad: ''
  });

  const tamanosE = [120, 80, 50, 30, 15]; 
  const direccionesE = [0, 90, 180, 270]; 
  const [rotacionEActual, setRotacionEActual] = useState(0);
  const coloresContraste = ['#444444', '#888888', '#BBBBBB', '#E0E0E0', '#F2F2F2'];
  const letrasContraste = ['C', 'O', 'D', 'R', 'S', 'V'];
  const [letraContrasteActual, setLetraContrasteActual] = useState('C');
  const [opcionesContraste, setOpcionesContraste] = useState([]);

  const menu = [
    { id: 'inicio', icono: '📢', texto: 'Novedades Clínicas' },
    { id: 'cvsq', icono: '📋', texto: 'Cuestionario CVS-Q' },
    { id: 'prueba', icono: '👁️', texto: 'Test Visual (IA)' },
    { id: 'resultados', icono: '📊', texto: 'Mis Resultados' },
    { id: 'configuracion', icono: '⚙️', texto: 'Mi Perfil' }
  ];

  // ========================================================
  // CARGAS INICIALES
  // ========================================================
  useEffect(() => {
    if (vistaActiva === 'inicio') {
      setCargandoNoticias(true);
      fetch('http://localhost:3000/api/noticias')
        .then(res => res.json())
        .then(data => { setNoticias(Array.isArray(data) ? data : []); setCargandoNoticias(false); })
        .catch(() => setCargandoNoticias(false));
    }

    if (vistaActiva === 'resultados') {
      fetch(`http://localhost:3000/api/historial/${usuario.id_usuario || usuario.id}`)
        .then(res => res.json())
        .then(data => setHistorialMedico(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [vistaActiva, usuario]);

  // ========================================================
  // LÓGICA DE PRUEBAS VISUALES INTERACTIVAS
  // ========================================================
  const iniciarPruebasVisuales = (distancia) => {
    setDistanciaReal(distancia); 
    if (distancia > 0) {
      fetch('http://localhost:3000/api/registrar-distancia', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: usuario.id_usuario || usuario.id, distancia_cm: distancia })
      }).catch(()=>console.log("Error al guardar telemetría"));
    }
    setVistaActiva('pruebas_interactivas');
    setFaseTestVisual(0);
    setResultadosTests({ bicromatico: '', agudeza: 0, contraste: 0, amsler: '', astigmatismo: '', motilidad: '' });
  };

  const procesarRespuestaBicromatico = (respuesta) => {
    setResultadosTests(prev => ({ ...prev, bicromatico: respuesta }));
    setRotacionEActual(direccionesE[Math.floor(Math.random() * direccionesE.length)]);
    setFaseTestVisual(2);
  };

  const comprobarAgudeza = (gradosRespuesta) => {
    if (gradosRespuesta === rotacionEActual) {
      if (resultadosTests.agudeza < 4) {
        setResultadosTests(prev => ({ ...prev, agudeza: prev.agudeza + 1 }));
        setRotacionEActual(direccionesE[Math.floor(Math.random() * direccionesE.length)]);
      } else {
        setResultadosTests(prev => ({ ...prev, agudeza: 5 }));
        generarNuevoContraste();
        setFaseTestVisual(3);
      }
    } else {
      generarNuevoContraste();
      setFaseTestVisual(3);
    }
  };

  const generarNuevoContraste = () => {
    const correcta = letrasContraste[Math.floor(Math.random() * letrasContraste.length)];
    setLetraContrasteActual(correcta);
    let opciones = [correcta];
    while(opciones.length < 4) {
      const letraAzar = letrasContraste[Math.floor(Math.random() * letrasContraste.length)];
      if(!opciones.includes(letraAzar)) opciones.push(letraAzar);
    }
    setOpcionesContraste(opciones.sort(() => Math.random() - 0.5));
  };

  const comprobarContraste = (letraElegida) => {
    if (letraElegida === letraContrasteActual) {
      if (resultadosTests.contraste < 4) {
        setResultadosTests(prev => ({ ...prev, contraste: prev.contraste + 1 }));
        generarNuevoContraste();
      } else {
        setResultadosTests(prev => ({ ...prev, contraste: 5 }));
        setFaseTestVisual(4); 
      }
    } else {
      setFaseTestVisual(4); 
    }
  };

  const procesarRespuestaAmsler = (respuesta) => {
    setResultadosTests(prev => ({ ...prev, amsler: respuesta }));
    setFaseTestVisual(5); 
  };

  const procesarRespuestaAstigmatismo = (respuesta) => {
    setResultadosTests(prev => ({ ...prev, astigmatismo: respuesta }));
    setFaseTestVisual(6); // Pasa a Motilidad
  };

  const procesarRespuestaMotilidad = async (respuesta) => {
    const resultadosFinales = { ...resultadosTests, motilidad: respuesta };
    setResultadosTests(resultadosFinales);
    setFaseTestVisual(7); // Finalizamos las pruebas
    
    // Almacenamos el resultado en la BD al finalizar la última prueba
    try {
      const textoReporte = `Bicromático: ${resultadosFinales.bicromatico}. Agudeza: Nivel ${resultadosFinales.agudeza}/5. Contraste: Nivel ${resultadosFinales.contraste}/5. Tensión Macular: ${resultadosFinales.amsler}. Fatiga de Enfoque: ${resultadosFinales.astigmatismo}. Motilidad Ocular: ${resultadosFinales.motilidad}. Distancia: ${distanciaReal}cm`;
      await fetch(`http://localhost:3000/api/historial/${usuario.id_usuario || usuario.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultado: textoReporte, tipo: 'Test Visual y Fatiga' })
      });
    } catch (e) {}
  };

  // ========================================================
  // LÓGICA CVS-Q (CÁLCULO EXACTO)
  // ========================================================
  const manejarSeleccionCVSQ = (tipo, valor) => {
    const nuevas = [...respuestas];
    if (tipo === 'frecuencia') { 
      nuevas[indicePregunta].frecuencia = valor; 
      nuevas[indicePregunta].intensidad = valor === 0 ? 0 : null; 
    }
    else { nuevas[indicePregunta].intensidad = valor; }
    setRespuestas(nuevas);
  };

  const irSiguienteCVSQ = async () => {
    const actual = respuestas[indicePregunta];
    if (actual.frecuencia === null || actual.intensidad === null) { 
      alert("Completa la escala de Frecuencia e Intensidad."); return; 
    }
    
    if (indicePregunta < 15) { 
      setIndicePregunta(i => i + 1); 
    } else {
      let puntajeCalculado = 0;
      respuestas.forEach(r => {
        puntajeCalculado += (r.frecuencia * r.intensidad);
      });

      let nivelSemaforo = '';
      if (puntajeCalculado <= 6) nivelSemaforo = 'Normal (Verde)';
      else if (puntajeCalculado <= 13) nivelSemaforo = 'Riesgo Medio (Amarillo)';
      else nivelSemaforo = 'Alto Riesgo (Rojo)';

      const cvsqGenerado = { puntaje_total: puntajeCalculado, nivel_fatiga: nivelSemaforo };
      setResultadoCVSQ(cvsqGenerado);
      setTestFinalizado(true);

      try {
        await fetch(`http://localhost:3000/api/historial/${usuario.id_usuario || usuario.id}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultado: `Puntaje CVS-Q: ${puntajeCalculado} Pts. Nivel: ${nivelSemaforo}`, tipo: 'Cuestionario CVS-Q' })
        });
      } catch (error) {}
    }
  };

  // ========================================================
  // GENERADOR PDF (PROTEGIDO)
  // ========================================================
  const generarPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(1, 87, 155); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(22);
      doc.text("VisionCare - Reporte Clínico Preventivo", 20, 25);
      
      doc.setTextColor(50, 50, 50); doc.setFontSize(12);
      doc.text(`Paciente: ${usuario.nombre} ${usuario.apellidoP || ''}`, 20, 55);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, 65);

      autoTable(doc, {
        startY: 75,
        head: [['Módulo Evaluado', 'Resultado Analizado']],
        body: [
          ['Puntaje CVS-Q', `${resultadoCVSQ.puntaje_total} Pts (${resultadoCVSQ.nivel_fatiga})`],
          ['Calibración Biométrica', `Distancia evaluada: ${distanciaReal} cm`],
          ['Test Bicromático', resultadosTests.bicromatico || '--'],
          ['Agudeza Visual (Snellen)', `Nivel ${resultadosTests.agudeza} de 5`],
          ['Sensibilidad al Contraste', `Nivel ${resultadosTests.contraste} de 5`],
          ['Tensión Macular (Amsler)', resultadosTests.amsler || '--'],
          ['Fatiga de Enfoque (Astigmatismo)', resultadosTests.astigmatismo || '--'],
          ['Motilidad Ocular', resultadosTests.motilidad || '--']
        ],
        headStyles: { fillColor: [2, 119, 189] }
      });

      let yActual = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 160;

      doc.setFontSize(14); doc.setFont(undefined, 'bold');
      
      if (resultadoCVSQ.puntaje_total >= 14) {
        doc.setTextColor(244, 67, 54); 
        doc.text("SEMÁFORO ROJO: ALTO RIESGO", 20, yActual);
      } else if (resultadoCVSQ.puntaje_total >= 7) {
        doc.setTextColor(255, 152, 0); 
        doc.text("SEMÁFORO AMARILLO: RIESGO MEDIO", 20, yActual);
      } else {
        doc.setTextColor(76, 175, 80); 
        doc.text("SEMÁFORO VERDE: NORMAL", 20, yActual);
      }

      yActual += 10;
      doc.setTextColor(2, 119, 189); doc.setFontSize(12);
      doc.text("Plan de Acción y Recomendaciones Personalizadas:", 20, yActual);
      
      yActual += 8;
      doc.setTextColor(80, 80, 80); doc.setFont(undefined, 'normal'); doc.setFontSize(10);
      
      let bullet = 1;
      
      if (distanciaReal < 40) {
        doc.text(`${bullet++}. Trabajas muy cerca de la pantalla (${distanciaReal}cm). Aléjate al menos a 50cm para reducir tensión ocular.`, 20, yActual); yActual += 7;
      } else {
        doc.text(`${bullet++}. Tu distancia frente a la pantalla es adecuada. Mantenla entre 50cm y 60cm.`, 20, yActual); yActual += 7;
      }

      if (resultadosTests.agudeza < 4 || resultadosTests.contraste < 4) {
        doc.text(`${bullet++}. Tuviste dificultades en agudeza o contraste. Se recomienda actualizar tu graduación de lentes.`, 20, yActual); yActual += 7;
      }

      if (resultadosTests.amsler.includes('Distorsionadas') || resultadosTests.astigmatismo.includes('oscuras')) {
        doc.text(`${bullet++}. Las pruebas indican signos de fatiga de enfoque o tensión. Programa una revisión presencial.`, 20, yActual); yActual += 7;
      }
      
      if (resultadosTests.motilidad.includes('mareo')) {
        doc.text(`${bullet++}. Tienes fatiga en los músculos oculares (saltos/mareo). Haz rotaciones circulares suaves de ojos.`, 20, yActual); yActual += 7;
      }

      if (resultadoCVSQ.puntaje_total >= 14) {
        doc.text(`${bullet++}. URGENTE: Presentas Síndrome Visual Informático Severo. Aplica lágrimas artificiales y visita a tu médico.`, 20, yActual); yActual += 7;
      } else {
        doc.text(`${bullet++}. Aplica la regla 20-20-20: Cada 20 min, mira a 6 metros (20 pies), por 20 segundos.`, 20, yActual); yActual += 7;
      }

      doc.save(`Reporte_VisionCare_${usuario.nombre}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error interno al compilar el PDF. Verifica que hayas completado las pruebas.");
    }
  };

  const cambiarVista = (idVista) => {
    setVistaActiva(idVista);
    if (idVista !== 'prueba' && idVista !== 'pruebas_interactivas') {
      setPasoPrueba('intro');
    }
  };

  // ========================================================
  // MOTOR DE VISTAS (RENDER)
  // ========================================================
  const renderContenido = () => {
    if (vistaActiva === 'inicio') {
      return (
        <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.4s' }}>
          <h1 style={{ color: colorTitulos, marginBottom: '10px', fontSize: '34px' }}>¡Hola, {usuario.nombre}! 👋</h1>
          <h2 style={{ color: colorTitulos, fontSize: '24px', borderBottom: `3px solid ${colorBotonPrincipal}`, paddingBottom: '10px', marginBottom: '25px' }}>📢 Muro de la Clínica</h2>
          {cargandoNoticias ? <p>Buscando novedades...</p> : noticias.length === 0 ? (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', border: '1px dashed #ccc' }}>Aún no hay publicaciones de los especialistas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {noticias.map(noti => (
                <div key={noti.id_noticia || noti.id} style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${colorBotonPrincipal}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: colorTitulos }}>{noti.titulo}</h3>
                    <span style={{ fontSize: '14px', color: '#01579B', fontWeight: 'bold', background: '#E3F2FD', padding: '5px 12px', borderRadius: '6px' }}>
                      👤 {noti.doctor_nombre || 'Especialista'}
                    </span>
                  </div>
                  {noti.contenido && <p style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{noti.contenido}</p>}
                  {(noti.url_multimedia || noti.url_archivo) && (
                    <div style={{ marginTop: '15px' }}>
                      {noti.tipo_multimedia === 'pdf' ? <iframe src={noti.url_multimedia} style={{ width: '100%', height: '300px', border: 'none' }} /> : <img src={noti.url_multimedia || noti.url_archivo} style={{ maxWidth: '100%', borderRadius: '8px' }} />}
                    </div>
                  )}
                  <div style={{ marginTop: '15px' }}>
                    <span style={{ fontSize: '13px', background: '#F5F5F5', padding: '5px 10px', borderRadius: '4px' }}>
                      📅 {noti.fecha_publicacion ? new Date(noti.fecha_publicacion).toLocaleDateString('es-ES') : noti.fecha}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (vistaActiva === 'prueba') {
      if (pasoPrueba === 'intro') {
        return (
          <div style={{ animation: 'fadeIn 0.4s', maxWidth: '900px', margin: '20px auto', textAlign: 'center' }}>
            <h1 style={{ color: colorTitulos, fontSize: '36px', marginBottom: '5px' }}>EVALUACIÓN DE</h1>
            <h1 style={{ color: colorTitulos, fontSize: '36px', marginTop: 0, marginBottom: '30px' }}>FATIGA VISUAL</h1>
            <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
              <div style={{ flex: 1, background: '#00B4D8', padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '32px', fontWeight: 'bold', letterSpacing: '8px', textAlign: 'center' }}>
                <div style={{ border: '4px solid rgba(255,255,255,0.3)', padding: '30px', borderRadius: '8px' }}>E F P<br/>T O Z<br/>L P E D</div>
              </div>
              <div style={{ flex: 1.2, padding: '40px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginBottom: '30px' }}>
                  

Al continuar, aceptas que VisualCare es un sistema diseñado exclusivamente para la prevención y detección temprana de fatiga visual (CVS-Q). La información y resultados obtenidos son meramente orientativos y preventivos. No constituyen un diagnóstico clínico, tratamiento ni receta médica. Si experimentas molestias severas, te recomendamos consultar a tu especialista en salud visual.




                </p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: 'bold', color: colorTitulos, cursor: 'pointer', marginBottom: '30px' }}>
                  <input type="checkbox" checked={avisoAceptado} onChange={(e) => setAvisoAceptado(e.target.checked)} style={{ transform: 'scale(1.5)', cursor: 'pointer' }} />
                  He leído y acepto el aviso legal
                </label>
                <button onClick={() => setPasoPrueba('calibracion')} disabled={!avisoAceptado} style={{ background: avisoAceptado ? colorBotonPrincipal : '#ccc', color: '#fff', padding: '15px 30px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: avisoAceptado ? 'pointer' : 'not-allowed' }}>Continuar a Calibración</button>
              </div>
            </div>
          </div>
        );
      }
      if (pasoPrueba === 'calibracion') {
        return <CalibradorIA idUsuario={usuario.id_usuario || usuario.id} alTerminar={iniciarPruebasVisuales} />;
      }
    }

    if (vistaActiva === 'pruebas_interactivas') {
      return (
        <div style={{ maxWidth: '900px', margin: '20px auto', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
          
          {faseTestVisual === 0 && (
            <div style={{ background: '#fff', padding: '50px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h1 style={{ color: colorTitulos, fontSize: '32px', marginBottom: '20px' }}>Protocolo Listo</h1>
              <p style={{ fontSize: '18px', color: '#555', marginBottom: '40px' }}>Distancia detectada: {distanciaReal}cm. Mantén tu postura.</p>
              <button onClick={() => setFaseTestVisual(1)} style={{ background: colorBotonPrincipal, color: '#fff', padding: '15px 40px', fontSize: '20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Comenzar Test 1</button>
            </div>
          )}

          {faseTestVisual === 1 && (
            <div>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>1. Test Bicromático</h2>
              <div style={{ display: 'flex', width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px' }}>
                <div style={{ flex: 1, background: '#FF0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '60px', fontWeight: '900', color: '#000', letterSpacing: '10px' }}>Z N O</span></div>
                <div style={{ flex: 1, background: '#00FF00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '60px', fontWeight: '900', color: '#000', letterSpacing: '10px' }}>Z N O</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button onClick={() => procesarRespuestaBicromatico('Rojo')} style={{ padding: '15px 30px', border: '2px solid #FF0000', background: '#fff', color: '#D32F2F', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>Rojo más nítido</button>
                <button onClick={() => procesarRespuestaBicromatico('Igual')} style={{ padding: '15px 30px', background: colorTitulos, color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>Igual en ambos</button>
                <button onClick={() => procesarRespuestaBicromatico('Verde')} style={{ padding: '15px 30px', border: '2px solid #00FF00', background: '#fff', color: '#2E7D32', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>Verde más nítido</button>
              </div>
            </div>
          )}

          {faseTestVisual === 2 && (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>2. Agudeza Visual</h2>
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                <span style={{ fontSize: `${tamanosE[resultadosTests.agudeza]}px`, fontWeight: 'bold', fontFamily: 'sans-serif', transform: `rotate(${rotacionEActual}deg)` }}>E</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '200px', margin: '0 auto' }}>
                <div></div><button onClick={() => comprobarAgudeza(270)} style={{ fontSize: '30px', padding: '15px', cursor: 'pointer' }}>⬆️</button><div></div>
                <button onClick={() => comprobarAgudeza(180)} style={{ fontSize: '30px', padding: '15px', cursor: 'pointer' }}>⬅️</button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Nivel {resultadosTests.agudeza + 1}</div>
                <button onClick={() => comprobarAgudeza(0)} style={{ fontSize: '30px', padding: '15px', cursor: 'pointer' }}>➡️</button>
                <div></div><button onClick={() => comprobarAgudeza(90)} style={{ fontSize: '30px', padding: '15px', cursor: 'pointer' }}>⬇️</button><div></div>
              </div>
            </div>
          )}

          {faseTestVisual === 3 && (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>3. Sensibilidad al Contraste</h2>
              <div style={{ background: '#FFFFFF', border: '2px solid #EEE', width: '200px', height: '200px', margin: '0 auto 40px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                <span style={{ fontSize: '100px', fontWeight: 'bold', fontFamily: 'sans-serif', color: coloresContraste[resultadosTests.contraste] }}>{letraContrasteActual}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {opcionesContraste.map(letra => (
                  <button key={letra} onClick={() => comprobarContraste(letra)} style={{ fontSize: '24px', padding: '15px 30px', cursor: 'pointer', border: `2px solid ${colorTitulos}`, borderRadius: '8px', background: '#fff', color: colorTitulos, fontWeight: 'bold' }}>{letra}</button>
                ))}
              </div>
            </div>
          )}

          {faseTestVisual === 4 && (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>4. Tensión Macular (Rejilla de Amsler)</h2>
              <div style={{width: '250px', height: '250px', background: '#fff', backgroundImage: 'linear-gradient(#333 2px, transparent 2px), linear-gradient(90deg, #333 2px, transparent 2px)', backgroundSize: '25px 25px', margin: '0 auto 40px', position: 'relative', border: '2px solid #333'}}>
                  <div style={{position: 'absolute', width: 14, height: 14, background: 'red', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button onClick={() => procesarRespuestaAmsler('Líneas Rectas y Claras')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Veo líneas rectas</button>
                <button onClick={() => procesarRespuestaAmsler('Líneas Distorsionadas/Borroso')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#F44336', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Veo distorsión / Borroso</button>
              </div>
            </div>
          )}

          {faseTestVisual === 5 && (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>5. Círculo Astigmático</h2>
              <div style={{width: '220px', height: '220px', borderRadius: '50%', border: '4px solid #333', position: 'relative', margin: '0 auto 40px'}}>
                  {[0, 30, 60, 90, 120, 150].map(deg => (
                      <div key={deg} style={{position: 'absolute', top: '50%', left: 0, width: '100%', height: '6px', background: '#333', transform: `translateY(-50%) rotate(${deg}deg)`}}></div>
                  ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button onClick={() => procesarRespuestaAstigmatismo('Todas igual de nítidas')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Todas se ven igual</button>
                <button onClick={() => procesarRespuestaAstigmatismo('Algunas más oscuras o tenues')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#FF9800', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Algunas se ven más oscuras</button>
              </div>
            </div>
          )}

          {/* 🔥 LA NUEVA PRUEBA 6: SEGUIMIENTO OCULAR (MOTILIDAD) */}
          {faseTestVisual === 6 && (
            <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, marginBottom: '10px' }}>6. Seguimiento Ocular (Motilidad)</h2>
              <p style={{ fontSize: '18px', marginBottom: '30px', color: '#555' }}>
                Sigue la bolita roja <strong>únicamente con tus ojos</strong> (no muevas la cabeza). <br/>
                ¿Sentiste que tus ojos daban pequeños saltos, o experimentaste un mareo leve?
              </p>
              
              <div style={{ width: '100%', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', borderRadius: '8px', marginBottom: '40px', overflow: 'hidden' }}>
                <div style={{ width: '30px', height: '30px', background: 'red', borderRadius: '50%', animation: 'pendulum 2.5s infinite ease-in-out' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <button onClick={() => procesarRespuestaMotilidad('Lo seguí sin problema')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>Lo seguí sin problema</button>
                <button onClick={() => procesarRespuestaMotilidad('Sentí saltos o mareo leve')} style={{ padding: '15px 25px', cursor: 'pointer', background: '#F44336', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold' }}>Sentí saltos o mareo</button>
              </div>
            </div>
          )}

          {faseTestVisual === 7 && (
            <div style={{ background: '#E8F5E9', padding: '50px', borderRadius: '16px', border: '2px solid #C8E6C9' }}>
              <h2 style={{ color: '#2E7D32', fontSize: '32px', marginBottom: '20px' }}>¡Pruebas Finalizadas! 🎉</h2>
              <button onClick={() => setVistaActiva('resultados')} style={{ background: '#2E7D32', color: '#fff', padding: '15px 30px', fontSize: '18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Ir a mi Expediente</button>
            </div>
          )}
        </div>
      );
    }

    if (vistaActiva === 'cvsq') {
      if (!testComenzado) {
        return (
          <div style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.4s' }}>
            <div style={{ background: '#fff', padding: '50px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderTop: `6px solid ${colorBotonPrincipal}` }}>
              <h2 style={{ color: colorTitulos, fontSize: '32px' }}>Test Clínico CVS-Q</h2>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>Evalúa los 16 síntomas estándar de fatiga visual informática.</p>
              <button onClick={() => { setTestComenzado(true); setRespuestas(Array(16).fill(null).map(() => ({ frecuencia: null, intensidad: null }))); setIndicePregunta(0); setTestFinalizado(false); setResultadoCVSQ(null); }} style={{ background: colorBotonPrincipal, color: '#fff', padding: '15px 35px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>Empezar Cuestionario</button>
            </div>
          </div>
        );
      }
      if (testFinalizado) {
        let colorSemaforo = resultadoCVSQ?.puntaje_total >= 14 ? '#D32F2F' : resultadoCVSQ?.puntaje_total >= 7 ? '#F57C00' : '#388E3C';
        let bgSemaforo = resultadoCVSQ?.puntaje_total >= 14 ? '#FFEBEE' : resultadoCVSQ?.puntaje_total >= 7 ? '#FFF3E0' : '#E8F5E9';

        return (
          <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', animation: 'fadeIn 0.4s' }}>
            <div style={{ background: '#fff', padding: '50px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <h2 style={{ color: colorTitulos, fontSize: '28px', marginBottom: '20px' }}>CVS-Q Completado</h2>
              <div style={{ background: bgSemaforo, padding: '30px', borderRadius: '12px', marginBottom: '30px' }}>
                <h3 style={{ color: colorSemaforo, fontSize: '24px', margin: '0 0 10px 0' }}>{resultadoCVSQ?.nivel_fatiga}</h3>
                <p style={{ fontSize: '18px', color: '#555', margin: 0 }}>Severidad: <strong>{resultadoCVSQ?.puntaje_total} puntos</strong></p>
              </div>
              <button onClick={() => cambiarVista('resultados')} style={{ background: colorBotonPrincipal, color: '#fff', padding: '15px 30px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>Ir al Expediente General</button>
            </div>
          </div>
        );
      }

      const actual = respuestas[indicePregunta];
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: colorTitulos, fontSize: '28px', margin: 0 }}>CVS-Q</h1>
            <span style={{ background: '#E3F2FD', color: colorTitulos, padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>{indicePregunta + 1} de 16</span>
          </div>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: colorTextoGeneral, fontSize: '22px', marginBottom: '35px' }}>{preguntasCVSQ[indicePregunta]}</h2>
            <p style={{ fontWeight: 'bold', color: colorTitulos, fontSize: '16px', marginBottom: '15px' }}>1. Frecuencia:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[['Nunca', 0], ['Ocasional (1-2 veces)', 1], ['Frecuente (3+ veces)', 2]].map(([txt, val]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '18px', padding: '12px', background: actual.frecuencia === val ? '#E3F2FD' : '#F5F5F5', borderRadius: '8px', cursor: 'pointer', border: actual.frecuencia === val ? `2px solid ${colorBotonPrincipal}` : '2px solid transparent' }}>
                  <input type="radio" checked={actual.frecuencia === val} onChange={() => manejarSeleccionCVSQ('frecuencia', val)} style={{ transform: 'scale(1.3)' }} /> {txt}
                </label>
              ))}
            </div>

            {actual.frecuencia > 0 && (
              <div style={{ background: '#F9FAFB', padding: '25px', marginTop: '30px', borderRadius: '12px', border: '1px solid #E0E0E0' }}>
                <p style={{ fontWeight: 'bold', color: colorTitulos, fontSize: '16px', margin: '0 0 15px 0' }}>2. Intensidad:</p>
                <div style={{ display: 'flex', gap: '30px' }}>
                  {[['Leve', 0], ['Intensa', 1]].map(([txt, val]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', cursor: 'pointer' }}><input type="radio" checked={actual.intensidad === val} onChange={() => manejarSeleccionCVSQ('intensidad', val)} style={{ transform: 'scale(1.3)' }} /> {txt}</label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #EEE' }}>
              <button onClick={() => setIndicePregunta(i => i - 1)} disabled={indicePregunta === 0} style={{ padding: '12px 25px', background: 'transparent', border: '2px solid #CCC', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: indicePregunta === 0 ? 'not-allowed' : 'pointer' }}>Anterior</button>
              <button onClick={irSiguienteCVSQ} style={{ padding: '12px 30px', background: colorBotonPrincipal, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>{indicePregunta === 15 ? 'Evaluar Puntuación' : 'Siguiente'}</button>
            </div>
          </div>
        </div>
      );
    }

    if (vistaActiva === 'resultados') {
      const pruebasFaltantes = !resultadoCVSQ || faseTestVisual < 7;

      return (
        <div style={{ maxWidth: '900px', margin: '20px auto', animation: 'fadeIn 0.4s' }}>
           <h1 style={{ color: colorTitulos, fontSize: '34px', marginBottom: '30px', textAlign: 'center' }}>Expediente Digital</h1>
           
           <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: `2px solid ${colorTitulos}`, textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '60px', marginBottom: '15px' }}>📄</div>
              <h2 style={{ color: colorTextoGeneral, fontSize: '24px', marginBottom: '20px' }}>Reporte Unificado de Salud Visual</h2>
              
              {pruebasFaltantes ? (
                <div style={{ background: '#FFF3E0', padding: '20px', borderRadius: '8px', color: '#E65100', fontWeight: '500', fontSize: '16px' }}>
                  ⚠️ Para generar tu reporte final personalizado en PDF, debes completar el <strong>Test CVS-Q</strong> y el <strong>Test Visual completo (IA + Fatiga)</strong>.
                </div>
              ) : (
                <button onClick={generarPDF} style={{ background: colorBotonPrincipal, color: '#fff', padding: '18px 40px', fontSize: '20px', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  Generar y Descargar PDF
                </button>
              )}
           </div>

           <h2 style={{ color: colorTitulos, fontSize: '26px', borderBottom: '3px solid #eee', paddingBottom: '10px', marginBottom: '25px' }}>
              📚 Mi Historial Clínico Completo
           </h2>
           
           {historialMedico.length === 0 ? (
             <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#777' }}>
               Aún no tienes registros ni recomendaciones en tu historial.
             </div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {historialMedico.map(item => {
                 const esDelDoctor = item.tipo === 'Reporte Médico';
                 
                 return (
                   <div key={item.id_test || item.id} style={{ 
                     background: '#fff', padding: '25px', borderRadius: '12px', 
                     borderLeft: `6px solid ${esDelDoctor ? '#00C853' : colorBotonPrincipal}`,
                     boxShadow: '0 4px 10px rgba(0,0,0,0.04)' 
                   }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                       <span style={{ fontSize: '14px', fontWeight: 'bold', color: esDelDoctor ? '#00C853' : colorBotonPrincipal, background: esDelDoctor ? '#E8F5E9' : '#E3F2FD', padding: '5px 12px', borderRadius: '6px' }}>
                         {esDelDoctor ? '👨‍⚕️ Mensaje del Optometrista' : `🤖 ${item.tipo}`}
                       </span>
                       <small style={{ color: '#888', fontWeight: '500' }}>{item.fecha}</small>
                     </div>
                     <p style={{ margin: '15px 0 0 0', fontSize: '16px', color: colorTextoGeneral, whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                       {item.resultado}
                     </p>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      );
    }
    
    if (vistaActiva === 'configuracion') {
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.4s' }}>
          <h1 style={{ color: colorTitulos, fontSize: '34px', marginBottom: '30px' }}>👤 Mi Perfil</h1>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '40px', borderBottom: '2px solid #f1f5f9', paddingBottom: '30px' }}>
              <div style={{ width: '80px', height: '80px', background: colorTitulos, color: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '36px', fontWeight: 'bold' }}>{usuario.nombre.charAt(0)}</div>
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: colorTextoGeneral, fontSize: '28px' }}>{usuario.nombre} {usuario.apellidoP}</h3>
                <span style={{ background: '#E3F2FD', color: colorTitulos, padding: '6px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>Paciente Registrado</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Correo de Acceso</p>
                <p style={{ margin: '5px 0 0 0', color: colorTextoGeneral, fontSize: '18px', fontWeight: 'bold' }}>{usuario.correo}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: '"Segoe UI", sans-serif', overflow: 'hidden' }}>
      <div style={{ width: '320px', background: colorFondoLateral, color: '#fff', display: 'flex', flexDirection: 'column', padding: '40px 25px', boxSizing: 'border-box', flexShrink: 0 }}>
        <h2 style={{ margin: '0 0 40px 10px', fontStyle: 'italic', fontSize: '30px' }}>VisionCare</h2>
        <span style={{ fontSize: '16px', color: '#81D4FA', marginTop: '-35px', marginBottom: '40px', marginLeft: '12px', fontWeight: 'bold' }}>Módulo Paciente</span>
        <hr style={{ width: '100%', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '30px', marginTop: '-20px' }} />
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {menu.map(m => (
            <button key={m.id} onClick={() => cambiarVista(m.id)} 
              style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '16px 20px', background: (vistaActiva === m.id || (m.id === 'prueba' && vistaActiva === 'pruebas_interactivas')) ? 'rgba(255,255,255,0.2)' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: (vistaActiva === m.id || (m.id === 'prueba' && vistaActiva === 'pruebas_interactivas')) ? 'bold' : '500', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '22px' }}>{m.icono}</span> {m.texto}
            </button>
          ))}
        </nav>
        
        <button onClick={cerrarSesion} style={{ padding: '18px 20px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid rgba(255,255,255,0.2)', marginTop: '20px' }}>
          <span style={{ fontSize: '22px' }}>🚪</span> Cerrar Sesión
        </button>
      </div>
      <div style={{ flex: 1, backgroundColor: '#F4F7F6', padding: '50px 70px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {renderContenido()}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pendulum {
          0% { transform: translateX(-120px); }
          50% { transform: translateX(120px); }
          100% { transform: translateX(-120px); }
        }
      `}</style>
    </div>
  );
}

export default PanelPaciente;