import React, { useMemo, useState } from 'react';
import './MapaGalactico.css';

function SistemaPopup({ sistema, onClose, position }) {
  if (!sistema) return null;

  const totalProducido = sistema.totalProducido || { minerales: 0, energia: 0, cristales: 0 };
  const instalaciones = sistema.instalaciones || [];

  const contarInstalaciones = (tipo) => {
    return instalaciones.filter(inst => inst.nombre === tipo).length;
  };

  const astilleros = contarInstalaciones('Astillero');
  const minas = contarInstalaciones('Mina');
  const centrosInvestigacion = contarInstalaciones('CentralInvestigacion');
  const fortalezas = contarInstalaciones('Fortaleza');

  return (
    <div 
      className="mg-popup" 
      style={{ 
        left: position.x + 'px', 
        top: position.y + 'px' 
      }}
    >
      <div className="mg-popup-header">
        <h3>{sistema.nombre}</h3>
        <button className="mg-popup-close" onClick={onClose}>×</button>
      </div>
      <div className="mg-popup-body">
        <div className="mg-popup-section">
          <span className="mg-popup-label">Tipo:</span>
          <span className="mg-popup-value">{sistema.tipo}</span>
        </div>
        <div className="mg-popup-section">
          <span className="mg-popup-label">Propietario:</span>
          <span className="mg-popup-value">{sistema.propietario || 'Sin conquistar'}</span>
        </div>
        <div className="mg-popup-divider"></div>
        <div className="mg-popup-title">Instalaciones</div>
        <div className="mg-popup-resources">
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Astilleros</span>
            <span className="mg-resource-amount">{astilleros}</span>
          </div>
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Minas</span>
            <span className="mg-resource-amount">{minas}</span>
          </div>
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Centros Inv.</span>
            <span className="mg-resource-amount">{centrosInvestigacion}</span>
          </div>
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Fortalezas</span>
            <span className="mg-resource-amount">{fortalezas}</span>
          </div>
        </div>
        <div className="mg-popup-divider"></div>
        <div className="mg-popup-title">Total Producido</div>
        <div className="mg-popup-resources">
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Minerales</span>
            <span className="mg-resource-amount">{totalProducido.minerales}</span>
          </div>
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Energía</span>
            <span className="mg-resource-amount">{totalProducido.energia}</span>
          </div>
          <div className="mg-popup-resource">
            <span className="mg-resource-name">Cristales</span>
            <span className="mg-resource-amount">{totalProducido.cristales}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapaGalactico({ sistemas, rutas, jugadores, onSistemaClick }) {
  const [sistemaSeleccionado, setSistemaSeleccionado] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  if (!sistemas || sistemas.length === 0) {
        return <div className="mg-loading">Esperando datos galácticos...</div>;
  }

  const sistemasConCoords = useMemo(() => {
    const total = sistemas.length;
    const centroX = 400;
    const centroY = 300;
    const radio = 220;

    return sistemas.map((sis, index) => {
      const angulo = (2 * Math.PI * index) / total;
      return {
        ...sis,
        x: centroX + radio * Math.cos(angulo),
        y: centroY + radio * Math.sin(angulo)
      };
    });
  }, [sistemas]);

  const handleSistemaClick = (sis, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setSistemaSeleccionado(sis);
    if (onSistemaClick) onSistemaClick(sis);
  };

  const handleClosePopup = () => {
    setSistemaSeleccionado(null);
  };

  return (
    <div className="mg-container">
      <svg className="mg-svg" viewBox="0 0 800 600">
        {rutas.map((ruta, i) => {
          const s1 = sistemasConCoords.find(s => s.id === ruta[0]);
          const s2 = sistemasConCoords.find(s => s.id === ruta[1]);
          return s1 && s2 ? (
            <line key={i} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} className="mg-ruta" />
          ) : null;
        })}
        {sistemasConCoords.map((sis) => (
          <g key={sis.id} className="mg-sistema" onClick={(e) => handleSistemaClick(sis, e)}>
            <circle cx={sis.x} cy={sis.y} r="12" className="mg-nodo" />
            <text x={sis.x} y={sis.y + 30} className="mg-nombre">{sis.nombre}</text>
          </g>
        ))}
      </svg>
      {sistemaSeleccionado && (
        <SistemaPopup 
          sistema={sistemaSeleccionado} 
          onClose={handleClosePopup} 
          position={popupPosition}
        />
      )}
    </div>
  );
}