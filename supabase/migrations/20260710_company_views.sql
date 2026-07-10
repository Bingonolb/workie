-- Company page views tracking
CREATE TABLE IF NOT EXISTS public.company_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_views_company   ON public.company_views(company_id);
CREATE INDEX IF NOT EXISTS idx_company_views_viewed_at ON public.company_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_company_views_company_date
  ON public.company_views(company_id, viewed_at);

ALTER TABLE public.company_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (anon or logged in)
CREATE POLICY "anyone_insert_views" ON public.company_views
  FOR INSERT WITH CHECK (true);

-- Business can read views for their own company
CREATE POLICY "business_read_own_views" ON public.company_views
  FOR SELECT USING (
    company_id IN (
      SELECT claimed_company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admins can read all
CREATE POLICY "admins_read_all_views" ON public.company_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
