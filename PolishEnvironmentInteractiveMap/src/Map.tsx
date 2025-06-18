import React, {useEffect, useMemo, useRef} from 'react';
import L, {Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
    IAqMeasurement,
    IHydro2Measurement,
    IHydroMeasurement,
    IMeteoMeasurement,
    ISynopMeasurement
} from "./dexie.tsx";
import MapFilters, {type FilterState} from "./MapFilters.tsx";
import SearchBox, {type SearchResult} from "./SearchBox.tsx";
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import StatisticsPanel from "./StatisticsPanel.tsx";

interface MapProps {
    center?: [number, number];
    zoom?: number;
    hydroMeasurements: IHydroMeasurement[];
    hydro2Measurements: IHydro2Measurement[];
    synopMeasurements: ISynopMeasurement[];
    meteoMeasurements: IMeteoMeasurement[];
    aqMeasurements: IAqMeasurement[];
}

const Map: React.FC<MapProps> = ({
                                     center = [52.2297, 21.0122],
                                     zoom = 6,
                                     hydroMeasurements,
                                     hydro2Measurements,
                                     synopMeasurements,
                                     meteoMeasurements,
                                     aqMeasurements
                                 }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletInstance = useRef<LeafletMap | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const highlightMarkerRef = useRef<L.Marker | null>(null);

    const [filters, setFilters] = React.useState<FilterState>({
        showHydro: true,
        showHydro2: true,
        showSynop: true,
        showMeteo: true,
        showAq: true,
        hydroTemperatureRange: {min: -50, max: 50},
        synopTemperatureRange: {min: -50, max: 50},
        meteoTemperatureRange: {min: -50, max: 50},
        pressureRange: {min: 900, max: 1100},
        synopWindSpeedRange: {min: 0, max: 50},
        meteoWindSpeedRange: {min: 0, max: 50},
        hydroWaterLevelRange: {min: -500, max: 1000},
        hydro2WaterLevelRange: {min: -500, max: 1000},
        flowRange: {min: 0, max: 10000},
        synopHumidityRange: {min: 0, max: 100},
        meteoHumidityRange: {min: 0, max: 100},
        synopPrecipitationRange: {min: 0, max: 200},
        meteoPrecipitationRange: {min: 0, max: 200},
        selectedRiver: '',
        selectedIcePhenomena: '',
        selectedGrowthPhenomena: '',
        showOnlyWithIce: false,
        showOnlyWithGrowth: false,
        requireSo2: false,
        requireC6h6: false,
        requireO3: false,
        requireCo: false,
        requirePm10: false,
        requirePm25: false,
        requireNo2: false,
        aqIndexRange: {min: 0, max: 5},
    });

    const uniqueValues = useMemo(() => {
        const rivers = new Set<string>();
        const growthPhenomena = new Set<string>();

        hydroMeasurements.forEach(m => {
            if (m.rzeka) rivers.add(m.rzeka);
            if (m.zjawisko_zarastania) growthPhenomena.add(String(m.zjawisko_zarastania));
        });

        return {
            rivers: Array.from(rivers).sort(),
            growthPhenomena: Array.from(growthPhenomena).sort()
        };
    }, [hydroMeasurements]);

    const hasValidValue = (value: unknown): value is number => {
        if (value === null || value === undefined) return false;

        if (typeof value === 'number' && !isNaN(value)) return true;

        if (typeof value === 'string') {
            const num = parseFloat(value);
            return !isNaN(num);
        }

        return false;
    };

    const toNumber = (value: unknown): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return parseFloat(value);
        return 0;
    };

    const isFilterActive = (rangeKey: keyof FilterState, defaultMin: number, defaultMax: number): boolean => {
        const range = filters[rangeKey] as { min: number; max: number };
        return range.min !== defaultMin || range.max !== defaultMax;
    };

    const filteredData = useMemo(() => {
        const filteredHydro = filters.showHydro ? hydroMeasurements.filter((measurement) => {
            if (filters.selectedRiver && measurement.rzeka !== filters.selectedRiver) {
                return false;
            }

            if (filters.showOnlyWithIce && (!measurement.zjawisko_lodowe || measurement.zjawisko_lodowe == 0)) {
                return false;
            }

            if (filters.showOnlyWithGrowth && (!measurement.zjawisko_zarastania || measurement.zjawisko_zarastania == 0)) {
                return false;
            }

            if (filters.selectedIcePhenomena && String(measurement.zjawisko_lodowe) !== filters.selectedIcePhenomena) {
                return false;
            }

            if (filters.selectedGrowthPhenomena && String(measurement.zjawisko_zarastania) !== filters.selectedGrowthPhenomena) {
                return false;
            }

            if (isFilterActive('hydroTemperatureRange', -50, 50)) {
                if (!hasValidValue(measurement.temperatura_wody)) {
                    return false;
                }
                const temp = toNumber(measurement.temperatura_wody);
                if (temp < filters.hydroTemperatureRange.min || temp > filters.hydroTemperatureRange.max) {
                    return false;
                }
            }

            if (isFilterActive('hydroWaterLevelRange', -500, 1000)) {
                if (!hasValidValue(measurement.stan_wody)) {
                    return false;
                }
                const stan = toNumber(measurement.stan_wody);
                if (stan < filters.hydroWaterLevelRange.min || stan > filters.hydroWaterLevelRange.max) {
                    return false;
                }
            }

            return true;
        }) : [];

        const filteredHydro2 = filters.showHydro2 ? hydro2Measurements.filter((measurement) => {
            if (isFilterActive('hydro2WaterLevelRange', -500, 1000)) {
                if (!hasValidValue(measurement.stan)) {
                    return false;
                }
                const stan = toNumber(measurement.stan);
                if (stan < filters.hydro2WaterLevelRange.min || stan > filters.hydro2WaterLevelRange.max) {
                    return false;
                }
            }

            if (isFilterActive('flowRange', 0, 10000)) {
                if (!hasValidValue(measurement.przelyw)) {
                    return false;
                }
                const przelyw = toNumber(measurement.przelyw);
                if (przelyw < filters.flowRange.min || przelyw > filters.flowRange.max) {
                    return false;
                }
            }

            return true;
        }) : [];

        const filteredSynop = filters.showSynop ? synopMeasurements.filter((measurement) => {
            if (isFilterActive('synopTemperatureRange', -50, 50)) {
                if (!hasValidValue(measurement.temperatura)) {
                    return false;
                }
                const temp = toNumber(measurement.temperatura);
                if (temp < filters.synopTemperatureRange.min || temp > filters.synopTemperatureRange.max) {
                    return false;
                }
            }

            if (isFilterActive('pressureRange', 900, 1100)) {
                if (!hasValidValue(measurement.cisnienie)) {
                    return false;
                }
                const cisnienie = toNumber(measurement.cisnienie);
                if (cisnienie < filters.pressureRange.min || cisnienie > filters.pressureRange.max) {
                    return false;
                }
            }

            if (isFilterActive('synopWindSpeedRange', 0, 50)) {
                if (!hasValidValue(measurement.predkosc_wiatru)) {
                    return false;
                }
                const predkosc = toNumber(measurement.predkosc_wiatru);
                if (predkosc < filters.synopWindSpeedRange.min || predkosc > filters.synopWindSpeedRange.max) {
                    return false;
                }
            }

            if (isFilterActive('synopHumidityRange', 0, 100)) {
                if (!hasValidValue(measurement.wilgotnosc_wzgledna)) {
                    return false;
                }
                const wilgotnosc = toNumber(measurement.wilgotnosc_wzgledna);
                if (wilgotnosc < filters.synopHumidityRange.min || wilgotnosc > filters.synopHumidityRange.max) {
                    return false;
                }
            }

            if (isFilterActive('synopPrecipitationRange', 0, 200)) {
                if (!hasValidValue(measurement.suma_opadu)) {
                    return false;
                }
                const opady = toNumber(measurement.suma_opadu);
                if (opady < filters.synopPrecipitationRange.min || opady > filters.synopPrecipitationRange.max) {
                    return false;
                }
            }

            return true;
        }) : [];

        const filteredMeteo = filters.showMeteo ? meteoMeasurements.filter(measurement => {
            if (isFilterActive('meteoTemperatureRange', -50, 50)) {
                if (!hasValidValue(measurement.temperatura_gruntu)) {
                    return false;
                }
                const temp = toNumber(measurement.temperatura_gruntu);
                if (temp < filters.meteoTemperatureRange.min || temp > filters.meteoTemperatureRange.max) {
                    return false;
                }
            }

            if (isFilterActive('meteoWindSpeedRange', 0, 50)) {
                if (!hasValidValue(measurement.wiatr_srednia_predkosc)) {
                    return false;
                }
                const predkosc = toNumber(measurement.wiatr_srednia_predkosc);
                if (predkosc < filters.meteoWindSpeedRange.min || predkosc > filters.meteoWindSpeedRange.max) {
                    return false;
                }
            }

            if (isFilterActive('meteoHumidityRange', 0, 100)) {
                if (!hasValidValue(measurement.wilgotnosc_wzgledna)) {
                    return false;
                }
                const wilgotnosc = toNumber(measurement.wilgotnosc_wzgledna);
                if (wilgotnosc < filters.meteoHumidityRange.min || wilgotnosc > filters.meteoHumidityRange.max) {
                    return false;
                }
            }

            if (isFilterActive('meteoPrecipitationRange', 0, 200)) {
                if (!hasValidValue(measurement.opad_10min)) {
                    return false;
                }
                const opady = toNumber(measurement.opad_10min);
                if (opady < filters.meteoPrecipitationRange.min || opady > filters.meteoPrecipitationRange.max) {
                    return false;
                }
            }

            return true;
        }) : [];

        let filteredAq = filters.showAq ? aqMeasurements.slice() : [];

        filteredAq = filteredAq.filter(m => {
            const st = m.parameters.find(p => p.parameter === 'stIndexLevel');
            if (!st) return false;
            return st.indexValue >= filters.aqIndexRange.min
                && st.indexValue <= filters.aqIndexRange.max;
        });

        const requireChecks: Array<[keyof FilterState, string]> = [
            ['requireSo2', 'SO2'],
            ['requireNo2', 'NO2'],
            ['requirePm10', 'PM10'],
            ['requirePm25', 'PM2.5'],
            ['requireO3', 'O3'],
            ['requireCo', 'CO'],
            ['requireC6h6', 'C6H6'],
        ];

        requireChecks.forEach(([flag, code]) => {
            if (filters[flag]) {
                filteredAq = filteredAq.filter(m =>
                    m.parameters.some(p => p.parameter.toUpperCase() === code)
                );
            }
        });

        return {
            hydro: filteredHydro,
            hydro2: filteredHydro2,
            synop: filteredSynop,
            meteo: filteredMeteo,
            aq: filteredAq
        };
    }, [hydroMeasurements, hydro2Measurements, synopMeasurements, meteoMeasurements, aqMeasurements, filters]);

    const handleSearchResultSelect = (result: SearchResult) => {
        if (!leafletInstance.current) return;

        const measurement = result.measurement as IHydroMeasurement | IHydro2Measurement | ISynopMeasurement | IMeteoMeasurement | IAqMeasurement;
        const lat = measurement.lat;
        const lon = measurement.lon;

        if (lat && lon) {
            leafletInstance.current.setView([lat, lon], 12, {
                animate: true,
                duration: 1
            });

            if (highlightMarkerRef.current) {
                leafletInstance.current.removeLayer(highlightMarkerRef.current);
            }

            const highlightIcon = L.divIcon({
                className: 'highlight-marker',
                html: `<div style="
                    background-color: #ff0000;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 0 10px rgba(255,0,0,0.5);
                    animation: pulse 2s infinite;
                "></div>
                <style>
                    @keyframes pulse {
                        0% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.2); opacity: 0.7; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                </style>`,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            });

            highlightMarkerRef.current = L.marker([lat, lon], {
                icon: highlightIcon,
                zIndexOffset: 1000
            }).addTo(leafletInstance.current);

            leafletInstance.current.once('moveend', () => {
                const el = highlightMarkerRef.current?.getElement();
                if (el) {
                    el.querySelector('div')?.classList.add('pulse');
                }
            });

            setTimeout(() => {
                if (highlightMarkerRef.current && leafletInstance.current) {
                    leafletInstance.current.removeLayer(highlightMarkerRef.current);
                    highlightMarkerRef.current = null;
                }
            }, 5000);
        }
    };

    const goToLocation = (lat: number, lon: number) => {
        if (!leafletInstance.current) return;

        leafletInstance.current.setView([lat, lon], 12, {
            animate: true,
            duration: 1
        });

        if (highlightMarkerRef.current) {
            leafletInstance.current.removeLayer(highlightMarkerRef.current);
        }

        const highlightIcon = L.divIcon({
            className: 'highlight-marker',
            html: `<div style="
          background-color: #ff0000;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 10px rgba(255,0,0,0.5);
          animation: pulse 2s infinite;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }
        </style>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
        });

        highlightMarkerRef.current = L.marker([lat, lon], {
            icon: highlightIcon,
            zIndexOffset: 1000
        }).addTo(leafletInstance.current);

        leafletInstance.current.once('moveend', () => {
            const el = highlightMarkerRef.current?.getElement();
            if (el) {
                el.querySelector('div')?.classList.add('pulse');
            }
        });

        setTimeout(() => {
            if (highlightMarkerRef.current && leafletInstance.current) {
                leafletInstance.current.removeLayer(highlightMarkerRef.current);
                highlightMarkerRef.current = null;
            }
        }, 5000);
    };

    const createColoredIcon = (color: string) => {
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${color};
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    };

    const formatDate = (date: Date | undefined) => {
        if (!date) return 'Brak danych';
        return new Date(date).toLocaleString('pl-PL');
    };

    const formatValue = (value: unknown, unit: string = '') => {
        if (value === null || value === undefined) return 'Brak danych';

        if (typeof value === 'string') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return `${num}${unit}`;
            }
        }

        return `${value}${unit}`;
    };

    const colors = {
        hydro: '#0066cc',
        hydro2: '#0099ff',
        synop: '#ff6600',
        meteo: '#00cc66',
        aq: '#95A5A6'
    };

    useEffect(() => {
        if (mapRef.current && !leafletInstance.current) {
            leafletInstance.current = L.map(mapRef.current).setView(center, zoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(leafletInstance.current);

            markersRef.current = (L as any).markerClusterGroup({
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                maxClusterRadius: 30,
            });
            leafletInstance.current.addLayer(markersRef.current);
        }

        return () => {
            if (leafletInstance.current) {
                leafletInstance.current.remove();
                leafletInstance.current = null;
            }
        };
    }, [center, zoom]);

    useEffect(() => {
        if (!leafletInstance.current || !markersRef.current) return;

        markersRef.current.clearLayers();

        filteredData.hydro.forEach(measurement => {
            if (measurement.lat && measurement.lon && markersRef.current) {
                const marker = L.marker([measurement.lat, measurement.lon], {
                    icon: createColoredIcon(colors.hydro)
                });

                marker.bindPopup(`
                    <div style="max-width: 300px;">
                        <strong>💧 Stacja Hydrologiczna</strong><br/>
                        <strong>ID stacji:</strong> ${formatValue(measurement.id_stacji)}<br/>
                        <strong>Nazwa:</strong> ${measurement.stacja || 'Brak danych'}<br/>
                        <strong>Rzeka:</strong> ${measurement.rzeka || 'Brak danych'}<br/>
                        <strong>Województwo:</strong> ${measurement.województwo || 'Brak danych'}<br/>
                        <strong>Stan wody:</strong> ${formatValue(measurement.stan_wody, ' cm')}<br/>
                        <strong>Data pomiaru stanu:</strong> ${formatDate(measurement.stan_wody_data_pomiaru)}<br/>
                        <strong>Temperatura wody:</strong> ${formatValue(measurement.temperatura_wody, '°C')}<br/>
                        <strong>Data pomiaru temperatury:</strong> ${formatDate(measurement.temperatura_wody_data_pomiaru)}<br/>
                        <strong>Zjawisko lodowe:</strong> ${formatValue(measurement.zjawisko_lodowe)}<br/>
                        <strong>Data zjawiska lodowego:</strong> ${formatDate(measurement.zjawisko_lodowe_data_pomiaru)}<br/>
                        <strong>Zjawisko zarastania:</strong> ${formatValue(measurement.zjawisko_zarastania)}<br/>
                        <strong>Data zjawiska zarastania:</strong> ${formatDate(measurement.zjawisko_zarastania_data_pomiaru)}<br/>
                        <strong>Współrzędne:</strong> ${formatValue(measurement.lat, '°')}, ${formatValue(measurement.lon, '°')}
                    </div>
                `);

                markersRef.current.addLayer(marker);
            }
        });

        filteredData.hydro2.forEach(measurement => {
            if (measurement.lat && measurement.lon && markersRef.current) {
                const marker = L.marker([measurement.lat, measurement.lon], {
                    icon: createColoredIcon(colors.hydro2)
                });

                marker.bindPopup(`
                    <div style="max-width: 300px;">
                        <strong>🌊 Stacja Hydrologiczna 2</strong><br/>
                        <strong>Kod stacji:</strong> ${formatValue(measurement.kod_stacji)}<br/>
                        <strong>Nazwa:</strong> ${measurement.nazwa_stacji || 'Brak danych'}<br/>
                        <strong>Stan:</strong> ${formatValue(measurement.stan, ' cm')}<br/>
                        <strong>Data pomiaru stanu:</strong> ${formatDate(measurement.stan_data)}<br/>
                        <strong>Przepływ:</strong> ${formatValue(measurement.przelyw, ' m³/s')}<br/>
                        <strong>Data pomiaru przepływu:</strong> ${formatDate(measurement.przeplyw_data)}<br/>
                        <strong>Współrzędne:</strong> ${formatValue(measurement.lat, '°')}, ${formatValue(measurement.lon, '°')}
                    </div>
                `);

                markersRef.current.addLayer(marker);
            }
        });

        filteredData.synop.forEach(measurement => {
            if (measurement.lat && measurement.lon && markersRef.current) {
                const marker = L.marker([measurement.lat, measurement.lon], {
                    icon: createColoredIcon(colors.synop)
                });

                marker.bindPopup(`
                    <div style="max-width: 300px;">
                        <strong>🌤️ Stacja Synoptyczna</strong><br/>
                        <strong>ID stacji:</strong> ${formatValue(measurement.id_stacji)}<br/>
                        <strong>Nazwa:</strong> ${measurement.stacja || 'Brak danych'}<br/>
                        <strong>Data pomiaru:</strong> ${formatDate(measurement.data_pomiaru)}<br/>
                        <strong>Godzina pomiaru:</strong> ${formatValue(measurement.godzina_pomiaru)}<br/>
                        <strong>Temperatura:</strong> ${formatValue(measurement.temperatura, '°C')}<br/>
                        <strong>Prędkość wiatru:</strong> ${formatValue(measurement.predkosc_wiatru, ' m/s')}<br/>
                        <strong>Kierunek wiatru:</strong> ${formatValue(measurement.kierunek_wiatru, '°')}<br/>
                        <strong>Wilgotność względna:</strong> ${formatValue(measurement.wilgotnosc_wzgledna, '%')}<br/>
                        <strong>Suma opadu:</strong> ${formatValue(measurement.suma_opadu, ' mm')}<br/>
                        <strong>Ciśnienie:</strong> ${formatValue(measurement.cisnienie, ' hPa')}<br/>
                        <strong>Współrzędne:</strong> ${formatValue(measurement.lat, '°')}, ${formatValue(measurement.lon, '°')}
                    </div>
                `);

                markersRef.current.addLayer(marker);
            }
        });

        filteredData.meteo.forEach(measurement => {
            if (measurement.lat && measurement.lon && markersRef.current) {
                const marker = L.marker([measurement.lat, measurement.lon], {
                    icon: createColoredIcon(colors.meteo)
                });

                marker.bindPopup(`
                    <div style="max-width: 300px;">
                        <strong>🌡️ Stacja Meteorologiczna</strong><br/>
                        <strong>Kod stacji:</strong> ${formatValue(measurement.kod_stacji)}<br/>
                        <strong>Nazwa:</strong> ${measurement.nazwa_stacji || 'Brak danych'}<br/>
                        <strong>Temperatura gruntu:</strong> ${formatValue(measurement.temperatura_gruntu, '°C')}<br/>
                        <strong>Data pomiaru temp. gruntu:</strong> ${formatDate(measurement.temperatura_gruntu_data)}<br/>
                        <strong>Kierunek wiatru:</strong> ${formatValue(measurement.wiatr_kierunek, '°')}<br/>
                        <strong>Data pomiaru kier. wiatru:</strong> ${formatDate(measurement.wiatr_kierunek_data)}<br/>
                        <strong>Średnia prędkość wiatru:</strong> ${formatValue(measurement.wiatr_srednia_predkosc, ' m/s')}<br/>
                        <strong>Data śred. prędkości:</strong> ${formatDate(measurement.wiatr_srednia_predkosc_data)}<br/>
                        <strong>Maks. prędkość wiatru:</strong> ${formatValue(measurement.wiatr_predkosc_maksymalna, ' m/s')}<br/>
                        <strong>Data maks. prędkości:</strong> ${formatDate(measurement.wiatr_predkosc_maksymalna_data)}<br/>
                        <strong>Wilgotność względna:</strong> ${formatValue(measurement.wilgotnosc_wzgledna, '%')}<br/>
                        <strong>Data wilgotności:</strong> ${formatDate(measurement.wilgotnosc_wzgledna_data)}<br/>
                        <strong>Poryw wiatru (10min):</strong> ${formatValue(measurement.wiatr_poryw_10min, ' m/s')}<br/>
                        <strong>Data porywu:</strong> ${formatDate(measurement.wiatr_poryw_10min_data)}<br/>
                        <strong>Opad (10min):</strong> ${formatValue(measurement.opad_10min, ' mm')}<br/>
                        <strong>Data opadu:</strong> ${formatDate(measurement.opad_10min_data)}<br/>
                        <strong>Współrzędne:</strong> ${formatValue(measurement.lat, '°')}, ${formatValue(measurement.lon, '°')}
                    </div>
                `);

                markersRef.current.addLayer(marker);
            }
        });

        filteredData.aq.forEach(meas => {
            const {lat, lon, parameters, location} = meas;
            const lookup = (code: string) => parameters.find(p => p.parameter.toUpperCase() === code);
            const st = lookup('STINDEXLEVEL');
            const so2 = lookup('SO2');
            const no2 = lookup('NO2');
            const pm10 = lookup('PM10');
            const pm25 = lookup('PM2.5');
            const o3 = lookup('O3');
            const co = lookup('CO');
            const c6h6 = lookup('C6H6');

            const indexColors = ['#2ECC71', '#F1C40F', '#E67E22', '#E74C3C', '#8E44AD', '#7F8C8D'];
            const defaultColor = '#95A5A6';

            const getDot = (val: number | undefined) => {
                if (val === undefined || val < 0) return defaultColor;
                return indexColors[val] || defaultColor;
            };
            const stColor = getDot(st?.indexValue);
            const so2Color = getDot(so2?.indexValue);
            const no2Color = getDot(no2?.indexValue);
            const pm10Color = getDot(pm10?.indexValue);
            const pm25Color = getDot(pm25?.indexValue);
            const o3Color = getDot(o3?.indexValue);
            const coColor = getDot(co?.indexValue);
            const c6h6Color = getDot(c6h6?.indexValue);

            const marker = L.marker([lat, lon], {icon: createColoredIcon(colors.aq)});
            const tooltipHtml = `
                <div style="max-width:250px;">
                    <strong>🌫️ AQ: ${location}</strong><br/>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${stColor};border-radius:50%;margin-right:4px;"></span>
                        <strong>Ogólny:</strong> ${st?.indexText || 'Brak danych'} (${st?.indexValue ?? '-'})
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${so2Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>SO₂:</strong> ${so2?.indexText || 'Brak danych'} (${so2?.indexValue ?? '-'})${so2?.measurementValue != null ? `, ${so2.measurementValue}${so2.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${no2Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>NO₂:</strong> ${no2?.indexText || 'Brak danych'} (${no2?.indexValue ?? '-'})${no2?.measurementValue != null ? `, ${no2.measurementValue}${no2.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${pm10Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>PM10:</strong> ${pm10?.indexText || 'Brak danych'} (${pm10?.indexValue ?? '-'})${pm10?.measurementValue != null ? `, ${pm10.measurementValue}${pm10.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${pm25Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>PM2.5:</strong> ${pm25?.indexText || 'Brak danych'} (${pm25?.indexValue ?? '-'})${pm25?.measurementValue != null ? `, ${pm25.measurementValue}${pm25.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${o3Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>O₃:</strong> ${o3?.indexText || 'Brak danych'} (${o3?.indexValue ?? '-'})${o3?.measurementValue != null ? `, ${o3.measurementValue}${o3.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${coColor};border-radius:50%;margin-right:4px;"></span>
                        <strong>CO:</strong> ${co?.indexText || 'Brak danych'} (${co?.indexValue ?? '-'})${co?.measurementValue != null ? `, ${co.measurementValue}${co.measurementUnit}` : ''}
                    </div>
                    <div><span style="display:inline-block;width:10px;height:10px;background-color:${c6h6Color};border-radius:50%;margin-right:4px;"></span>
                        <strong>C₆H₆:</strong> ${c6h6?.indexText || 'Brak danych'} (${c6h6?.indexValue ?? '-'})${c6h6?.measurementValue != null ? `, ${c6h6.measurementValue}${c6h6.measurementUnit}` : ''}
                    </div>
                </div>
            `;
            marker.bindTooltip(tooltipHtml, {direction: 'top', offset: [0, -10], permanent: false});
            markersRef.current.addLayer(marker);
        });

    }, [filteredData]);

    return (
        <div style={{position: 'relative'}}>
            <div ref={mapRef} className="leaflet-container" style={{height: '100vh', width: '100%'}}/>

            <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1001
            }}>
                <SearchBox
                    hydroMeasurements={hydroMeasurements}
                    hydro2Measurements={hydro2Measurements}
                    synopMeasurements={synopMeasurements}
                    meteoMeasurements={meteoMeasurements}
                    aqMeasurements={aqMeasurements}
                    onResultSelect={handleSearchResultSelect}
                />
            </div>

            <MapFilters
                filters={filters}
                onFiltersChange={setFilters}
                rivers={uniqueValues.rivers}
                growthPhenomena={uniqueValues.growthPhenomena}
            />

            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'white',
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 1000
            }}>
                <div style={{fontWeight: 'bold', marginBottom: '5px'}}>Typy stacji:</div>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '3px'}}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.hydro,
                        borderRadius: '50%',
                        marginRight: '8px'
                    }}></div>
                    <span>💧 Hydrologiczna ({filteredData.hydro.length})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '3px'}}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.hydro2,
                        borderRadius: '50%',
                        marginRight: '8px'
                    }}></div>
                    <span>🌊 Hydrologiczna 2 ({filteredData.hydro2.length})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '3px'}}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.synop,
                        borderRadius: '50%',
                        marginRight: '8px'
                    }}></div>
                    <span>🌤️ Synoptyczna ({filteredData.synop.length})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.meteo,
                        borderRadius: '50%',
                        marginRight: '8px'
                    }}></div>
                    <span>🌡️ Meteorologiczna ({filteredData.meteo.length})</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: colors.aq,
                        borderRadius: '50%',
                        marginRight: '8px'
                    }}></div>
                    <span>🌫️ Jakość powietrza ({filteredData.aq.length})</span>
                </div>
            </div>

            <StatisticsPanel onGoToStation={goToLocation}/>
        </div>
    );
};

export default Map;
