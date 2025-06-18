'use server'
import { getDhruvtaraClient } from './gauth'
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
    const client = await getDhruvtaraClient()
    const response = await client.request({
      url: `${process.env.DHRUV_TARA_URL}/pincode/query`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { "servicedBy.warehouses.zohoWarehouseId": zohoWarehouseId }
    })
    
    const pincodeData = response.data as DhruvtaraPincodeData[]
    const bazaarWarehouses = await fetchWarehouseLocations()
    const matchedWarehouse = matchWarehouseByZohoId(zohoWarehouseId, bazaarWarehouses.results)
    
    return pincodeData.map((item) => ({
      Schedule: item.serviceSchedule.join(','),
      WH: matchedWarehouse?.Warehouse || `Warehouse-${zohoWarehouseId}`,
      distance: item.servicedBy.warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId)?.distance || 0,
      district: item.district,
      latitude: item.geoLocation.latitude,
      longitute: item.geoLocation.longitude,
      pincode: parseInt(item.pincode),
      schedule_type: item.deliveryType,
      state: item.state,
      matchedWarehouse,
      placeId: item.mapInfo?.googleMaps?.placeId,
    }))
  } catch (error) {
    console.error('Error fetching pincodes by zohoWarehouseId:', error)
    return []
  }
}

async function fetchAllWarehousesPincodes(): Promise<PincodePoint[]> {
  try {
    const warehouseResponse = await fetchWarehouseLocations()
    const warehouses = warehouseResponse.results
    
    const warehousePincodePromises = warehouses.map(warehouse => 
      fetchPincodesByZohoWarehouseId(warehouse.zohoWarehouseId)
    )
    
    const allResults = await Promise.all(warehousePincodePromises)
    const allPincodes = allResults.flat().filter(p => p.placeId)
    
    // Remove duplicates based on pincode
    return allPincodes.reduce((acc, current) => {
      const existing = acc.find(item => item.pincode === current.pincode)
      if (!existing) acc.push(current)
      return acc
    }, [] as PincodePoint[])
  } catch (error) {
    console.error('Error fetching all warehouses pincodes:', error)
    return []
  }
}

export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  return Array.from(new Set(pincodes.map(p => p.toString()).filter(isValidPincode)))
}

export async function fetchAllPincodePlaceIds(): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    const allPincodes = await fetchAllWarehousesPincodes()
    const placeIdMapping: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    allPincodes.forEach(pincode => {
      if (pincode.placeId && !placeIdMapping[pincode.pincode.toString()]) {
        placeIdMapping[pincode.pincode.toString()] = {
          placeId: pincode.placeId,
          latitude: pincode.latitude,
          longitude: pincode.longitute
        }
      }
    })
    return placeIdMapping
  } catch (error) {
    console.error('Error creating consolidated pincode place ID mapping:', error)
    throw error
  }
}

export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
  try {
    const allPincodes = await fetchAllWarehousesPincodes()
    if (warehouses) {
      const warehouseNames = warehouses.split(',').map(name => name.trim().toLowerCase())
      const filteredPincodes = allPincodes.filter(pincode => 
        warehouseNames.some(name => 
          pincode.WH.toLowerCase().includes(name) || name.includes(pincode.WH.toLowerCase())
        )
      )
      return createPincodeResponse(filteredPincodes)
    }
    return createPincodeResponse(allPincodes)
  } catch (error) {
    console.error('Error fetching pincode locations:', error)
    throw new Error('Failed to fetch pincode locations')
  }
}