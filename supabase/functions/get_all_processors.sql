
-- Create a function to get all processors (employee/admin) who have processed requests
CREATE OR REPLACE FUNCTION public.get_all_processors()
RETURNS TABLE(id uuid, name text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id,
    u.raw_user_meta_data->>'name' as name
  FROM
    requests r
  JOIN
    auth.users u ON r.processed_by = u.id
  WHERE
    r.processed_by IS NOT NULL;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_all_processors() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_processors() TO anon;
