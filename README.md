# Orders Management Tool - Next.js with Supabase and Tailwind CSS

A modern, single-page web application for managing orders data. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase. This tool allows you to fetch CSV data from an API and upload it to a Supabase database with a beautiful, responsive interface.

## 🚀 Features

- **One-Page Interface** - Clean, focused tool for orders management
- **CSV Data Fetching** - Fetch orders data from Plenty One API
- **Visual Data Display** - View CSV data in a responsive table (50 rows max by default)
- **Supabase Integration** - Upload data to PostgreSQL database
- **Batch Processing** - Handle large datasets efficiently
- **Real-time Feedback** - Status messages and error handling
- **Responsive Design** - Works on all devices

## 📦 Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- ESLint

### Backend
- Supabase (PostgreSQL database)
- Plenty One API integration

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Plenty One API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd buka-test
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_PLENTY_ONE_KEY=your_plenty_one_api_key
   ```

4. **Set up Supabase database**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and run the contents of `src/lib/supabase-schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗂️ Project Structure

```
buka-test/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── page.tsx         # Main orders tool page
│   │   └── layout.tsx       # Root layout
│   ├── components/          # Reusable components
│   │   └── OrdersTool.tsx   # Main orders management component
│   └── lib/                 # Utility libraries
│       ├── supabase.ts      # Supabase client configuration
│       ├── api.ts           # API functions for CSV fetching
│       └── supabase-schema.sql # Database schema
├── public/                  # Static assets
├── env.example             # Environment variables template
└── package.json            # Dependencies and scripts
```

## 🔧 Configuration

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and anon key
3. Add these to your `.env.local` file
4. Run the SQL schema in the Supabase SQL Editor

### Plenty One API

1. Get your API key from Plenty One
2. Add it to your `.env.local` file as `NEXT_PUBLIC_PLENTY_ONE_KEY`

### Database Schema

The application expects the following table structure in Supabase:

```sql
CREATE TABLE orders (
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
```

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 How to Use

1. **Fetch Orders**: Click the "Fetch Orders CSV" button to download and parse the latest orders data from the API
2. **Review Data**: The data will be displayed in a table showing up to 50 rows by default
3. **View All**: Click "Show All" to view all fetched orders
4. **Upload to Database**: Click "Upload to Supabase" to store the data in your PostgreSQL database

## 🔌 API Integration

The tool integrates with the Plenty One API to fetch CSV data with the following columns:

- OrderID
- Item Quantity
- Variation Number
- Order Date
- Variation Name
- Attribute
- Marketplace
- Delivery Country

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Other Platforms
- **Netlify**: Use `npm run build` and deploy the `.next` folder
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Use the Node.js preset

## 🆘 Troubleshooting

### Common Issues

1. **"API token not found"**: Make sure `NEXT_PUBLIC_PLENTY_ONE_KEY` is set in your `.env.local`
2. **"Orders table does not exist"**: Run the SQL schema in your Supabase SQL Editor
3. **CSV parsing errors**: Check that the API is returning valid CSV data
4. **Upload failures**: Verify your Supabase credentials and table permissions

### Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure the Supabase table schema is created
4. Check the Supabase dashboard for any database errors

## 🔄 Updates

To keep your project up to date:

```bash
npm update
npm run build
```

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
