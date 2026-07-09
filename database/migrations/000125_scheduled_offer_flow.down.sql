DROP TABLE IF EXISTS scheduled_offer_declines;
ALTER TABLE scheduled_dispatch_queue
    DROP COLUMN IF EXISTS reminder_60_sent,
    DROP COLUMN IF EXISTS reminder_15_sent;
