let synopCoordsCache: Map<string, SynopStationCoordinate> | null = null;

export interface SynopStationCoordinate {
    kod: string;
    nazwa: string;
    lat: number;
    lon: number;
}

const dmsToDecimal = (dmsString: string): number => {
    const parts = dmsString.trim().split(' ');
    if (parts.length !== 3) return 0;
    const [deg, min, sec] = parts.map(p => parseInt(p, 10));
    return deg + min / 60 + sec / 3600;
};

export const parseSynopStationCoordinates = async (): Promise<Map<string, SynopStationCoordinate>> => {
    const response = await fetch('/kody_stacji_synop.csv');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    const lines = text.split('\n');
    const map = new Map<string, SynopStationCoordinate>();

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].trim().split(';');
        if (cols.length < 5) continue;
        const [kod, nazwa, lonStr, latStr] = cols;
        if (!kod || !lonStr || !latStr) continue;
        const lat = dmsToDecimal(latStr);
        const lon = dmsToDecimal(lonStr);
        if (lat && lon) {
            map.set(kod, {kod, nazwa, lat, lon});
        }
    }

    console.log(`Wczytano ${map.size} stacji synop`);
    return map;
};

export const getSynopStationCoordinates = async () => {
    if (!synopCoordsCache) {
        console.log('Ładuję współrzędne stacji synop...');
        synopCoordsCache = await parseSynopStationCoordinates();
    }
    return synopCoordsCache;
};
