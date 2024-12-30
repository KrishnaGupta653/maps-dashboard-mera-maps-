"use server";
import { getClient } from "./gauth";

interface Warehouse {
  Schedule: string,
  WH: string,
  distance: number,
  district: string,
  latitude: number,
  longitute: number,
  pincode: number,
  schedule_type: string,
  state: string
}

interface Location{
  Latitude: number,
  Longitute: number,
  Warehouse: string
}

interface OrderDataLocation {
  cust_count: number;
  latitude: number;
  longitude: number;
  order_date: string;
  order_value: number;
  so_count: number;
  volume: number;
}

export async function WareHouseLocation(): Promise<Location[]> {
  try {
    const client = await getClient();
    const res = await client.request<{ results: Location[] }>({
      url: `${process.env.NEXT_PUBLIC_MAP_VISUALIZER_BASE_URL}/serviceableWarehouse/location`,
      method: "GET",
    });
    const results: Location[] = res.data.results;
    return results;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function WareHouseLocationWithPincode(): Promise<Warehouse[]> {
  try {
    const client = await getClient();
    const res = await client.request<{ results: Warehouse[] }>({
      url: `${process.env.NEXT_PUBLIC_MAP_VISUALIZER_BASE_URL}/serviceablePincode/location`,
      method: "GET",
    });
    const results: Warehouse[] = res.data.results;
    return results;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function HeatMapDateSelection(
  from_date: string,
  to_date: string,
  metric: string,
  limit: number = 100,
  maxRetries: number = 3
): Promise<any> {
  let allResults: any = [];
  let page = 1; 
  let totalPages = 1;
  let retries = 0;

  console.log("to_data", to_date);
  try {
    const client = await getClient();
    while (page <= totalPages) {
      try {
        const res = await client.request<{ results: any, Info: { totalPages: number } }>({
          url: `${process.env.NEXT_PUBLIC_MAP_VISUALIZER_BASE_URL}/orderData/location?from_date=${from_date}&to_date=${to_date}&metric=${metric}&page=${page}&limit=${limit}`,
          method: "GET",
        });

        console.log(`API Response for page ${page}:`, res);  

        const results: any = res.data.results;
        totalPages = res.data.Info.totalPages; 

        if (results.length === 0) {
          break; 
        }

        console.log(`Fetched ${results.length} results from page ${page}`);
        allResults = allResults.concat(results); 

        
        if (page === totalPages) {
          console.log("Reached the last page.");
          break; 
        }

        page++; 
      } catch (error:any) {
        if (error.response && error.response.status === 503 && retries < maxRetries) {
          
          console.log(`Service Unavailable (503). Retrying... Attempt ${retries + 1} of ${maxRetries}`);
          retries++;
          const backoffTime = Math.pow(2, retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        } else {
          console.error("Error fetching data:", error);
          throw error;
        }
      }
    }
    return allResults;
  } catch (error) {
    console.error("Final error after retries:", error);
    throw error;
  }
}
