-- Create the processing_steps table
CREATE TABLE IF NOT EXISTS processing_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('Drying', 'Grinding', 'Storage')),
  temperature NUMERIC,
  humidity NUMERIC,
  facility_id TEXT,
  status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE processing_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for processing_steps
CREATE POLICY "Processing steps are viewable by everyone" ON processing_steps
  FOR SELECT USING (true);

CREATE POLICY "Users can insert processing steps" ON processing_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own processing steps" ON processing_steps
  FOR UPDATE USING (auth.uid() IS NOT NULL);
