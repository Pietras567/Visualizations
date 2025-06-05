// src/MapFullScreen.tsx
import React, {useEffect, useRef} from 'react';
import L, {Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
    center?: [number, number];
    zoom?: number;
}

const Map: React.FC<MapProps> = ({center = [52.2297, 21.0122], zoom = 12}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletInstance = useRef<LeafletMap | null>(null);

    useEffect(() => {
        if (mapRef.current && !leafletInstance.current) {
            leafletInstance.current = L.map(mapRef.current).setView(center, zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(leafletInstance.current);
        }

        return () => {
            if (leafletInstance.current) {
                leafletInstance.current.remove();
                leafletInstance.current = null;
            }
        };
    }, [center, zoom]);

    return <div ref={mapRef} className="leaflet-container"/>;
};

export default Map;
