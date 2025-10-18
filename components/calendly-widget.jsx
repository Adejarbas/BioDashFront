'use client';

import React, { useEffect } from 'react';

const CalendlyWidget = () => {
  useEffect(() => {
    // Adiciona o CSS do Calendly
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Adiciona o JavaScript do Calendly
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Inicializa o widget quando o script estiver carregado
    script.onload = () => {
      if (window.Calendly) {
        window.Calendly.initBadgeWidget({
          url: 'https://calendly.com/deadvader865',
          text: 'Clique aqui e agende já sua demonstração',
          color: '#00cd3aff',
          textColor: '#ffffff',
          branding: true
        });
      }
    };

    // Cleanup quando o componente for desmontado
    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
      // Remove o widget do Calendly se existir
      const calendlyWidget = document.querySelector('.calendly-badge-widget');
      if (calendlyWidget) {
        calendlyWidget.remove();
      }
    };
  }, []);

  return null;
};

export default CalendlyWidget;