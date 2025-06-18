import axios from 'axios'
import {db, type IAqMeasurement, type IAqParameter} from "./dexie.tsx"

export async function getCurrentMeasurementsPL(): Promise<IAqMeasurement[]> {
    const stationRes = await axios.get('/pjp-api/rest/station/findAll');
    const stations: Array<any> = stationRes.data;
    const results: IAqMeasurement[] = [];

    const unitsMap: Record<string, string> = {
        so2: 'µg/m³',
        no2: 'µg/m³',
        pm10: 'µg/m³',
        pm25: 'µg/m³',
        o3: 'µg/m³',
        co: 'mg/m³',
        c6h6: 'µg/m³'
    };

    for (const station of stations) {
        try {
            const [idxRes, sensorsRes] = await Promise.all([
                axios.get(`/pjp-api/rest/aqindex/getIndex/${station.id}`),
                axios.get(`/pjp-api/rest/station/sensors/${station.id}`)
            ]);
            const idx = idxRes.data;
            const sensors: Array<any> = sensorsRes.data;
            const params: IAqParameter[] = [];

            if (idx.stIndexLevel) {
                params.push({
                    parameter: 'stIndexLevel',
                    indexValue: idx.stIndexLevel.id,
                    indexText: idx.stIndexLevel.indexLevelName,
                    measurementValue: null,
                    measurementUnit: null,
                    lastUpdated: idx.stCalcDate
                });
            }

            for (const sensor of sensors) {
                try {
                    const dataRes = await axios.get(`/pjp-api/rest/data/getData/${sensor.id}`);
                    const values: Array<any> = dataRes.data.values;
                    const latest = values.find(v => v.value !== null) || values[0];
                    const rawCode = sensor.param.paramCode.toLowerCase();
                    const key = rawCode.replace(/\./g, '');
                    const idxLevel = idx[`${key}IndexLevel`];
                    params.push({
                        parameter: sensor.param.paramCode,
                        indexValue: idxLevel ? idxLevel.id : -1,
                        indexText: idxLevel ? idxLevel.indexLevelName : 'Brak',
                        measurementValue: latest ? latest.value : null,
                        measurementUnit: unitsMap[key] || null,
                        lastUpdated: latest ? latest.date : idx.stCalcDate
                    });
                } catch (e) {
                    console.warn(`Brak danych dla sensora ${sensor.id}`, e);
                }
            }

            results.push({
                locationId: station.id,
                location: station.stationName,
                lat: parseFloat(station.gegrLat),
                lon: parseFloat(station.gegrLon),
                parameters: params
            });
        } catch (error) {
            console.error(`Błąd dla stacji ${station.id}:`, error);
        }
    }

    await db.aqMeasurements.clear();
    await db.aqMeasurements.bulkAdd(results);
    console.log(`Zapisano ${results.length} pomiarów aq do bazy danych`);

    return results;
}
