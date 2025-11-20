-- Add INSERT policy for assets table to allow anonymous uploads
CREATE POLICY "Allow anonymous insert access on assets" ON assets
  FOR INSERT WITH CHECK (true);

-- Also add UPDATE and DELETE policies for consistency
CREATE POLICY "Allow anonymous update access on assets" ON assets
  FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous delete access on assets" ON assets
  FOR DELETE USING (true);