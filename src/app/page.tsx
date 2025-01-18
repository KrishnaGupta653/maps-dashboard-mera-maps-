"use client"
import { useEffect, useState } from 'react';
import { geoCodeRequest, initHeatMap, initHeatMapSelection } from './map';
import { heatMapDateSelection, wareHouseLocation, getwareHouseLocations } from './actions/actions';
import { useRouter } from 'next/navigation';
import './Loader.css';
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

export default function Home() {

  const router = useRouter();
  const [radius, setRadius] = useState(10);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'order_value' | 'so_count' | 'cust_count' | 'volume'>('cust_count');
  const [data, setData] = useState<Location[]>([]);
  const [locationData, setLocationData] = useState<any>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pincodeBoundary, setPincodeBoundary] = useState(false);
  const [storePincode, setStorePincode] = useState<[{ [key: string]: any[] }] | undefined>(undefined);
  const [whMap, setWhMap] = useState<whMap>({});

  const fetchWarehouseData = async () => {
    try {
      const response = await getwareHouseLocations();
      const res = await wareHouseLocation();
      const hMap: whMap = {};
      response.forEach((item: any) => {
        const warehouse = item.WH;
        if (!hMap[warehouse]) {
          hMap[warehouse] = [];
        }
        hMap[warehouse].push(item);
      });
      setWhMap(hMap);
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
    const filteredData = warehouseData.filter(item => selectedWarehouse.includes(item[1]));
    initHeatMap(radius, filteredData, filteredPincodeByWH, pincodeBoundary);
  }, [selectedWarehouse, radius, selectedMetric, startDate, endDate, pincodeBoundary]);

  const [geoCoderesponse, setGeoCoderesponse] = useState(true);
  const [count, setCount] = useState(0);

  const handlePincodeBoundary = async () => {
    setPincodeBoundary(!pincodeBoundary);
  }
  const handleSelectChange = async (warehouse: string) => {
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
    setSelectedMetric(e.target.value as 'cust_count' | 'order_value' | 'so_count' | 'volume');
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
      initHeatMapSelection(locationData, selectedMetric, startDate, endDate);
    }
  }, [locationData, selectedMetric, startDate, endDate]);

  const handleEndDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  }

  const [loader, setLoader] = useState(true);
  useEffect(() => {
    const fetchDataForHeatmap = async () => {
      if (endDate && startDate) {
        setLoader(false);
        await heatMapDateSelect(startDate, endDate, selectedMetric);
        await initHeatMapSelection(locationData, selectedMetric, startDate, endDate);
        setLoader(true);
      }
    };
    if (endDate) {
      fetchDataForHeatmap();
    }

  }, [startDate, endDate, selectedMetric]);

  const [handleGeoCode, setHandleGeoCode] = useState(false);
  const [text, setText] = useState("");
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHandleGeoCode(false);
    setText(e.target.value);
  };

  const handlePlace = () => {
    setHandleGeoCode(true);
    geoCodeRequest({ address: text });
  };

  return (
    <>
      <div className='bg-slate-200 w-full h-full' style={{ position: 'relative', minHeight: '100vh' }}>
        <div className='flex text-white'
          style={{
            position: 'absolute',
            top: 20,
            left: '12px',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(109, 136, 153, 0.5)',
            borderRadius: '12px',
            zIndex: 10
          }}>
          <div className='p-1'>
            <label htmlFor="radius" className={`text-${radius === 10 ? 'black' : 'white'} text-2xl font-bold p-2 ml-2 rounded-xl ${radius === 10 ? 'border-blue-0' : 'bg-blue-500'}`}>Radius (km): </label>
            <input
              className='bg-transparent text-black text-2xl pl-1 ml-4'
              id="radius"
              type="number"
              value={radius}
              onChange={handleRadiusChange}
              step="10"
            />
          </div>
          <div className='flex m-1'>
            <button onClick={toggleExpand} className={`text-${isExpanded ? 'white' : 'black'} text-2xl p-2 font-bold rounded-xl ${isExpanded ? 'bg-blue-500' : 'border-blue-0'}`}>
              {isExpanded ? "Hide WareHouse" : "Show WareHouse"}
            </button>
            {isExpanded && (
              <div className="flex ml-4 mt-3">
                {Object.keys(whMap).map((warehouse) => (
                  <div key={warehouse} className="px-1">
                    <input
                      className="bg-slate-400 size-6"
                      type="checkbox"
                      id={warehouse}
                      checked={selectedWarehouse.includes(warehouse)}
                      onChange={() => handleSelectChange(warehouse)}
                    />
                    <label htmlFor={warehouse} className="text-black font-semibold text-2xl mb-4 ml-1">
                      {warehouse}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div id="map" style={{ width: '100vw', height: '100vh' }}></div>
        <div
          className="flex flex-row text-white mb-2"
          style={{
            position: 'absolute',
            bottom: 0,
            left: '12px',
            justifyContent: 'center',
            backgroundColor: 'rgba(109, 136, 153, 0.5)',
            borderRadius: '12px',
            zIndex: 10,
          }}
        >
          <div className="flex flex-row items-center py-2 px-4">
            <h2 className="text-black text-3xl font-bold mr-4">
              {loader ? 'HeatMap' : <span className="loader"></span>}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-black text-2xl font-bold whitespace-nowrap">Start Date:</div>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="bg-transparent text-black text-2xl rounded-xl p-1"
              />
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-black text-2xl font-bold whitespace-nowrap">End Date:</div>
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="bg-transparent text-black text-2xl rounded-xl p-1"
              />
            </div>
            <div className="flex items-center space-x-4 ml-4">
              <div className="text-black text-2xl font-bold whitespace-nowrap">Select Metric:</div>
              <select
                onChange={handleMetricChange}
                value={selectedMetric}
                className="bg-transparent text-black text-2xl rounded-xl p-1"
              >
                <option value="cust_count">Customer Count</option>
                <option value="so_count">Order Count</option>
                <option value="volume">Volume</option>
                <option value="order_value">Order Value</option>
              </select>
            </div>
            <div className="flex items-center ml-4">
              <input type="checkbox" onChange={handlePincodeBoundary} className="mt-0.5 size-6" />
              <span className="text-black text-2xl font-bold whitespace-nowrap mx-2">Pincode Boundary</span>
            </div>
            <div className="flex items-center ml-4">
              <input
                className="bg-slate-100 text-black text-xl rounded-md p-2 w-48"
                placeholder="Enter a location"
                type="text"
                onChange={handleTextChange}
              />
              <button
                onClick={handlePlace}
                className={`px-4 py-2 text-2xl font-bold ml-4 text-${handleGeoCode ? 'white' : 'black'} rounded-xl ${handleGeoCode ? 'bg-blue-500' : ''
                  }`}
              >
                Locate
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

