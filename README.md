# Inventory Opname Application

A simple, no-login Next.js application for inventory stocktaking (opname) with Supabase backend. This application follows the specifications from `tech_spec.md`.

## Features

- **Asset Selection**: Dropdown from master data table
- **Form Input**: Opname data with status checkboxes
- **Image Upload**: Upload images as proof/verification
- **Report Generation**: Table format matching the specification
- **Print Functionality**: Direct printing from browser
- **Mobile-Friendly**: Responsive design with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 (Pages Router) + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database, Storage, Auth disabled)
- **Deployment**: Vercel (recommended)

## Database Schema

### Assets Table (Master Data)
- `id` (UUID PRIMARY KEY)
- `name` (TEXT) - Asset name
- `merk` (TEXT) - Brand/Type
- `tahun` (INTEGER) - Year
- `no_asset` (TEXT) - Asset number
- `pemakai` (TEXT) - User/Assigned to
- `site` (TEXT) - Site
- `lokasi` (TEXT) - Location
- `created_at`, `updated_at` (TIMESTAMPTZ)

### Opname Records Table
- `id` (UUID PRIMARY KEY)
- `asset_id` (UUID FK) - Links to assets.id
- `keterangan_ada` (BOOLEAN) - Present checkbox
- `keterangan_tidak_ada` (BOOLEAN) - Not present checkbox
- `status_bagus` (BOOLEAN) - Good condition checkbox
- `status_rusak` (BOOLEAN) - Damaged condition checkbox
- `h_perolehan` (NUMERIC) - Purchase value
- `nilai_buku` (NUMERIC) - Book value
- `image_url` (TEXT) - URL to uploaded image
- `created_at`, `updated_at` (TIMESTAMPTZ)

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to **SQL Editor** in your Supabase dashboard
3. Run the migration scripts in order:
   - `supabase/migrations/001_create_assets_table.sql`
   - `supabase/migrations/002_create_opname_records_table.sql`
   - `supabase/migrations/003_create_storage_bucket.sql`
   - `supabase/migrations/004_insert_sample_data.sql` (optional, for testing)
4. Copy your project URL and anon key from **Project Settings** → **API**

### 2. Local Development

1. Clone this repository or extract the files:
   ```bash
   cd inventory-opname
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### 3. Adding More Master Data

To add more assets to your master data, use the Supabase SQL Editor:

```sql
INSERT INTO assets (name, merk, tahun, no_asset, pemakai, site, lokasi) VALUES
('Your Asset Name', 'Brand', 2023, 'ASSET001', 'User', 'Site', 'Location');
```

## Application Flow

### Form Page (`/`)
1. User visits the application
2. Sees a dropdown with all assets from master data
3. Selects an asset → auto-fills Merk, Tahun, No Asset, Pemakai, Site, Lokasi
4. Fills in checkboxes:
   - KETERANGAN: ADA / TIDAK ADA
   - STATUS AKTIVA: BAGUS / RUSAK
5. Enters H.Perolehan and Nilai Buku (optional)
6. Uploads image (optional)
7. Clicks "Simpan" → data saved to Supabase

### Report Page (`/report`)
1. Displays all opname records with asset details
2. Shows checkboxes with ✓ marks
3. Displays uploaded images as thumbnails
4. Shows totals for H.Perolehan and Nilai Buku
5. Print button for generating printable reports

## File Structure

```
inventory-opname/
├── src/
│   ├── components/          # Reusable components (if needed)
│   ├── lib/
│   │   └── supabaseClient.ts # Supabase client setup
│   ├── pages/
│   │   ├── _app.tsx         # Next.js app component
│   │   ├── _document.tsx    # Next.js document component
│   │   ├── index.tsx        # Form page
│   │   └── report.tsx       # Report page
│   └── styles/
│       └── globals.css      # Global styles with Tailwind
├── supabase/
│   └── migrations/          # Database migration scripts
├── .env.local.example       # Environment template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Deployment (Vercel)

1. Push code to GitHub/GitLab
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Usage Tips

- **Mobile Friendly**: The app works well on mobile devices
- **Image Upload**: Images are stored in Supabase Storage
- **Print Reports**: Use the print button for clean PDF output
- **Data Persistence**: All data is stored in Supabase database
- **No Authentication**: Simple and anonymous access

## Security Notes

- **No Authentication**: This app uses anonymous access as specified
- **Public Storage**: Images are publicly accessible
- **Row Level Security**: Basic RLS policies are enabled
- **Production Use**: Consider adding authentication for sensitive data

## Customization

To customize the application:
1. Modify the form fields in `src/pages/index.tsx`
2. Update the report layout in `src/pages/report.tsx`
3. Change colors and styles using Tailwind classes
4. Add validation as needed

## Support

For issues or questions:
1. Check the Supabase dashboard for any database errors
2. Verify environment variables are correctly set
3. Ensure all migration scripts have been run
4. Check browser console for JavaScript errors