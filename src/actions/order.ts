'use server';

let ordersData: OrderLocationData[] | null = null;

async function getOrdersData(): Promise<OrderLocationData[]> {
  if (!ordersData) {
    ordersData = (await import('../data/orders.json')).default;
  }
  return ordersData;
}

export interface OrderLocationData {
  cust_count: number;
  latitude: number;
  longitude: number;
  order_date: string;
  order_value: number;
  so_count: number;
  volume: number;
}

export interface OrderResponse {
  Info: {
    currentPage: number;
    rows: number;
    totalData: number;
    totalPages: number;
  };
  results: OrderLocationData[];
}

/**
 * Helper function to generate random data based on date range
 */
async function generateOrderData(
  fromDate: string,
  toDate: string
): Promise<OrderLocationData[]> {
  const baseData = await getOrdersData();

  // Generate data for the specified date range
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

  const generatedData: OrderLocationData[] = [];

  // Generate data for each day in the range
  for (let i = 0; i <= daysDiff; i++) {
    const currentDate = new Date(from);
    currentDate.setDate(from.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // For each day, create variations of the base data
    baseData.forEach((order) => {
      // Add some randomness based on the metric
      const multiplier = Math.random() * 0.5 + 0.75; // Between 0.75 and 1.25

      // Slightly vary the coordinates for realistic spread
      const latVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees
      const lngVariation = (Math.random() - 0.5) * 0.01; // ±0.005 degrees

      generatedData.push({
        cust_count: Math.round(order.cust_count * multiplier),
        latitude: order.latitude + latVariation,
        longitude: order.longitude + lngVariation,
        order_date: dateStr,
        order_value: Math.round(order.order_value * multiplier * 100) / 100,
        so_count: Math.round(order.so_count * multiplier),
        volume: Math.round(order.volume * multiplier * 100) / 100,
      });
    });
  }

  return generatedData;
}

export async function fetchOrderLocationData(
  fromDate?: string,
  toDate?: string,
  metric?: string
): Promise<OrderResponse> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Use current date if no dates provided
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultFromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const effectiveFromDate = fromDate || defaultFromDate;
    const effectiveToDate = toDate || today;
    const effectiveMetric = metric || 'cust_count';

    console.log(
      `Generating order data from ${effectiveFromDate} to ${effectiveToDate} for metric: ${effectiveMetric}`
    );

    // Generate data based on the parameters
    const results = await generateOrderData(effectiveFromDate, effectiveToDate);

    return {
      Info: {
        currentPage: 1,
        rows: results.length,
        totalData: results.length,
        totalPages: 1,
      },
      results,
    };
  } catch (error) {
    console.error('Error fetching order location data:', error);
    throw new Error('Failed to fetch order location data');
  }
}
