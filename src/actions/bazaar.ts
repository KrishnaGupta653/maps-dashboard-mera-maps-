// 'use server'
// import { getBazaarClient } from './gauth'
// export interface BazaarWarehouseAddress {
//   addressLine1: string
//   addressLine2?: string
//   state: string
//   city: string
//   district: string
//   pincode: number
//   country: string
// }
// export interface BazaarWarehouseGeoLocation {
//   type: 'Point'
//   coordinates: [number, number] // [longitude, latitude]
// }
// export interface BazaarWarehouse {
//   _id: string
//   name: string
//   type: 'WAREHOUSE'
//   zohoWarehouseId: string
//   address: BazaarWarehouseAddress
//   geoLocation: BazaarWarehouseGeoLocation
//   shipsyHubCode?: string
//   hubCode?: string
//   status: 'ACTIVE'
//   createdAt: string
//   updatedAt: string
// }
// export interface WarehouseLocation {
//   Latitude: number
//   Longitute: number 
//   Warehouse: string
//   zohoWarehouseId: string
//   address: BazaarWarehouseAddress
//   warehouseId: string
//   hubCode?: string
//   shipsyHubCode?: string
// }
// export interface WarehouseResponse {
//   Info: {
//     currentPage: number
//     rows: number
//     totalData: number
//     totalPages: number
//   }
//   results: WarehouseLocation[]
// }
// export async function fetchWarehouseLocations(): Promise<WarehouseResponse> {
//   try {
//     const client = await getBazaarClient()
//     const response = await client.request({
//       url: `${process.env.BAZAAR_BASE_URL}/warehouse?type=WAREHOUSE&status=ACTIVE`,
//       method: 'GET',
//     })
//     const data = response.data as BazaarWarehouse[]
//     const transformedResults: WarehouseLocation[] = data
//       .filter(warehouse => 
//         warehouse.geoLocation?.coordinates?.length === 2 && warehouse.name.toLowerCase() !== 'retail warehouse')
//       .map((warehouse) => {
//         const [longitude, latitude] = warehouse.geoLocation.coordinates
//         return {
//           Latitude: latitude,
//           Longitute: longitude,
//           Warehouse: warehouse.name,
//           zohoWarehouseId: warehouse.zohoWarehouseId,
//           address: warehouse.address,
//           warehouseId: warehouse._id,
//           hubCode: warehouse.hubCode,
//           shipsyHubCode: warehouse.shipsyHubCode,
//         }
//       })
//     return {
//       Info: {
//         currentPage: 1,
//         rows: transformedResults.length,
//         totalData: transformedResults.length,
//         totalPages: 1,
//       },
//       results: transformedResults,
//     }
//   } catch (error) {
//     console.error('Error fetching warehouse locations:', error)
//     throw new Error('Failed to fetch warehouse locations')
//   }
// }
'use server'

// Mock data import (you'll need to create this file in your project)
import warehousesData from '../data/warehouses.json'

export interface BazaarWarehouseAddress {
  addressLine1: string
  addressLine2?: string
  state: string
  city: string
  district: string
  pincode: number
  country: string
}

export interface BazaarWarehouseGeoLocation {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface BazaarWarehouse {
  _id: string
  name: string
  type: 'WAREHOUSE'
  zohoWarehouseId: string
  address: BazaarWarehouseAddress
  geoLocation: BazaarWarehouseGeoLocation
  shipsyHubCode?: string
  hubCode?: string
  status: 'ACTIVE'
  createdAt: string
  updatedAt: string
}

export interface WarehouseLocation {
  Latitude: number
  Longitute: number 
  Warehouse: string
  zohoWarehouseId: string
  address: BazaarWarehouseAddress
  warehouseId: string
  hubCode?: string
  shipsyHubCode?: string
}

export interface WarehouseResponse {
  Info: {
    currentPage: number
    rows: number
    totalData: number
    totalPages: number
  }
  results: WarehouseLocation[]
}

export async function fetchWarehouseLocations(): Promise<WarehouseResponse> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Use local mock data
    const data = warehousesData as BazaarWarehouse[]
    
    const transformedResults: WarehouseLocation[] = data
      .filter(warehouse => 
        warehouse.geoLocation?.coordinates?.length === 2 && 
        warehouse.name.toLowerCase() !== 'retail warehouse'
      )
      .map((warehouse) => {
        const [longitude, latitude] = warehouse.geoLocation.coordinates
        return {
          Latitude: latitude,
          Longitute: longitude,
          Warehouse: warehouse.name,
          zohoWarehouseId: warehouse.zohoWarehouseId,
          address: warehouse.address,
          warehouseId: warehouse._id,
          hubCode: warehouse.hubCode,
          shipsyHubCode: warehouse.shipsyHubCode,
        }
      })

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
    console.error('Error fetching warehouse locations:', error)
    throw new Error('Failed to fetch warehouse locations')
  }
}