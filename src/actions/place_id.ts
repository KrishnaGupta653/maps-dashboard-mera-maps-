'use server'
import { getClient } from './gauth2'

export type PincodeData = {
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
      erpnextWarehouseId: string
      zohoWarehouseId?: string
      distance: number
    }>
    hubs?: Array<any>
  }
  holidayList: string[]
  serviceable: boolean
  mapInfo: {
    googleMaps: {
      placeId: string
    }
  }
  serviceTimeWindow?: {
    start: string
    end: string
  }
}

// Validate pincode format (6 digits)
function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim())
}

// Function to get unique valid pincodes
export async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  const uniquePincodes = Array.from(new Set(
    pincodes.map(p => p.toString()).filter(isValidPincode)
  ))
  
  console.log(`Filtered ${pincodes.length} pincodes to ${uniquePincodes.length} unique valid pincodes`)
  return uniquePincodes
}

export async function fetchSinglePincodeData(pincode: string): Promise<PincodeData | null> {
  try {
    if (!isValidPincode(pincode)) {
      console.warn(`Invalid pincode format: ${pincode}`)
      return null
    }

    const client = await getClient()
    const url = `https://dhruv-tara-1019598212725.asia-east2.run.app/pincode/${pincode}`
    
    console.log(`Fetching data for pincode: ${pincode}`)
    
    const response = await client.request({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.data) {
      console.warn(`No data returned for pincode: ${pincode}`)
      return null
    }

    const data = JSON.parse(JSON.stringify(response.data)) as PincodeData
    
    // Validate that we have the required mapInfo
    if (!data.mapInfo?.googleMaps?.placeId) {
      console.warn(`No place ID found for pincode: ${pincode}`)
      return null
    }

    return data
  } catch (error: any) {
    console.error(`Error fetching pincode data for ${pincode}:`, {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    })
    return null
  }
}

export async function fetchAllPincodePlaceIds(pincodes: string[]): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    // First validate and filter pincodes
    const validPincodes = await getUniqueValidPincodes(pincodes)
    
    if (validPincodes.length === 0) {
      console.warn('No valid pincodes provided')
      return {}
    }

    console.log(`Fetching place IDs for ${validPincodes.length} valid pincodes...`)
    
    const results: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    // Process pincodes in smaller batches to avoid overwhelming the API
    const batchSize = 100 // Reduced batch size for better reliability
    const delay = 100 // Increased delay between batches
    
    for (let i = 0; i < validPincodes.length; i += batchSize) {
      const batch = validPincodes.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validPincodes.length / batchSize)} (${batch.length} pincodes)`)
      
      // Create promises for the current batch
      const batchPromises = batch.map(async (pincode) => {
        try {
          const data = await fetchSinglePincodeData(pincode)
          if (data && data.mapInfo?.googleMaps?.placeId) {
            return {
              pincode,
              placeId: data.mapInfo.googleMaps.placeId,
              latitude: data.geoLocation.latitude,
              longitude: data.geoLocation.longitude
            }
          }
          return null
        } catch (error) {
          console.error(`Failed to fetch data for pincode ${pincode}:`, error)
          return null
        }
      })
      
      // Execute batch promises
      const batchResults = await Promise.all(batchPromises)
      
      // Process results
      batchResults.forEach(result => {
        if (result) {
          results[result.pincode] = {
            placeId: result.placeId,
            latitude: result.latitude,
            longitude: result.longitude
          }
        }
      })
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < validPincodes.length) {
        console.log(`Waiting ${delay}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    const successCount = Object.keys(results).length
    console.log(`Successfully fetched place IDs for ${successCount} out of ${validPincodes.length} pincodes`)
    
    if (successCount === 0) {
      console.warn('No place IDs were successfully fetched. Check API authentication and pincode validity.')
    }
    
    return results
  } catch (error) {
    console.error('Error in fetchAllPincodePlaceIds:', error)
    throw new Error('Failed to fetch pincode place IDs')
  }
}

// Utility function to fetch place IDs for a specific set of pincodes with retry logic
export async function fetchPlaceIdsWithRetry(
  pincodes: string[], 
  maxRetries: number = 3
): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} to fetch place IDs`)
      const results = await fetchAllPincodePlaceIds(pincodes)
      
      if (Object.keys(results).length > 0) {
        return results
      }
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000 // Exponential backoff
        console.log(`No results in attempt ${attempt}, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        const delay = attempt * 1000
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch place IDs after all retry attempts')
}

// Legacy function for backward compatibility
export async function fetchPincodeData(pincode?: string): Promise<PincodeData | PincodeData[]> {
  try {
    const client = await getClient()
    const baseUrl = 'https://dhruv-tara-1019598212725.asia-east2.run.app/pincode'
    
    const url = pincode ? `${baseUrl}/${pincode}/` : `${baseUrl}/`
    
    const response = await client.request({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    return JSON.parse(JSON.stringify(response.data)) as PincodeData | PincodeData[]
  } catch (error) {
    console.error('Error fetching pincode data:', error)
    throw new Error('Failed to fetch pincode data')
  }
}