import React, {useEffect, useState} from 'react';
import {db, type IHydroMeasurement, type ISynopMeasurement} from './dexie.tsx';

interface StatisticsData {
    measurementType: string;
    parameter: string;
    count: number;
    min: number;
    max: number;
    avg: number;
    median: number;
    stdDev: number;
    outliers: number[];
    ranges: { range: string, count: number, percentage: number }[];
    topMinimum: { value: number, stationName: string, lat: number, lon: number }[];
    topMaximum: { value: number, stationName: string, lat: number, lon: number }[];
    q1: number;
    q3: number;
    iqr: number;
    cv: number;
    skewness: number;
    kurtosis: number;
    unit?: string;
}

interface StatisticsPanelProps {
    onGoToStation?: (lat: number, lon: number) => void;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({onGoToStation}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [statistics, setStatistics] = useState<StatisticsData[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
    const [selectedStationType, setSelectedStationType] = useState<string>('hydro');

    const stationTypes = [
        {key: 'hydro', label: 'Hydrologiczna', icon: '💧'},
        {key: 'hydro2', label: 'Hydrologiczna 2', icon: '🌊'},
        {key: 'synop', label: 'Synoptyczna', icon: '🌤️'},
        {key: 'meteo', label: 'Meteorologiczna', icon: '🌡️'},
        {key: 'aq', label: 'Jakość Powietrza', icon: '🌫️'}
    ];

    const safeParseNumber = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(parsed) ? null : parsed;
    };

    const calculateAdvancedStats = (values: number[]): {
        q1: number,
        q3: number,
        iqr: number,
        cv: number,
        skewness: number,
        kurtosis: number
    } => {
        if (values.length === 0) return {q1: 0, q3: 0, iqr: 0, cv: 0, skewness: 0, kurtosis: 0};

        const sorted = [...values].sort((a, b) => a - b);
        const n = sorted.length;

        const q1 = sorted[Math.floor(n * 0.25)];
        const q3 = sorted[Math.floor(n * 0.75)];
        const iqr = q3 - q1;

        const mean = values.reduce((sum, val) => sum + val, 0) / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

        const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
        const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n - 3;

        return {
            q1: Math.round(q1 * 100) / 100,
            q3: Math.round(q3 * 100) / 100,
            iqr: Math.round(iqr * 100) / 100,
            cv: Math.round(cv * 100) / 100,
            skewness: Math.round(skewness * 1000) / 1000,
            kurtosis: Math.round(kurtosis * 1000) / 1000
        };
    };

    const calculateStats = (values: number[], stations: any[]): Omit<StatisticsData, 'measurementType' | 'parameter' | 'unit'> => {
        if (values.length === 0) return {
            count: 0, min: 0, max: 0, avg: 0, median: 0, stdDev: 0, outliers: [], ranges: [],
            topMinimum: [], topMaximum: [], q1: 0, q3: 0, iqr: 0, cv: 0, skewness: 0, kurtosis: 0
        };

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];

        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const outliers = values.filter(val => Math.abs(val - avg) > 2 * stdDev);

        const valuesWithStations = values.map((value, index) => ({
            value,
            station: stations[index]
        }));

        const sortedByValue = [...valuesWithStations].sort((a, b) => a.value - b.value);
        const topMinimum = sortedByValue.slice(0, 5).map(item => ({
            value: item.value,
            stationName: item.station?.nazwa_stacji || item.station?.stacja || 'Nieznana stacja',
            lat: item.station?.lat || 0,
            lon: item.station?.lon || 0
        }));

        const topMaximum = sortedByValue.slice(-5).reverse().map(item => ({
            value: item.value,
            stationName: item.station?.nazwa_stacji || item.station?.stacja || 'Nieznana stacja',
            lat: item.station?.lat || 0,
            lon: item.station?.lon || 0
        }));

        const ranges = getRanges(values);
        const advancedStats = calculateAdvancedStats(values);

        return {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: Math.round(avg * 100) / 100,
            median: Math.round(median * 100) / 100,
            stdDev: Math.round(stdDev * 100) / 100,
            outliers: outliers.slice(0, 5),
            ranges,
            topMinimum,
            topMaximum,
            ...advancedStats
        };
    };

    const getRanges = (values: number[]): { range: string, count: number, percentage: number }[] => {
        if (values.length === 0) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        const bucketSize = range / 5;

        const buckets = Array.from({length: 5}, (_, i) => {
            const start = min + i * bucketSize;
            const end = i === 4 ? max : min + (i + 1) * bucketSize;
            const count = values.filter(v => v >= start && v <= end).length;
            const percentage = Math.round((count / values.length) * 100);

            return {
                range: `${Math.round(start * 10) / 10} - ${Math.round(end * 10) / 10}`,
                count,
                percentage
            };
        }).filter(bucket => bucket.count > 0);

        return buckets.sort((a, b) => b.count - a.count);
    };

    const handleGoToStation = (lat: number, lon: number) => {
        onGoToStation?.(lat, lon);
    };

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const stats: StatisticsData[] = [];

            if (selectedStationType === 'hydro') {
                const hydroData = await db.hydroMeasurements.toArray();
                if (hydroData.length > 0) {
                    const levelPairs = hydroData
                        .map(d => ({value: safeParseNumber(d.stan_wody), station: d}))
                        .filter(p => p.value !== null) as { value: number; station: IHydroMeasurement }[];

                    if (levelPairs.length > 0) {
                        const values = levelPairs.map(p => p.value);
                        const stations = levelPairs.map(p => p.station);
                        const baseStats = calculateStats(values, stations);
                        stats.push({
                            measurementType: 'Hydro',
                            parameter: 'Stan wody',
                            ...baseStats,
                            unit: 'cm'
                        });
                    }

                    const tempPairs = hydroData
                        .map(d => ({value: safeParseNumber(d.temperatura_wody), station: d}))
                        .filter(p => p.value !== null) as { value: number; station: IHydroMeasurement }[];

                    if (tempPairs.length > 0) {
                        const values = tempPairs.map(p => p.value);
                        const stations = tempPairs.map(p => p.station);
                        const baseStats = calculateStats(values, stations);
                        stats.push({
                            measurementType: 'Hydro',
                            parameter: 'Temperatura wody',
                            ...baseStats,
                            unit: '°C'
                        });
                    }
                }
            }

            if (selectedStationType === 'hydro2') {
                const data = await db.hydro2Measurements.toArray();
                const stan = data.map(d => safeParseNumber(d.stan)).filter((v): v is number => v !== null);
                if (stan.length) {
                    const base = calculateStats(stan, data);
                    stats.push({measurementType: 'Hydro2', parameter: 'Stan', ...base, unit: 'cm'});
                }
                const przeplyw = data.map(d => safeParseNumber(d.przelyw)).filter((v): v is number => v !== null);
                if (przeplyw.length) {
                    const base = calculateStats(przeplyw, data);
                    stats.push({measurementType: 'Hydro2', parameter: 'Przepływ', ...base, unit: 'm3/s'});
                }
            }

            if (selectedStationType === 'synop') {
                const synopData = await db.synopMeasurements.toArray();
                if (synopData.length > 0) {
                    const addSynopParam = (
                        paramKey: keyof ISynopMeasurement,
                        label: string,
                        unit: string
                    ) => {
                        const pairs = synopData
                            .map(d => ({value: safeParseNumber(d[paramKey]), station: d}))
                            .filter(p => p.value !== null) as { value: number; station: ISynopMeasurement }[];

                        if (pairs.length > 0) {
                            const values = pairs.map(p => p.value);
                            const stations = pairs.map(p => p.station);
                            const baseStats = calculateStats(values, stations);
                            stats.push({
                                measurementType: 'Synop',
                                parameter: label,
                                ...baseStats,
                                unit
                            });
                        }
                    };

                    addSynopParam('temperatura', 'Temperatura', '°C');
                    addSynopParam('predkosc_wiatru', 'Prędkość wiatru', 'm/s');
                    addSynopParam('wilgotnosc_wzgledna', 'Wilgotność wzgl.', '%');
                    addSynopParam('cisnienie', 'Ciśnienie', 'hPa');
                    addSynopParam('suma_opadu', 'Suma opadów', 'mm');
                }
            }

            if (selectedStationType === 'meteo') {
                const data = await db.meteoMeasurements.toArray();
                const temps = data.map(d => safeParseNumber(d.temperatura_gruntu)).filter((v): v is number => v !== null);
                if (temps.length) {
                    const base = calculateStats(temps, data);
                    stats.push({measurementType: 'Meteo', parameter: 'Temperatura gruntu', ...base, unit: '°C'});
                }
                const wiatr = data.map(d => safeParseNumber(d.wiatr_srednia_predkosc)).filter((v): v is number => v !== null);
                if (wiatr.length) {
                    const base = calculateStats(wiatr, data);
                    stats.push({measurementType: 'Meteo', parameter: 'Śr. prędkość wiatru', ...base, unit: 'm/s'});
                }
                const wilg = data.map(d => safeParseNumber(d.wilgotnosc_wzgledna)).filter((v): v is number => v !== null);
                if (wilg.length) {
                    const base = calculateStats(wilg, data);
                    stats.push({measurementType: 'Meteo', parameter: 'Wilgotność', ...base, unit: '%'});
                }
            }

            if (selectedStationType === 'aq') {
                const stations = await db.aqMeasurements.toArray();
                const paramMap: Record<string, { values: number[]; stations: any[]; unit: string }> = {};
                stations.forEach((st) => {
                    st.parameters.forEach((p) => {
                        const val = safeParseNumber(p.measurementValue);
                        if (val !== null) {
                            if (!paramMap[p.parameter]) {
                                paramMap[p.parameter] = {values: [], stations: [], unit: p.measurementUnit || ''};
                            }
                            paramMap[p.parameter].values.push(val);
                            paramMap[p.parameter].stations.push({...st, nazwa_stacji: st.location});
                        }
                    });
                });
                Object.entries(paramMap).forEach(([param, {values, stations: sts, unit}]) => {
                    const base = calculateStats(values, sts);
                    stats.push({measurementType: 'AQ', parameter: param, ...base, unit});
                });
            }

            setStatistics(stats);
        } catch (error) {
            console.error('Błąd podczas pobierania statystyk:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStatistics();
        }
    }, [isOpen, selectedStationType]);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                width: '420px',
                background: 'white',
                borderRadius: '12px 12px 0 0',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '1px solid #ddd',
                transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 45px))',
                transition: 'transform 0.3s ease-in-out'
            }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        width: '100%',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px 12px 0 0',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                >
                    <span>📊 Statystyki Pomiarów</span>
                    <span style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}>
                        ▼
                    </span>
                </button>

                <div style={{
                    maxHeight: isOpen ? '600px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                }}>
                    <div style={{padding: '20px'}}>
                        <div style={{display: 'flex', marginBottom: '16px', borderBottom: '1px solid #eee'}}>
                            {[
                                {key: 'basic', label: '📊 Podstawowe'},
                                {key: 'advanced', label: '🔬 Zaawansowane'}
                            ].map(mode => (
                                <button
                                    key={mode.key}
                                    onClick={() => setViewMode(mode.key as any)}
                                    style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: 'none',
                                        background: viewMode === mode.key ? '#007bff' : 'transparent',
                                        color: viewMode === mode.key ? 'white' : '#666',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        borderRadius: '4px 4px 0 0',
                                        marginBottom: '-1px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {mode.label}
                                </button>
                            ))}
                        </div>

                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px'}}>
                            {stationTypes.map(type => (
                                <button
                                    key={type.key}
                                    onClick={() => setSelectedStationType(type.key)}
                                    style={{
                                        padding: '6px 10px',
                                        border: '1px solid #ccc',
                                        background: selectedStationType === type.key ? '#28a745' : 'white',
                                        color: selectedStationType === type.key ? 'white' : '#666',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '10px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {type.icon} {type.label}
                                </button>
                            ))}
                        </div>

                        <div style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            paddingRight: '8px'
                        }}>
                            {statistics.length === 0 ? (
                                <div style={{textAlign: 'center', color: '#666', fontSize: '12px', padding: '20px'}}>
                                    {loading ? 'Ładowanie statystyk...' : 'Brak danych do wyświetlenia'}
                                </div>
                            ) : (
                                statistics.map((stat, index) => (
                                    <div key={index} style={{
                                        background: '#f8f9fa',
                                        border: '1px solid #e9ecef',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            marginBottom: '12px',
                                            color: '#495057',
                                            borderBottom: '1px solid #dee2e6',
                                            paddingBottom: '8px'
                                        }}>
                                            {stat.measurementType} - {stat.parameter}
                                        </div>

                                        {viewMode === 'basic' ? (
                                            <div style={{fontSize: '11px', lineHeight: '1.5'}}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '8px',
                                                    marginBottom: '12px'
                                                }}>
                                                    <span><strong>Pomiary:</strong> {stat.count}</span>
                                                    <span><strong>Min:</strong> {stat.min}{stat.unit}</span>
                                                    <span><strong>Max:</strong> {stat.max}{stat.unit}</span>
                                                    <span><strong>Średnia:</strong> {stat.avg}{stat.unit}</span>
                                                    <span><strong>Mediana:</strong> {stat.median}{stat.unit}</span>
                                                </div>

                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '16px'
                                                }}>
                                                    <div>
                                                        <strong>📉 Top 5 Minimum:</strong>
                                                        <div style={{marginTop: '6px'}}>
                                                            {stat.topMinimum.map((item, i) => (
                                                                <div key={i} style={{
                                                                    fontSize: '10px',
                                                                    color: '#666',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '2px 0',
                                                                    borderBottom: i < stat.topMinimum.length - 1 ? '1px solid #eee' : 'none'
                                                                }}>
                                                                    <div>
                                                                        <div>{item.value}{stat.unit}</div>
                                                                        <div style={{
                                                                            color: '#999',
                                                                            fontSize: '9px'
                                                                        }}>{item.stationName}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleGoToStation(item.lat, item.lon)}
                                                                        style={{
                                                                            background: '#007bff',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '3px',
                                                                            padding: '2px 6px',
                                                                            fontSize: '8px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        →
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <strong>📈 Top 5 Maximum:</strong>
                                                        <div style={{marginTop: '6px'}}>
                                                            {stat.topMaximum.map((item, i) => (
                                                                <div key={i} style={{
                                                                    fontSize: '10px',
                                                                    color: '#666',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    padding: '2px 0',
                                                                    borderBottom: i < stat.topMaximum.length - 1 ? '1px solid #eee' : 'none'
                                                                }}>
                                                                    <div>
                                                                        <div>{item.value}{stat.unit}</div>
                                                                        <div style={{
                                                                            color: '#999',
                                                                            fontSize: '9px'
                                                                        }}>{item.stationName}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleGoToStation(item.lat, item.lon)}
                                                                        style={{
                                                                            background: '#007bff',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '3px',
                                                                            padding: '2px 6px',
                                                                            fontSize: '8px',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        →
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{fontSize: '11px', lineHeight: '1.5'}}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: '8px',
                                                    marginBottom: '12px'
                                                }}>
                                                    <span><strong>Odch. std:</strong> {stat.stdDev}{stat.unit}</span>
                                                    <span><strong>Wsp. zmienności:</strong> {stat.cv}%</span>
                                                    <span><strong>Q1:</strong> {stat.q1}{stat.unit}</span>
                                                    <span><strong>Q3:</strong> {stat.q3}{stat.unit}</span>
                                                    <span><strong>IQR:</strong> {stat.iqr}{stat.unit}</span>
                                                    <span><strong>Skośność:</strong> {stat.skewness}</span>
                                                    <span><strong>Kurtoza:</strong> {stat.kurtosis}</span>
                                                    <span><strong>Odstające:</strong> {stat.outliers.length}</span>
                                                </div>

                                                <div style={{marginBottom: '12px'}}>
                                                    <strong>📊 Rozkład wartości:</strong>
                                                    <div style={{marginTop: '6px'}}>
                                                        {stat.ranges.slice(0, 3).map((range, i) => (
                                                            <div key={i} style={{
                                                                fontSize: '10px',
                                                                color: '#666',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '2px 0'
                                                            }}>
                                                                <span>{range.range}{stat.unit}</span>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}>
                                                                    <div style={{
                                                                        width: '30px',
                                                                        height: '8px',
                                                                        background: '#e9ecef',
                                                                        borderRadius: '4px',
                                                                        overflow: 'hidden'
                                                                    }}>
                                                                        <div style={{
                                                                            width: `${range.percentage}%`,
                                                                            height: '100%',
                                                                            background: '#007bff',
                                                                            borderRadius: '4px'
                                                                        }}/>
                                                                    </div>
                                                                    <span>{range.percentage}%</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {stat.outliers.length > 0 && (
                                                    <div>
                                                        <strong>⚠️ Wartości odstające:</strong>
                                                        <div style={{
                                                            marginTop: '4px',
                                                            fontSize: '10px',
                                                            color: '#dc3545'
                                                        }}>
                                                            {stat.outliers.slice(0, 3).map((outlier, i) => (
                                                                <span key={i}>
                                                                    {Math.round(outlier * 10) / 10}{stat.unit}
                                                                    {i < Math.min(stat.outliers.length - 1, 2) ? ', ' : ''}
                                                                </span>
                                                            ))}
                                                            {stat.outliers.length > 3 && <span>...</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;