// 'use server'
// import { getSuchnavaliClient } from './gauth'

// export interface OrderLocationData {
//   cust_count: number
//   latitude: number
//   longitude: number
//   order_date: string
//   order_value: number
//   so_count: number
//   volume: number
// }

// export interface OrderResponse {
//   Info: {
//     currentPage: number
//     rows: number
//     totalData: number
//     totalPages: number
//   }
//   results: OrderLocationData[]
// }

// export async function fetchOrderLocationData(
//   fromDate?: string,
//   toDate?: string,
//   metric?: string
// ): Promise<OrderResponse> {
//   try {
//     const client = await getSuchnavaliClient()
  
//     const params = new URLSearchParams()
//     if (fromDate) params.append('from_date', fromDate)
//     if (toDate) params.append('to_date', toDate)
//     if (metric) params.append('metric', metric)
//     params.append('completeInfo', 'Yes')
    
//     const allResults: OrderLocationData[]=[]
//     let currentPage = 1
//     let totalPages = 1
    
//     do {
//       params.set('page', currentPage.toString())
//       const url = `${process.env.SUCHNAVALI_BASE_URL}/orderData/location?${params.toString()}`
      
//       const response = await client.request({
//         url,
//         method: 'GET',
//       })
      
//       const data = response.data as OrderResponse
      
//       if (data?.results) {
//         allResults.push(...data.results)
//         totalPages = data.Info.totalPages
//         currentPage++
//       } else {
//         break
//       }
//     } while (currentPage <= totalPages)
    
//     return {
//       Info: {
//         currentPage: 1,
//         rows: allResults.length,
//         totalData: allResults.length,
//         totalPages: 1
//       },
//       results: allResults
//     }
//   } catch (error) {
//     console.error('Error fetching order location data:', error)
//     throw new Error('Failed to fetch order location data')
//   }
// }
'use server'

// Mock data import (you'll need to create this file in your project)
import ordersData from '../data/orders.json'

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

// Helper function to generate random data based on date range and metric
function generateOrderData(fromDate: string, toDate: string, metric: string): OrderLocationData[] {
  const baseData = ordersData as OrderLocationData[]
  
  // Generate data for the specified date range
  const from = new Date(fromDate)
  const to = new Date(toDate)
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  
  const generatedData: OrderLocationData[] = []
  
  // Generate data for each day in the range
  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(from)
    currentDate.setDate(from.getDate() + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // For each day, create variations of the base data
    baseData.forEach((order, index) => {
      // Add some randomness based on the metric
      const multiplier = Math.random() * 0.5 + 0.75 // Between 0.75 and 1.25
      
      // Slightly vary the coordinates for realistic spread
      const latVariation = (Math.random() - 0.5) * 0.01 // ±0.005 degrees
      const lngVariation = (Math.random() - 0.5) * 0.01 // ±0.005 degrees
      
      generatedData.push({
        cust_count: Math.round(order.cust_count * multiplier),
        latitude: order.latitude + latVariation,
        longitude: order.longitude + lngVariation,
        order_date: dateStr,
        order_value: Math.round(order.order_value * multiplier * 100) / 100,
        so_count: Math.round(order.so_count * multiplier),
        volume: Math.round(order.volume * multiplier * 100) / 100
      })
    })
  }
  
  return generatedData
}

export async function fetchOrderLocationData(
  fromDate?: string,
  toDate?: string,
  metric?: string
): Promise<OrderResponse> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Use current date if no dates provided
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const defaultFromDate = thirtyDaysAgo.toISOString().split('T')[0]
    
    const effectiveFromDate = fromDate || defaultFromDate
    const effectiveToDate = toDate || today
    const effectiveMetric = metric || 'cust_count'
    
    console.log(`Generating order data from ${effectiveFromDate} to ${effectiveToDate} for metric: ${effectiveMetric}`)
    
    // Generate data based on the parameters
    const results = generateOrderData(effectiveFromDate, effectiveToDate, effectiveMetric)
    
    return {
      Info: {
        currentPage: 1,
        rows: results.length,
        totalData: results.length,
        totalPages: 1
      },
      results: results
    }
  } catch (error) {
    console.error('Error fetching order location data:', error)
    throw new Error('Failed to fetch order location data')
  }
}