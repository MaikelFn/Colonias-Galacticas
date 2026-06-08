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
  const [popupPosition, setPopupPosition]             = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
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
    const total  = sistemas.length;
    const centroX = 400, centroY = 300, radio = 220;
    return sistemas.map((sis, index) => {
      const tieneCoords = typeof sis.x === 'number' && typeof sis.y === 'number';
      const angulo = (2 * Math.PI * index) / total;
      return {
        ...sis,
        x: tieneCoords ? sis.x : centroX + radio * Math.cos(angulo),
        y: tieneCoords ? sis.y : centroY + radio * Math.sin(angulo),
      };
    });
  }, [sistemas]);

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
    setPopupPosition({ x: rect.right, y: rect.top + rect.height / 2 });
    setSistemaSeleccionado(sis);
    if (onSistemaClick) onSistemaClick(sis);
  }

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