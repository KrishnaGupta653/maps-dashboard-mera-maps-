"use client";
import { useEffect, useRef, useCallback, useState } from "react";
// import { WarehouseLocation } from "@/actions/warehouse";
import { WarehouseLocation } from "@/actions/bazaar";
import { PincodePoint } from "@/actions/pincode";
import { OrderLocationData } from "@/actions/order";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { fetchAllPincodePlaceIds, getUniqueValidPincodes } from "@/actions/place_id";
interface GoogleMapProps {
  warehouses: WarehouseLocation[];
  pincodes: PincodePoint[];
  orderData: OrderLocationData[];
  showWarehouses: boolean;
  showPincodes: boolean;
  showHeatmap: boolean;
  showCircles?: boolean;
  showRoads: boolean;
  showNewWarehouses: boolean;
  newWarehouses: NewWarehouse[];
  onNewWarehouseMove: (id: string, lat: number, lng: number) => void;
  selectedMetrics: string[];
  loading: {
    warehouses: boolean;
    pincodes: boolean;
    orders: boolean;
  };
}
interface PincodeToPlaceId {
  [pincode: string]: {
    placeId: string;
  };
}
interface GoogleMapsAPI {
  maps: {
    Map: new (
      element: HTMLElement,
      options: google.maps.MapOptions
    ) => google.maps.Map;
    InfoWindow: new () => google.maps.InfoWindow;
    Geocoder: new () => google.maps.Geocoder;
    Marker: new (options: google.maps.MarkerOptions) => google.maps.Marker;
    LatLngBounds: new () => google.maps.LatLngBounds;
    LatLng: new (lat: number, lng: number) => google.maps.LatLng;
    SymbolPath: {
      CIRCLE: google.maps.SymbolPath;
    };
    MapTypeControlStyle: {
      HORIZONTAL_BAR: google.maps.MapTypeControlStyle;
    };
    ControlPosition: {
      TOP_CENTER: google.maps.ControlPosition;
      RIGHT_CENTER: google.maps.ControlPosition;
    };
    FeatureType: {
      POSTAL_CODE: google.maps.FeatureType;
    };
    visualization?: {
      HeatmapLayer: new (
        options: google.maps.visualization.HeatmapLayerOptions
      ) => google.maps.visualization.HeatmapLayer;
    };
  };
}
interface HeatmapDataPoint {
  location: google.maps.LatLng;
  weight: number;
}
interface FeatureMouseEvent {
  features: Array<{
    placeId?: string;
  }>;
  latLng: google.maps.LatLng;
}
interface NewWarehouse {
  id: string;
  lat: number;
  lng: number;
  name: string;
  color: string;
}
declare global {
  interface Window {
    google: GoogleMapsAPI;
    initMap: () => void;
  }
}
const COLORS = [
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#4ECDC4", "#F1948A", "#45B7D1",
  "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA", "#85C1E9", "#F4D03F", "#FF6B6B", "#96CEB4"];

const ROAD_HIDDEN_STYLES: google.maps.MapTypeStyle[] = [
     // Hide all road types - more comprehensive
  { featureType: "road", stylers: [{ visibility: "off" }] },
  // { featureType: "road.highway", stylers: [{ visibility: "off" }] },
  // { featureType: "road.highway.controlled_access", stylers: [{ visibility: "off" }] },
  // { featureType: "road.arterial", stylers: [{ visibility: "off" }] },
  // { featureType: "road.local", stylers: [{ visibility: "off" }] },
  // { featureType: "transit", stylers: [{ visibility: "off" }] },
  // { featureType: "transit.line", stylers: [{ visibility: "off" }] },
  // { featureType: "transit.station", stylers: [{ visibility: "off" }] },
  // { featureType: "transit.station.airport", stylers: [{ visibility: "off" }] },
  // { featureType: "transit.station.bus", stylers: [{ visibility: "off" }] },
  // { featureType: "transit.station.rail", stylers: [{ visibility: "off" }] },
  // { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ visibility: "off" }] },
  // { featureType: "road.highway", elementType: "geometry", stylers: [{ visibility: "off" }] },
  // { featureType: "road.arterial", elementType: "geometry", stylers: [{ visibility: "off" }] },
  // { featureType: "road.local", elementType: "geometry", stylers: [{ visibility: "off" }] },
  // { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  // { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
  // { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
  // { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  // { featureType: "all", elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
  // { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
  // { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b2a6" }] },
  // { featureType: "administrative.land_parcel", elementType: "geometry.stroke", stylers: [{ color: "#dcd2be" }] },
  // { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#ae9e90" }] },
  // { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  // { featureType: "poi", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
  // { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
  // { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5b076" }] },
  // { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#447530" }] },
  // { featureType: "water", elementType: "geometry", stylers: [{ color: "#b9d3c2" }] },
  // { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92998d" }] },
  // { featureType: "road.highway", elementType: "all", stylers: [{ visibility: "off" }] },
  // { featureType: "road.arterial", elementType: "all", stylers: [{ visibility: "off" }] },
  // { featureType: "road.local", elementType: "all", stylers: [{ visibility: "off" }] },

  ];
const generateWarehouseColors = (
  warehouses: WarehouseLocation[],
  pincodes: PincodePoint[]
) => {
  const warehouseNames = new Set<string>();
  warehouses.forEach((wh) => {
    if (wh.Warehouse) warehouseNames.add(wh.Warehouse);
  });
  pincodes.forEach((pc) => {
    if (pc.WH) warehouseNames.add(pc.WH);
  });
  const uniqueNames = Array.from(warehouseNames).sort();
  return uniqueNames.reduce(
    (acc, name, i) => ({
      ...acc,
      [name]: COLORS[i % COLORS.length],
    }),
    {} as Record<string, string>
  );
};
const createMarkerIcon_existing_warehouse = (color: string): google.maps.Symbol => ({
  // path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  path: "M2 8L12 3L22 8V21H18V17H16V21H8V17H6V21H2V8Z M18 3V7H20V3H18Z M4 10V12H6V10H4Z M8 10V12H10V10H8Z M14 10V12H16V10H14Z M18 10V12H20V10H18Z",
  fillColor: color,
  fillOpacity: 0.9,
  strokeColor: "#000000",
  strokeWeight: 1,
  scale: 1.3,
  anchor: new window.google.maps.Point(12, 21),
});
const createMarkerIcon_new_warehouse = (color: string): google.maps.Symbol => ({
  //path: "M2 20V8L12 2L22 8V20H16V14H8V20H2ZM4 18H6V16H4V18ZM10 18H14V16H10V18ZM18 18H20V16H18V18ZM12 4.5L5.5 9H18.5L12 4.5ZM8 12H16V10H8V12Z",
path:"M47 5 L53 5 L53 25 L47 25 Z M40 11 L60 11 L60 17 L40 17 Z M50 25 L20 45 L80 45 Z M20 45 L80 45 L80 95 L20 95 Z M25 55 L45 55 L45 90 L25 90 Z M55 55 L75 55 L75 90 L55 90 Z M47 55 L53 55 L53 63 L47 63 Z M18 95 L82 95 L82 99 L18 99 Z M41 71 L43 71 L43 73 L41 73 Z M57 71 L59 71 L59 73 L57 73 Z",
  fillColor: color,
 fillOpacity: 0.9,
  strokeColor: "#000000",
  strokeWeight: 1,
  scale: 0.4,
  anchor: new window.google.maps.Point(50, 60),
});
export default function GoogleMap({
  warehouses,
  pincodes,
  orderData,
  showWarehouses,
  showPincodes,
  showHeatmap,
  showCircles,
  showNewWarehouses,
  showRoads,
  newWarehouses,
  onNewWarehouseMove,
  selectedMetrics,
  loading,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const isInitializedRef = useRef(false);
  const postalCodeLayerRef = useRef<google.maps.FeatureLayer | null>(null);
  const warehouseMarkersRef = useRef<google.maps.Marker[]>([]);
  const pincodeMarkersRef = useRef<google.maps.Marker[]>([]);
  const pincodeToPlaceIdRef = useRef<Record<string, string>>({});
  const newWarehouseMarkersRef = useRef<google.maps.Marker[]>([]);
  const newWarehouseCirclesRef = useRef<google.maps.Circle[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const warehouseCirclesRef = useRef<google.maps.Circle[]>([]);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [pincodeToPlaceIdData, setPincodeToPlaceIdData] = useState<PincodeToPlaceId>({});
  
  const initializeMap = useCallback(() => {
    if (!mapRef.current || isInitializedRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.6139, lng: 77.209 },
        zoom: 8,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
        styles: showRoads ? undefined : ROAD_HIDDEN_STYLES,
        // styles:ROAD_HIDDEN_STYLES,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        streetViewControl: false,
        scaleControl: true,
        rotateControl: false,
        fullscreenControl: false,
        fullscreenControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP,
        },
        gestureHandling: "greedy",
      });
    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
    geocoderRef.current = new window.google.maps.Geocoder();
    postalCodeLayerRef.current = map.getFeatureLayer(
      window.google.maps.FeatureType.POSTAL_CODE
    );
    isInitializedRef.current = true;
  }, [showRoads]);

  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      initializeMap();
      return;
    }
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      window.initMap = initializeMap;
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=geometry,places,visualization&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [initializeMap]);
  const clearMarkers = (
    markersRef: React.MutableRefObject<google.maps.Marker[]>
  ) => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };
  const clearHeatmap = () => {
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
  };
  const fitBounds = (positions: google.maps.LatLngLiteral[], zoom = 12) => {
    if (!mapInstanceRef.current || positions.length === 0) return;

    if (positions.length === 1) {
      mapInstanceRef.current.setCenter(positions[0]);
      mapInstanceRef.current.setZoom(zoom);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      positions.forEach((pos) => bounds.extend(pos));
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }
  };
  const createHeatmap = useCallback(() => {
    if (
      !mapInstanceRef.current ||
      !showHeatmap ||
      orderData.length === 0 ||
      !window.google?.maps?.visualization
    ) {
      clearHeatmap();
      return;
    }
    clearHeatmap();
    const getWeight = (order: OrderLocationData) => {
      if (selectedMetrics.length === 0) return 1;
      let totalWeight = 0;
      selectedMetrics.forEach((metric) => {
        switch (metric) {
          case "cust_count":
            totalWeight += order.cust_count || 0;
            break;
          case "so_count":
            totalWeight += order.so_count || 0;
            break;
          case "order_value":
            totalWeight += (order.order_value || 0) / 1000;
            break;
          case "volume":
            totalWeight += order.volume || 0;
            break;
          default:
            totalWeight += 1;
        }
      });

      return Math.max(totalWeight, 1);
    };
    const heatmapData: HeatmapDataPoint[] = orderData
      .filter((order) => order.latitude && order.longitude)
      .map((order) => ({
        location: new window.google.maps.LatLng(
          order.latitude,
          order.longitude
        ),
        weight: getWeight(order),
      }));
    if (heatmapData.length === 0) return;
    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 20,
      opacity: 0.8,
    });
    if (!showWarehouses && !showPincodes) {
      const positions = heatmapData.map((point) => ({
        lat: point.location.lat(),
        lng: point.location.lng(),
      }));
      fitBounds(positions, 10);
    }
  }, [orderData, showHeatmap, selectedMetrics, showWarehouses, showPincodes]);
  const clearCircles = () => {
    warehouseCirclesRef.current.forEach((circle) => circle.setMap(null));
    warehouseCirclesRef.current = [];
  };
  const createWarehouseCircles = useCallback(() => {
    if (!mapInstanceRef.current || warehouses.length === 0) {
      clearCircles();
      return;
    }
    clearCircles();
    warehouses.forEach((warehouse) => {
      const lat = parseFloat(warehouse.Latitude?.toString() || "0");
      const lng = parseFloat(warehouse.Longitute?.toString() || "0");
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
      const center = { lat, lng };
      // Create 30km circle
      const circle30km = new window.google.maps.Circle({
        strokeColor: "#52ace9",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillColor: "#52ace9",
        fillOpacity: 0.1,
        map: mapInstanceRef.current,
        center: center,
        radius: 30000,
        zIndex: -100,
        clickable: false,
      });
      const circle40km = new window.google.maps.Circle({
        strokeColor: "#f14c3b",
        strokeOpacity: 1.0,
        strokeWeight: 1,
        fillColor: "#f14c3b",
        fillOpacity: 0.05,
        map: mapInstanceRef.current,
        center: center,
        radius: 40000,
        zIndex: -101,
        clickable: false,
        // icons: [{
        //   icon: {
        //     path: 'M 0,-1 0,1',
        //     strokeOpacity: 1,
        //     scale: 2
        //   },
        //   offset: '0',
        //   repeat: '15px'
        // }]
      });
      warehouseCirclesRef.current.push(circle30km, circle40km);
    });
  }, [warehouses]);
  const createWarehouseMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !showWarehouses || warehouses.length === 0) {
      return;
    }
    clearMarkers(warehouseMarkersRef);
    const warehouseColors = generateWarehouseColors(warehouses, pincodes);
    const positions: google.maps.LatLngLiteral[] = [];
    warehouses.forEach((warehouse, index) => {
      const lat = parseFloat(warehouse.Latitude?.toString() || "0");
      const lng = parseFloat(warehouse.Longitute?.toString() || "0");
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
      const position = { lat, lng };
      const color = warehouseColors[warehouse.Warehouse || ""] || COLORS[index % COLORS.length] || "#4285F4";
      const associatedPincodes = pincodes.filter( (p) => p.WH === warehouse.Warehouse);
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: warehouse.Warehouse || `Warehouse ${index + 1}`,
        icon: createMarkerIcon_existing_warehouse(color),
        zIndex: 1000,
      });
      const infoContent = `
        <div style="padding: 12px; font-family: system-ui; max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
            <span style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></span>
            🏢 ${warehouse.Warehouse || `Warehouse ${index + 1}`}
          </h3>
          <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
            <div><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} </div>
            <div><strong>Associated Pincodes:</strong> ${associatedPincodes.length}</div>
            ${associatedPincodes.length > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <strong>Sample Pincodes:</strong><br>
                ${associatedPincodes.slice(0, 5).map((p) =>
                `<span style="display: inline-block; background-color: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin: 2px; border: 1px solid ${color}40;">${p.pincode}</span>`).join("")}
                ${associatedPincodes.length > 5 ? `<br><small>... and ${associatedPincodes.length - 5 } more</small>`: ""}
              </div>
            `
          : ""
        }
          </div>
        </div>`;
      marker.addListener("click", () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);}
      });
      warehouseMarkersRef.current.push(marker);
      positions.push(position);
    });
    if (!showHeatmap && !showPincodes) {
      fitBounds(positions);
    }
  }, [warehouses, showWarehouses, pincodes, showHeatmap, showPincodes]);

    const createPincodeFeatureLayers = useCallback(async () => {
      if ( !mapInstanceRef.current || !showPincodes || pincodes.length === 0 || Object.keys(pincodeToPlaceIdData).length === 0) {
        if (postalCodeLayerRef.current) {
          postalCodeLayerRef.current.style = null;
        }
        return;
      }
    
      clearMarkers(pincodeMarkersRef);
      if (postalCodeLayerRef.current) {
        postalCodeLayerRef.current.style = null;
      }
      pincodeToPlaceIdRef.current = {};
    
      const warehouseGroups = pincodes.reduce((acc, pincode) => {
        if (!acc[pincode.WH]) acc[pincode.WH] = [];
        acc[pincode.WH].push(pincode);
        return acc;
      }, {} as Record<string, PincodePoint[]>);
    
      const warehouseColors = generateWarehouseColors(warehouses, pincodes);
      const pincodeToWarehouseMap: Record<
        string,
        { warehouse: string; color: string; data: PincodePoint } 
        > = {};
      let mappedPincodes = 0;
      // let totalPincodes = 0;
      Object.entries(warehouseGroups).forEach(([warehouseName, pincodeGroup]) => {
        const color = warehouseColors[warehouseName] || "#4285F4";
        pincodeGroup.forEach((pincode) => {
          // totalPincodes++;
          const pincodeStr = pincode.pincode.toString();
          pincodeToWarehouseMap[pincodeStr] = {
            warehouse: warehouseName,
            color,
            data: pincode,
          };
          const pincodeData = pincodeToPlaceIdData[pincodeStr];
          if (pincodeData?.placeId) {
            pincodeToPlaceIdRef.current[pincodeStr] = pincodeData.placeId;
            mappedPincodes++;
          } else {
            // console.warn(`No place ID found for pincode: ${pincodeStr}`);
          }
        });
      });
    
      //console.log(`Mapped ${mappedPincodes} out of ${totalPincodes} pincodes to place IDs`);
      if (mappedPincodes === 0) {
        console.warn('No pincodes could be mapped to place IDs. Postal code styling will not work.');
        return;
      }
    
      if (postalCodeLayerRef.current) {
        postalCodeLayerRef.current.style = (params: google.maps.FeatureStyleFunctionOptions) => {
          const feature = params.feature as google.maps.PlaceFeature;
          const placeId = feature.placeId;
          if (!placeId) return null;
        
          const matchingPincode = Object.entries(
            pincodeToPlaceIdRef.current
          ).find(([, storedPlaceId]) => storedPlaceId === placeId);
        
          if (matchingPincode) {
            const [pincodeStr] = matchingPincode;
            const warehouseInfo = pincodeToWarehouseMap[pincodeStr];
          
            if (warehouseInfo) {
              return {
                strokeColor: warehouseInfo.color,
                strokeOpacity: 1.0,
                strokeWeight: 2.0,
                fillColor: warehouseInfo.color,
                fillOpacity: 0.3,
              };
            }
          }
          return null;
        };
      
        // postalCodeLayerRef.current.addListener(
        //   "mousemove",
        //   (event: FeatureMouseEvent) => {
        //     const features = event.features || [];
        //     const feature = features[0];
          
        //     if (feature?.placeId) {
        //       const matchingPincode = Object.entries(
        //         pincodeToPlaceIdRef.current
        //       ).find(([, storedPlaceId]) => storedPlaceId === feature.placeId);
            
        //       if (matchingPincode && event.latLng) {
        //         const [pincodeStr] = matchingPincode;
        //         const warehouseInfo = pincodeToWarehouseMap[pincodeStr];
              
        //         if (
        //           warehouseInfo &&
        //           infoWindowRef.current &&
        //           mapInstanceRef.current
        //         ) {
        //           infoWindowRef.current.setContent(`
        //             <div style="padding: 6px 10px; font-family: sans-serif; font-size: 11px; color: #333; line-height: 1.4; max-width: 220px;">
        //               <style>
        //                 .gm-ui-hover-effect > span {
        //                   transform: scale(0.8) !important;
        //                 }
        //               </style>
        //               <strong>Pincode:</strong> ${pincodeStr}<br>
        //               <strong>Warehouse:</strong> <span style="color: ${warehouseInfo.color};">${warehouseInfo.warehouse}</span><br>
        //               <strong>District:</strong> ${warehouseInfo.data.district}<br>
        //               <strong>State:</strong>    ${warehouseInfo.data.state}<br>
        //               <strong>Distance:</strong> ${warehouseInfo.data.distance} km<br>
        //               <strong>Schedule:</strong> ${warehouseInfo.data.Schedule}
        //             </div>
        //           `);
        //           infoWindowRef.current.setPosition(event.latLng);
        //           infoWindowRef.current.open(mapInstanceRef.current);
        //         }
        //       }
        //     }
        //   }
        // );
        postalCodeLayerRef.current.addListener(
  "click",
  (event: FeatureMouseEvent) => {
    const features = event.features || [];
    const feature = features[0];
  
    if (feature?.placeId) {
      const matchingPincode = Object.entries(
        pincodeToPlaceIdRef.current
      ).find(([, storedPlaceId]) => storedPlaceId === feature.placeId);
    
      if (matchingPincode && event.latLng) {
        const [pincodeStr] = matchingPincode;
        const warehouseInfo = pincodeToWarehouseMap[pincodeStr];
      
        if (
          warehouseInfo &&
          infoWindowRef.current &&
          mapInstanceRef.current
        ) {
          // Enhanced info window with more pincode data
          const pincodeData = warehouseInfo.data;
          
          infoWindowRef.current.setContent(`
            <div style="padding: 14px; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #1f2937; line-height: 1.5; max-width: 320px; background: white; border-radius: 8px;">
              <!-- Header -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${warehouseInfo.color};">
                <div style="width: 16px; height: 16px; background: ${warehouseInfo.color}; border-radius: 50%; flex-shrink: 0;"></div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">
                  📍 Pincode ${pincodeStr}
                </h3>
              </div>

              <!-- Location Details -->
              <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px;">
                  🌍 Location Details
                </h4>
                <div style="background: #f9fafb; padding: 8px; border-radius: 6px; font-size: 12px;">
                  <div style="margin-bottom: 4px;"><strong>State:</strong> ${pincodeData.state}</div>
                  <div style="margin-bottom: 4px;"><strong>District:</strong> ${pincodeData.district}</div>
                  <div style="margin-bottom: 4px;"><strong>Coordinates:</strong> ${pincodeData.latitude.toFixed(6)}, ${pincodeData.longitute.toFixed(6)}</div>
                </div>
              </div>

              <!-- Warehouse Assignment -->
              <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px;">
                  🏢 Warehouse Assignment
                </h4>
                <div style="background: ${warehouseInfo.color}15; border: 1px solid ${warehouseInfo.color}40; padding: 8px; border-radius: 6px; font-size: 12px;">
                  <div style="margin-bottom: 4px;">
                    <strong style="color: ${warehouseInfo.color};">Warehouse:</strong> ${warehouseInfo.warehouse}
                  </div>
                  <div style="margin-bottom: 4px;"><strong>Distance:</strong> ${pincodeData.distance} km</div>
                  ${pincodeData.matchedWarehouse ? `
                    <div style="margin-bottom: 4px;"><strong>Warehouse Code:</strong> ${pincodeData.matchedWarehouse.zohoWarehouseId || 'N/A'}</div>
                  ` : ''}
                </div>
              </div>

              <!-- Service Schedule -->
              <div style="margin-bottom: 12px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px;">
                  📅 Service Schedule
                </h4>
                <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 8px; border-radius: 6px; font-size: 12px;">
                  <div style="margin-bottom: 4px;"><strong>Schedule Type:</strong> ${pincodeData.schedule_type}</div>
                  <div style="margin-bottom: 4px;"><strong>Schedule:</strong> ${pincodeData.Schedule}</div>
                </div>
              </div>
              ${pincodeData.matchedWarehouse ? `
                <div style="margin-bottom: 8px;">
                  <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #374151; display: flex; align-items: center; gap: 4px;">
                    📦 Warehouse Details
                  </h4>
                  <div style="background: #fef7ff; border: 1px solid #d946ef; padding: 8px; border-radius: 6px; font-size: 11px;">
                    ${pincodeData.matchedWarehouse.Latitude && pincodeData.matchedWarehouse.Longitute ? `
                      <div style="margin-bottom: 4px;">
                        <strong>WH Location:</strong> ${parseFloat(pincodeData.matchedWarehouse.Latitude.toString()).toFixed(4)}, ${parseFloat(pincodeData.matchedWarehouse.Longitute.toString()).toFixed(4)}
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

            </div>
          `);
          
          infoWindowRef.current.setPosition(event.latLng);
          infoWindowRef.current.open(mapInstanceRef.current);
        }
      }
    }
  }
);

mapInstanceRef.current.addListener('click', () => {
  if (infoWindowRef.current) {
    infoWindowRef.current.close();
  }
});
       
    }
  }, [pincodes, showPincodes, warehouses, pincodeToPlaceIdData]);
  const clearNewWarehouseMarkers = () => {
    newWarehouseMarkersRef.current.forEach((marker) => marker.setMap(null));
    newWarehouseMarkersRef.current = [];
  };
  const clearNewWarehouseCircles = () => {
    newWarehouseCirclesRef.current.forEach((circle) => circle.setMap(null));
    newWarehouseCirclesRef.current = [];
  };
  const createNewWarehouseMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !showNewWarehouses || newWarehouses.length === 0) {
      clearNewWarehouseMarkers();
      clearNewWarehouseCircles();
      return;
    }
    clearNewWarehouseMarkers();
    clearNewWarehouseCircles();
    newWarehouses.forEach((warehouse) => {
      const position = { lat: warehouse.lat, lng: warehouse.lng };
      const color =  warehouse.color ||  "#9B59B6";
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: warehouse.name,
        icon: createMarkerIcon_new_warehouse(color),
        zIndex: 2000,
        draggable: true,
      });
      marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          onNewWarehouseMove(warehouse.id, newLat, newLng);
          const associatedCircles = newWarehouseCirclesRef.current.filter(
            (_, index) => Math.floor(index / 2) === newWarehouses.findIndex(w => w.id === warehouse.id)
          );
          associatedCircles.forEach(circle => {
            circle.setCenter({ lat: newLat, lng: newLng });
          });
        }
      });
      const center = position;
      // 30km circle
      const circle30km = new window.google.maps.Circle({
        strokeColor: "#9B59B6",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        fillOpacity: 0.1,
        fillColor: "#9B59B6",
        map: mapInstanceRef.current,
        center: center,
        radius: 30000,
        zIndex: -100,
        clickable: false,
      });
      // 40km circle
      const circle40km = new window.google.maps.Circle({
        strokeColor: "#8E44AD",
        strokeOpacity: 1.0,
        strokeWeight: 1,
        fillColor: "#8E44AD",
        fillOpacity: 0.1,
        map: mapInstanceRef.current,
        center: center,
        radius: 40000,
        zIndex: -101,
        clickable: false,
      });
      const infoContent = `
      <div style="padding: 12px; font-family: system-ui; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
          <span style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></span>
          🏢 ${warehouse.name}
        </h3>
        <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
          <div><strong>Location:</strong> ${warehouse.lat.toFixed(6)}, ${warehouse.lng.toFixed(6)}</div>
          <div><strong>Type:</strong> New Warehouse (Draggable)</div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; color: #9B59B6;">
            <strong>Service Areas:</strong><br>
            • 30km radius (Primary)<br>
            • 40km radius (Extended)
          </div>
        </div>
      </div>
    `;
      marker.addListener("click", () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });
      newWarehouseMarkersRef.current.push(marker);
      newWarehouseCirclesRef.current.push(circle30km, circle40km);
    });
  }, [newWarehouses, showNewWarehouses, onNewWarehouseMove]);

  useEffect(() => {
    loadGoogleMaps();
    return () => {
      clearMarkers(warehouseMarkersRef);
      clearMarkers(pincodeMarkersRef);
      clearNewWarehouseMarkers();
      clearHeatmap();
      clearCircles();
      clearNewWarehouseCircles();
    };
  }, [loadGoogleMaps]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isInitializedRef.current) return;
      console.log('Toggling roads:', showRoads);
      const roadStyles = showRoads ? null : ROAD_HIDDEN_STYLES;
      mapInstanceRef.current.setOptions({
        styles: roadStyles,
      });
       console.log("✅ Road styles updated:", showRoads ? "Visible" : "Hidden");
    }, [showRoads]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    createNewWarehouseMarkers();
  }, [newWarehouses, showNewWarehouses, createNewWarehouseMarkers]);

  useEffect(() => {
    const loadPincodeData = async () => {
      try {
        if (pincodes.length === 0) {
          // console.log('No pincodes to load')
          setPincodeToPlaceIdData({})
          return
        }
        // console.log(`Starting to load place IDs for ${pincodes.length} pincodes...`)
        const pincodeStrings = pincodes.map(p => p.pincode.toString())
        const uniquePincodes = await getUniqueValidPincodes(pincodeStrings)
        if (uniquePincodes.length === 0) {
          console.warn('No valid pincodes found after filtering')
          setPincodeToPlaceIdData({})
          return
        }
        // console.log(`Loading place IDs for ${uniquePincodes.length} unique valid pincodes...`)
        const data = await fetchAllPincodePlaceIds()
        setPincodeToPlaceIdData(data)
        const successCount = Object.keys(data).length
        // console.log(`Successfully loaded place IDs for ${successCount} out of ${uniquePincodes.length} pincodes`)
        if (successCount === 0) {
          // console.warn('No place IDs were loaded. This might indicate API authentication issues or invalid pincodes.')
        }
      } catch (error) {
        console.error("Failed to load pincode place IDs:", error)
        setPincodeToPlaceIdData({})
      }
    }
    if (pincodes.length > 0 && !loading.pincodes) {
      loadPincodeData()
    } else {
      setPincodeToPlaceIdData({})
    }
  }, [pincodes, loading.pincodes]) 

  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (showWarehouses && !loading.warehouses) {
      createWarehouseMarkers();
    } else {
      clearMarkers(warehouseMarkersRef);
    }
  }, [warehouses, showWarehouses, loading.warehouses, createWarehouseMarkers]);

  useEffect(() => {
    if (!isInitializedRef.current) return;

    if (showCircles && warehouses.length > 0 && !loading.warehouses) {
      createWarehouseCircles();
      createPincodeFeatureLayers();
    } else {
      clearCircles();
    }
  }, [warehouses, showCircles, loading.warehouses, createWarehouseCircles, createPincodeFeatureLayers]);

  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (
      showPincodes &&
      !loading.pincodes &&
      Object.keys(pincodeToPlaceIdData).length > 0
    ) {
      createPincodeFeatureLayers();
    } else {
      clearMarkers(pincodeMarkersRef);
      if (postalCodeLayerRef.current) {
        postalCodeLayerRef.current.style = null;
      }
    }
  }, [ pincodes, showPincodes, loading.pincodes, pincodeToPlaceIdData, createPincodeFeatureLayers,]);
  
  useEffect(() => {
    if (!isInitializedRef.current) return;
    createHeatmap();
  }, [orderData, showHeatmap, selectedMetrics, createHeatmap]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapRef}
        className="w-full h-full relative"
        style={{ minHeight: "400px" }}
      >
        {(loading.warehouses || loading.pincodes || loading.orders) && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white/90 rounded-lg p-4 flex items-center space-x-3 shadow-lg">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-gray-700 font-medium">
                {(() => {
                  const loadingStates = [];
                  if (loading.warehouses) loadingStates.push("warehouses");
                  if (loading.pincodes) loadingStates.push("postal codes");
                  if (loading.orders) loadingStates.push("reports");
                  if (loadingStates.length === 0) return "Loading...";
                  if (loadingStates.length === 1)
                    return `Loading ${loadingStates[0]}...`;
                  if (loadingStates.length === 2)
                    return `Loading ${loadingStates[0]} and ${loadingStates[1]}...`;
                  return `Loading ${loadingStates
                    .slice(0, -1)
                    .join(", ")} and ${loadingStates[loadingStates.length - 1]
                    }...`;
                })()}
              </span>
            </div>
          </div>
        )}
        {((showWarehouses && warehouses.length > 0) ||
          (showPincodes && pincodes.length > 0) ||
          (showHeatmap && orderData.length > 0) ||
          (showCircles && warehouses.length > 0) ||
          (showNewWarehouses && newWarehouses.length > 0)) && (
            <div className="fixed bottom-4 right-0 z-20">
              {/* Toggle Button */}
              <button
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className={`absolute ${isLegendOpen ? "right-80" : "right-2"
                  } bottom-0 w-10 h-12 bg-white/90 backdrop-blur-sm rounded-l-lg shadow-lg border border-gray-200 hover:bg-white transition-all duration-300 flex items-center justify-center group z-30`}>
                <ChevronLeftIcon className={`h-5 w-5 text-gray-600 transition-transform duration-300 ${isLegendOpen ? "rotate-180" : "rotate-0"}`}/>
                {!isLegendOpen && (
                  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    Show Legend
                  </div>
                )}
              </button>
              {/* Legends Panel */}
              <div className={`bg-white/20 backdrop-blur-md rounded-l-lg shadow-xl border border-gray-200 p-4 w-70 h-134 overflow-y-auto transform transition-transform duration-300 ${isLegendOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* Panel Header */}
                <div className="flex items-center justify-between mb-3 pb-1 border-b border-gray-200">
                  <h3 className="text-sm font-bold text-black-800">Map Legend</h3>
                  <button
                    onClick={() => setIsLegendOpen(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Circles Legend */}
                  {showCircles && warehouses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        ⭕ Service Area Circles
                      </h4>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center space-x-3">
                          <svg width="20" height="20" viewBox="0 0 20 20">
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              fill="none"
                              stroke="#52ace9"
                              strokeWidth="2"
                            />
                          </svg>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-700">
                              30km Radius
                            </div>
                            <div className="text-xs text-gray-500">
                              Primary service area
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <svg width="20" height="20" viewBox="0 0 20 20">
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              fill="none"
                              stroke="#ff6b6b"
                              strokeWidth="2"
                            />
                          </svg>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-700">
                              40km Radius
                            </div>
                            <div className="text-xs text-gray-500">
                              Extended service area
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 pl-6">
                          {warehouses.length} warehouse
                          {warehouses.length !== 1 ? "s" : ""} with service areas
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Warehouse Legend */}
                  {showWarehouses && warehouses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        🏢 Warehouses ({warehouses.length})
                      </h4>
                      <div className="space-y-2 pl-2 max-h-100 overflow-y-auto">
                        {warehouses.map((warehouse, index) => {
                          const warehouseColors = generateWarehouseColors(warehouses, pincodes);
                          const color = warehouseColors[warehouse.Warehouse || ""] || COLORS[index % COLORS.length];
                          const associatedPincodes = pincodes.filter((p) => p.WH === warehouse.Warehouse);
                          return (
                            <div
                              key={warehouse.Warehouse || index}
                              className="flex items-center space-x-3"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                style={{ color }}
                              >
                                <path
                                  // d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                  d= "M2 8L12 3L22 8V21H18V17H16V21H8V17H6V21H2V8Z M18 3V7H20V3H18Z M4 10V12H6V10H4Z M8 10V12H10V10H8Z M14 10V12H16V10H14Z M18 10V12H20V10H18Z"
                                  fill="currentColor"
                                  stroke="#000000"
                                  strokeWidth="1"
                                />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-700 truncate">
                                  {warehouse.Warehouse ||
                                    `Warehouse ${index + 1}`}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {associatedPincodes.length} pincodes
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Heatmap Legend */}
                  {showHeatmap && orderData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        🔥 Order Heatmap
                      </h4>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                        <div
                          className="h-3 w-full rounded shadow-inner"
                          style={{
                            background:
                              "linear-gradient(to right, rgb(140, 243, 98), rgb(140, 243, 98), rgba(255,0,0,0.8))",
                          }}
                        />
                        <div className="text-xs text-gray-600">
                          {orderData.length} order locations
                        </div>
                        {selectedMetrics.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <strong>Metrics:</strong> {selectedMetrics.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* New Warehouses Legend */}
                  {showNewWarehouses && newWarehouses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        🏗️ New Warehouses ({newWarehouses.length})
                      </h4>
                      <div className="space-y-2 pl-2 max-h-40 overflow-y-auto">
                        {newWarehouses.map((warehouse) => (
                          <div key={warehouse.id} className="flex items-center space-x-3">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              style={{ color: "#9B59B6" }}
                            >
                              <path
                                // d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                d="M3 21V9L8 6L13 9V5L18 2L23 5V21H19V18H17V21H15V18H13V21H11V18H9V21H7V18H5V21H3Z M19 7V9H21V7H19Z M5 11V13H7V11H5Z M9 11V13H11V11H9Z M13 11V13H15V11H13Z M17 11V13H19V11H17Z M19 15V17H21V15H19Z M5 15V17H7V15H5Z"
                                fill="currentColor"
                                stroke="#ffffff"
                                strokeWidth="1"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-700 truncate">
                                {warehouse.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Draggable • {warehouse.lat.toFixed(4)}, {warehouse.lng.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
