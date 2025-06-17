import axios from 'axios';
import {
    db,
    type IHydro2Measurement,
    type IHydroMeasurement,
    type IMeteoMeasurement,
    type ISynopMeasurement
} from './dexie.tsx';
import {parseStationCoordinates, type StationCoordinate} from "./stationCoordinates.tsx";
import {getSynopStationCoordinates} from './stationCoordinatesSynop';

let stationCoordinatesCache: Map<string, StationCoordinate> | null = null;

const getStationCoordinates = async (): Promise<Map<string, StationCoordinate>> => {
    if (!stationCoordinatesCache) {
        console.log('Ładowanie współrzędnych stacji z pliku CSV...');
        stationCoordinatesCache = await parseStationCoordinates();
    }
    return stationCoordinatesCache;
};


export const getMeasurementsSynop = async (): Promise<ISynopMeasurement[]> => {
    const config = {
        method: 'get',
        url: 'https://danepubliczne.imgw.pl/api/data/synop',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    try {
        const response = await axios.request(config);
        const synopData: ISynopMeasurement[] = response.data;

        const coordsMap = await getSynopStationCoordinates();

        const withCoords = synopData.map(m => {
            const code = String(m.id_stacji).slice(2);
            const coord = coordsMap.get(code);
            if (coord) {
                return {...m, lat: coord.lat, lon: coord.lon};
            } else {
                console.warn(`Brak współrzędnych dla synop stacji ${code}`);
                return m;
            }
        });

        const validData = withCoords.filter(m => m.lat != null && m.lon != null);

        await db.synopMeasurements.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.synopMeasurements.bulkAdd(validData);

        console.log(`Zapisano ${validData.length} pomiarów synop do bazy danych`);
        return validData;

    } catch (error) {
        console.error('Błąd pobierania danych synop:', error);
        throw error;
    }
}

export const getMeasurementsHydro = async (): Promise<IHydroMeasurement[]> => {
    const config = {
        method: 'get',
        url: 'https://danepubliczne.imgw.pl/api/data/hydro',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    try {
        const response = await axios.request(config);
        const hydroData: IHydroMeasurement[] = response.data;

        const stationCoordinates = await getStationCoordinates();

        const hydroDataWithCoordinates = hydroData.map(measurement => {
            const stationId = String(measurement.id_stacji);
            const coordinates = stationCoordinates.get(stationId);

            if (coordinates) {
                return {
                    ...measurement,
                    lat: coordinates.lat,
                    lon: coordinates.lon
                };
            } else {
                console.log(`Brak współrzędnych dla stacji ${stationId}`);
                return measurement;
            }
        });

        const hydroDataWithValidCoordinates = hydroDataWithCoordinates.filter(
            measurement => measurement.lat && measurement.lon
        );

        console.log(`Znaleziono współrzędne dla ${hydroDataWithValidCoordinates.length} z ${hydroData.length} stacji hydro`);

        await db.hydroMeasurements.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.hydroMeasurements.bulkAdd(hydroDataWithValidCoordinates);

        console.log(`Zapisano ${hydroDataWithValidCoordinates.length} pomiarów hydro do bazy danych`);
        return hydroDataWithValidCoordinates;

    } catch (error) {
        console.error('Błąd pobierania danych hydro:', error);
        throw error;
    }
}

export const getMeasurementsHydro2 = async (): Promise<IHydro2Measurement[]> => {
    const config = {
        method: 'get',
        url: 'https://danepubliczne.imgw.pl/api/data/hydro2',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    try {
        const response = await axios.request(config);
        const hydro2Data: IHydro2Measurement[] = response.data;

        await db.hydro2Measurements.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.hydro2Measurements.bulkAdd(hydro2Data);

        console.log(`Zapisano ${hydro2Data.length} pomiarów hydro2 do bazy danych`);
        return hydro2Data;

    } catch (error) {
        console.error('Błąd pobierania danych hydro2: ', error);
        throw error;
    }
}

export const getMeasurementsMeteo = async (): Promise<IMeteoMeasurement[]> => {
    const config = {
        method: 'get',
        url: 'https://danepubliczne.imgw.pl/api/data/meteo/',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    try {
        const response = await axios.request(config);
        const meteoData: IMeteoMeasurement[] = response.data;

        await db.meteoMeasurements.clear();
        await new Promise(resolve => setTimeout(resolve, 100));
        await db.meteoMeasurements.bulkAdd(meteoData);

        console.log(`Zapisano ${meteoData.length} pomiarów meteo do bazy danych`);
        return meteoData;

    } catch (error) {
        console.error('Błąd pobierania danych meteo:', error);
        throw error;
    }
}
