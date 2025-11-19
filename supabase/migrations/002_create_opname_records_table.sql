-- OPNAME RECORDS (USER INPUT)
CREATE TABLE opname_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  keterangan_ada BOOLEAN DEFAULT false,
  keterangan_tidak_ada BOOLEAN DEFAULT false,
  status_bagus BOOLEAN DEFAULT false,
  status_rusak BOOLEAN DEFAULT false,
  h_perolehan NUMERIC,
  nilai_buku NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_opname_asset_id ON opname_records(asset_id);
CREATE INDEX idx_opname_created_at ON opname_records(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE opname_records ENABLE ROW LEVEL SECURITY;

-- Create policies for CRUD operations (allow anonymous access)
CREATE POLICY "Allow anonymous insert access on opname_records" ON opname_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read access on opname_records" ON opname_records
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update access on opname_records" ON opname_records
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on opname_records" ON opname_records
  FOR DELETE USING (true);