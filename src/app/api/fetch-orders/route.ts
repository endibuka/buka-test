import { NextResponse } from 'next/server'

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

function parseCSV(csvText: string): OrderData[] {
  const lines = csvText.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return [];
  }
  
  // Split the first line to get headers
  const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
  console.log('Headers found:', headers);
  
  const data: OrderData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Split by semicolon and handle quoted values
    const values = lines[i].split(';').map(v => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    // Only add rows that have at least an OrderID
    if (row.OrderID && row.OrderID.trim()) {
      data.push(row as OrderData);
    }
  }
  
  console.log('Parsed data sample:', data.slice(0, 2));
  return data;
}

export async function GET() {
  // Use server-side environment variable (without NEXT_PUBLIC_ prefix)
  const API_TOKEN = process.env.PLENTY_ONE_KEY || process.env.NEXT_PUBLIC_PLENTY_ONE_KEY;
  
  if (!API_TOKEN) {
    console.error('API token not found in environment variables');
    return NextResponse.json(
      { error: 'API token not found. Please check your environment variables.' },
      { status: 500 }
    );
  }

  const headers = {
    'Authorization': `Bearer ${API_TOKEN}`
  };

  const url = "https://www.sagenta.online/rest/catalogs/export/b7c11a23-7016-5b24-aac9-e791aa18ff84/download?hash=791980b5f2720c9fbe8b2fb2d629718a&extension=csv";

  try {
    console.log('Fetching CSV from:', url);
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      return NextResponse.json(
        { error: `HTTP error! status: ${response.status} - ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const csvText = await response.text();
    console.log('CSV text length:', csvText.length);
    console.log('CSV first 200 characters:', csvText.substring(0, 200));
    
    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Empty CSV response received' },
        { status: 500 }
      );
    }
    
    const orders = parseCSV(csvText);
    console.log('Parsed orders count:', orders.length);
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return NextResponse.json(
      { error: `Failed to fetch CSV data: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 