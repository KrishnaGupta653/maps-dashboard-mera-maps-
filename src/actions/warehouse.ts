'use server'
import { getSuchnavaliClient } from './gauth'
export interface WarehouseLocation {
  Latitude: number
  Longitute: number
  Warehouse: string
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
     const client = await getSuchnavaliClient()
     const response = await client.request({
        url: `${process.env.SUCHNAVALI_BASE_URL}/serviceableWarehouse/location`,
        method: 'GET',
     })

     const data = response.data as WarehouseResponse
     const normalizedResults = data.results.map((location) => {
        let warehouseName = location.Warehouse
        if (warehouseName === 'Narsinghpur, Gurugram') {
          warehouseName = 'Gurgaon'
        }
        return {
          ...location,
          Warehouse: warehouseName,
        }
     })
     return {
        ...data,
        results: normalizedResults,
     }
   } catch (error) {
     console.error('Error fetching warehouse locations:', error)
     throw new Error('Failed to fetch warehouse locations')
   }
}
