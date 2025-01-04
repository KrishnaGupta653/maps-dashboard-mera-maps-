"use client"
let map: google.maps.Map | null = null;
let heatmap: google.maps.visualization.HeatmapLayer | null = null;
export async function loadGoogleMapsScript(): Promise<void> {
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

    const radius = Math.max(50, 90 - zoomLevel * 3.5);
    const opacity = Math.max(0.8, 0.8 - zoomLevel * 0.05);
    console.log("radius", radius);
    heatmap.setOptions({
      radius: radius,
      opacity: opacity,
    });
  }
};

export const initializeMap = (mapElementId: string): google.maps.Map => {
  if (window.google && window.google.maps) {
    const map = new google.maps.Map(document.getElementById(mapElementId)!, {
      center: { lat: 29.3516232, lng: 77.7109485 },
      zoom: 8,
      gestureHandling: 'greedy',
      mapId: '68b8f843e24917af'
    });
    // map.addListener('zoom_changed', () => {
    //   const zoomLevel: any = map.getZoom();
    //   updateHeatmapOnZoom(zoomLevel);
    // });
    return map;
  } else {
    throw new Error("Google Maps is not loaded yet");
  }
};


export async function initHeatMapSelection(locationData?: any, selectedMetric?: any, startDate?: string, endDate?: string): Promise<boolean> {

  try {
    if (!map) {
      await loadGoogleMapsScript();
      map = initializeMap("map");
    }
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
          weight: adjustedWeight
        };

      }).filter((item: any) => item !== null);
    };

    const zoomLevel = map.getZoom();
    const heatmapDataMetric = prepareHeatmapData(filtered, selectedMetric, zoomLevel);
    if (heatmap) {
      heatmap.setMap(null);
    }
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapDataMetric,
      map: map,
      dissipating: true,
      maxIntensity: 1,
      radius: 20,
      // opacity: 0.8,
      // gradient: [
      //   'rgba(0, 255, 0, 0)', // Transparent green
      //   'rgba(0, 255, 0, 0.6)', // Light green
      //   'rgba(255, 255, 0, 0.8)', // Yellow
      //   'rgba(255, 165, 0, 0.4)', // Orange
      //   'rgba(255, 0, 0, 1)', // Solid red
      // ],
    });

    if (filtered.length > 0) {
      const centerLatLng = new google.maps.LatLng(filtered[0].latitude, filtered[0].longitude);
      map.setCenter(centerLatLng);
      map.setZoom(10);
    }
    return true;
  } catch (error) {
    return false;
    console.error("Error initializing heatmap:", error);
  }

}

const currentInfoWindow: google.maps.InfoWindow | null = null;
let geocoder: google.maps.Geocoder;
let markers: google.maps.Marker[] = [];
let circles: google.maps.Circle[] = [];
let marker: google.maps.Marker;
let featureLayer: google.maps.FeatureLayer;
const featureLayers: google.maps.FeatureLayer[] = [];

export async function geoCodeRequest(request: any, pincodeArray?: any, toggle?: boolean): Promise<boolean> {
  if (!map) {
    await loadGoogleMapsScript();
    map = initializeMap("map");
  }

  console.log("pincodeArray", pincodeArray);
  const { LOCALITY, POSTAL_CODE } = google.maps.FeatureType;
  geocoder = new google.maps.Geocoder();
  if (!marker) {
    marker = new google.maps.Marker({
      map: map,
    });
  }
  const dataLayer = new google.maps.Data();
  dataLayer.setMap(map);

  const infoWindow = new google.maps.InfoWindow();

  function styleBoundary(placeId: string) {
    const featureStyleOptions = {
      strokeColor: '#810FCB',
      strokeOpacity: 1.0,
      strokeWeight: 3.0,
      fillColor: '#810FCB',
      fillOpacity: 0.5
    };
    featureLayer.style = (options: any) => {
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
    const placeIdsToStyle: Set<string> = new Set();
    featureLayer = map.getFeatureLayer(POSTAL_CODE);

    for (const wh in pincodeArray) {
      if (pincodeArray.hasOwnProperty(wh)) {
        const pincodes = pincodeArray[wh];
        for (const pin of pincodes) {
          try {
            const pincode = pin.pincode.toString();
            const request = { address: pincode };

            const result = await geocoder.geocode(request)
            const { results } = result;
            if (results.length > 0) {
              if (!toggle) {
                featureLayer.style = null;
                continue;
              }
              const placeId = results[0].place_id;
              placeIdsToStyle.add(placeId);
              const featureStyleOptions = {
                strokeColor: '#810FCB',
                strokeOpacity: 1.0,
                strokeWeight: 2.0,
                fillOpacity: 0.5
              };
              featureLayer.style = (options: any) => {
                if (placeIdsToStyle.has(options.feature.placeId)) {
                  return featureStyleOptions;
                }
              };
              // featureLayer.addListener('click', function (event:any) {
              //   // The event argument contains information about the feature being hovered over
              //   const feature = event.feature;

              //   // Log the feature or show some information
              //   console.log('Mouse over feature:', feature);
              // })
              featureLayers.push(featureLayer);
            }
          } catch (error) {
            console.log("error", error);
          }
        }
      }
    }
    return true;
  } catch (e) {
    console.error("Geocode was not successful for the following reason:", e);
    return false;
  }
}



export async function initHeatMap(props?: any, filteredData?: any): Promise<void> {

  if (!map) {
    await loadGoogleMapsScript();
    map = initializeMap("map");
  }
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
