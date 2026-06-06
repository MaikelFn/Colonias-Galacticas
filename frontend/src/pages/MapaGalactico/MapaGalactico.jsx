import React, { useMemo } from 'react';
import './MapaGalactico.css';

export default function MapaGalactico({ sistemas, rutas, jugadores, onSistemaClick }) {

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

  return (
    <svg className="mg-svg" viewBox="0 0 800 600">
      {rutas.map((ruta, i) => {
        const s1 = sistemasConCoords.find(s => s.id === ruta[0]);
        const s2 = sistemasConCoords.find(s => s.id === ruta[1]);
        return s1 && s2 ? (
          <line key={i} x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} className="mg-ruta" />
        ) : null;
      })}
      {sistemasConCoords.map((sis) => (
        <g key={sis.id} className="mg-sistema" onClick={() => onSistemaClick(sis)}>
          <circle cx={sis.x} cy={sis.y} r="12" className="mg-nodo" />
          <text x={sis.x} y={sis.y + 30} className="mg-nombre">{sis.nombre}</text>
        </g>
      ))}
    </svg>
  );
}