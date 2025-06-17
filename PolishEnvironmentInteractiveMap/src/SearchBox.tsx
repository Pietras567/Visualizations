import React, {useMemo, useState} from 'react';
import type {
    IAqMeasurement,
    IHydro2Measurement,
    IHydroMeasurement,
    IMeteoMeasurement,
    ISynopMeasurement
} from "./dexie.tsx";

export interface SearchResult {
    type: 'hydro' | 'hydro2' | 'synop' | 'meteo' | 'aq';
    measurement: IHydroMeasurement | IHydro2Measurement | ISynopMeasurement | IMeteoMeasurement | IAqMeasurement;
    displayName: string;
    searchText: string;
}

interface SearchBoxProps {
    hydroMeasurements: IHydroMeasurement[];
    hydro2Measurements: IHydro2Measurement[];
    synopMeasurements: ISynopMeasurement[];
    meteoMeasurements: IMeteoMeasurement[];
    aqMeasurements: IAqMeasurement[];
    onResultSelect: (result: SearchResult) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({
                                                 hydroMeasurements,
                                                 hydro2Measurements,
                                                 synopMeasurements,
                                                 meteoMeasurements,
                                                 aqMeasurements,
                                                 onResultSelect
                                             }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const searchableData = useMemo(() => {
        const results: SearchResult[] = [];

        hydroMeasurements.forEach(measurement => {
            if (measurement.lat && measurement.lon) {
                const displayName = `${measurement.stacja || 'Niezn. stacja'} (Hydrologiczna)`;
                const searchText = [
                    measurement.stacja,
                    measurement.rzeka,
                    measurement.województwo,
                    measurement.id_stacji?.toString(),
                    'hydro'
                ].filter(Boolean).join(' ').toLowerCase();

                results.push({
                    type: 'hydro',
                    measurement,
                    displayName,
                    searchText
                });
            }
        });

        hydro2Measurements.forEach(measurement => {
            if (measurement.lat && measurement.lon) {
                const displayName = `${measurement.nazwa_stacji || 'Niezn. stacja'} (Hydrologiczna 2)`;
                const searchText = [
                    measurement.nazwa_stacji,
                    measurement.kod_stacji?.toString(),
                    'hydro2'
                ].filter(Boolean).join(' ').toLowerCase();

                results.push({
                    type: 'hydro2',
                    measurement,
                    displayName,
                    searchText
                });
            }
        });

        synopMeasurements.forEach(measurement => {
            if (measurement.lat && measurement.lon) {
                const displayName = `${measurement.stacja || 'Niezn. stacja'} (Synoptyczna)`;
                const searchText = [
                    measurement.stacja,
                    measurement.id_stacji?.toString(),
                    'synop'
                ].filter(Boolean).join(' ').toLowerCase();

                results.push({
                    type: 'synop',
                    measurement,
                    displayName,
                    searchText
                });
            }
        });

        meteoMeasurements.forEach(measurement => {
            if (measurement.lat && measurement.lon) {
                const displayName = `${measurement.nazwa_stacji || 'Niezn. stacja'} (Meteorologiczna)`;
                const searchText = [
                    measurement.nazwa_stacji,
                    measurement.kod_stacji?.toString(),
                    'meteo'
                ].filter(Boolean).join(' ').toLowerCase();

                results.push({
                    type: 'meteo',
                    measurement,
                    displayName,
                    searchText
                });
            }
        });

        aqMeasurements.forEach(measurement => {
            if (measurement.lat && measurement.lon) {
                const displayName = `${measurement.location} (Jakość powietrza)`;
                const searchText = [
                    measurement.location,
                    'aq'
                ].filter(Boolean).join(' ').toLowerCase();
                results.push({type: 'aq', measurement, displayName, searchText});
            }
        });

        return results;
    }, [hydroMeasurements, hydro2Measurements, synopMeasurements, meteoMeasurements, aqMeasurements]);

    const filteredResults = useMemo(() => {
        if (!searchTerm.trim()) return [];

        const term = searchTerm.toLowerCase().trim();
        return searchableData
            .filter(item => item.searchText.includes(term))
            .slice(0, 10);
    }, [searchableData, searchTerm]);

    const handleResultClick = (result: SearchResult) => {
        setSearchTerm(result.displayName);
        setIsOpen(false);
        onResultSelect(result);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputBlur = () => {
        setTimeout(() => setIsOpen(false), 200);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'hydro':
                return '💧';
            case 'hydro2':
                return '🌊';
            case 'synop':
                return '🌤️';
            case 'meteo':
                return '🌡️';
            case 'aq':
                return '🌫️';
            default:
                return '📍';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'hydro':
                return '#0066cc';
            case 'hydro2':
                return '#0099ff';
            case 'synop':
                return '#ff6600';
            case 'meteo':
                return '#00cc66';
            case 'aq':
                return '#95A5A6';
            default:
                return '#666';
        }
    };

    return (
        <div style={{
            position: 'relative',
            width: '300px',
            zIndex: 1001
        }}>
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
            }}>
                <span style={{
                    position: 'absolute',
                    left: '10px',
                    fontSize: '16px',
                    color: '#666',
                    zIndex: 1
                }}>🔍</span>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="Szukaj stacji pomiarowej..."
                    style={{
                        width: '100%',
                        padding: '10px 40px 10px 35px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#007bff';
                        handleInputFocus();
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#ddd';
                        handleInputBlur();
                    }}
                />
                {searchTerm && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setIsOpen(false);
                        }}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >×</button>
                )}
            </div>

            {isOpen && filteredResults.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {filteredResults.map((result, index) => {
                        const measurement = result.measurement as any;
                        return (
                            <div
                                key={index}
                                onClick={() => handleResultClick(result)}
                                style={{
                                    padding: '12px 15px',
                                    borderBottom: index < filteredResults.length - 1 ? '1px solid #eee' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                }}
                            >
                                <div style={{
                                    width: '12px',
                                    height: '12px',
                                    backgroundColor: getTypeColor(result.type),
                                    borderRadius: '50%',
                                    flexShrink: 0
                                }}></div>
                                <span style={{fontSize: '14px'}}>
                                    {getTypeIcon(result.type)}
                                </span>
                                <div style={{flex: 1}}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        color: '#333'
                                    }}>
                                        {result.displayName}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#666',
                                        marginTop: '2px'
                                    }}>
                                        {result.type === 'hydro' && (measurement as IHydroMeasurement).rzeka &&
                                            `Rzeka: ${(measurement as IHydroMeasurement).rzeka}`}
                                        {result.type === 'hydro' && (measurement as IHydroMeasurement).województwo &&
                                            ` • ${(measurement as IHydroMeasurement).województwo}`}
                                        {(result.type === 'hydro2' || result.type === 'meteo') &&
                                            `Kod: ${measurement.kod_stacji}`}
                                        {(result.type === 'hydro' || result.type === 'synop') &&
                                            `ID: ${measurement.id_stacji}`}
                                        {result.type === 'aq' && `ID: ${measurement.locationId}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isOpen && searchTerm && filteredResults.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ddd',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '15px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    Brak wyników dla "{searchTerm}"
                </div>
            )}
        </div>
    );
};

export default SearchBox;