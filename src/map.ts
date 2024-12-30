"use client"
let map: google.maps.Map | null = null;
let heatmap: google.maps.visualization.HeatmapLayer | null = null;
declare global {
  interface Window {
    google: typeof google;
    initAutocomplete: () => void;
  }
}

export function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_API_KEY}&libraries=visualization,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);

    document.head.appendChild(script);
  });
}

const updateHeatmapOnZoom = (zoomLevel: number) => {
  if (heatmap) {
    const radius = Math.max(50, 90 - zoomLevel * 1.5);
    const opacity = Math.max(0.6, 0.8 - zoomLevel * 0.05);
    heatmap.setOptions({
      radius: radius,
      opacity: opacity,
    });
  }
};

export const initializeMap = (mapElementId: string): google.maps.Map => {
  // if (window.google && window.google.maps) {
  //   return new google.maps.Map(document.getElementById(mapElementId)!, {
  //     center: { lat: 29.3516232, lng: 77.7109485 },
  //     zoom: 8,
  //     gestureHandling: 'greedy',
  //     mapId: '68b8f843e24917af'
  //   });
  if (window.google && window.google.maps) {
    const map = new google.maps.Map(document.getElementById(mapElementId)!, {
      center: { lat: 29.3516232, lng: 77.7109485 },
      zoom: 8,
      gestureHandling: 'greedy',
      mapId: '68b8f843e24917af'
    });
    map.addListener('zoom_changed', () => {
      const zoomLevel: any = map.getZoom();
      updateHeatmapOnZoom(zoomLevel);
    });

    // findPlaces();

    return map;
  } else {
    throw new Error("Google Maps is not loaded yet");
  }
};


async function findPlaces() {
  const { Place } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
  const request = {
    textQuery: 'Giridih',
    fields: ['displayName', 'location'],
    locationBias: { lat: 37.4161493, lng: -122.0812166 },
    isOpenNow: true,
    language: 'en-US',
    maxResultCount: 8,
    minRating: 3.2,
    region: 'us',
    useStrictTypeFiltering: false,
  };
  const { places } = await Place.searchByText(request);

  if (places.length) {
    console.log(places);

    const { LatLngBounds } = await google.maps.importLibrary("core") as google.maps.CoreLibrary;
    const bounds = new LatLngBounds();
    places.forEach((place) => {
      const markerView = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: place.displayName,
      });

      bounds.extend(place.location as google.maps.LatLng);
      console.log(place);
    });

    map!.fitBounds(bounds);

  } else {
    console.log('No results');
  }
}

type Metric = 'order_value' | 'so_count' | 'cust_count';

export async function initHeatMapSelection(locationData?: any, selectedMetric?: any, startDate?: any, endDate?: any): Promise<void> {
  try {
    await loadGoogleMapsScript();
    map = initializeMap("map");
    const filterDataByDate = (locationData: any, startDate: string, endDate: string) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return locationData.filter((item: any) => {
        const orderDate = new Date(item.order_date);
        return orderDate >= start && orderDate <= end;
      });
    };

    const filtered = filterDataByDate(locationData, startDate || "", endDate || "");
    const prepareHeatmapData = (locationData: any, metric: string, zoomLevel: any) => {
      return locationData.map((item: any) => {
        const latLng = new google.maps.LatLng(item.latitude, item.longitude);
        const weight = item[metric];

        const zoomWeightMultiplier = 1 + (zoomLevel - 12) * 0.05;
        const adjustedWeight = weight * zoomWeightMultiplier;
        return {
          location: latLng,
          weight: Math.max(adjustedWeight, 1),
        };

      }).filter((item: any) => item !== null);
    };

    const zoomLevel = map.getZoom();
    // const radius = Math.max(50, 120 - (zoomLevel! * 2)); // Reduce radius as you zoom in
    // const opacity = Math.max(0.3, 0.8 - (zoomLevel! * 0.05));

    const heatmapDataMetric = prepareHeatmapData(filtered, selectedMetric, zoomLevel);
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapDataMetric,
      map: map,
      radius: Math.max(50, 120 - zoomLevel! * 1.5),
      opacity: 0.7,
      gradient: [
        'rgba(0, 255, 0, 0)', // Transparent green
        'rgba(0, 255, 0, 0.6)', // Light green
        'rgba(255, 255, 0, 0.8)', // Yellow
        'rgba(255, 165, 0, 1)', // Orange
        'rgba(255, 0, 0, 1)', // Solid red
      ],
    });
    if (filtered.length > 0) {
      const centerLatLng = new google.maps.LatLng(filtered[0].latitude, filtered[0].longitude);
      map.setCenter(centerLatLng);
      map.setZoom(10); // Adjust zoom level to fit the data
    }
  } catch (error) {
    console.error("Error initializing heatmap:", error);
  }
}

let currentInfoWindow: google.maps.InfoWindow | null = null;
let geocoder: google.maps.Geocoder;
let markers: google.maps.Marker[] = [];
let circles: google.maps.Circle[] = [];
let marker: google.maps.Marker;
let infoWindow: any;
let lastInteractedFeatureIds: any = [];
let lastClickedFeatureIds: any[] = [];


//   // const placeAutocomplete = new google.maps.places.Autocomplete(request?.address);
//   // placeAutocomplete.bindTo('bounds', map);
//   // placeAutocomplete.setFields(['geometry', 'icon', 'name']);
//   //@ts-ignore
//   //   placeAutocomplete.id = 'place-autocomplete-input';

//   //   const card = document.getElementById('place-autocomplete-card') as HTMLElement;
//   //   //@ts-ignore
//   //   card.appendChild(placeAutocomplete);
//   //   map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);
//   //   // Add the gmp-placeselect listener, and display the results on the map.
//   //   //@ts-ignore
//   //   placeAutocomplete.addEventListener('gmp-placeselect', async ({ place }) => {
//   //     await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });



let featureLayer: google.maps.FeatureLayer;
var LOCALITY = 'LOCALITY';
var POSTAL_CODE = 'POSTAL_CODE';

export async function geocodefor(request: any, pincodeArray?: any, toggle?: any): Promise<void> {
  if (!map) {
    await loadGoogleMapsScript();
    map = initializeMap("map");
  }
  geocoder = new google.maps.Geocoder();
  if (!marker) {
    marker = new google.maps.Marker({
      map: map,
    });
  }

  // console.log("pincodeArray", pincodeArray);
  const dataLayer = new google.maps.Data();
  dataLayer.setMap(map);

  function styleBoundary(placeId: string) {
    const featureStyleOptions = {
      strokeColor: '#810FCB',
      strokeOpacity: 1.0,
      strokeWeight: 3.0,
      fillColor: '#810FCB',
      fillOpacity: 0.5
    };
    featureLayer.style = (options: { feature: { placeId: string; }; }) => {
      if (options.feature.placeId == placeId) {
        return featureStyleOptions;
      }
    };
  }

  const zoomToPolygon = (placeId: string) => {
    geocoder.geocode({ placeId })
      .then(({ results }) => {
        map!.fitBounds(results[0].geometry.viewport, 155);
      })
      .catch((e) => {
        console.log('Geocoder failed due to: ' + e);
      });
  };

  if (request.address && request.address.length > 0) {
    if (isNaN(request.address)) {
      featureLayer = map.getFeatureLayer(LOCALITY);
    } else {
      featureLayer = map.getFeatureLayer(POSTAL_CODE);
    }
    const result = await geocoder.geocode(request);
    const { results } = result;
    zoomToPolygon(results[0].place_id);
    map.setCenter(results[0].geometry.location);
    marker.setPosition(results[0].geometry.location);
    marker.setMap(map);
    styleBoundary(results[0].place_id);
  }

  try {
    
    const featureLayers: google.maps.FeatureLayer[] = [];
    const placeIdsToStyle: Set<string> = new Set();
    featureLayer = map.getFeatureLayer(POSTAL_CODE);

    for (const wh in pincodeArray) {
      if (pincodeArray.hasOwnProperty(wh)) {
        const pincodes = pincodeArray[wh];
        for (const pin of pincodes) {
          try {
          let pincode = pin.pincode.toString();
          const request = { address: pincode };

          const result = await geocoder.geocode(request)
          const { results } = result;
          if (results.length > 0) {
            placeIdsToStyle.add(results[0].place_id);
          }
          function styleBoundary() {
            const featureStyleOptions = {
              strokeColor: '#810FCB',
              strokeOpacity: 1.0,
              strokeWeight: 2.0,
              fillColor: '#810FCB',
              fillOpacity: 0.5
            };
            featureLayer.style = (options: { feature: { placeId: string; }; }) => {
              if (placeIdsToStyle.has(options.feature.placeId)) {
                return featureStyleOptions;
              }
            };
          }
          styleBoundary();
          if (!toggle) {
            featureLayer.style = null;
          }
          featureLayers.push(featureLayer);
          } catch (error) {
            console.log("error", error);
          }
        }
      }
    }
  } catch (e) {
    console.error("Geocode was not successful for the following reason:", e);
  }
}



export async function initHeatMap(props?: any, filteredData?: any, PincodeWH?: any): Promise<void> {
  if (!map) {
    await loadGoogleMapsScript();
    map = initializeMap("map");
  }

  // const {Place} = await google.maps.importLibrary("places");

  const clearMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
    markers = [];
  };

  const clearCircles = () => {
    circles.forEach(circle => {
      circle.setMap(null);
    });
    circles = [];
  };

  const addMarkers = (filteredData: any[], map: google.maps.Map) => {
    filteredData.forEach((ware: any) => {
      const lat = ware[0]?.lat;
      const lng = ware[0]?.lng;
      if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        const marker = new google.maps.Marker({
          // draggable: true,
          // animation: google.maps.Animation.DROP,
          position: { lat, lng },
          map,
          title: ware[1],
          optimized: false,
        });
        markers.push(marker);
        marker.addListener("click", () => {
          const infoWindow = new google.maps.InfoWindow();
          infoWindow.setContent(marker.getTitle());
          infoWindow.open(marker.getMap(), marker);
        });
      } else {
        console.warn('Invalid lat/lng for warehouse:', ware);
      }
    });
  };
  const addCircles = (filteredData: any[], map: google.maps.Map, props?: any) => {
    filteredData.forEach((ware: any) => {
      const lat = ware[0]?.lat;
      const lng = ware[0]?.lng;
      if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        if (props !== 10) {
          const circle = new google.maps.Circle({
            strokeColor: "#0000FF",
            strokeOpacity: 0.4,
            strokeWeight: 2,
            fillColor: "transparent",
            fillOpacity: 0.7,
            map,
            center: { lat, lng },
            radius: props * 1000,
          });
          circles.push(circle);
        }
      } else {
        console.warn('Invalid lat/lng for warehouse (circle):', ware);
      }
    });
  };
  if (typeof google !== "undefined") {
    const infoWindow = new google.maps.InfoWindow();
    clearMarkers();
    clearCircles();
    if (filteredData && filteredData.length > 0) {
      addMarkers(filteredData, map);
      addCircles(filteredData, map, props);
    }
  }
}
