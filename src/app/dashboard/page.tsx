"use client"
import { useEffect, useState } from 'react';
import { geoCodeRequest, initHeatMap, initHeatMapSelection } from '../../map';
import { heatMapDateSelection, wareHouseLocation, getwareHouseLocations } from '@/app/actions/actions';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
// import {Button} from "@nextui-org/react";

interface Location {
    Latitude: number,
    Longitute: number,
    Warehouse: string
}

interface resultItem {
    Schedule: string;
    WH: string;
    distance: number;
    district: string;
    latitude: number;
    longitute: number;
    pincode: number;
    schedule_type: string;
    state: string;
}

interface whMap {
    [key: string]: resultItem[];
}
let map: google.maps.Map | null = null;

export default function Home() {

    const router = useRouter();
    const [radius, setRadius] = useState(10);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<'order_value' | 'so_count' | 'cust_count'>('cust_count');
    const [data, setData] = useState<Location[]>([]);
    const [locationData, setLocationData] = useState<any>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [pincodeBoundary, setPincodeBoundary] = useState(true);
    // const [loading, setLoading] = useState<boolean>(false);
    const [storePincode, setStorePincode] = useState<[{ [key: string]: any[] }] | undefined>(undefined);
    const [whMap, setWhMap] = useState<whMap>({});
    const [storeData, setStoreData] = useState<[{ [key: string]: any[] }] | undefined>(undefined);


    // const dataofware = async() => {
    //     if (!map) {
    //         await loadGoogleMapsScript();
    //         map = initializeMap("map");
    //     }
    // }

    // useEffect(()=>{
    //     dataofware()
    // }, [])

    const fetchWarehouseData = async () => {
        try {
            const response = await getwareHouseLocations();
            const res = await wareHouseLocation();
            const whMap: whMap = {};
            response.forEach((item: any) => {
                const warehouse = item.WH;
                if (!whMap[warehouse]) {
                    whMap[warehouse] = [];
                }
                whMap[warehouse].push(item);
            });
            setWhMap(whMap);
            setData(res)
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
        }
    };


    function getDefaultDateRange() {
        const today = new Date();
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        return { startDate: last7Days.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
    }

    const [startDate, setStartDate] = useState(getDefaultDateRange().startDate);
    const [endDate, setEndDate] = useState(getDefaultDateRange().endDate);

    useEffect(() => {
        // if (storeData) {
        //     const warehouseData: [google.maps.LatLngLiteral, string][] = data.map((data) => [
        //         { lat: parseFloat(data.Latitude.toString()), lng: parseFloat(data.Longitute.toString()) },
        //         data.Warehouse
        //     ]);
        //     const filteredData = warehouseData.filter(item => selectedWarehouse.includes(item[1]));
        //     // initHeatMap(radius, filteredData, filteredPincodeByWH);
        // }
        // else {
        fetchWarehouseData();
        const warehouseData: [google.maps.LatLngLiteral, string][] = data.map((data) => [
            { lat: parseFloat(data.Latitude.toString()), lng: parseFloat(data.Longitute.toString()) },
            data.Warehouse
        ]);

        const filteredPincodeByWH: any = Object.keys(whMap)
            .filter(wh => selectedWarehouse.includes(wh))
            .reduce((obj, wh) => {
                obj[wh] = whMap[wh];
                return obj;
            }, {} as { [key: string]: any[] });

        setStorePincode(filteredPincodeByWH);
        setStoreData(filteredPincodeByWH);
        const filteredData = warehouseData.filter(item => selectedWarehouse.includes(item[1]));
        initHeatMap(radius, filteredData, filteredPincodeByWH);
        // }
    }, [selectedWarehouse, radius, selectedMetric, startDate, endDate]);

    const [geoCoderesponse, setGeoCoderesponse] = useState(true);
    const [storeFeatureLayer, setStoreFeatureLayer] = useState<google.maps.FeatureLayer[]>([]);
    const [count, setCount] = useState(0);

    const handlePincodeBoundary = async () => {

        setPincodeBoundary(!pincodeBoundary);
        setCount(count + 1);
        if (count == 0) {
            let temp = false
            setGeoCoderesponse(temp);
            temp = await geoCodeRequest("", storePincode, pincodeBoundary);
            setGeoCoderesponse(temp);
        }
        else {
            let temp = await geoCodeRequest("", storePincode, pincodeBoundary);
            setCount(0);   
        }

        // if (temp) {
        //     console.log("2334");
        // }
    }

    const handleSelectChange = (warehouse: string) => {
        setSelectedWarehouse((prevSelected) => {
            if (prevSelected.includes(warehouse)) {
                return prevSelected.filter(item => item !== warehouse);
            } else {
                return [...prevSelected, warehouse];
            }
        });
    };

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRadius = Number(e.target.value);
        if (newRadius > 0) {
            setRadius(newRadius);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
    };

    const handleMetricChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedMetric(e.target.value as 'cust_count' | 'order_value' | 'so_count');
    };

    const heatMapDateSelect = async (startDate: any, endDate: any, selectedMetric: any) => {
        try {
            const response = await heatMapDateSelection(startDate, endDate, selectedMetric);
            setLocationData(response)
        } catch (error) {
            console.error('Error fetching warehouse data:', error);
        }
    };

    useEffect(() => {
        if (locationData.length > 0) {
            // map = new google.maps.Map(document.getElementById('map')!, {
            //     center: { lat: 29.3516232, lng: 77.7109485 },
            //     zoom: 8,
            //     gestureHandling: 'greedy',
            //     mapId: '68b8f843e24917af'
            //   });
            initHeatMapSelection(locationData, selectedMetric, startDate, endDate);
        }
    }, [locationData, selectedMetric, startDate, endDate]);

    const handleEndDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        // setLoading(true);
    }
    useEffect(() => {
        const fetchDataForHeatmap = async () => {
            if (endDate && startDate) {
                await heatMapDateSelect(startDate, endDate, selectedMetric);
                // map = new google.maps.Map(document.getElementById('map')!, {
                //     center: { lat: 29.3516232, lng: 77.7109485 },
                //     zoom: 8,
                //     gestureHandling: 'greedy',
                //     mapId: '68b8f843e24917af'
                //   });
                await initHeatMapSelection(locationData, selectedMetric, startDate, endDate);
            }
        };
        if (endDate) {
            fetchDataForHeatmap();
        }

        // setLoading(false);

    }, [startDate, endDate, selectedMetric]);

    const handleClick = async () => {
        try {
            await signOut(auth);
            router.push('/')
            console.log("object");
        } catch (error) {
            console.log(error);
        }
    }

    const [text, setText] = useState("");
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // var dispal = (predictions: any, state: any) => {
        //     if (state == google.maps.places.PlacesServiceStatus.OK) {
        //         predictions.forEach((predictio: any) => {
        //             console.log("prediction", predictio);
        //             setText(predictio.description)
        //         })
        //     }
        // }
        // var service = new google.maps.places.AutocompleteService();
        // service.getQueryPredictions({ 'input': e.target.value }, dispal);

        setText(e.target.value);
    };

    const handlePlace = () => {
        geoCodeRequest({ address: text });
    };

    return (
        <>
            <div className='bg-slate-200'>
                <div className='flex text-white'>
                    <div className='p-1 mt-2'>
                        <label htmlFor="radius" className={`text-${radius === 10 ? 'black' : 'white'} text-xl p-2 ml-2 font-medium rounded-xl border-2 ${radius === 10 ? 'border-blue-200' : 'bg-blue-500'}`}>Radius (km): </label>
                        <input
                            className='bg-slate-200 text-black text-xl ml-4'
                            id="radius"
                            type="number"
                            value={radius}
                            onChange={handleRadiusChange}
                            step="10"
                        />
                    </div>
                    <div className='flex m-1'>
                        <button onClick={toggleExpand} className={`text-${isExpanded ? 'white' : 'black'} text-xl p-2 font-medium rounded-xl border-2 ${isExpanded ? 'border-blue-500 bg-blue-500' : 'border-blue-300'}`}>
                            {isExpanded ? "Hide WareHouse" : "Show WareHouse"}
                        </button>
                        {isExpanded && (
                            <div className="flex ml-2 mt-2">
                                {Object.keys(whMap).map((warehouse) => (
                                    <div key={warehouse} className="px-1">
                                        <input
                                            className="bg-slate-400 size-5 mt-1"
                                            type="checkbox"
                                            id={warehouse}
                                            checked={selectedWarehouse.includes(warehouse)}
                                            onChange={() => handleSelectChange(warehouse)}
                                        />
                                        <label htmlFor={warehouse} className="text-black text-xl ml-0.5">
                                            {warehouse}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className='px-4 py-2 ml-auto mr-2 mt-1 mb-1 rounded-xl border-2 border-blue-300 bg-blue-500'>
                        <button className='text-white text-xl' onClick={handleClick}>Logout</button>
                    </div>
                </div>

                <div id="map" style={{ width: '100%', height: '636px' }}></div>


                <div className='flex flex-row m-1'>
                    <h2 className='text-black text-xl p-2 font-medium'>Heatmap</h2>
                    <div className='flex flex-row'>
                        <div className='text-black text-xl p-2 mt-1'>Start Date: </div>
                        <input
                            type="date"
                            value={startDate}
                            onChange={handleStartDateChange}
                            className="bg-slate-100 mb-8 rounded-xl p-1"
                        />

                        <div className='text-black text-xl p-2 mt-1'>End Date: </div>
                        <input
                            type="date"
                            value={endDate}
                            onChange={handleEndDateChange}
                            className="bg-slate-100 mb-8 rounded-xl p-1"
                        />

                        <div className='text-black text-xl p-2 mt-1'>Select Metric: </div>
                        <select
                            onChange={handleMetricChange}
                            value={selectedMetric}
                            className="bg-slate-100 mb-8 rounded-xl p-1"
                        >
                            <option value="cust_count">Customer Count</option>
                            <option value="order_value">Order Value</option>
                            <option value="so_count">Order Count</option>
                        </select>
                        {/* <Button onPress = {handlePincodeBoundary} className="mx-2 p-0 bg-transparent"
              size="sm">Toggle Pincode Boundaries</Button> */}
                        <button onClick={handlePincodeBoundary} className={`px-4 py-2 mx-10 mb-8 my-1 text-${pincodeBoundary ? 'black' : 'white'} rounded-xl border-2 ${pincodeBoundary ? 'border-blue-300 ' : 'border-blue-500 bg-blue-500'}`}>
                            {geoCoderesponse ? (
                                'Toggle Pincode Boundaries'
                                // Show "Loading..." when isLoading is true
                            ) : (
                                <span>Loading...</span>
                            )}
                        </button>

                        <input
                            className='bg-slate-200 text-black text-xl p-2 m-1 w-36 h-10 rounded-md'
                            placeholder='Enter a location'
                            type="text"
                            onChange={handleTextChange}
                        />
                        <button onClick={handlePlace} className='px-4 py-2 mx-10 mb-8 my-1 text-black rounded-xl border-2 border-blue-300'>Locate</button>
                    </div>
                </div>
            </div>
        </>
    );
}

