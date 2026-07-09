-- Advance-commitment flow for scheduled bookings ("Trip Planner"):
-- drivers can browse far-future scheduled orders in their city and commit
-- early, instead of waiting for the T-lead matcher lottery.
--
-- 1. scheduled_offer_declines — a driver who dismisses a scheduled offer never
--    sees it again (per-driver, per-order).
-- 2. Reminder flags on scheduled_dispatch_queue — the dispatch scheduler sends
--    T-60 / T-15 pushes to the committed driver exactly once each.

CREATE TABLE IF NOT EXISTS scheduled_offer_declines (
    order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    driver_id  UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, driver_id)
);

ALTER TABLE scheduled_dispatch_queue
    ADD COLUMN IF NOT EXISTS reminder_60_sent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS reminder_15_sent BOOLEAN NOT NULL DEFAULT FALSE;
