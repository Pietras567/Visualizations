export interface StationCoordinate {
    id: string;
    nazwa: string;
    rzeka: string;
    lat: number;
    lon: number;
    wysokosc?: string;
}

const dmsToDecimal = (dmsString: string): number => {
    const parts = dmsString.trim().split(' ');
    if (parts.length !== 3) return 0;

    const degrees = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);

    return degrees + minutes / 60 + seconds / 3600;
};

export const parseHydroStationCoordinates = async (): Promise<Map<string, StationCoordinate>> => {
    try {
        const response = await fetch('/kody_stacji_hydro.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvText = await response.text();
        const lines = csvText.split('\n');

        const stationMap = new Map<string, StationCoordinate>();

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const columns = line.split(';');
            if (columns.length < 6) continue;

            const id = columns[1]?.trim();
            const nazwa = columns[2]?.trim();
            const rzeka = columns[3]?.trim();
            const szerokoscGeog = columns[4]?.trim();
            const dlugoscGeog = columns[5]?.trim();
            const wysokosc = columns[6]?.trim();

            if (!id || !szerokoscGeog || !dlugoscGeog) continue;

            try {
                const lat = dmsToDecimal(szerokoscGeog);
                const lon = dmsToDecimal(dlugoscGeog);

                if (lat > 0 && lon > 0) {
                    stationMap.set(id, {
                        id,
                        nazwa: nazwa || '',
                        rzeka: rzeka || '',
                        lat,
                        lon,
                        wysokosc: wysokosc || ''
                    });
                }
            } catch (error) {
                console.error(`Błąd parsowania współrzędnych dla stacji ${id}:`, error);
            }
        }

        console.log(`Załadowano ${stationMap.size} stacji ze współrzędnymi`);
        return stationMap;

    } catch (error) {
        console.error('Błąd podczas ładowania pliku CSV ze stacjami:', error);
        return new Map();
    }
};
