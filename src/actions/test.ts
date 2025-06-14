import { getClient } from './gauth'
// Types
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
async function getUniqueValidPincodes(pincodes: (string | number)[]): Promise<string[]> {
  const uniquePincodes = Array.from(new Set(
    pincodes.map(p => p.toString()).filter(isValidPincode)
  ))
  
  console.log(`✅ Filtered ${pincodes.length} pincodes to ${uniquePincodes.length} unique valid pincodes`)
  return uniquePincodes
}

async function fetchSinglePincodeData(pincode: string): Promise<PincodeData | null> {
  try {
    if (!isValidPincode(pincode)) {
      console.warn(`❌ Invalid pincode format: ${pincode}`)
      return null
    }

    const client = await getClient()
    const url = `https://dhruv-tara-1019598212725.asia-east2.run.app/pincode/${pincode}`
    
    console.log(`🔍 Fetching data for pincode: ${pincode}`)
    
    const response = await client.request({
      url,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.data) {
      console.warn(`⚠️  No data returned for pincode: ${pincode}`)
      return null
    }

    const data = JSON.parse(JSON.stringify(response.data)) as PincodeData
    
    // Validate that we have the required mapInfo
    if (!data.mapInfo?.googleMaps?.placeId) {
      console.warn(`⚠️  No place ID found for pincode: ${pincode}`)
      return null
    }

    console.log(`✅ Successfully fetched data for pincode: ${pincode}`)
    return data
  } catch (error: any) {
    console.error(`❌ Error fetching pincode data for ${pincode}:`, {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
    })
    return null
  }
}

async function fetchAllPincodePlaceIds(pincodes: string[]): Promise<Record<string, { placeId: string; latitude: number; longitude: number }>> {
  try {
    // First validate and filter pincodes
    const validPincodes = await getUniqueValidPincodes(pincodes)
    
    if (validPincodes.length === 0) {
      console.warn('⚠️  No valid pincodes provided')
      return {}
    }

    console.log(`🚀 Fetching place IDs for ${validPincodes.length} valid pincodes...`)
    
    const results: Record<string, { placeId: string; latitude: number; longitude: number }> = {}
    
    // Process pincodes in smaller batches to avoid overwhelming the API
    const batchSize = 5 // Reduced batch size for better reliability
    const delay = 200 // Increased delay between batches
    
    for (let i = 0; i < validPincodes.length; i += batchSize) {
      const batch = validPincodes.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validPincodes.length / batchSize)} (${batch.length} pincodes)`)
      
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
          console.error(`❌ Failed to fetch data for pincode ${pincode}:`, error)
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
        console.log(`⏳ Waiting ${delay}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    const successCount = Object.keys(results).length
    console.log(`🎉 Successfully fetched place IDs for ${successCount} out of ${validPincodes.length} pincodes`)
    
    if (successCount === 0) {
      console.warn('⚠️  No place IDs were successfully fetched. Check API authentication and pincode validity.')
    }
    
    return results
  } catch (error) {
    console.error('❌ Error in fetchAllPincodePlaceIds:', error)
    throw new Error('Failed to fetch pincode place IDs')
  }
}

// Test function to demonstrate usage
async function testPincodeAPI() {
  console.log('🔥 Starting Pincode API Test...\n')
  
  try {
    // Test with some sample pincodes
    const testPincodes = ['110001', '400001', '560001', '600001', '700001']
    
    console.log('📍 Testing with pincodes:', testPincodes.join(', '))
    console.log('=' .repeat(60))
    
    // Test single pincode fetch
    console.log('\n🔍 Testing single pincode fetch:')
    const singleResult = await fetchSinglePincodeData('110001')
    if (singleResult) {
      console.log('✅ Single pincode result:')
      console.log(JSON.stringify({
        pincode: singleResult.pincode,
        state: singleResult.state,
        district: singleResult.district,
        serviceable: singleResult.serviceable,
        placeId: singleResult.mapInfo.googleMaps.placeId,
        coordinates: singleResult.geoLocation
      }, null, 2))
    }
    
    // Test batch fetch
    console.log('\n📦 Testing batch pincode fetch:')
    const batchResults = await fetchAllPincodePlaceIds(testPincodes)
    
    console.log('\n🎯 Final Results:')
    console.log('=' .repeat(60))
    
    if (Object.keys(batchResults).length > 0) {
      Object.entries(batchResults).forEach(([pincode, data]) => {
        console.log(`📍 ${pincode}: ${data.placeId} (${data.latitude}, ${data.longitude})`)
      })
    } else {
      console.log('❌ No results obtained')
    }
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPincodeAPI()
    .then(() => {
      console.log('\n🎉 All tests completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Fatal error:', error)
      process.exit(1)
    })
}

// Export functions for use in other modules
export {
  fetchSinglePincodeData,
  fetchAllPincodePlaceIds,
  getUniqueValidPincodes,
  getClient
}