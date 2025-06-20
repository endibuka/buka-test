-- MONTHLY ORDER REPORT - FACT CHECK AGAINST AI OUTPUT
-- This query generates the same monthly breakdown that the AI uses in its analytics

-- 1. BASIC MONTHLY BREAKDOWN (matches "📅 COMPLETE MONTHLY BREAKDOWN" section)
SELECT 
    EXTRACT(YEAR FROM order_date::date) as year,
    EXTRACT(MONTH FROM order_date::date) as month,
    TO_CHAR(order_date::date, 'Month') as month_name,
    COUNT(DISTINCT order_id) as unique_orders,
    SUM(item_quantity) as total_items,
    ROUND(AVG(item_quantity::numeric), 2) as avg_items_per_order
FROM orders 
WHERE order_date IS NOT NULL 
    AND order_date != ''
    AND order_date::date IS NOT NULL
GROUP BY 
    EXTRACT(YEAR FROM order_date::date),
    EXTRACT(MONTH FROM order_date::date),
    TO_CHAR(order_date::date, 'Month')
ORDER BY year, month;

-- 2. MARKETPLACE BY MONTH BREAKDOWN (matches "📅 MARKETPLACE BY MONTH BREAKDOWN" section)
SELECT 
    EXTRACT(YEAR FROM order_date::date) as year,
    EXTRACT(MONTH FROM order_date::date) as month,
    TO_CHAR(order_date::date, 'Month') as month_name,
    marketplace,
    COUNT(*) as order_count,
    SUM(item_quantity) as total_quantity
FROM orders 
WHERE order_date IS NOT NULL 
    AND order_date != ''
    AND marketplace IS NOT NULL
    AND marketplace != ''
GROUP BY 
    EXTRACT(YEAR FROM order_date::date),
    EXTRACT(MONTH FROM order_date::date),
    TO_CHAR(order_date::date, 'Month'),
    marketplace
ORDER BY year, month, total_quantity DESC;

-- 3. COUNTRY BY MONTH BREAKDOWN
SELECT 
    EXTRACT(YEAR FROM order_date::date) as year,
    EXTRACT(MONTH FROM order_date::date) as month,
    TO_CHAR(order_date::date, 'Month') as month_name,
    delivery_country,
    COUNT(*) as order_count,
    SUM(item_quantity) as total_quantity
FROM orders 
WHERE order_date IS NOT NULL 
    AND order_date != ''
    AND delivery_country IS NOT NULL
    AND delivery_country != ''
GROUP BY 
    EXTRACT(YEAR FROM order_date::date),
    EXTRACT(MONTH FROM order_date::date),
    TO_CHAR(order_date::date, 'Month'),
    delivery_country
ORDER BY year, month, total_quantity DESC;

-- 4. DECEMBER 31, 2024 SPECIFIC ANALYSIS (matches AI's special analysis)
SELECT 
    'December 31, 2024' as date_label,
    COUNT(DISTINCT order_id) as unique_orders,
    SUM(item_quantity) as total_items,
    STRING_AGG(DISTINCT delivery_country, ', ' ORDER BY delivery_country) as countries
FROM orders 
WHERE order_date::date = '2024-12-31';

-- 5. OVERALL SUMMARY STATISTICS (matches "📊 VERIFIED SUMMARY STATISTICS")
SELECT 
    'SUMMARY' as report_type,
    COUNT(*) as total_database_rows,
    COUNT(DISTINCT order_id) as unique_order_ids,
    SUM(item_quantity) as total_items_sold,
    ROUND(AVG(item_quantity::numeric), 2) as avg_items_per_order,
    MIN(order_date::date) as oldest_date,
    MAX(order_date::date) as newest_date,
    COUNT(CASE WHEN order_date IS NOT NULL AND order_date != '' THEN 1 END) as valid_dates
FROM orders;

-- 6. TOP MARKETPLACES (matches "🏪 TOP MARKETPLACES BY VOLUME" section)
SELECT 
    marketplace,
    COUNT(*) as order_count,
    SUM(item_quantity) as total_quantity,
    ROUND((SUM(item_quantity) * 100.0 / (SELECT SUM(item_quantity) FROM orders WHERE marketplace IS NOT NULL)), 1) as percentage
FROM orders 
WHERE marketplace IS NOT NULL AND marketplace != ''
GROUP BY marketplace
ORDER BY total_quantity DESC
LIMIT 10;

-- 7. TOP COUNTRIES (matches "🌍 TOP COUNTRIES BY VOLUME" section)
SELECT 
    delivery_country,
    COUNT(*) as order_count,
    SUM(item_quantity) as total_quantity,
    ROUND((SUM(item_quantity) * 100.0 / (SELECT SUM(item_quantity) FROM orders WHERE delivery_country IS NOT NULL)), 1) as percentage
FROM orders 
WHERE delivery_country IS NOT NULL AND delivery_country != ''
GROUP BY delivery_country
ORDER BY total_quantity DESC
LIMIT 10; 