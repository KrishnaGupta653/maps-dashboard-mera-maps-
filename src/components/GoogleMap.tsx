'use client'
import { useEffect, useRef, useCallback } from 'react'
import { WarehouseLocation } from '@/actions/warehouse'
import { PincodePoint } from '@/actions/pincode'
import { OrderLocationData } from '@/actions/order'

interface GoogleMapProps {
  warehouses: WarehouseLocation[]
  pincodes: PincodePoint[]
  orderData: OrderLocationData[]
  showWarehouses: boolean
  showPincodes: boolean
  showHeatmap: boolean
  selectedMetrics: string[]
  isLoading?: boolean
  isPincodeLoading?: boolean
}

interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: google.maps.MapOptions) => google.maps.Map
    InfoWindow: new () => google.maps.InfoWindow
    Geocoder: new () => google.maps.Geocoder
    Marker: new (options: google.maps.MarkerOptions) => google.maps.Marker
    LatLngBounds: new () => google.maps.LatLngBounds
    LatLng: new (lat: number, lng: number) => google.maps.LatLng
    SymbolPath: {
      CIRCLE: google.maps.SymbolPath
    }
    MapTypeControlStyle: {
      HORIZONTAL_BAR: google.maps.MapTypeControlStyle
    }
    ControlPosition: {
      TOP_CENTER: google.maps.ControlPosition
      RIGHT_CENTER: google.maps.ControlPosition
    }
    FeatureType: {
      POSTAL_CODE: google.maps.FeatureType
    }
    visualization?: {
      HeatmapLayer: new (options: google.maps.visualization.HeatmapLayerOptions) => google.maps.visualization.HeatmapLayer
    }
  }
}

interface HeatmapDataPoint {
  location: google.maps.LatLng
  weight: number
}

interface GeocodeResult {
  results: {
    place_id: string
    geometry: {
      location: google.maps.LatLng
    }
  }[]
}

interface FeatureMouseEvent {
  features: Array<{
    placeId?: string
  }>
  latLng: google.maps.LatLng
}

declare global {
  interface Window {
    google: GoogleMapsAPI
    initMap: () => void
  }
}

const COLORS = [
  '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', 
  '#85C1E9', '#F4D03F', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
]
// Updated color generation to handle both warehouses and pincodes
const generateWarehouseColors = (warehouses: WarehouseLocation[], pincodes: PincodePoint[]) => {
  // Get all unique warehouse names from both sources
  const warehouseNames = new Set<string>()
  
  // Add warehouse names from warehouses array
  warehouses.forEach(wh => {
    if (wh.Warehouse) warehouseNames.add(wh.Warehouse)
  })
  
  // Add warehouse names from pincodes array
  pincodes.forEach(pc => {
    if (pc.WH) warehouseNames.add(pc.WH)
  })
  
  const uniqueNames = Array.from(warehouseNames).sort() // Sort for consistency
  return uniqueNames.reduce((acc, name, i) => ({ 
    ...acc, 
    [name]: COLORS[i % COLORS.length] 
  }), {} as Record<string, string>)
}

const createMarkerIcon = (color: string): google.maps.Symbol => ({
  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  fillColor: color,
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale: 1.5,
  anchor: new window.google.maps.Point(12, 24)
})

export default function GoogleMap({ 
  warehouses, 
  pincodes, 
  orderData,
  showWarehouses, 
  showPincodes, 
  showHeatmap,
  selectedMetrics,
  isLoading = false,
  isPincodeLoading = false 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const isInitializedRef = useRef(false)
  const postalCodeLayerRef = useRef<google.maps.FeatureLayer | null>(null)
  const warehouseMarkersRef = useRef<google.maps.Marker[]>([])
  const pincodeMarkersRef = useRef<google.maps.Marker[]>([])
  const pincodeToPlaceIdRef = useRef<Record<string, string>>({})
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  const initializeMap = useCallback(() => {
    if (!mapRef.current || isInitializedRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.2090 },
      zoom: 8,
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
      },
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      streetViewControl: false,
      scaleControl: true,
      rotateControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
      position: window.google.maps.ControlPosition.RIGHT_BOTTOM
      },
      gestureHandling: 'true'
    })

    mapInstanceRef.current = map
    infoWindowRef.current = new window.google.maps.InfoWindow()
    geocoderRef.current = new window.google.maps.Geocoder()
    postalCodeLayerRef.current = map.getFeatureLayer(window.google.maps.FeatureType.POSTAL_CODE)
    
    isInitializedRef.current = true
  }, [])

  const loadGoogleMaps = useCallback(() => {
    if (window.google?.maps) {
      initializeMap()
      return
    }

    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      window.initMap = initializeMap
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=geometry,places,visualization&v=weekly`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [initializeMap])

  const clearMarkers = (markersRef: React.MutableRefObject<google.maps.Marker[]>) => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
  }

  const clearHeatmap = () => {
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null)
      heatmapRef.current = null
    }
  }

  const fitBounds = (positions: google.maps.LatLngLiteral[], zoom = 12) => {
    if (!mapInstanceRef.current || positions.length === 0) return
    
    if (positions.length === 1) {
      mapInstanceRef.current.setCenter(positions[0])
      mapInstanceRef.current.setZoom(zoom)
    } else {
      const bounds = new window.google.maps.LatLngBounds()
      positions.forEach(pos => bounds.extend(pos))
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    }
  }

  const createHeatmap = useCallback(() => {
    if (!mapInstanceRef.current || !showHeatmap || orderData.length === 0 || !window.google?.maps?.visualization) {
      clearHeatmap()
      return
    }

    clearHeatmap()

    const getWeight = (order: OrderLocationData) => {
      if (selectedMetrics.length === 0) return 1

      let totalWeight = 0
      selectedMetrics.forEach(metric => {
        switch (metric) {
          case 'cust_count':
            totalWeight += order.cust_count || 0
            break
          case 'so_count':
            totalWeight += order.so_count || 0
            break
          case 'order_value':
            totalWeight += (order.order_value || 0) / 1000
            break
          case 'volume':
            totalWeight += order.volume || 0
            break
          default:
            totalWeight += 1
        }
      })
      
      return Math.max(totalWeight, 1)
    }

    const heatmapData: HeatmapDataPoint[] = orderData
      .filter(order => order.latitude && order.longitude) 
      .map(order => ({
        location: new window.google.maps.LatLng(order.latitude, order.longitude),
        weight: getWeight(order)
      }))

    if (heatmapData.length === 0) return

    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 20,
      opacity: 0.8,
    })

    if (!showWarehouses && !showPincodes) {
      const positions = heatmapData.map(point => ({
        lat: point.location.lat(),
        lng: point.location.lng()
      }))
      fitBounds(positions, 10)
    }
  }, [orderData, showHeatmap, selectedMetrics, showWarehouses, showPincodes])

  const createWarehouseMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !showWarehouses || warehouses.length === 0) return

    clearMarkers(warehouseMarkersRef)
    // Use the updated color generation function
    const warehouseColors = generateWarehouseColors(warehouses, pincodes)
    const positions: google.maps.LatLngLiteral[] = []

    warehouses.forEach((warehouse, index) => {
      const lat = parseFloat(warehouse.Latitude?.toString() || '0')
      const lng = parseFloat(warehouse.Longitute?.toString() || '0')

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return

      const position = { lat, lng }
      // Get color for this warehouse, with fallback
      const color = warehouseColors[warehouse.Warehouse || ''] || COLORS[index % COLORS.length] || '#4285F4'
      const associatedPincodes = pincodes.filter(p => p.WH === warehouse.Warehouse)
      
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: warehouse.Warehouse || `Warehouse ${index + 1}`,
        icon: createMarkerIcon(color),
        zIndex: 1000
      })

      const infoContent = `
        <div style="padding: 12px; font-family: system-ui; max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
            <span style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></span>
            🏢 ${warehouse.Warehouse || `Warehouse ${index + 1}`}
          </h3>
          <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
            <div><strong>Location:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
            <div><strong>Associated Pincodes:</strong> ${associatedPincodes.length}</div>
            ${associatedPincodes.length > 0 ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <strong>Sample Pincodes:</strong><br>
                ${associatedPincodes.slice(0, 5).map(p => 
                  `<span style="display: inline-block; background-color: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin: 2px; border: 1px solid ${color}40;">${p.pincode}</span>`
                ).join('')}
                ${associatedPincodes.length > 5 ? `<br><small>... and ${associatedPincodes.length - 5} more</small>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      `
      
      marker.addListener('click', () => {
        if (infoWindowRef.current && mapInstanceRef.current) {
          infoWindowRef.current.setContent(infoContent)
          infoWindowRef.current.open(mapInstanceRef.current, marker)
        }
      })

      warehouseMarkersRef.current.push(marker)
      positions.push(position)
    })

    if (!showHeatmap && !showPincodes) {
      fitBounds(positions)
    }
  }, [warehouses, showWarehouses, pincodes, showHeatmap, showPincodes])

  const createPincodeFeatureLayers = useCallback(async () => {
    if (!mapInstanceRef.current || !showPincodes || pincodes.length === 0 || !geocoderRef.current) return

    clearMarkers(pincodeMarkersRef)
    if (postalCodeLayerRef.current) {
      postalCodeLayerRef.current.style = null
    }
    pincodeToPlaceIdRef.current = {}

    const warehouseGroups = pincodes.reduce((acc, pincode) => {
      if (!acc[pincode.WH]) acc[pincode.WH] = []
      acc[pincode.WH].push(pincode)
      return acc
    }, {} as Record<string, PincodePoint[]>)

    // Use the same color generation function for consistency
    const warehouseColors = generateWarehouseColors(warehouses, pincodes)
    const positions: google.maps.LatLngLiteral[] = []
    const pincodeToWarehouseMap: Record<string, { warehouse: string, color: string, data: PincodePoint }> = {}

    const geocodePromises = Object.entries(warehouseGroups).flatMap(([warehouseName, pincodeGroup]) => {
      const color = warehouseColors[warehouseName] || '#4285F4' // Fallback color
      
      return pincodeGroup.map((pincode) => {
        const pincodeStr = pincode.pincode.toString()
        pincodeToWarehouseMap[pincodeStr] = { warehouse: warehouseName, color, data: pincode }

        return new Promise<void>((resolve) => {
          if (!geocoderRef.current) {
            resolve()
            return
          }
          
          geocoderRef.current.geocode({ address: pincodeStr })
            .then((result: GeocodeResult) => {
              const { results } = result
              if (results && results.length > 0) {
                const placeId = results[0].place_id
                pincodeToPlaceIdRef.current[pincodeStr] = placeId
                
                const location = results[0].geometry.location
                const marker = new window.google.maps.Marker({
                  position: location,
                  map: mapInstanceRef.current,
                  title: `Pincode: ${pincodeStr}`,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 0,
                    fillColor: color,
                    fillOpacity: 0.8,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  },
                  zIndex: 500
                })

                const infoContent = `
                  <div style="padding: 12px; font-family: system-ui; max-width: 280px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
                      <span style="width: 12px; height: 12px; background-color: ${color}; border-radius: 50%;"></span>
                      📍 Pincode: ${pincodeStr}
                    </h3>
                    <div style="font-size: 13px; color: #6b7280; line-height: 1.4;">
                      <div><strong>Warehouse:</strong> <span style="color: ${color}; font-weight: 600;">${pincode.WH}</span></div>
                      <div><strong>District:</strong> ${pincode.district}</div>
                      <div><strong>State:</strong> ${pincode.state}</div>
                      <div><strong>Distance:</strong> ${pincode.distance} km</div>
                      <div><strong>Schedule:</strong> ${pincode.Schedule}</div>
                    </div>
                  </div>
                `
                
                marker.addListener('click', () => {
                  if (infoWindowRef.current && mapInstanceRef.current) {
                    infoWindowRef.current.setContent(infoContent)
                    infoWindowRef.current.open(mapInstanceRef.current, marker)
                  }
                })

                pincodeMarkersRef.current.push(marker)
                positions.push({
                  lat: location.lat(),
                  lng: location.lng()
                })
              }
              resolve()
            })
            .catch(() => resolve())
        })
      })
    })

    await Promise.all(geocodePromises)

    if (postalCodeLayerRef.current) {
      postalCodeLayerRef.current.style = (params: google.maps.FeatureStyleFunctionOptions) => {
        const feature = params.feature as google.maps.PlaceFeature;
        const placeId = feature.placeId;
        if (!placeId) return null

        const matchingPincode = Object.entries(pincodeToPlaceIdRef.current).find(
          ([, storedPlaceId]) => storedPlaceId === placeId
        )

        if (matchingPincode) {
          const [pincodeStr] = matchingPincode
          const warehouseInfo = pincodeToWarehouseMap[pincodeStr]
          
          if (warehouseInfo) {
            return {
              strokeColor: warehouseInfo.color,
              strokeOpacity: 1.0,
              strokeWeight: 2.0,
              fillColor: warehouseInfo.color,
              fillOpacity: 0.3
            }
          }
        }
        return null
      }

      postalCodeLayerRef.current.addListener('mousemove', (event: FeatureMouseEvent) => {
        const features = event.features || []
        const feature = features[0]
        
        if (feature?.placeId) {
          const matchingPincode = Object.entries(pincodeToPlaceIdRef.current).find(
            ([, storedPlaceId]) => storedPlaceId === feature.placeId
          )

          if (matchingPincode && event.latLng) {
            const [pincodeStr] = matchingPincode
            const warehouseInfo = pincodeToWarehouseMap[pincodeStr]
            
            if (warehouseInfo && infoWindowRef.current && mapInstanceRef.current) {
              infoWindowRef.current.setContent(`
                <div style="padding: 8px; font-family: system-ui; font-size: 12px; color: #1f2937;">
                  <strong>Pincode:</strong> ${pincodeStr}<br>
                  <strong>Warehouse:</strong> <span style="color: ${warehouseInfo.color};">${warehouseInfo.warehouse}</span>
                </div>
              `)
              infoWindowRef.current.setPosition(event.latLng)
              infoWindowRef.current.open(mapInstanceRef.current)
            }
          }
        }
      })

      postalCodeLayerRef.current.addListener('mouseout', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }
      })
    }

    if (positions.length > 0 && !showWarehouses && !showHeatmap) {
      fitBounds(positions, 10)
    }
  }, [pincodes, showPincodes, showWarehouses, showHeatmap, warehouses])

  useEffect(() => {
    loadGoogleMaps()
    return () => {
      clearMarkers(warehouseMarkersRef)
      clearMarkers(pincodeMarkersRef)
      clearHeatmap()
    }
  }, [loadGoogleMaps])

  useEffect(() => {
    if (!isInitializedRef.current) return
    if (showWarehouses && !isLoading) {
      createWarehouseMarkers()
    } else {
      clearMarkers(warehouseMarkersRef)
    }
  }, [warehouses, showWarehouses, isLoading, createWarehouseMarkers])

  useEffect(() => {
    if (!isInitializedRef.current) return
    if (showPincodes && !isPincodeLoading) {
      createPincodeFeatureLayers()
    } else {
      clearMarkers(pincodeMarkersRef)
      if (postalCodeLayerRef.current) {
        postalCodeLayerRef.current.style = null
      }
    }
  }, [pincodes, showPincodes, isPincodeLoading, createPincodeFeatureLayers])

  useEffect(() => {
    if (!isInitializedRef.current) return
    createHeatmap()
  }, [orderData, showHeatmap, selectedMetrics, createHeatmap])

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ minHeight: '400px' }} 
      />
      
      {/* Loading overlay */}
      {(isLoading || isPincodeLoading) && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white/90 rounded-lg p-4 flex items-center space-x-3 shadow-lg">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-gray-700 font-medium">
              {isLoading && isPincodeLoading ? 'Loading warehouses and postal codes...' :
               isLoading ? 'Loading warehouses...' : 'Loading postal codes...'}
            </span>
          </div>
        </div>
      )}

      {/* Legends Panel - Fixed to right side */}
      {((showWarehouses && warehouses.length > 0) || (showPincodes && pincodes.length > 0) || (showHeatmap && orderData.length > 0)) && (
        <div className="absolute top-40 right-2 h-50 bg-white/80 rounded-lg shadow-lg p-4 max-w-xs z-20 max-h-80 overflow-y-auto no-scrollbar">
          
          {/* Warehouse Legend */}
          {showWarehouses && warehouses.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🏢 Warehouses ({warehouses.length})
              </h4>
              <div className="space-y-2">
                {warehouses.map((warehouse, index) => {
                  const warehouseColors = generateWarehouseColors(warehouses, pincodes)
                  const color = warehouseColors[warehouse.Warehouse || ''] || COLORS[index % COLORS.length]
                  const associatedPincodes = pincodes.filter(p => p.WH === warehouse.Warehouse)
                  
                  return (
                    <div key={warehouse.Warehouse || index} className="flex items-center space-x-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" style={{ color }}>
                        <path 
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                          fill="currentColor"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </svg>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-700">
                          {warehouse.Warehouse || `Warehouse ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {associatedPincodes.length} pincodes
                        </div>
                      </div>
                    </div>
                  )
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Low</span>
                  <span>High</span>
                </div>
                <div className="h-3 w-full rounded" style={{
                  background: 'linear-gradient(to right, rgb(140, 243, 98), rgb(140, 243, 98), rgba(255,0,0,0.8))'
                }} />
                <div className="text-xs text-gray-600">
                  {orderData.length} order locations
                </div>
                {selectedMetrics.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Metrics: {selectedMetrics.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}