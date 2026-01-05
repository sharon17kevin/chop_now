-- Create search analytics table
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_count 
ON public.search_analytics(search_count DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query 
ON public.search_analytics(search_query);

-- RPC function to increment search count
CREATE OR REPLACE FUNCTION increment_search_count(p_search_query TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.search_analytics (search_query, search_count, last_searched_at)
  VALUES (LOWER(TRIM(p_search_query)), 1, NOW())
  ON CONFLICT (search_query) 
  DO UPDATE SET 
    search_count = search_analytics.search_count + 1,
    last_searched_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read popular searches
CREATE POLICY "Anyone can read search analytics"
ON public.search_analytics FOR SELECT
TO public
USING (true);
