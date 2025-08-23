
// 'use server'

// // Mock data imports
// import pincodesData from '../data/pincodes.json'
// import { fetchWarehouseLocations, WarehouseLocation } from './bazaar'

// export interface PincodePoint {
//   Schedule: string
//   WH: string
//   distance: number
//   district: string
//   latitude: number
//   longitute: number
//   pincode: number
//   schedule_type: string
//   state: string
//   matchedWarehouse?: WarehouseLocation | null 
//   placeId?: string
// }

// interface PincodeResponse {
//   Info: {
//     currentPage: number
//     rows: number
//     totalData: number
//     totalPages: number
//   }
//   results: PincodePoint[]
// }

// interface DhruvtaraPincodeData {
//   pincode: string
//   deliveryType: string
//   serviceSchedule: string[]
//   geoLocation: {
//     longitude: number
//     latitude: number
//   }
//   state: string
//   district: string
//   servicedBy: {
//     warehouses: Array<{
//       zohoWarehouseId: string
//       erpnextWarehouseId: string
//       distance: number
//     }>
//   }
//   mapInfo?: {
//     googleMaps: {
//       placeId: string
//     }
//   }
// }

// const isValidPincode = (pincode: string): boolean => /^\d{6}$/.test(pincode.trim())

// const matchWarehouseByZohoId = (zohoWarehouseId: string, warehouses: WarehouseLocation[]): WarehouseLocation | null =>
//   warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId) || null

// const createPincodeResponse = (results: PincodePoint[]): PincodeResponse => ({
//   Info: {
//     currentPage: 1,
//     rows: results.length,
//     totalData: results.length,
//     totalPages: 1,
//   },
//   results,
// })

// async function fetchPincodesByZohoWarehouseId(zohoWarehouseId: string): Promise<PincodePoint[]> {
//   try {
//     // Simulate API delay
//     await new Promise(resolve => setTimeout(resolve, 300))
    
//     // Use local mock data
//     const pincodeData = pincodesData as DhruvtaraPincodeData[]
//     const bazaarWarehouses = await fetchWarehouseLocations()
//     const matchedWarehouse = matchWarehouseByZohoId(zohoWarehouseId, bazaarWarehouses.results)
    
//     // Filter pincodes that are serviced by this warehouse
//     const filteredPincodes = pincodeData.filter(item => 
//       item.servicedBy.warehouses.some(wh => wh.zohoWarehouseId === zohoWarehouseId)
//     )
    
//     console.log(`Found ${filteredPincodes.length} pincodes for warehouse ${zohoWarehouseId}`)
    
//     return filteredPincodes.map((item) => {
//       const warehouseService = item.servicedBy.warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId)
//       return {
//         Schedule: item.serviceSchedule.join(', '),
//         WH: matchedWarehouse?.Warehouse || `Warehouse-${zohoWarehouseId}`,
//         distance: warehouseService?.distance || 0,
//         district: item.district,
//         latitude: item.geoLocation.latitude,
//         longitute: item.geoLocation.longitude,
//         pincode: parseInt(item.pincode),
//         schedule_type: item.deliveryType,
//         state: item.state,
//         matchedWarehouse,
//         placeId: item.mapInfo?.googleMaps?.placeId,
//       }
//     })
//   } catch (error) {
//     console.error('Error fetching pincodes by zohoWarehouseId:', error)
//     return []
//   }
// }

// async function fetchAllWarehousesPincodes(): Promise<PincodePoint[]> {
//   try {
//     console.log('🔄 Starting to fetch all warehouses pincodes...')
    
//     const warehouseResponse = await fetchWarehouseLocations()
//     const warehouses = warehouseResponse.results
    
//     console.log(`📦 Found ${warehouses.length} warehouses:`, warehouses.map(w => ({ id: w.zohoWarehouseId, name: w.Warehouse })))
    
//     const warehousePincodePromises = warehouses.map(warehouse => 
//       fetchPincodesByZohoWarehouseId(warehouse.zohoWarehouseId)
//     )
    
//     const allResults = await Promise.all(warehousePincodePromises)
//     const allPincodes = allResults.flat()
    
//     console.log(`📍 Total pincodes found: ${allPincodes.length}`)
//     console.log(`📍 Pincodes with place IDs: ${allPincodes.filter(p => p.placeId).length}`)
    
//     // Log first few pincodes for debugging
//     if (allPincodes.length > 0) {
//       console.log('Sample pincodes:', allPincodes.slice(0, 3).map(p => ({
//         pincode: p.pincode,
//         warehouse: p.WH,
//         placeId: p.placeId ? 'YES' : 'NO',
//         coords: `${p.latitude}, ${p.longitute}`
//       })))
//     }
    
//     // Remove duplicates based on pincode
//     const uniquePincodes = allPincodes.reduce((acc, current) => {
//       const existing = acc.find(item => item.pincode === current.pincode)
//       if (!existing) {
//         acc.push(current)
//       }
//       return acc
//     }, [] as PincodePoint[])
    
//     console.log(`✅ Unique pincodes: ${uniquePincodes.length}`)
//     return uniquePincodes
//   } catch (error) {
//     console.error('❌ Error fetching all warehouses pincodes:', error)
//     return []
//   }
// }

// export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
//   const validPincodes = Array.from(new Set(pincodes.map(p => p.toString()).filter(isValidPincode)))
//   console.log(`📋 Valid pincodes from ${pincodes.length} input: ${validPincodes.length}`)
//   return validPincodes
// }

// export async function fetchAllPincodePlaceIds(): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
//   try {
//     console.log('🗺️ Starting to fetch pincode place IDs...')
    
//     const allPincodes = await fetchAllWarehousesPincodes()
//     const placeIdMapping: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
//     allPincodes.forEach(pincode => {
//       const pincodeStr = pincode.pincode.toString()
//       if (pincode.placeId && !placeIdMapping[pincodeStr]) {
//         placeIdMapping[pincodeStr] = {
//           placeId: pincode.placeId,
//           latitude: pincode.latitude,
//           longitude: pincode.longitute
//         }
//       }
//     })
    
//     console.log(`🎯 Created place ID mapping for ${Object.keys(placeIdMapping).length} pincodes`)
//     console.log('Sample mapping:', Object.entries(placeIdMapping).slice(0, 3))
    
//     return placeIdMapping
//   } catch (error) {
//     console.error('❌ Error creating consolidated pincode place ID mapping:', error)
//     throw error
//   }
// }

// export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
//   try {
//     console.log('🚀 fetchPincodeLocations called with warehouses:', warehouses)
    
//     const allPincodes = await fetchAllWarehousesPincodes()
    
//     if (warehouses) {
//       const warehouseNames = warehouses.split(',').map(name => name.trim().toLowerCase())
//       console.log('🔍 Filtering by warehouse names:', warehouseNames)
      
//       const filteredPincodes = allPincodes.filter(pincode => 
//         warehouseNames.some(name => 
//           pincode.WH.toLowerCase().includes(name) || name.includes(pincode.WH.toLowerCase())
//         )
//       )
      
//       console.log(`📊 Filtered pincodes: ${filteredPincodes.length} out of ${allPincodes.length}`)
//       return createPincodeResponse(filteredPincodes)
//     }
    
//     console.log(`📊 Returning all pincodes: ${allPincodes.length}`)
//     return createPincodeResponse(allPincodes)
//   } catch (error) {
//     console.error('❌ Error fetching pincode locations:', error)
//     throw new Error('Failed to fetch pincode locations')
//   }
// }

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
    console.log(`🔍 Fetching pincodes for warehouse: ${zohoWarehouseId}`)
    
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
    
    console.log(`✅ Found ${filteredPincodes.length} pincodes for warehouse ${zohoWarehouseId}`)
    
    const results = filteredPincodes.map((item) => {
      const warehouseService = item.servicedBy.warehouses.find(wh => wh.zohoWarehouseId === zohoWarehouseId)
      const result = {
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
      
      // Debug log for place IDs
      if (result.placeId) {
        console.log(`📍 Pincode ${result.pincode} has placeId: ${result.placeId}`)
      } else {
        console.warn(`⚠️ Pincode ${result.pincode} missing placeId`)
      }
      
      return result
    })
    
    return results
  } catch (error) {
    console.error(`❌ Error fetching pincodes for warehouse ${zohoWarehouseId}:`, error)
    return []
  }
}

async function fetchAllWarehousesPincodes(): Promise<PincodePoint[]> {
  try {
    console.log('🔄 Starting to fetch all warehouses pincodes...')
    
    const warehouseResponse = await fetchWarehouseLocations()
    const warehouses = warehouseResponse.results
    
    console.log(`📦 Found ${warehouses.length} warehouses`)
    console.log('📦 Warehouse list:', warehouses.map(w => ({ id: w.zohoWarehouseId, name: w.Warehouse })))
    
    const warehousePincodePromises = warehouses.map(warehouse => 
      fetchPincodesByZohoWarehouseId(warehouse.zohoWarehouseId)
    )
    
    const allResults = await Promise.all(warehousePincodePromises)
    const allPincodes = allResults.flat()
    
    console.log(`📍 Total pincodes found: ${allPincodes.length}`)
    console.log(`📍 Pincodes with place IDs: ${allPincodes.filter(p => p.placeId).length}`)
    
    // Enhanced debugging
    const pincodesByWarehouse = allPincodes.reduce((acc, pincode) => {
      if (!acc[pincode.WH]) acc[pincode.WH] = []
      acc[pincode.WH].push(pincode.pincode)
      return acc
    }, {} as Record<string, number[]>)
    
    console.log('📊 Pincodes by warehouse:', pincodesByWarehouse)
    
    // Log sample pincodes with place IDs
    const withPlaceIds = allPincodes.filter(p => p.placeId)
    if (withPlaceIds.length > 0) {
      console.log('🎯 Sample pincodes with place IDs:', withPlaceIds.slice(0, 5).map(p => ({
        pincode: p.pincode,
        warehouse: p.WH,
        placeId: p.placeId,
        coords: `${p.latitude}, ${p.longitute}`
      })))
    }
    
    // Remove duplicates based on pincode
    const uniquePincodes = allPincodes.reduce((acc, current) => {
      const existing = acc.find(item => item.pincode === current.pincode)
      if (!existing) {
        acc.push(current)
      } else {
        console.log(`🔄 Duplicate pincode found: ${current.pincode}, keeping first occurrence`)
      }
      return acc
    }, [] as PincodePoint[])
    
    console.log(`✅ Unique pincodes: ${uniquePincodes.length}`)
    
    return uniquePincodes
  } catch (error) {
    console.error('❌ Error fetching all warehouses pincodes:', error)
    throw error // Re-throw to handle in calling function
  }
}

export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  const validPincodes = Array.from(new Set(pincodes.map(p => p.toString()).filter(isValidPincode)))
  console.log(`📋 Valid pincodes from ${pincodes.length} input: ${validPincodes.length}`)
  
  if (validPincodes.length === 0) {
    console.warn('⚠️ No valid pincodes found in input')
  }
  
  return validPincodes
}

export async function fetchAllPincodePlaceIds(): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    console.log('🗺️ Starting to fetch pincode place IDs...')
    
    const allPincodes = await fetchAllWarehousesPincodes()
    const placeIdMapping: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    let mappedCount = 0
    let totalCount = 0
    
    allPincodes.forEach(pincode => {
      totalCount++
      const pincodeStr = pincode.pincode.toString()
      
      if (pincode.placeId && !placeIdMapping[pincodeStr]) {
        placeIdMapping[pincodeStr] = {
          placeId: pincode.placeId,
          latitude: pincode.latitude,
          longitude: pincode.longitute
        }
        mappedCount++
        console.log(`✅ Mapped pincode ${pincodeStr} to placeId: ${pincode.placeId}`)
      } else if (!pincode.placeId) {
        console.warn(`⚠️ Pincode ${pincodeStr} has no placeId`)
      }
    })
    
    console.log(`🎯 Place ID mapping summary:`)
    console.log(`   Total pincodes processed: ${totalCount}`)
    console.log(`   Successfully mapped: ${mappedCount}`)
    console.log(`   Mapping coverage: ${((mappedCount / totalCount) * 100).toFixed(1)}%`)
    
    // Log sample mappings for verification
    const sampleEntries = Object.entries(placeIdMapping).slice(0, 3)
    console.log('📍 Sample mappings:', sampleEntries.map(([pincode, data]) => ({
      pincode,
      placeId: data.placeId,
      coords: `${data.latitude}, ${data.longitude}`
    })))
    
    if (mappedCount === 0) {
      console.error('❌ No place IDs were mapped! Check your data structure.')
      throw new Error('No valid place IDs found in pincode data')
    }
    
    return placeIdMapping
  } catch (error) {
    console.error('❌ Error creating consolidated pincode place ID mapping:', error)
    throw error
  }
}

export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
  try {
    console.log('🚀 fetchPincodeLocations called')
    console.log('🔧 Parameters:', { warehouses })
    
    const allPincodes = await fetchAllWarehousesPincodes()
    console.log(`📊 Retrieved ${allPincodes.length} total pincodes`)
    
    if (allPincodes.length === 0) {
      console.warn('⚠️ No pincodes found in data')
      return createPincodeResponse([])
    }
    
    let filteredPincodes = allPincodes
    
    if (warehouses) {
      const warehouseNames = warehouses.split(',').map(name => name.trim().toLowerCase())
      console.log('🔍 Filtering by warehouse names:', warehouseNames)
      
      filteredPincodes = allPincodes.filter(pincode => 
        warehouseNames.some(name => 
          pincode.WH.toLowerCase().includes(name) || name.includes(pincode.WH.toLowerCase())
        )
      )
      
      console.log(`📊 Filtered results: ${filteredPincodes.length} out of ${allPincodes.length}`)
    }
    
    console.log(`✅ Returning ${filteredPincodes.length} pincodes`)
    
    // Final validation
    const withPlaceIds = filteredPincodes.filter(p => p.placeId)
    console.log(`🎯 Pincodes with place IDs in final result: ${withPlaceIds.length}`)
    
    return createPincodeResponse(filteredPincodes)
  } catch (error) {
    console.error('❌ Error in fetchPincodeLocations:', error)
    throw new Error(`Failed to fetch pincode locations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
