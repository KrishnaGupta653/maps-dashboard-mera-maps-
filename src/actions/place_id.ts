'use server'
import { getDhruvtaraClient } from './gauth'
import { fetchWarehouseLocations } from './bazaar'

export interface PincodeData {
  pincode: string
  geoLocation: {
    longitude: number
    latitude: number
  }
  mapInfo: {
    googleMaps: {
      placeId: string
    }
  }
  deliveryType?: string
  serviceSchedule?: string[]
  state?: string
  district?: string
  servicedBy?: {
    warehouses: Array<{
      erpnextWarehouseId: string
      zohoWarehouseId?: string
      distance: number
    }>
  }
  holidayList?: string[]
  serviceable?: boolean
  serviceTimeWindow?: {
    start: string
    end: string
  }
}

export interface WarehousePincodeMapping {
  zohoWarehouseId: string
  warehouseName: string
  pincodes: Array<{
    pincode: string
    placeId: string
    latitude: number
    longitude: number
    state: string
    district: string
    distance: number
  }>
}

const isValidPincode = (pincode: string): boolean => /^\d{6}$/.test(pincode.trim())

export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  return Array.from(new Set(pincodes.map(p => p.toString()).filter(isValidPincode)))
}

export async function fetchSinglePincodeData(pincode: string): Promise<PincodeData | null> {
  if (!isValidPincode(pincode)) return null
  try {
    const client = await getDhruvtaraClient()
    const response = await client.request({
      url: `${process.env.DHRUV_TARA_URL}/pincode/${pincode}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = response.data as PincodeData
    return data?.mapInfo?.googleMaps?.placeId ? data : null
  } catch {
    return null
  }
}

// Fetch pincodes for a specific warehouse using zohoWarehouseId
export async function fetchPincodesByWarehouse(zohoWarehouseId: string): Promise<PincodeData[]> {
  try {
    const client = await getDhruvtaraClient()
    const response = await client.request({
      url: `${process.env.DHRUV_TARA_URL}/pincode/query`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { "servicedBy.warehouses.zohoWarehouseId": zohoWarehouseId }
    })
    
    return response.data as PincodeData[]
  } catch (error) {
    console.error(`Error fetching pincodes for warehouse ${zohoWarehouseId}:`, error)
    return []
  }
}

// Fetch pincode and place ID mapping for a specific warehouse
export async function fetchWarehousePincodeMapping(zohoWarehouseId: string, warehouseName: string): Promise<WarehousePincodeMapping> {
  const pincodeData = await fetchPincodesByWarehouse(zohoWarehouseId)
  
  const pincodes = pincodeData
    .filter(data => data.mapInfo?.googleMaps?.placeId) // Only include items with place IDs
    .map(data => ({
      pincode: data.pincode,
      placeId: data.mapInfo.googleMaps.placeId,
      latitude: data.geoLocation.latitude,
      longitude: data.geoLocation.longitude,
      state: data.state || '',
      district: data.district || '',
      distance: data.servicedBy?.warehouses[0]?.distance || 0
    }))

  return {
    zohoWarehouseId,
    warehouseName,
    pincodes
  }
}

// Fetch pincode and place ID mappings for all warehouses
export async function fetchAllWarehousePincodeMappings(): Promise<WarehousePincodeMapping[]> {
  try {
    // Get all warehouses from Bazaar API
    const warehouseResponse = await fetchWarehouseLocations()
    const warehouses = warehouseResponse.results
    
    console.log(`Found ${warehouses.length} warehouses to process`)
    
    // Fetch pincode mappings for each warehouse
    const mappingPromises = warehouses.map(warehouse => 
      fetchWarehousePincodeMapping(warehouse.zohoWarehouseId, warehouse.Warehouse)
    )
    
    const mappings = await Promise.all(mappingPromises)
    
    // Filter out warehouses with no pincodes
    const validMappings = mappings.filter(mapping => mapping.pincodes.length > 0)
    
    console.log(`Successfully processed ${validMappings.length} warehouses with pincodes`)
    
    return validMappings
  } catch (error) {
    console.error('Error fetching all warehouse pincode mappings:', error)
    throw new Error('Failed to fetch warehouse pincode mappings')
  }
}

// Get consolidated pincode to place ID mapping across all warehouses
export async function fetchAllPincodePlaceIds(): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    const allMappings = await fetchAllWarehousePincodeMappings()
    const consolidatedMapping: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    allMappings.forEach(mapping => {
      mapping.pincodes.forEach(pincodeInfo => {
        // If pincode already exists, keep the first occurrence (you can modify this logic as needed)
        if (!consolidatedMapping[pincodeInfo.pincode]) {
          consolidatedMapping[pincodeInfo.pincode] = {
            placeId: pincodeInfo.placeId,
            latitude: pincodeInfo.latitude,
            longitude: pincodeInfo.longitude
          }
        }
      })
    })
    
    return consolidatedMapping
  } catch (error) {
    console.error('Error creating consolidated pincode place ID mapping:', error)
    throw error
  }
}

// Legacy function - kept for backward compatibility
export async function fetchAllPincodePlaceIdsLegacy(
  pincodes: string[]
): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  const validPincodes = await getUniqueValidPincodes(pincodes)
  if (validPincodes.length === 0) return {}
  
  const results = await Promise.allSettled(
    validPincodes.map(async (pincode) => {
      const data = await fetchSinglePincodeData(pincode)
      return data ? {
        pincode,
        placeId: data.mapInfo.googleMaps.placeId,
        latitude: data.geoLocation.latitude,
        longitude: data.geoLocation.longitude
      } : null
    })
  )
  
  return results.reduce((acc, result) => {
    if (result.status === 'fulfilled' && result.value) {
      const { pincode, placeId, latitude, longitude } = result.value
      acc[pincode] = { placeId, latitude, longitude }
    }
    return acc
  }, {} as Record<string, { placeId: string; latitude: number; longitude: number }>)
}

export async function fetchPlaceIdsWithRetry(
  pincodes: string[], 
  maxRetries = 2
): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await fetchAllPincodePlaceIdsLegacy(pincodes)
      if (Object.keys(results).length > 0) return results
    } catch (error) {
      if (attempt === maxRetries) throw error
    }
  }
  throw new Error('Failed to fetch place IDs')
}

export async function fetchPincodeData(pincode?: string): Promise<PincodeData | PincodeData[]> {
  const client = await getDhruvtaraClient()
  const response = await client.request({
    url: `${process.env.DHRUV_TARA_URL}/pincode${pincode ? `/${pincode}` : ''}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data as PincodeData | PincodeData[]
}