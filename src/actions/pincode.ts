
'use server'

// Mock data imports
import pincodesData from '../data/pincodes.json'
import { fetchWarehouseLocations, WarehouseLocation } from './bazaar'

export interface PincodePoint {
  Schedule: string
  WH: string
  distance: number
  district: string
  latitude: number
  longitute: number
  pincode: number
  schedule_type: string
  state: string
  matchedWarehouse?: WarehouseLocation | null 
  placeId?: string
}

interface PincodeResponse {
  Info: {
    currentPage: number
    rows: number
    totalData: number
    totalPages: number
  }
  results: PincodePoint[]
}

interface DhruvtaraPincodeData {
  pincode: string
  deliveryType: string
  serviceSchedule: string[]
  geoLocation: {
    longitude: number
    latitude: number
  }
  state: string
  district: string
  servicedBy: {
    warehouses: Array<{
      zohoWarehouseId: string
      erpnextWarehouseId: string
      distance: number
    }>
  }
  mapInfo?: {
    googleMaps: {
      placeId: string
    }
  }
}

const isValidPincode = (pincode: string): boolean => /^\d{6}$/.test(pincode.trim())

const matchWarehouseByZohoId = (zohoWarehouseId: string, warehouses: WarehouseLocation[]): WarehouseLocation | null =>
  warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId) || null

const createPincodeResponse = (results: PincodePoint[]): PincodeResponse => ({
  Info: {
    currentPage: 1,
    rows: results.length,
    totalData: results.length,
    totalPages: 1,
  },
  results,
})

async function fetchPincodesByZohoWarehouseId(zohoWarehouseId: string): Promise<PincodePoint[]> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Use local mock data
    const pincodeData = pincodesData as DhruvtaraPincodeData[]
    const bazaarWarehouses = await fetchWarehouseLocations()
    const matchedWarehouse = matchWarehouseByZohoId(zohoWarehouseId, bazaarWarehouses.results)
    
    // Filter pincodes that are serviced by this warehouse
    const filteredPincodes = pincodeData.filter(item => 
      item.servicedBy.warehouses.some(wh => wh.zohoWarehouseId === zohoWarehouseId)
    )
    
    console.log(`Found ${filteredPincodes.length} pincodes for warehouse ${zohoWarehouseId}`)
    
    return filteredPincodes.map((item) => {
      const warehouseService = item.servicedBy.warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId)
      return {
        Schedule: item.serviceSchedule.join(', '),
        WH: matchedWarehouse?.Warehouse || `Warehouse-${zohoWarehouseId}`,
        distance: warehouseService?.distance || 0,
        district: item.district,
        latitude: item.geoLocation.latitude,
        longitute: item.geoLocation.longitude,
        pincode: parseInt(item.pincode),
        schedule_type: item.deliveryType,
        state: item.state,
        matchedWarehouse,
        placeId: item.mapInfo?.googleMaps?.placeId,
      }
    })
  } catch (error) {
    console.error('Error fetching pincodes by zohoWarehouseId:', error)
    return []
  }
}

async function fetchAllWarehousesPincodes(): Promise<PincodePoint[]> {
  try {
    console.log('🔄 Starting to fetch all warehouses pincodes...')
    
    const warehouseResponse = await fetchWarehouseLocations()
    const warehouses = warehouseResponse.results
    
    console.log(`📦 Found ${warehouses.length} warehouses:`, warehouses.map(w => ({ id: w.zohoWarehouseId, name: w.Warehouse })))
    
    const warehousePincodePromises = warehouses.map(warehouse => 
      fetchPincodesByZohoWarehouseId(warehouse.zohoWarehouseId)
    )
    
    const allResults = await Promise.all(warehousePincodePromises)
    const allPincodes = allResults.flat()
    
    console.log(`📍 Total pincodes found: ${allPincodes.length}`)
    console.log(`📍 Pincodes with place IDs: ${allPincodes.filter(p => p.placeId).length}`)
    
    // Log first few pincodes for debugging
    if (allPincodes.length > 0) {
      console.log('Sample pincodes:', allPincodes.slice(0, 3).map(p => ({
        pincode: p.pincode,
        warehouse: p.WH,
        placeId: p.placeId ? 'YES' : 'NO',
        coords: `${p.latitude}, ${p.longitute}`
      })))
    }
    
    // Remove duplicates based on pincode
    const uniquePincodes = allPincodes.reduce((acc, current) => {
      const existing = acc.find(item => item.pincode === current.pincode)
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [] as PincodePoint[])
    
    console.log(`✅ Unique pincodes: ${uniquePincodes.length}`)
    return uniquePincodes
  } catch (error) {
    console.error('❌ Error fetching all warehouses pincodes:', error)
    return []
  }
}

export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  const validPincodes = Array.from(new Set(pincodes.map(p => p.toString()).filter(isValidPincode)))
  console.log(`📋 Valid pincodes from ${pincodes.length} input: ${validPincodes.length}`)
  return validPincodes
}

export async function fetchAllPincodePlaceIds(): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    console.log('🗺️ Starting to fetch pincode place IDs...')
    
    const allPincodes = await fetchAllWarehousesPincodes()
    const placeIdMapping: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    allPincodes.forEach(pincode => {
      const pincodeStr = pincode.pincode.toString()
      if (pincode.placeId && !placeIdMapping[pincodeStr]) {
        placeIdMapping[pincodeStr] = {
          placeId: pincode.placeId,
          latitude: pincode.latitude,
          longitude: pincode.longitute
        }
      }
    })
    
    console.log(`🎯 Created place ID mapping for ${Object.keys(placeIdMapping).length} pincodes`)
    console.log('Sample mapping:', Object.entries(placeIdMapping).slice(0, 3))
    
    return placeIdMapping
  } catch (error) {
    console.error('❌ Error creating consolidated pincode place ID mapping:', error)
    throw error
  }
}

export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
  try {
    console.log('🚀 fetchPincodeLocations called with warehouses:', warehouses)
    
    const allPincodes = await fetchAllWarehousesPincodes()
    
    if (warehouses) {
      const warehouseNames = warehouses.split(',').map(name => name.trim().toLowerCase())
      console.log('🔍 Filtering by warehouse names:', warehouseNames)
      
      const filteredPincodes = allPincodes.filter(pincode => 
        warehouseNames.some(name => 
          pincode.WH.toLowerCase().includes(name) || name.includes(pincode.WH.toLowerCase())
        )
      )
      
      console.log(`📊 Filtered pincodes: ${filteredPincodes.length} out of ${allPincodes.length}`)
      return createPincodeResponse(filteredPincodes)
    }
    
    console.log(`📊 Returning all pincodes: ${allPincodes.length}`)
    return createPincodeResponse(allPincodes)
  } catch (error) {
    console.error('❌ Error fetching pincode locations:', error)
    throw new Error('Failed to fetch pincode locations')
  }
}