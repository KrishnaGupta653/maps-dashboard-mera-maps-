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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY}&libraries=visualization,places`;
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
      mapId: `${process.env.NEXT_PUBLIC_MAPS_ID_KEY}`,
      mapTypeControl: false,
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
    var heat = [];
    for (let i = 0; i < locationData.length; i++) {
      if (filtered[i][selectedMetric] !== 0) {
        var weightedLoc = {
          location: new google.maps.LatLng(filtered[i].latitude, filtered[i].longitude),
          weight: parseFloat(filtered[i][selectedMetric])
        };
        heat.push(weightedLoc);
      }
    }

    if (heatmap) {
      heatmap.setMap(null);
    }
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: heat,
      map,
      opacity: 0.8,
      dissipating: true,
      maxIntensity: 1,
      // maxIntensity: Math.max(...heatmapDataMetric.map((item:any) => item.weight)) || 1,

      radius: 20,
      gradient: [
        'rgba(0, 255, 0, 0)',
        'rgba(0, 255, 0, 0.6)',
        'rgba(255, 255, 0, 0.7)',
        'rgba(255, 165, 0, 0.6)',
        'rgba(255, 0, 0, 0.8)',
      ],
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

let geocoder: google.maps.Geocoder;
let markers: google.maps.marker.AdvancedMarkerElement[] = [];
let circles: google.maps.Circle[] = [];
let marker: google.maps.Marker;
let featureLayer: google.maps.FeatureLayer;
const featureLayers: google.maps.FeatureLayer[] = [];

const boundaryColourStore = {
  'Narnaul': '#FF0F00',
  'Gurugram': '#008000',
  'Noida': '#FF0000',
  'Meerut': '#0000FF',
  'Assandh': '#FFA500',
  'Rohtak': '#800080',
  'Delhi': '#01480F',
  'Aligarh': '#08FB0F',
};

export async function geoCodeRequest(request: any, pincodeArray?: any, toggle?: boolean): Promise<boolean> {
  if (!map) {
    await loadGoogleMapsScript();
    map = initializeMap("map");
  }
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
  function handleMove(event: any) {
    createInfoWindow(event);
  }

  async function createInfoWindow(event: any) {
    let feature = event.features[0];
    if (!feature.placeId) return;
    const place = await feature.fetchPlace();
    let content =
      '<span style="font-size:large"> Pincode: ' + place.displayName
    updateInfoWindow(content, event.latLng);
  }

  function updateInfoWindow(content: any, center: any) {
    infoWindow.setContent(content);
    infoWindow.setPosition(center);
    infoWindow.open({
      map,
      shouldFocus: true,
    });
  }

  try {
    featureLayer = map.getFeatureLayer(POSTAL_CODE);
    const allFeatureLayers: any[] = [];
    for (const wh in pincodeArray) {
      let currentBoundaryColour = "";

      for (const [place, colour] of Object.entries(boundaryColourStore)) {
        if (place === wh) {
          currentBoundaryColour = colour;
          break;
        }
      }

      if (pincodeArray.hasOwnProperty(wh)) {
        const pincodes = pincodeArray[wh];
        const geocodePromises: Promise<any>[] = [];
        const placeIdsToStyle = new Set<string>();

        pincodes.forEach((pin: any) => {
          const pincode = pin.pincode.toString();
          const request = { address: pincode };

          if (!toggle) {
            featureLayer.style = null;
            return;
          }
          geocodePromises.push(
            geocoder.geocode(request).then((result) => {
              const { results } = result;
              if (results.length > 0) {
                const placeId = results[0].place_id;
                placeIdsToStyle.add(placeId);
              } else {
                console.warn(`No results found for pincode: ${pincode}`);
              }
            }).catch((error) => {
              console.log("Error geocoding pincode", error);
            })
          );
        });
        await Promise.all(geocodePromises);

        const featureLayerStyle = (options: any) => {
          const placeId = options.feature.placeId;

          if (placeIdsToStyle.has(placeId)) {
            return {
              strokeColor: currentBoundaryColour,
              strokeOpacity: 1.0,
              strokeWeight: 2.0,
              fillColor: currentBoundaryColour,
              fillOpacity: 0.5
            };
          }
        };
        allFeatureLayers.push(featureLayerStyle);
      }
    }

    featureLayer.style = (options: any) => {
      for (const styleFunction of allFeatureLayers) {
        const style = styleFunction(options);
        if (style) {
          return style;
        }
      }
    };
    featureLayer.addListener('mousemove', handleMove);
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
    markers.forEach((marker: any) => {
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
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
  const infoWindow = new google.maps.InfoWindow();
  const addMarkers = (filteredData: any[], map: google.maps.Map) => {
    filteredData.forEach((ware: any) => {
      let currentBoundaryColour = null
      for (const [place, colour] of Object.entries(boundaryColourStore)) {
        if (place === ware[1]) {
          currentBoundaryColour = colour;
          break;
        }
      }
      const pinBackground = new PinElement({
        background: currentBoundaryColour,
        glyphColor: currentBoundaryColour,
        borderColor: currentBoundaryColour,
        scale: 1.2,
      });
      const pinGlyph = new PinElement({

      });
      const lat = ware[0]?.lat;
      const lng = ware[0]?.lng;
      if (typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng) && isFinite(lat) && isFinite(lng)) {
        const marker = new AdvancedMarkerElement({
          position: { lat, lng },
          map,
          title: ware[1],
          content: pinBackground.element,
          gmpClickable: true,
        });
        map.setCenter(new google.maps.LatLng(lat, lng));
        markers.push(marker);
        marker.addListener("click", () => {
          infoWindow.close();
          infoWindow.setContent(marker.title);
          infoWindow.open(marker.map, marker);
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
