import Dexie, {type Table} from 'dexie';

export interface IHydroMeasurement {
    "id"?: number,
    "id_stacji": number,
    "stacja"?: string,
    "rzeka"?: string,
    "województwo"?: string,
    "stan_wody"?: number,
    "stan_wody_data_pomiaru"?: Date,
    "temperatura_wody"?: number,
    "temperatura_wody_data_pomiaru"?: Date,
    "zjawisko_lodowe"?: number,
    "zjawisko_lodowe_data_pomiaru"?: Date,
    "zjawisko_zarastania"?: number,
    "zjawisko_zarastania_data_pomiaru"?: Date,
    "lat"?: number,
    "lon"?: number
}

export interface ISynopMeasurement {
    "id"?: number,
    "id_stacji": number,
    "stacja"?: string,
    "data_pomiaru"?: Date,
    "godzina_pomiaru"?: number,
    "temperatura"?: number,
    "predkosc_wiatru"?: number,
    "kierunek_wiatru"?: number,
    "wilgotnosc_wzgledna"?: number,
    "suma_opadu"?: number,
    "cisnienie"?: number,
    "lat"?: number,
    "lon"?: number
}

export interface IMeteoMeasurement {
    "id"?: number,
    "kod_stacji": number,
    "nazwa_stacji"?: string,
    "lon"?: number,
    "lat"?: number,
    "temperatura_gruntu"?: number,
    "temperatura_gruntu_data"?: Date,
    "wiatr_kierunek"?: number,
    "wiatr_kierunek_data"?: Date,
    "wiatr_srednia_predkosc"?: number,
    "wiatr_srednia_predkosc_data"?: Date,
    "wiatr_predkosc_maksymalna"?: number,
    "wiatr_predkosc_maksymalna_data"?: Date,
    "wilgotnosc_wzgledna"?: number,
    "wilgotnosc_wzgledna_data"?: Date,
    "wiatr_poryw_10min"?: number,
    "wiatr_poryw_10min_data"?: Date,
    "opad_10min"?: number,
    "opad_10min_data"?: Date
}

export interface IHydro2Measurement {
    "id"?: number,
    "kod_stacji": number,
    "nazwa_stacji"?: string,
    "lon"?: number,
    "lat"?: number,
    "stan"?: number,
    "stan_data"?: Date,
    "przelyw"?: number,
    "przeplyw_data"?: Date
}

export interface IAqParameter {
    parameter: string;
    indexValue: number;
    indexText: string;
    measurementValue: number | null;
    measurementUnit: string | null;
    lastUpdated: string;
}

export interface IAqMeasurement {
    id?: number;
    locationId: number;
    location: string;
    lat: number;
    lon: number;
    parameters: IAqParameter[];
}

export class MyAppDB extends Dexie {
    hydroMeasurements!: Table<IHydroMeasurement, number>;
    synopMeasurements!: Table<ISynopMeasurement, number>;
    meteoMeasurements!: Table<IMeteoMeasurement, number>;
    hydro2Measurements!: Table<IHydro2Measurement, number>;
    aqMeasurements!: Table<IAqMeasurement, number>;

    constructor() {
        super('AppDatabase');
        this.version(1).stores({
            synopMeasurements: "++id, id_stacji, stacja, data_pomiaru, godzina_pomiaru, temperatura, predkosc_wiatru, " +
                "kierunek_wiatru, wilgotnosc_wzgledna, suma_opadu, cisnienie, lat, lon",
            hydro2Measurements: "++id, kod_stacji, nazwa_stacji, lon, lat, stan, stan_data, przelyw, przeplyw_data",
            meteoMeasurements: "++id, kod_stacji, nazwa_stacji, lon, lat, temperatura_gruntu, temperatura_gruntu_data, " +
                "wiatr_kierunek, wiatr_kierunek_data, wiatr_srednia_predkosc, wiatr_srednia_predkosc_data, " +
                "wiatr_predkosc_maksymalna, wiatr_predkosc_maksymalna_data, wilgotnosc_wzgledna, wilgotnosc_wzgledna_data, " +
                "wiatr_poryw_10min, wiatr_poryw_10min_data, opad_10min, opad_10min_data",
            hydroMeasurements: "++id, id_stacji, stacja, rzeka, województwo, stan_wody, stan_wody_data_pomiaru, " +
                "temperatura_wody, temperatura_wody_data_pomiaru, zjawisko_lodowe, zjawisko_lodowe_data_pomiaru, " +
                "zjawisko_zarastania, zjawisko_zarastania_data_pomiaru, lat, lon",
            aqMeasurements: '++id, locationId, location, latitude, longitude'
        });

    }
}

export const db = new MyAppDB();
