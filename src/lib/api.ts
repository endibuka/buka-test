export interface OrderData {
  OrderID: string;
  'Item Quantity': string;
  'Variation Number': string;
  'Order Date': string;
  'Variation Name': string;
  Attribute: string;
  Marketplace: string;
  'Delivery Country': string;
}

export async function fetchOrdersCSV(): Promise<OrderData[]> {
  try {
    console.log('Fetching orders from API route...');
    const response = await fetch('/api/fetch-orders');
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Received data:', data);
    
    if (!data.orders || !Array.isArray(data.orders)) {
      throw new Error('Invalid response format: orders array not found');
    }
    
    return data.orders;
  } catch (error) {
    console.error('Error fetching CSV:', error);
    throw error;
  }
} 