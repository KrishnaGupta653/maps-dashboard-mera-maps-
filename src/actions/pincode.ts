// 'use server'
// import { getClient } from './gauth'

// export type PincodePoint = {
//   Schedule: string
//   WH: string
//   distance: number
//   district: string
//   latitude: number
//   longitute: number
//   pincode: number
//   schedule_type: string
//   state: string
// }

// export interface PincodeResponse {
//   Info: {
//     currentPage: number
//     rows: number
//     totalData: number
//     totalPages: number
//   }
//   results: PincodePoint[]
// }

// export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
//   try {
//     const client = await getClient()
//     let url = 'https://suchnavali-vslywuxv3a-el.a.run.app/serviceablePincode/location'
    
//     if (warehouses) {
//       url += `?WH=${encodeURIComponent(warehouses)}`
//     }
    
//     const response = await client.request({
//       url,
//       method: 'GET',
//     })
    
//     // Ensure we return a plain object
//     return JSON.parse(JSON.stringify(response.data)) as PincodeResponse
//   } catch (error) {
//     console.error('Error fetching pincode locations:', error)
//     throw new Error('Failed to fetch pincode locations')
//   }
// }
'use server'
import { getClient } from './gauth'

export type PincodePoint = {
  Schedule: string
  WH: string
  distance: number
  district: string
  latitude: number
  longitute: number
  pincode: number
  schedule_type: string
  state: string
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

export async function fetchPincodeLocations(warehouses?: string): Promise<PincodeResponse> {
  try {
    const client = await getClient()
    let url = `${process.env.NEXT_PUBLIC_SUCHNAVALI_BASE_URL}/serviceablePincode/location`
    
    if (warehouses) {
      url += `?WH=${encodeURIComponent(warehouses)}`
    }
    
    const response = await client.request({
      url,
      method: 'GET',
    })
    return JSON.parse(JSON.stringify(response.data)) as PincodeResponse
  } catch (error) {
    console.error('Error fetching pincode locations:', error)
    throw new Error('Failed to fetch pincode locations')
  }
}