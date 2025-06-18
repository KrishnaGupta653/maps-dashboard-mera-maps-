'use server'
import { getSuchnavaliClient } from './gauth'

export interface OrderLocationData {
  cust_count: number
  latitude: number
  longitude: number
  order_date: string
  order_value: number
  so_count: number
  volume: number
}

export interface OrderResponse {
  Info: {
    currentPage: number
    rows: number
    totalData: number
    totalPages: number
  }
  results: OrderLocationData[]
}

export async function fetchOrderLocationData(
  fromDate?: string,
  toDate?: string,
  metric?: string
): Promise<OrderResponse> {
  try {
    const client = await getSuchnavaliClient()
  
    const params = new URLSearchParams()
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)
    if (metric) params.append('metric', metric)
    params.append('completeInfo', 'Yes')
    
    const allResults: OrderLocationData[]=[]
    let currentPage = 1
    let totalPages = 1
    
    do {
      params.set('page', currentPage.toString())
      const url = `${process.env.SUCHNAVALI_BASE_URL}/orderData/location?${params.toString()}`
      
      const response = await client.request({
        url,
        method: 'GET',
      })
      
      const data = response.data as OrderResponse
      
      if (data?.results) {
        allResults.push(...data.results)
        totalPages = data.Info.totalPages
        currentPage++
      } else {
        break
      }
    } while (currentPage <= totalPages)
    
    return {
      Info: {
        currentPage: 1,
        rows: allResults.length,
        totalData: allResults.length,
        totalPages: 1
      },
      results: allResults
    }
  } catch (error) {
    console.error('Error fetching order location data:', error)
    throw new Error('Failed to fetch order location data')
  }
}
