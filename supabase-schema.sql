-- ============================================================
-- GolfGives — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── subscriptions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'inactive'
                           CHECK (status IN ('active','inactive','cancelled','past_due')),
  amount                 INTEGER DEFAULT 999,  -- in pence
  currency               TEXT DEFAULT 'gbp',
  started_at             TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── charities ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charities (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  website          TEXT,
  emoji            TEXT DEFAULT '🏥',
  is_active        BOOLEAN DEFAULT TRUE,
  supporters_count INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── charity_selections ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charity_selections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Keep supporters_count up to date
CREATE OR REPLACE FUNCTION update_charity_supporters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE charities SET supporters_count = supporters_count + 1 WHERE id = NEW.charity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE charities SET supporters_count = GREATEST(0, supporters_count - 1) WHERE id = OLD.charity_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.charity_id <> NEW.charity_id THEN
    UPDATE charities SET supporters_count = GREATEST(0, supporters_count - 1) WHERE id = OLD.charity_id;
    UPDATE charities SET supporters_count = supporters_count + 1 WHERE id = NEW.charity_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_charity_selection_change ON charity_selections;
CREATE TRIGGER on_charity_selection_change
  AFTER INSERT OR UPDATE OR DELETE ON charity_selections
  FOR EACH ROW EXECUTE FUNCTION update_charity_supporters();

-- ── scores ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  score       INTEGER NOT NULL CHECK (score >= 0 AND score <= 50),
  played_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Max 5 scores per user per month
CREATE OR REPLACE FUNCTION check_monthly_score_limit()
RETURNS TRIGGER AS $$
DECLARE
  count_this_month INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_this_month
  FROM scores
  WHERE user_id = NEW.user_id
    AND DATE_TRUNC('month', played_at) = DATE_TRUNC('month', NEW.played_at::TIMESTAMPTZ);

  IF count_this_month >= 5 THEN
    RAISE EXCEPTION 'Monthly score limit of 5 reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_monthly_score_limit ON scores;
CREATE TRIGGER enforce_monthly_score_limit
  BEFORE INSERT ON scores
  FOR EACH ROW EXECUTE FUNCTION check_monthly_score_limit();

-- ── draws ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draws (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  draw_date       DATE NOT NULL,
  prize_pool      NUMERIC(10, 2) DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','completed','cancelled')),
  winning_numbers INTEGER[],
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── draw_entries ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id        UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_numbers  INTEGER[],
  prize_won      NUMERIC(10, 2),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ── draw_winners ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS draw_winners (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id      UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prize_tier   TEXT NOT NULL CHECK (prize_tier IN ('jackpot','four_match','three_match')),
  prize_amount NUMERIC(10, 2) NOT NULL,
  match_count  INTEGER DEFAULT 0,
  verified     BOOLEAN DEFAULT FALSE,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws              ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_winners       ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- subscriptions
CREATE POLICY "Users view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subs"   ON subscriptions FOR ALL USING (TRUE); -- backend service role

-- charities (public read)
CREATE POLICY "Anyone can view active charities" ON charities FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage charities"          ON charities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- charity_selections
CREATE POLICY "Users manage own selection" ON charity_selections FOR ALL USING (auth.uid() = user_id);

-- scores
CREATE POLICY "Users manage own scores" ON scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all scores"  ON scores FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draws (public read)
CREATE POLICY "Anyone can view draws"  ON draws FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage draws"    ON draws FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draw_entries
CREATE POLICY "Users view own entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all entries" ON draw_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draw_winners
CREATE POLICY "Anyone can view winners" ON draw_winners FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage winners"   ON draw_winners FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- Seed: Sample charities
-- ============================================================

INSERT INTO charities (name, description, category, website, emoji) VALUES
  ('Cancer Research UK',   'Fighting cancer through pioneering research to help people live longer, better lives.',       'Health',    'https://www.cancerresearchuk.org', '🎗️'),
  ('Mind',                 'Mental health charity providing support and resources to people experiencing mental illness.', 'Mental Health', 'https://www.mind.org.uk', '🧠'),
  ('WWF UK',               'Leading environmental charity working to protect the natural world for future generations.',   'Environment', 'https://www.wwf.org.uk', '🐼'),
  ('Alzheimer''s Society', 'Dementia charity providing support, care and research for those affected by dementia.',        'Health',    'https://www.alzheimers.org.uk', '💜'),
  ('Shelter',              'Fighting for people''s right to a safe home — helping millions with housing issues each year.','Housing',   'https://www.shelter.org.uk', '🏠'),
  ('British Red Cross',    'Helping people in crisis, whoever and wherever they are, at home or overseas.',                'Emergency', 'https://www.redcross.org.uk', '🔴')
ON CONFLICT DO NOTHING;
