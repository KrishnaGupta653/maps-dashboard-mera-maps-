'use server'
import { getSuchnavaliClient } from './gauth'
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
}

export interface PincodeResponse {
  Info: {
    currentPage: number
    rows: number
    totalData: number
    totalPages: number
  }
  results: PincodePoint[]
}

export interface DhruvtaraPincodeData {
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
}

function matchWarehouseByZohoId(zohoWarehouseId: string, warehouses: WarehouseLocation[]): WarehouseLocation | null {
  return warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId) || null
}

function matchWarehouseByName(pincodeWH: string, warehouses: WarehouseLocation[]): WarehouseLocation | null {
  let match = warehouses.find(wh => 
    wh.Warehouse.toLowerCase() === pincodeWH.toLowerCase()
  )
  if (match) return match
  const normalizedPincodeWH = pincodeWH.toLowerCase()
    .replace(/warehouse/g, '')
    .replace(/wh/g, '')
    .trim()
  
  match = warehouses.find(wh => {
    const normalizedName = wh.Warehouse.toLowerCase()
      .replace(/warehouse/g, '')
      .replace(/wh/g, '')
      .trim()
    return normalizedName.includes(normalizedPincodeWH) || 
           normalizedPincodeWH.includes(normalizedName)
  })

  return match || null
}

export async function fetchPincodesByZohoWarehouseId(zohoWarehouseId: string): Promise<PincodeResponse> {
  try {
    const client = await getSuchnavaliClient()
    const response = await client.request({
      url: `${process.env.DHRUVTARA_BASE_URL}/pincode/query`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { "servicedBy.warehouses.zohoWarehouseId": zohoWarehouseId }
    })
    
    const pincodeData = response.data as DhruvtaraPincodeData[]
    const bazaarWarehouses = await fetchWarehouseLocations()
    const matchedWarehouse = matchWarehouseByZohoId(zohoWarehouseId, bazaarWarehouses.results)
    
    const transformedResults: PincodePoint[] = pincodeData.map((item) => ({
      Schedule: item.serviceSchedule.join(','),
      WH: matchedWarehouse?.Warehouse || `Warehouse-${zohoWarehouseId}`,
      distance: item.servicedBy.warehouses[0]?.distance || 0,
      district: item.district,
      latitude: item.geoLocation.latitude,
      longitute: item.geoLocation.longitude,
      pincode: parseInt(item.pincode),
      schedule_type: item.deliveryType,
      state: item.state,
      matchedWarehouse,
    }))
    
    return {
      Info: {
        currentPage: 1,
        rows: transformedResults.length,
        totalData: transformedResults.length,
        totalPages: 1,
      },
      results: transformedResults,
    }
  } catch (error) {
    console.error('Error fetching pincodes by zohoWarehouseId:', error)
    throw new Error('Failed to fetch pincodes by zohoWarehouseId')
  }
}

export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
  try {
    const client = await getSuchnavaliClient()
    let url = `${process.env.SUCHNAVALI_BASE_URL}/serviceablePincode/location`
    
    if (warehouses) {
      url += `?WH=${encodeURIComponent(warehouses)}`
    }
    
    const response = await client.request({ url, method: 'GET' })
    const pincodeData = response.data as PincodeResponse
    const bazaarWarehouses = await fetchWarehouseLocations()

    const updatedResults = pincodeData.results.map(pincode => {
      const matchedWarehouse = matchWarehouseByName(pincode.WH, bazaarWarehouses.results)
      return {
        ...pincode,
        longitude: pincode.longitute, 
        WH: matchedWarehouse?.Warehouse || pincode.WH,
        matchedWarehouse,
      }
    })
    
    return {
      ...pincodeData,
      results: updatedResults,
    }
  } catch (error) {
    console.error('Error fetching pincode locations:', error)
    throw new Error('Failed to fetch pincode locations')
  }
}