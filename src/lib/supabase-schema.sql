-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    item_quantity INTEGER NOT NULL DEFAULT 0,
    variation_number VARCHAR(255),
    order_date VARCHAR(255),
    variation_name TEXT,
    attribute TEXT,
    marketplace VARCHAR(255),
    delivery_country VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on order_id for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);

-- Create index on order_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- Create index on marketplace for marketplace-based queries
CREATE INDEX IF NOT EXISTS idx_orders_marketplace ON orders(marketplace);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (you can modify this based on your needs)
CREATE POLICY "Allow all operations on orders" ON orders
    FOR ALL USING (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 