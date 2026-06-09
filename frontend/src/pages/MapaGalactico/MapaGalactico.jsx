import React, { useMemo, useState, useRef } from 'react';
import './MapaGalactico.css';

import imgMinero      from '../../assets/minero.png';
import imgEnergetico  from '../../assets/energetico.png';
import imgCientifico  from '../../assets/cientifico.png';
import imgBalanceado  from '../../assets/balanceado.png';

const PLANET_IMAGES = {
  minero:      imgMinero,
  energetico:  imgEnergetico,
  'energético':  imgEnergetico,
  cientifico:  imgCientifico,
  'científico':  imgCientifico,
  balanceado:  imgBalanceado,
  balanceando: imgBalanceado, 
};

function getPlanetImage(tipo) {
  if (!tipo) return null;
  return PLANET_IMAGES[tipo.toLowerCase()] ?? null;
}

// ─── Popup ────────────────────────────────────────────────────────────────────
function SistemaPopup({ sistema, onClose, position }) {
  if (!sistema) return null;

  const prodTurno = sistema.produccion ?? { minerales: 0, energia: 0, cristales: 0 }
  const instalaciones = sistema.instalaciones || [];
  const contar = (tipo) => instalaciones.filter(inst => inst.nombre === tipo).length;

  return (
    <div className="mg-popup-modern" style={{ left: position.x + 'px', top: position.y + 'px' }}>

      <div className="mg-popup-header-modern">
        <div className="mg-popup-header-left">
          <h4>{sistema.nombre}</h4>
          <span className={`mg-tag-tipo ${sistema.tipo?.toLowerCase()}`}>{sistema.tipo}</span>
        </div>
        <button className="mg-popup-close-modern" onClick={onClose}>×</button>
      </div>

      <div className="mg-popup-divider" />

      <div className="mg-popup-body-modern">

        <div className="mg-popup-row">
          <span className="mg-label-muted">Propietario</span>
          <span className="mg-value-highlight">{sistema.propietario || 'Sector Libre'}</span>
        </div>

        <div className="mg-popup-row">
          <span className="mg-label-muted">Flotas en órbita</span>
          <span className="mg-value-flotas">{sistema.astillerosEstacionados ?? 0}</span>
        </div>

        <div className="mg-popup-divider" />

        <div className="mg-grid-subseccion">
          <div className="mg-grid-item">
            <small>Minas</small>
            <strong>{contar('Mina')}</strong>
          </div>
          <div className="mg-grid-item">
            <small>Astilleros</small>
            <strong>{contar('Astillero')}</strong>
          </div>
          <div className="mg-grid-item">
            <small>C. Inv.</small>
            <strong>{contar('CentralInvestigacion')}</strong>
          </div>
          <div className="mg-grid-item">
            <small>Fortalezas</small>
            <strong>{contar('Fortaleza')}</strong>
          </div>
        </div>

        <div className="mg-popup-divider" />

        <div className="mg-produccion-barra">
          <div className="mg-prod-item" title="Minerales">
            🪨 <span className="txt-minerales">+{prodTurno.minerales}</span>
          </div>
          <div className="mg-prod-item" title="Energía">
            ⚡ <span className="txt-energia">+{prodTurno.energia}</span>
          </div>
          <div className="mg-prod-item" title="Cristales">
            💎 <span className="txt-cristales">+{prodTurno.cristales}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MapaGalactico({ sistemas, rutas, jugadores, onSistemaClick }) {
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [toastConstruccion, setToastConstruccion] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const posicionSistemaRef = useRef({ x: 0, y: 0 });
  
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDraggedRef = useRef(false);

  if (!sistemas || sistemas.length === 0) {
    return <div className="mg-loading">Esperando datos galácticos...</div>;
  }

  const colorMap = useMemo(() => {
    const COLORS = ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#F97316'];
    const map = {};
    (jugadores || []).forEach((j, i) => {
      map[j.nombre] = COLORS[i % COLORS.length];
    });
    return map;
  }, [jugadores]);

  const sistemasConCoords = useMemo(() => {
    const total = sistemas.length;
    const centroX = 400, centroY = 300;
    
    // Si todos los sistemas ya tienen coordenadas, usarlas
    const todosTienenCoords = sistemas.every(sis => 
      typeof sis.x === 'number' && typeof sis.y === 'number'
    );
    
    if (todosTienenCoords) {
      return sistemas;
    }

    // Inicializar posiciones en círculo
    const nodos = sistemas.map((sis, index) => {
      const tieneCoords = typeof sis.x === 'number' && typeof sis.y === 'number';
      const angulo = (2 * Math.PI * index) / total;
      return {
        ...sis,
        x: tieneCoords ? sis.x : centroX + 220 * Math.cos(angulo),
        y: tieneCoords ? sis.y : centroY + 220 * Math.sin(angulo),
        vx: 0,
        vy: 0
      };
    });

    // Construir mapa de conexiones (rutas)
    const conexiones = new Map();
    if (rutas) {
      rutas.forEach(ruta => {
        const [id1, id2] = ruta;
        if (!conexiones.has(id1)) conexiones.set(id1, []);
        if (!conexiones.has(id2)) conexiones.set(id2, []);
        conexiones.get(id1).push(id2);
        conexiones.get(id2).push(id1);
      });
    }

    // Parámetros del algoritmo force-directed
    const ITERACIONES = 300;
    const FUERZA_REPULSION = 80000;
    const FUERZA_ATRACCION = 0.005;
    const FUERZA_CENTRO = 0.05;
    const TEMPERATURA_INICIAL = 300;
    const ENFRIAMIENTO = 0.98;

    let temperatura = TEMPERATURA_INICIAL;

    for (let iter = 0; iter < ITERACIONES; iter++) {
      // Aplicar fuerzas
      for (let i = 0; i < nodos.length; i++) {
        const nodo = nodos[i];
        let fx = 0, fy = 0;

        // Fuerza de repulsión entre todos los pares
        for (let j = 0; j < nodos.length; j++) {
          if (i === j) continue;
          const otro = nodos[j];
          const dx = nodo.x - otro.x;
          const dy = nodo.y - otro.y;
          const distancia = Math.sqrt(dx * dx + dy * dy) || 1;
          const fuerza = FUERZA_REPULSION / (distancia * distancia);
          fx += (dx / distancia) * fuerza;
          fy += (dy / distancia) * fuerza;
        }

        // Fuerza de atracción entre nodos conectados
        const vecinos = conexiones.get(nodo.id) || [];
        vecinos.forEach(idVecino => {
          const vecino = nodos.find(n => n.id === idVecino);
          if (vecino) {
            const dx = vecino.x - nodo.x;
            const dy = vecino.y - nodo.y;
            const distancia = Math.sqrt(dx * dx + dy * dy) || 1;
            const fuerza = distancia * FUERZA_ATRACCION;
            fx += (dx / distancia) * fuerza;
            fy += (dy / distancia) * fuerza;
          }
        });

        // Fuerza hacia el centro
        const dxCentro = centroX - nodo.x;
        const dyCentro = centroY - nodo.y;
        fx += dxCentro * FUERZA_CENTRO;
        fy += dyCentro * FUERZA_CENTRO;

        // Actualizar velocidad con límite de temperatura
        nodo.vx = (nodo.vx + fx) * 0.9;
        nodo.vy = (nodo.vy + fy) * 0.9;
        
        const velocidad = Math.sqrt(nodo.vx * nodo.vx + nodo.vy * nodo.vy);
        if (velocidad > temperatura) {
          nodo.vx = (nodo.vx / velocidad) * temperatura;
          nodo.vy = (nodo.vy / velocidad) * temperatura;
        }

        // Actualizar posición
        nodo.x += nodo.vx;
        nodo.y += nodo.vy;
      }

      // Enfriar temperatura
      temperatura *= ENFRIAMIENTO;
    }

    // Remover propiedades de simulación
    return nodos.map(({ vx, vy, ...resto }) => resto);
  }, [sistemas, rutas]);

  // ─── Gestores de Eventos para Cámara (Pan & Zoom) ───────────────────────────
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;

    if (Math.abs(newX - pan.x) > 3 || Math.abs(newY - pan.y) > 3) {
      hasDraggedRef.current = true;
      if (sistemaSeleccionado) setSistemaSeleccionado(null);
    }

    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 2.5);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.5);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan((prevPan) => ({
      x: mouseX - (mouseX - prevPan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prevPan.y) * (newZoom / zoom),
    }));

    setZoom(newZoom);
    if (sistemaSeleccionado) setSistemaSeleccionado(null);
  };

  const handleClick = (sis, event) => {
    if (hasDraggedRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    
    const posPopup = { x: rect.right, y: rect.top + rect.height / 2 };
    
    const posToast = {
      x: rect.left + rect.width / 2,
      y: rect.bottom + 12
    };
    
    setPopupPosition(posPopup);
    setSistemaSeleccionado(sis);
    
    if (onSistemaClick) onSistemaClick(sis, posPopup, posToast);
  };

  const RADIO = 24;

  return (
    <div className="mg-container" style={{ position: 'relative', overflow: 'hidden' }}>
      <svg 
        className="mg-svg" 
        viewBox="0 0 800 600"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', width: '100%', height: '100%' }}
      >
        <defs>
          {sistemasConCoords.map((sis) => (
            <clipPath key={`clip-${sis.id}`} id={`clip-${sis.id}`}>
              <circle cx={sis.x} cy={sis.y} r={RADIO} />
            </clipPath>
          ))}
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {rutas && rutas.map((ruta, i) => {
            const s1 = sistemasConCoords.find(s => s.id === ruta[0]);
            const s2 = sistemasConCoords.find(s => s.id === ruta[1]);
            return s1 && s2 ? (
              <line key={i} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} className="mg-ruta" />
            ) : null;
          })}

          {sistemasConCoords.map((sis) => {
            const img           = getPlanetImage(sis.tipo);
            const colorDueno    = sis.propietario ? (colorMap[sis.propietario] ?? '#718096') : null;
            const esSeleccion   = sistemaSeleccionado?.id === sis.id;
            const radioActual   = esSeleccion ? RADIO + 4 : RADIO;

            return (
              <g
                key={sis.id}
                className="mg-sistema"
                onClick={(e) => handleClick(sis, e)}
                style={{ cursor: 'pointer' }}
              >
                {esSeleccion && (
                  <circle
                    cx={sis.x} cy={sis.y} r={radioActual + 6}
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.7"
                  />
                )}

                {colorDueno && (
                  <circle
                    cx={sis.x} cy={sis.y} r={radioActual + 4}
                    fill={colorDueno}
                    opacity="0.28"
                  />
                )}

                <circle
                  cx={sis.x} cy={sis.y} r={radioActual}
                  fill={colorDueno ? colorDueno : '#2d3748'}
                  opacity={img ? 0.5 : 1}
                  stroke={colorDueno ?? '#4a5568'}
                  strokeWidth={esSeleccion ? 2 : 1}
                  style={{ transition: 'all 0.25s' }}
                />

                {img && (
                  <image
                    href={img}
                    x={sis.x - radioActual}
                    y={sis.y - radioActual}
                    width={radioActual * 2}
                    height={radioActual * 2}
                    clipPath={`url(#clip-${sis.id})`}
                    preserveAspectRatio="xMidYMid slice"
                    style={{ transition: 'all 0.25s' }}
                  />
                )}

                <circle
                  cx={sis.x} cy={sis.y} r={radioActual}
                  fill="none"
                  stroke={colorDueno ?? '#4a5568'}
                  strokeWidth={esSeleccion ? 2.5 : 1.2}
                  style={{ transition: 'all 0.25s' }}
                />

                <text x={sis.x} y={sis.y + radioActual + 14} className="mg-nombre">
                  {sis.nombre}
                </text>

                {sis.propietario && (
                  <text
                    x={sis.x} y={sis.y + radioActual + 26}
                    textAnchor="middle"
                    fill={colorDueno}
                    fontSize="9"
                    opacity="0.9"
                    pointerEvents="none"
                  >
                    {sis.propietario}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {sistemaSeleccionado && (
        <SistemaPopup
          sistema={sistemaSeleccionado}
          onClose={() => setSistemaSeleccionado(null)}
          position={popupPosition}
        />
      )}
    </div>
  );
}