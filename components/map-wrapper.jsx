// components/MapWrapper.jsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Leaflet map component with ssr: false
const LeafletMap = dynamic(() => import('./leaflet-map.tsx'), {
  ssr: false,
});

export default function MapWrapper() {
  return (
    <div style={{ height: '500px', width: '100%', zIndex: 1 }}>
      <LeafletMap />
    </div>
  );
}