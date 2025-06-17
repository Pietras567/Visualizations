import './App.css'
import Map from './Map';
import {useEffect, useState} from "react";
import {
    db,
    type IAqMeasurement,
    type IHydro2Measurement,
    type IHydroMeasurement,
    type IMeteoMeasurement,
    type ISynopMeasurement
} from "./dexie.tsx";
import {
    getMeasurementsHydro,
    getMeasurementsHydro2,
    getMeasurementsMeteo,
    getMeasurementsSynop
} from "./MeasurementsActions.tsx";
import {getCurrentMeasurementsPL} from "./AirQualityActions.tsx";

function App() {
    const [hydroMeasurements, setHydroMeasurements] = useState<IHydroMeasurement[]>([]);
    const [hydro2Measurements, setHydro2Measurements] = useState<IHydro2Measurement[]>([]);
    const [synopMeasurements, setSynopMeasurements] = useState<ISynopMeasurement[]>([]);
    const [meteoMeasurements, setMeteoMeasurements] = useState<IMeteoMeasurement[]>([]);
    const [aqMeasurements, setAqMeasurements] = useState<IAqMeasurement[]>([])
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                await getMeasurementsHydro();
                const hydroData = await db.hydroMeasurements.toArray();
                setHydroMeasurements(hydroData);

                await getMeasurementsSynop();
                const synopData = await db.synopMeasurements.toArray();
                setSynopMeasurements(synopData);

                await getMeasurementsHydro2();
                const hydro2Data = await db.hydro2Measurements.toArray();
                setHydro2Measurements(hydro2Data);

                await getMeasurementsMeteo();
                const meteoData = await db.meteoMeasurements.toArray();
                setMeteoMeasurements(meteoData);

                await getCurrentMeasurementsPL();
                const aqData = await db.aqMeasurements.toArray();
                setAqMeasurements(aqData);
            } catch (e) {
                console.error('Błąd wczytywania danych', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    if (loading) {
        return <div>Ładowanie danych...</div>;
    }

    return (
        <>
            <Map
                center={[52.2297, 21.0122]}
                zoom={12}
                hydroMeasurements={hydroMeasurements}
                hydro2Measurements={hydro2Measurements}
                synopMeasurements={synopMeasurements}
                meteoMeasurements={meteoMeasurements}
                aqMeasurements={aqMeasurements}
            />
        </>
    )
}

export default App
