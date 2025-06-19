"use client";
import { useState, useCallback, useEffect } from "react";
import { Switch } from "@headlessui/react";
import { CalendarIcon, PlayIcon, Bars3Icon, XMarkIcon,ChevronDownIcon} from "@heroicons/react/24/outline";
import GoogleMap from "@/components/GoogleMap";
import { WarehouseLocation, fetchWarehouseLocations } from "@/actions/bazaar";
import { PincodePoint, fetchPincodeLocations } from "@/actions/pincode";
import { OrderLocationData, fetchOrderLocationData } from "@/actions/order";
import SplashScreen from "@/components/SplashScreen";

const formatDateToISO = (ddmmyyyy: string): string => {
  if (!ddmmyyyy || ddmmyyyy.length !== 10) return '';
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatISOToDDMMYYYY = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const validateDateFormat = (dateStr: string): boolean => {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!regex.test(dateStr)) return false;
  
  const [, day, month, year] = dateStr.match(regex) || [];
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.getFullYear() === parseInt(year) &&
         date.getMonth() === parseInt(month) - 1 &&
         date.getDate() === parseInt(day);
};
const getDefaultDateRange = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  return {
    from: thirtyDaysAgo.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
};

interface NewWarehouse {
  id: string;
  lat: number;
  lng: number;
  name: string;
  color: string;
}
const WAREHOUSE_COLORS = ['#FF5722', '#00BCD4', '#9C27B0', '#4CAF50', '#FF9800', 
'#E91E63', '#00E676', '#FFC107', '#673AB7', '#03A9F4'];

export default function Dashboard() {
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showPincodes, setShowPincodes] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [pincodes, setPincodes] = useState<PincodePoint[]>([]);
  const [orderData, setOrderData] = useState<OrderLocationData[]>([]);
  const [loading, setLoading] = useState({ warehouses: false, pincodes: false, orders: false,});
  const [errors, setErrors] = useState({warehouses: "", pincodes: "",orders: "",});
  const [selectedMetric, setSelectedMetric] = useState<string>("cust_count");
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [showCircles, setShowCircles] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNewWarehouses, setShowNewWarehouses] = useState(false);
  // const [showRoads, setShowRoads] = useState(true); 
  const [showPincodeMessage, setShowPincodeMessage] = useState(false);
  const [newWarehouses, setNewWarehouses] = useState<NewWarehouse[]>([]);
  const [dateErrors, setDateErrors] = useState({ from: '', to: '', dateRange: ''});
  const [dateInputs, setDateInputs] = useState({ from: formatISOToDDMMYYYY(getDefaultDateRange().from), to: formatISOToDDMMYYYY(getDefaultDateRange().to)});
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const metricOptions = [
    { key: "cust_count", label: "Customer Count" },
    { key: "so_count", label: "Sales Order Count" },
    { key: "order_value", label: "Order Value" },
    { key: "volume", label: "Volume" },
  ];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);
  const shouldAutoCollapse = useCallback(() => {
    if (showHeatmap) {
      return false;
    }
      if (showNewWarehouses) {
      return false;
    }

    return true;
  }, [showHeatmap ,showNewWarehouses]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const addNewWarehouse = useCallback(() => {
  setNewWarehouses((prev) => {
    const colorIndex = prev.length % WAREHOUSE_COLORS.length;
    const newWarehouse: NewWarehouse = {
      id: `new-warehouse-${Date.now()}`,
      lat: 28.6139,
      lng: 77.209,
      name: `New Warehouse ${prev.length + 1}`,
      color: WAREHOUSE_COLORS[colorIndex],
    };
    return [...prev, newWarehouse];
  });
}, []);
  
useEffect(() => {
  const splashShown = sessionStorage.getItem('splashShown');
  if (splashShown) {
    setShowSplashScreen(false);
    setHasShownSplash(true);
  }
}, []);
const handleSplashComplete = () => {
  setShowSplashScreen(false);
  setHasShownSplash(true);
  sessionStorage.setItem('splashShown', 'true');
};
const handleDateChange = useCallback(
  (field: "from" | "to", value: string) => {
    setDateInputs(prev => ({ ...prev, [field]: value }));
    setDateErrors(prev => ({ ...prev, [field]: '' }));
    if (value.length === 10) {
      if (validateDateFormat(value)) {
        const isoDate = formatDateToISO(value);
        const updatedRange = { ...dateRange, [field]: isoDate };
        const fromDate = new Date(field === 'from' ? isoDate : dateRange.from);
        const toDate = new Date(field === 'to' ? isoDate : dateRange.to);
         if (fromDate > toDate) {
          setDateErrors(prev => ({ 
            ...prev, 
            dateRange: 'From date cannot be greater than To date' 
          }));
          return;
        }
        setDateErrors({ from: '', to: '', dateRange: '' });
        setDateRange(updatedRange);
        
        if (errors.orders) {
          setErrors((prev) => ({ ...prev, orders: "" }));
        }
      } else {
        setDateErrors(prev => ({ 
          ...prev, 
          [field]: 'Invalid date format. Use DD/MM/YYYY',
          dateRange: '' 
        }));
      }
    }
    else {
      setDateErrors(prev => ({ ...prev, dateRange: '' }));
    }
  },
  [dateRange, errors.orders]
);
  // const removeNewWarehouse = useCallback(() => {
  //   setNewWarehouses((prev) => prev.slice(0, -1));
  // }, []);

  const updateNewWarehousePosition = useCallback(
    (id: string, lat: number, lng: number) => {
      setNewWarehouses((prev) =>
        prev.map((warehouse) =>
          warehouse.id === id ? { ...warehouse, lat, lng } : warehouse
        )
      );
    },
    []
  );

  const updateNewWarehouseManually = useCallback(
    (id: string, lat: number, lng: number) => {
      setNewWarehouses((prev) =>
        prev.map((warehouse) =>
          warehouse.id === id ? { ...warehouse, lat, lng } : warehouse
        )
      );
    },
    []
  );
  const clearAllDateErrors = useCallback(() => {
    setDateErrors({ from: '', to: '', dateRange: '' });
  }, []);
  const handleNewWarehouseToggle = useCallback(
  (isSelected: boolean) => {
    setShowNewWarehouses(isSelected);
    if (!isSelected) {
      setNewWarehouses([]);
      if (shouldAutoCollapse()) {
        setTimeout(() => setIsMenuOpen(false), 300);
      }
    } else {
      const newWarehouse: NewWarehouse = { 
        id: `new-warehouse-${Date.now()}`,
        lat: 28.6139,
        lng: 77.209,
        name: `New Warehouse 1`,
        color: WAREHOUSE_COLORS[0],
      };
      setNewWarehouses([newWarehouse]);
   }
  },
  [shouldAutoCollapse]
);
  const handleToggle = useCallback(
    async (
      type: "warehouses" | "pincodes" | "circles",
      isSelected: boolean
    ) => {
      if (type === "pincodes" && isSelected && !showWarehouses) {
        setShowPincodeMessage(true);
        // alert("Please enable Warehouses first to show Pincodes");
        setTimeout(() => setShowPincodeMessage(false), 3000);
        return;
      }
      if (type === "circles") {
        setShowCircles(isSelected);
        if (isSelected && warehouses.length === 0) {
          setLoading((prev) => ({ ...prev, warehouses: true }));
          setErrors((prev) => ({ ...prev, warehouses: "" }));
          try {
            const response = await fetchWarehouseLocations();

            if (response?.results) {
              setWarehouses(response.results as WarehouseLocation[]);
            } else {
              throw new Error("No warehouse data received");
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to fetch warehouses";
            setErrors((prev) => ({ ...prev, warehouses: message }));
            setShowCircles(false);
          } finally {
            setLoading((prev) => ({ ...prev, warehouses: false }));
          }
        }
        if (shouldAutoCollapse()) {
          setTimeout(() => setIsMenuOpen(false), 300);
        }
        return;
      }
      const isWarehouse = type === "warehouses";
      const setter = isWarehouse ? setShowWarehouses : setShowPincodes;
      const data = isWarehouse ? warehouses : pincodes;
      setter(isSelected);
      if (type === "warehouses" && isSelected) {
        setShowCircles(true);
        
      }
      if (shouldAutoCollapse()) {
        setTimeout(() => setIsMenuOpen(false), 300);
      }
      if (!isSelected || data.length > 0) return;
      setLoading((prev) => ({ ...prev, [type]: true }));
      setErrors((prev) => ({ ...prev, [type]: "" }));
      try {
        const response = await (isWarehouse
          ? fetchWarehouseLocations()
          : fetchPincodeLocations(
              showWarehouses ? warehouses.map((w) => w.Warehouse).join(",") : ""
            ));

        if (response?.results) {
          if (isWarehouse) {
            setWarehouses(response.results as WarehouseLocation[]);
          } else {
            setPincodes(response.results as PincodePoint[]);
          }
        } else {
          throw new Error(`No ${type} data received`);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to fetch ${type}`;
        setErrors((prev) => ({ ...prev, [type]: message }));
        setter(false);
        if (type === "warehouses") {
          setShowCircles(false);
        }
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }));
      }
    },
    [warehouses, pincodes, shouldAutoCollapse, showWarehouses]
  );

  const fetchOrderData = useCallback(
    async (fromDate: string, toDate: string, metric: string) => {
      setLoading((prev) => ({ ...prev, orders: true }));
      setErrors((prev) => ({ ...prev, orders: "" }));
      try {
        const response = await fetchOrderLocationData(fromDate, toDate, metric);

        if (response?.results) {
          setOrderData(response.results);
        } else {
          throw new Error("No order data received");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch order data";
        setErrors((prev) => ({ ...prev, orders: message }));
        console.error("Error fetching order data:", err);
      } finally {
        setLoading((prev) => ({ ...prev, orders: false }));
      }
    },
    []
  );

  const handleHeatmapToggle = useCallback(
    (isSelected: boolean) => {
      setShowHeatmap(isSelected);
      if (!isSelected) {
        setOrderData([]);
        setErrors((prev) => ({ ...prev, orders: "" }));
        clearAllDateErrors();
        //setShowHeatmapDropdown(false);
        if (shouldAutoCollapse()) {
          setTimeout(() => setIsMenuOpen(false), 300);
        }
      }

    },
    [shouldAutoCollapse,clearAllDateErrors]
  );

  const handleGenerateHeatmap = useCallback(async () => {
    await fetchOrderData(dateRange.from, dateRange.to, selectedMetric);
    // Auto-collapse after generating
    if (shouldAutoCollapse()) {
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 300);
    }
  }, [ fetchOrderData, dateRange.from, dateRange.to, selectedMetric,shouldAutoCollapse,]);

  const handleMetricChange = useCallback(
    (metric: string) => {
      setSelectedMetric(metric);
      if (errors.orders) {
        setErrors((prev) => ({ ...prev, orders: "" }));
      }
    },
    [errors.orders]
  );

  // const handleRoadsToggle = useCallback(
  //   (isSelected: boolean) => {
  //     setShowRoads(isSelected);
  //     if (shouldAutoCollapse()) {
  //       setTimeout(() => setIsMenuOpen(false), 300);
  //     }
  //   },
  //   [shouldAutoCollapse]
  // );
  const uniqueWarehouseCount = new Set(pincodes.map((p) => p.WH)).size;
  return (
    <>
    {showSplashScreen && (
        <SplashScreen onComplete={handleSplashComplete} 
        logoSrc="/icon.png"/>
      )}
    {(hasShownSplash || !showSplashScreen) && (
    <div className="relative w-full h-screen bg-black text-black overflow-hidden">
      {/* Hamburger Menu Button */}
      <div
        className={`absolute top-2 left-2 z-50 ${isFullscreen ? "fixed" : ""}`}
      >
        <button
          onClick={handleMenuToggle}
          className="flex items-center justify-center w-10 h-10 bg-black/20 backdrop-blur-md rounded-lg border border-black/10 hover:bg-black/20 transition-colors"
        >
          {isMenuOpen ? (
            <XMarkIcon className="h-5 w-5 text-black" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-black" />
          )}
        </button>
      </div>
      {/* Hamburger Menu Panel */}
      <div
        className={`${
          isFullscreen ? "fixed" : "absolute"
        } top-14 left-2 z-50 transition-all duration-200  ${
          isMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-black/10 backdrop-blur-md rounded-lg border border-white/10 p-4 min-w-[280px] max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-3">
            <ToggleControl
              checked={showWarehouses}
              onChange={(checked) => handleToggle("warehouses", checked)}
              loading={loading.warehouses}
              label="Warehouses"
              color="blue"
            />
            <ToggleControl
              checked={showCircles}
              onChange={(checked) => handleToggle("circles", checked)}
              loading={false}
              label="Circles"
              color="blue"
            />
            <ToggleControl
              checked={showPincodes}
              onChange={(checked) => handleToggle("pincodes",checked)}
              loading={loading.pincodes}
              label="Pincodes"
              color="green"
              // disabled={!showWarehouses}
            />
            {showPincodeMessage && (
              <div className="relative bg-red-600/90 border-2 border-red-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
                <button
                  onClick={() => setShowPincodeMessage(false)}
                  className="absolute top-1.5 right-2 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors" aria-label="Close warning">
                  <span className="text-white text-xs font-bold">×</span>
                </button>
                <p className="text-white text-sm font-bold flex items-center gap-2 pr-6">
                  <span className="text-yellow-300 text-lg">⚠️</span>
                  Please enable Warehouses first before enabling Pincodes
                </p>
              </div>
            )}
            {/* <ToggleControl
              checked={showRoads}
              onChange={handleRoadsToggle}
              loading={false}
              label="Roads & Highways"
              color="yellow"
            /> */}
            <ToggleControl
              checked={showNewWarehouses}
              onChange={handleNewWarehouseToggle}
              loading={false}
              label="New Warehouses"
              color="purple"
            />
            {/* New Warehouse Controls - Only show when enabled */}
            {(showNewWarehouses) &&(
              <div className="bg-white/10 px-2 py-2 rounded-lg border border-white/10 w-70 ">
                <h4 className="text-xs font-medium mb-2 text-black flex items-center gap-1">
                  🏗️ Warehouse Controls
                </h4>
                <div className="flex items-center gap-1 mb-2">
                  <button
                    onClick={addNewWarehouse}
                    className="flex items-center justify-center w-8 h-8 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-bold transition-colors">
                    +
                  </button>
                  {/* <button
                    onClick={removeNewWarehouse}
                    disabled={newWarehouses.length === 0}
                    className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-colors">
                    -
                  </button> */}
                  <span className="text-xs text-black">
                    {newWarehouses.length} warehouse
                    {newWarehouses.length !== 1 ? "s" : ""}
                  </span>
                </div>                
                {/* Position Controls for each warehouse */}
                {newWarehouses.map((warehouse) => (
                  <div key={warehouse.id} className="mb-2 p-1.5 bg-white/10 rounded border border-white/20">
                    <div className="text-xs font-medium mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2" style={{ color: warehouse.color }}>
                        <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: warehouse.color }}></div>
                        {warehouse.name}
                      </div>
                      {/* Cross button - Windows style top-right */}
                      <button
                        onClick={() => setNewWarehouses(prev => prev.filter(w => w.id !== warehouse.id))}
                        className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center text-xs font-bold transition-colors"
                        title="Remove warehouse">
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-black/70">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={warehouse.lat}
                          onChange={(e) =>
                            updateNewWarehouseManually(
                              warehouse.id,
                              parseFloat(e.target.value) || 0,
                              warehouse.lng
                            )
                          }
                          className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded focus:ring-1 focus:ring-purple-500/50 text-black"
                          placeholder="Latitude"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-black/70">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={warehouse.lng}
                          onChange={(e) =>
                            updateNewWarehouseManually(
                              warehouse.id,
                              warehouse.lat,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded focus:ring-1 focus:ring-purple-500/50 text-black"
                          placeholder="Longitude"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <ToggleControl
              checked={showHeatmap}
              onChange={handleHeatmapToggle}
              loading={loading.orders}
              label="Reports"
              color="red"
            />
            {/* Metric Selection - Only show when heatmap is enabled */}
            {showHeatmap && (
              <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                <h4 className="text-xs font-medium mb-2 text-black">Select Metric</h4>
                <div className="relative">
                  <select
                    value={selectedMetric}
                    onChange={(e) => handleMetricChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white/10 border border-white/20 rounded focus:ring-1 focus:ring-red-500/50 text-black appearance-none cursor-pointer">
                    {metricOptions.map((option) => (
                      <option key={option.key} value={option.key} className="bg-white text-black">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-black/50 pointer-events-none" />
                </div>
              </div>
            )}
            {(showHeatmap) && (
              <div className="bg-white/10 px-3 py-2 rounded-lg border border-white/10">
                <h4 className="text-xs font-medium mb-2 flex items-center gap-1 text-black">
                  <CalendarIcon className="h-3 w-3" />
                  Date Range (DD/MM/YYYY)
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-black/70">From</label>
                    <input
                      type="text"
                      value={dateInputs.from}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[\d/]*$/.test(value) && value.length <= 10) {
                          handleDateChange("from", value);
                        }
                      }}
                      placeholder="DD/MM/YYYY"
                      className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 text-black ${
                        dateErrors.from 
                          ? 'bg-red-50 border-red-300 focus:ring-red-500/50' 
                          : 'bg-white/10 border-white/20 focus:ring-red-500/50'
                      }`}
                    />
                    {dateErrors.from && (
                      <p className="text-red-400 text-[10px] mt-1">{dateErrors.from}</p>
                    )}
                    {/* {!dateErrors.from && dateInputs.from.length === 10 && validateDateFormat(dateInputs.from) && (
                      <p className="text-green-400 text-[10px] mt-1 italic">
                        ✓ Valid date: {dateInputs.from}
                      </p>
                    )} */}
                  </div>
                  <div>
                    <label className="text-xs text-black/70">To</label>
                    <input
                      type="text"
                      value={dateInputs.to}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only numbers and forward slashes, max 10 characters
                        if (/^[\d/]*$/.test(value) && value.length <= 10) {
                          handleDateChange("to", value);
                        }
                      }}
                      placeholder="DD/MM/YYYY"
                      className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 text-black ${
                        dateErrors.to 
                          ? 'bg-red-50 border-red-300 focus:ring-red-500/50' 
                          : 'bg-white/10 border-white/20 focus:ring-red-500/50'
                      }`}
                    />
                    {dateErrors.to && (
                      <p className="text-red-400 text-[10px] mt-1">{dateErrors.to}</p>
                    )}
                    {/* {!dateErrors.to && dateInputs.to.length === 10 && validateDateFormat(dateInputs.to) && (
                      <p className="text-green-400 text-[10px] mt-1 italic">
                        ✓ Valid date: {dateInputs.to}
                      </p>
                    )} */}
                  </div>
                  {dateErrors.dateRange && (
                    <div className="relative bg-red-600/90 border-2 border-red-400 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm">
                      
                      <span className="text-white text-xs font-bold flex items-center gap-2 pr-6">⚠️
                      {dateErrors.dateRange}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {(showHeatmap) && (
              <button
                onClick={handleGenerateHeatmap}
                disabled={
                  loading.orders || 
                  !!dateErrors.from || 
                  !!dateErrors.to ||
                  !!dateErrors.dateRange ||
                  dateInputs.from.length !== 10 ||
                  dateInputs.to.length !== 10 ||
                  !validateDateFormat(dateInputs.from) ||
                  !validateDateFormat(dateInputs.to)
                }
                className={`w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  loading.orders || 
                  !!dateErrors.from || 
                  !!dateErrors.to ||
                  !!dateErrors.dateRange ||
                  dateInputs.from.length !== 10 ||
                  dateInputs.to.length !== 10 ||
                  !validateDateFormat(dateInputs.from) ||
                  !validateDateFormat(dateInputs.to)
                    ? "bg-gray-500/50 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white hover:shadow-md"
                }`}
              >
                {loading.orders ? (
                  <>
                    <div className="animate-spin h-3 w-3 border border-white/30 border-t-white rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3" />
                    Generate Heatmap
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Map */}
      <GoogleMap
        warehouses={warehouses}
        pincodes={pincodes}
        orderData={orderData}
        showWarehouses={showWarehouses}
        showPincodes={showPincodes}
        showHeatmap={showHeatmap}
        showCircles={showCircles}
        showNewWarehouses={showNewWarehouses}
        newWarehouses={newWarehouses}
        onNewWarehouseMove={updateNewWarehousePosition}
        selectedMetrics={[selectedMetric]}
        loading={loading}
        // showRoads={showRoads}
      />
      {/* Status - legends */}
      <div
        className={`absolute bottom-2 left-4 z-40 flex gap-2 ${ isFullscreen ? "fixed" : "" }`}>
        <StatusCard
          show={showWarehouses || loading.warehouses || !!errors.warehouses}
          loading={loading.warehouses}
          error={errors.warehouses}
          count={warehouses.length}
          label="warehouse"
          color="blue"
        />
        <StatusCard
          show={showPincodes || loading.pincodes || !!errors.pincodes}
          loading={loading.pincodes}
          error={errors.pincodes}
          count={pincodes.length}
          label="pincode"
          color="green"
          extra={
            uniqueWarehouseCount > 0
              ? `${uniqueWarehouseCount} warehouses serving`
              : undefined
          }
        />
        <StatusCard
          show={showHeatmap || loading.orders || !!errors.orders}
          loading={loading.orders}
          error={errors.orders}
          count={orderData.length}
          label="data point"
          color="red"
          selectedMetric={selectedMetric}
          metricOptions={metricOptions}
           extra={
             showHeatmap && !loading.orders && !errors.orders
                ? `${metricOptions.find((m) => m.key === selectedMetric)?.label || selectedMetric} (${formatISOToDDMMYYYY(dateRange.from)} to ${formatISOToDDMMYYYY(dateRange.to)})`
                : loading.orders
                ? "Generating heatmap data..."
                : undefined}
                />
        <StatusCard
          show={showNewWarehouses}
          loading={false}
          error=""
          count={newWarehouses.length}
          label="new warehouse"
          color="purple"
          extra="Draggable markers with service areas"
        />
        {/* <StatusCard
          show={!showRoads}
          loading={false}
          error=""
          count={0}
          label="roads hidden"
          color="yellow"
          extra="Roads and highways are hidden"
        /> */}
      </div>
    </div>
    )}
    </>
  );
}

function ToggleControl({checked, onChange, loading, label, color, disabled=false,}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  loading: boolean;
  label: string;
  color: "blue" | "green" | "purple" | "yellow" | "red";
  disabled?: boolean;
}) {
  const colorClass = color === "blue" ? "bg-blue-500" : color === "green" ? "bg-green-500": color === "purple"
                     ? "bg-purple-500": color === "red" ? "bg-red-500" : "bg-yellow-500";
  return (
      <div className="flex items-center gap-1 bg-white/15 px-2 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={loading || disabled}
        className={`${checked ? colorClass : "bg-gray-500"} ${
          loading || disabled ? "opacity-50" : ""
        } relative inline-flex h-4 w-8 rounded-full border-2 border-transparent transition-colors duration-200`}
      >
        <span
          className={`${checked ? "translate-x-4" : "translate-x-0"} 
          inline-block h-3 w-3 transform rounded-full bg-white shadow-lg transition duration-200`}
        />
      </Switch>
      <span className="text-xs font-medium select-none text-black">
        {loading ? "Loading..." : label === "New Warehouses" ? "Add New Warehouses" : `Show ${label}`}
      </span>
      </div>
  );
}
function StatusCard({ show,loading, error,count,label,color,extra,selectedMetric,metricOptions}: {
  show: boolean;
  loading: boolean;
  error: string;
  count: number;
  label: string;
  color: "blue" | "green" | "red" | "purple" | "yellow";
  extra?: string;
  selectedMetric?: string;
  metricOptions?: Array<{ key: string; label: string }>;
}) {
  if (!show) return null;
  const colorClass = color === "blue" ? "text-blue-300" : color === "green" ? "text-green-300" : color === "red" ? 
                     "text-red-300" : color === "purple" ? "text-purple-300" : "text-yellow-300";
  const bgClass =
    color === "blue" ? "bg-blue-500" : color === "green" ? "bg-green-500" : color === "red" ? 
    "bg-red-500" : color === "purple" ? "bg-purple-500" : "bg-yellow-500";
  const getMetricLabel = () => {
    if (!selectedMetric || !metricOptions) return "";
    const metric = metricOptions.find(m => m.key === selectedMetric);
    return metric ? metric.label.toLowerCase() : selectedMetric;
  };
    return (
    <div className="bg-black/50 backdrop-blur-md rounded-lg p-2 border border-white/10">
      {loading && (
        <div className="flex items-center gap-1">
          <div
            className={`animate-spin h-3 w-3 border-2 border-${color}-400 border-t-transparent rounded-full`}
          />
          <p className={`${colorClass} text-xs`}>
            {label === "data point" && selectedMetric 
              ? `Loading ${getMetricLabel()}...`
              : `Loading ${label}s...`
            }
          </p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 bg-red-500 rounded-full" />
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      {!loading && !error && count > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 ${bgClass} rounded-full`} />
            <p className={`${colorClass} text-xs`}>
              {count} {label}
              {count !== 1 ? "s" : ""}
            </p>
          </div>
          {label === "data point" && selectedMetric && metricOptions && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-orange-400 rounded-full" />
              <p className="text-orange-300 text-xs">
                Metric: {metricOptions.find(m => m.key === selectedMetric)?.label}
              </p>
            </div>
          )}
          {extra && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-yellow-400 rounded-full" />
              <p className="text-yellow-300 text-xs">{extra}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
