-- MASTER DATA (READ-ONLY)
CREATE TABLE assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  merk TEXT,
  tahun INTEGER,
  no_asset TEXT,
  pemakai TEXT,
  site TEXT,
  lokasi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_assets_name ON assets(name);
CREATE INDEX idx_assets_no_asset ON assets(no_asset);

-- Enable RLS (Row Level Security)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policy for SELECT operations (allow anonymous access)
CREATE POLICY "Allow anonymous read access on assets" ON assets
  FOR SELECT USING (true);