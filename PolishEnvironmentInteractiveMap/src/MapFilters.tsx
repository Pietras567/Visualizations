import React, {useState} from 'react';

export interface FilterState {
    showHydro: boolean;
    showHydro2: boolean;
    showSynop: boolean;
    showMeteo: boolean;
    showAq: boolean;
    hydroTemperatureRange: {
        min: number;
        max: number;
    };
    hydroWaterLevelRange: {
        min: number;
        max: number;
    };
    synopTemperatureRange: {
        min: number;
        max: number;
    };
    pressureRange: {
        min: number;
        max: number;
    };
    synopWindSpeedRange: {
        min: number;
        max: number;
    };
    synopHumidityRange: {
        min: number;
        max: number;
    };
    synopPrecipitationRange: {
        min: number;
        max: number;
    };
    meteoTemperatureRange: {
        min: number;
        max: number;
    };
    meteoWindSpeedRange: {
        min: number;
        max: number;
    };
    meteoHumidityRange: {
        min: number;
        max: number;
    };
    meteoPrecipitationRange: {
        min: number;
        max: number;
    };
    hydro2WaterLevelRange: {
        min: number;
        max: number;
    };
    flowRange: {
        min: number;
        max: number;
    };
    selectedRiver: string;
    selectedIcePhenomena: string;
    selectedGrowthPhenomena: string;
    showOnlyWithIce: boolean;
    showOnlyWithGrowth: boolean;

    aqIndexRange: { min: number; max: number };
    requireSo2: boolean;
    requireNo2: boolean;
    requirePm10: boolean;
    requirePm25: boolean;
    requireO3: boolean;
    requireCo: boolean;
    requireC6h6: boolean;
}

interface MapFiltersProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    rivers: string[];
    growthPhenomena: string[];
}

const ICE_PHENOMENA = {
    '01': 'Śryż',
    '02': 'Kra',
    '03': 'Lód brzegowy',
    '04': 'Pokrywa lodowa',
    '05': 'Zator lodowy',
    '06': 'Lód brzegowy i śryż',
    '07': 'Lód brzegowy i kra',
    '08': 'Śryż i kra',
    '09': 'Zator śryżowy',
    '32': 'Lód zatokowy',
    '41': 'Woda na lodzie',
    '42': 'Lód pływający (wolny od brzegów)',
    '43': 'Lód zmurszały (dziurawy)'
};

const MapFilters: React.FC<MapFiltersProps> = ({
                                                   filters,
                                                   onFiltersChange,
                                                   rivers,
                                                   growthPhenomena
                                               }) => {
    const [expandedSections, setExpandedSections] = useState({
        hydro: false,
        hydro2: false,
        synop: false,
        meteo: false,
        aq: false,
    });

    const [showHelp, setShowHelp] = useState({
        ice: false,
        growth: false
    });

    const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    const updateRangeFilter = (
        rangeKey: 'hydroTemperatureRange' | 'synopTemperatureRange' | 'meteoTemperatureRange' | 'pressureRange' | 'synopWindSpeedRange' | 'meteoWindSpeedRange' | 'hydroWaterLevelRange' | 'hydro2WaterLevelRange' | 'flowRange' | 'synopHumidityRange' | 'meteoHumidityRange' | 'synopPrecipitationRange' | 'meteoPrecipitationRange' | 'aqIndexRange',
        type: 'min' | 'max',
        value: number
    ) => {
        const newFilters = {
            ...filters,
            [rangeKey]: {
                ...filters[rangeKey],
                [type]: value
            }
        };
        onFiltersChange(newFilters);
    };

    const resetFilters = () => {
        onFiltersChange({
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
            aqIndexRange: {min: 0, max: 5},
            requireSo2: false,
            requireNo2: false,
            requirePm10: false,
            requirePm25: false,
            requireO3: false,
            requireCo: false,
            requireC6h6: false,
        });
    };

    const defaultRanges: Record<keyof FilterState, { min: number; max: number }> = {
        hydroTemperatureRange: {min: -50, max: 50},
        hydroWaterLevelRange: {min: -500, max: 1000},
        synopTemperatureRange: {min: -50, max: 50},
        pressureRange: {min: 900, max: 1100},
        synopWindSpeedRange: {min: 0, max: 50},
        synopHumidityRange: {min: 0, max: 100},
        synopPrecipitationRange: {min: 0, max: 200},
        meteoTemperatureRange: {min: -50, max: 50},
        meteoWindSpeedRange: {min: 0, max: 50},
        meteoHumidityRange: {min: 0, max: 100},
        meteoPrecipitationRange: {min: 0, max: 200},
        hydro2WaterLevelRange: {min: -500, max: 1000},
        flowRange: {min: 0, max: 10000},
        aqIndexRange: {min: 0, max: 5},
        showHydro: {
            min: 0,
            max: 0
        },
        showHydro2: {
            min: 0,
            max: 0
        },
        showSynop: {
            min: 0,
            max: 0
        },
        showMeteo: {
            min: 0,
            max: 0
        },
        showAq: {
            min: 0,
            max: 0
        },
        selectedRiver: {
            min: 0,
            max: 0
        },
        selectedIcePhenomena: {
            min: 0,
            max: 0
        },
        selectedGrowthPhenomena: {
            min: 0,
            max: 0
        },
        showOnlyWithIce: {
            min: 0,
            max: 0
        },
        showOnlyWithGrowth: {
            min: 0,
            max: 0
        },
        requireSo2: {
            min: 0,
            max: 0
        },
        requireNo2: {
            min: 0,
            max: 0
        },
        requirePm10: {
            min: 0,
            max: 0
        },
        requirePm25: {
            min: 0,
            max: 0
        },
        requireO3: {
            min: 0,
            max: 0
        },
        requireCo: {
            min: 0,
            max: 0
        },
        requireC6h6: {
            min: 0,
            max: 0
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const createSectionHeader = (
        title: string,
        color: string,
        isVisible: boolean,
        onToggleVisibility: () => void,
        sectionKey: keyof typeof expandedSections,
        count?: number
    ) => (
        <div style={{marginBottom: '10px'}}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                cursor: 'pointer',
                userSelect: 'none'
            }}
                 onClick={() => toggleSection(sectionKey)}
            >
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={onToggleVisibility}
                        onClick={(e) => e.stopPropagation()}
                        style={{cursor: 'pointer'}}
                    />
                    <div style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: color,
                        borderRadius: '50%'
                    }}></div>
                    <span style={{fontWeight: 'bold', fontSize: '14px'}}>
                        {title} {count !== undefined && `(${count})`}
                    </span>
                </div>
                <span style={{
                    fontSize: '18px',
                    color: '#666',
                    transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }}>
                    ▼
                </span>
            </div>
        </div>
    );

    const createRangeInput = (
        label: string,
        rangeKey: 'hydroTemperatureRange' | 'synopTemperatureRange' | 'meteoTemperatureRange' | 'pressureRange' | 'synopWindSpeedRange' | 'meteoWindSpeedRange' | 'hydroWaterLevelRange' | 'hydro2WaterLevelRange' | 'flowRange' | 'synopHumidityRange' | 'meteoHumidityRange' | 'synopPrecipitationRange' | 'meteoPrecipitationRange' | 'aqIndexRange',
        unit: string,
        icon: string,
        helpText?: string
    ) => {
        const {min, max} = filters[rangeKey] as { min: number, max: number };
        const {min: allowedMin, max: allowedMax} = defaultRanges[rangeKey];
        const startPct = ((min - allowedMin) / (allowedMax - allowedMin)) * 100;
        const endPct = ((max - allowedMin) / (allowedMax - allowedMin)) * 100;

        const handleMinChange = (value: number) => {
            const newMin = Math.min(value, max - 1);
            updateRangeFilter(rangeKey, 'min', newMin);
        };

        const handleMaxChange = (value: number) => {
            const newMax = Math.max(value, min + 1);
            updateRangeFilter(rangeKey, 'max', newMax);
        };

        return (
            <div style={{marginBottom: '12px'}}>
                <div style={{fontWeight: 'bold', marginBottom: '5px', fontSize: '13px'}}>
                    {icon} {label}:
                    {helpText && (
                        <span style={{fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '5px'}}>
                ({helpText})
            </span>
                    )}
                </div>
                <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                    <input
                        type="number"
                        min={allowedMin}
                        max={allowedMax}
                        value={filters[rangeKey].min}
                        onChange={(e) => updateRangeFilter(rangeKey, 'min', Number(e.target.value))}
                        placeholder="Min"
                        style={{
                            width: '70px',
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            fontSize: '12px'
                        }}
                    />
                    <span style={{fontSize: '12px', color: '#666'}}>-</span>
                    <input
                        type="number"
                        min={allowedMin}
                        max={allowedMax}
                        value={filters[rangeKey].max}
                        onChange={(e) => updateRangeFilter(rangeKey, 'max', Number(e.target.value))}
                        placeholder="Max"
                        style={{
                            width: '70px',
                            padding: '4px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            fontSize: '12px'
                        }}
                    />
                    <span style={{fontSize: '11px', color: '#888'}}>{unit}</span>
                </div>
                <div style={{position: 'relative', height: '28px', marginTop: '8px'}}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '0',
                        right: '0',
                        height: '4px',
                        background: '#e0e0e0',
                        borderRadius: '2px',
                        transform: 'translateY(-50%)'
                    }}/>

                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${startPct}%`,
                        width: `${endPct - startPct}%`,
                        height: '4px',
                        background: '#007bff',
                        borderRadius: '2px',
                        transform: 'translateY(-50%)'
                    }}/>

                    <input
                        type='range'
                        min={allowedMin}
                        max={allowedMax}
                        value={min}
                        onChange={e => handleMinChange(Number(e.target.value))}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '28px',
                            opacity: 0,
                            cursor: 'pointer',
                            pointerEvents: 'none'
                        }}
                    />

                    <input
                        type='range'
                        min={allowedMin}
                        max={allowedMax}
                        value={max}
                        onChange={e => handleMaxChange(Number(e.target.value))}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '28px',
                            opacity: 0,
                            cursor: 'pointer',
                            pointerEvents: 'none'
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${startPct}%`,
                            width: '16px',
                            height: '16px',
                            background: '#007bff',
                            border: '2px solid white',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            zIndex: 2
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = min;
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const width = rect.width;

                            const handleMouseMove = (e: MouseEvent) => {
                                const deltaX = e.clientX - startX;
                                const deltaValue = (deltaX / width) * (allowedMax - allowedMin);
                                const newValue = Math.round(Math.max(allowedMin, Math.min(allowedMax, startValue + deltaValue)));
                                handleMinChange(newValue);
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />

                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${endPct}%`,
                            width: '16px',
                            height: '16px',
                            background: '#007bff',
                            border: '2px solid white',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            zIndex: 2
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            const startX = e.clientX;
                            const startValue = max;
                            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                            const width = rect.width;

                            const handleMouseMove = (e: MouseEvent) => {
                                const deltaX = e.clientX - startX;
                                const deltaValue = (deltaX / width) * (allowedMax - allowedMin);
                                const newValue = Math.round(Math.max(allowedMin, Math.min(allowedMax, startValue + deltaValue)));
                                handleMaxChange(newValue);
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />
                </div>
            </div>
        )
    };

    const createSelectInput = (
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: { [key: string]: string } | string[],
        icon: string,
        placeholder: string = "Wszystkie",
        helpKey?: 'ice' | 'growth'
    ) => (
        <div style={{marginBottom: '12px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px'}}>
                <label style={{fontWeight: 'bold', fontSize: '13px'}}>
                    {icon} {label}:
                </label>
                {helpKey && (
                    <button
                        onClick={() => setShowHelp(prev => ({...prev, [helpKey]: !prev[helpKey]}))}
                        style={{
                            background: 'none',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ?
                    </button>
                )}
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: 'white'
                }}
            >
                <option value="">{placeholder}</option>
                {Array.isArray(options) ?
                    options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    )) :
                    Object.entries(options).map(([key, description]) => (
                        <option key={key} value={key}>{key} - {description}</option>
                    ))
                }
            </select>
            {helpKey && showHelp[helpKey] && (
                <div style={{
                    marginTop: '5px',
                    padding: '8px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '11px',
                    border: '1px solid #e9ecef'
                }}>
                    {helpKey === 'ice' && Object.entries(ICE_PHENOMENA).map(([code, desc]) => (
                        <div key={code}><strong>{code}:</strong> {desc}</div>
                    ))}
                    {helpKey === 'growth' && (
                        <div>
                            Kody zarastania - wartości liczbowe reprezentujące różne stopnie zarastania zbiorników
                            wodnych
                            <div>
                                <div style={{fontWeight: 'bold', marginBottom: '5px'}}>Format kodu: dpw</div>
                                <div style={{marginBottom: '5px'}}>
                                    <strong>Rodzaj roślinności:</strong><br/>
                                    d - denna (zanurzona)<br/>
                                    p - pływająca<br/>
                                    w - wystająca nad wodę
                                </div>
                                <div>
                                    <strong>Stopień zarośnięcia:</strong><br/>
                                    0 - brak, 1 - 1/3, 2 - 2/3, 3 - całkowite<br/>
                                    <em>Np. 112 = d1 p1 w2</em>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const createCheckbox = (label: string, checked: boolean, onChange: () => void, icon: string) => (
        <div style={{marginBottom: '8px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px'}}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    style={{marginRight: '8px', cursor: 'pointer'}}
                />
                {icon} {label}
            </label>
        </div>
    );

    return (
        <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '280px',
            maxHeight: '80vh',
            overflowY: 'auto',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontSize: '12px'
        }}>
            <div style={{marginBottom: '15px', textAlign: 'center'}}>
                <h3 style={{margin: '0 0 10px 0', fontSize: '16px', color: '#333'}}>Filtry Mapy</h3>
                <button
                    onClick={resetFilters}
                    style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    🔄 Resetuj filtry
                </button>
            </div>

            {createSectionHeader('Hydrologiczna', '#0066cc', filters.showHydro, () => updateFilter('showHydro', !filters.showHydro), 'hydro')}
            {expandedSections.hydro && filters.showHydro && (
                <div style={{
                    marginLeft: '20px',
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f8f9ff',
                    borderRadius: '6px',
                    borderLeft: '3px solid #0066cc'
                }}>
                    {createSelectInput('Rzeka', filters.selectedRiver, (value) => updateFilter('selectedRiver', value), rivers, '🏞️')}

                    {createRangeInput('Temperatura wody', 'hydroTemperatureRange', '°C', '🌡️')}

                    {createRangeInput('Stan wody', 'hydroWaterLevelRange', 'cm', '📏')}

                    {createCheckbox('Tylko stacje ze zjawiskami lodowymi', filters.showOnlyWithIce, () => updateFilter('showOnlyWithIce', !filters.showOnlyWithIce), '🧊')}

                    {createCheckbox('Tylko stacje z zarastaniem', filters.showOnlyWithGrowth, () => updateFilter('showOnlyWithGrowth', !filters.showOnlyWithGrowth), '🌿')}

                    {createSelectInput('Zjawisko lodowe', filters.selectedIcePhenomena, (value) => updateFilter('selectedIcePhenomena', value), ICE_PHENOMENA, '🧊', 'Wszystkie', 'ice')}

                    {createSelectInput('Kod zarastania', filters.selectedGrowthPhenomena, (value) => updateFilter('selectedGrowthPhenomena', value), growthPhenomena, '🌿', 'Wszystkie', 'growth')}
                </div>
            )}

            {createSectionHeader('Hydrologiczna 2', '#0099ff', filters.showHydro2, () => updateFilter('showHydro2', !filters.showHydro2), 'hydro2')}
            {expandedSections.hydro2 && filters.showHydro2 && (
                <div style={{
                    marginLeft: '20px',
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '6px',
                    borderLeft: '3px solid #0099ff'
                }}>
                    {createRangeInput('Stan wody', 'hydro2WaterLevelRange', 'cm', '📏')}

                    {createRangeInput('Przepływ', 'flowRange', 'm³/s', '🌊')}
                </div>
            )}

            {createSectionHeader('Synoptyczna', '#ff6600', filters.showSynop, () => updateFilter('showSynop', !filters.showSynop), 'synop')}
            {expandedSections.synop && filters.showSynop && (
                <div style={{
                    marginLeft: '20px',
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#fff8f0',
                    borderRadius: '6px',
                    borderLeft: '3px solid #ff6600'
                }}>
                    {createRangeInput('Temperatura', 'synopTemperatureRange', '°C', '🌡️')}

                    {createRangeInput('Ciśnienie', 'pressureRange', 'hPa', '🌀')}

                    {createRangeInput('Prędkość wiatru', 'synopWindSpeedRange', 'm/s', '💨')}

                    {createRangeInput('Wilgotność względna', 'synopHumidityRange', '%', '💧')}

                    {createRangeInput('Suma opadu', 'synopPrecipitationRange', 'mm', '🌧️')}
                </div>
            )}

            {createSectionHeader('Meteorologiczna', '#00cc66', filters.showMeteo, () => updateFilter('showMeteo', !filters.showMeteo), 'meteo')}
            {expandedSections.meteo && filters.showMeteo && (
                <div style={{
                    marginLeft: '20px',
                    marginBottom: '15px',
                    padding: '12px',
                    backgroundColor: '#f0fff4',
                    borderRadius: '6px',
                    borderLeft: '3px solid #00cc66'
                }}>
                    {createRangeInput('Temperatura gruntu', 'meteoTemperatureRange', '°C', '🌱')}

                    {createRangeInput('Średnia prędkość wiatru', 'meteoWindSpeedRange', 'm/s', '💨')}

                    {createRangeInput('Wilgotność względna', 'meteoHumidityRange', '%', '💧')}

                    {createRangeInput('Opad (10min)', 'meteoPrecipitationRange', 'mm', '🌧️')}
                </div>
            )}

            {createSectionHeader('Jakość powietrza', '#95A5A6', filters.showAq, () => updateFilter('showAq', !filters.showAq), 'aq')}
            {expandedSections.aq && filters.showAq && (
                <div style={{
                    marginLeft: '20px',
                    padding: '12px',
                    borderLeft: '3px solid #91fbfb',
                    backgroundColor: '#f4ffff',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    {createRangeInput('Ogólny indeks', 'aqIndexRange', '', '🌫️')}
                    {createCheckbox('Wymagaj SO₂', filters.requireSo2, () => updateFilter('requireSo2', !filters.requireSo2), '')}
                    {createCheckbox('Wymagaj NO₂', filters.requireNo2, () => updateFilter('requireNo2', !filters.requireNo2), '')}
                    {createCheckbox('Wymagaj PM10', filters.requirePm10, () => updateFilter('requirePm10', !filters.requirePm10), '')}
                    {createCheckbox('Wymagaj PM2.5', filters.requirePm25, () => updateFilter('requirePm25', !filters.requirePm25), '')}
                    {createCheckbox('Wymagaj O₃', filters.requireO3, () => updateFilter('requireO3', !filters.requireO3), '')}
                    {createCheckbox('Wymagaj CO', filters.requireCo, () => updateFilter('requireCo', !filters.requireCo), '')}
                    {createCheckbox('Wymagaj C₆H₆', filters.requireC6h6, () => updateFilter('requireC6h6', !filters.requireC6h6), '')}
                </div>
            )}
        </div>
    );
};

export default MapFilters;
