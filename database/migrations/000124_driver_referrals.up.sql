-- Driver referral attribution. Until now the driver referral code was derived
-- on the fly from the driver UUID ("DRV" + first 5 hex chars) and never stored,
-- and no join table existed — so referral counts could never move.
--
-- 1. Persist the code on drivers (backfilled with the same derivation the
--    engagement handler used, so codes already shown to drivers keep working).
-- 2. driver_referrals mirrors rider_referrals: one row per referred driver.

ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12) UNIQUE;

-- Backfill DRV + first 5 hex of the id (the code the engagement handler always
-- displayed), disambiguating collisions with a numeric suffix. Seed/test rows
-- can share a uuid prefix, and the column is UNIQUE, so a naive prefix would
-- violate the constraint — the ROW_NUMBER suffix guarantees uniqueness while
-- leaving the common (non-colliding) case identical to what was shown before.
UPDATE drivers d
SET referral_code = 'DRV' || UPPER(LEFT(REPLACE(d.id::text, '-', ''), 5))
    || CASE WHEN x.rn > 1 THEN x.rn::text ELSE '' END
FROM (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY UPPER(LEFT(REPLACE(id::text, '-', ''), 5))
               ORDER BY created_at
           ) AS rn
    FROM drivers
) x
WHERE d.id = x.id AND d.referral_code IS NULL;

CREATE TABLE IF NOT EXISTS driver_referrals (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    referred_driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    referral_code      VARCHAR(12) NOT NULL,
    -- JOINED on registration; REWARDED once a reward is actually credited.
    status             VARCHAR(20) NOT NULL DEFAULT 'JOINED'
                       CHECK (status IN ('PENDING','JOINED','REWARDED','EXPIRED')),
    reward_amount_paise BIGINT NOT NULL DEFAULT 0,
    rewarded_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- A driver can only ever be referred once.
    CONSTRAINT uq_driver_referrals_referred UNIQUE (referred_driver_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_referrals_referrer ON driver_referrals(referrer_driver_id);
