ALTER TABLE publish_tasks
    ADD COLUMN IF NOT EXISTS config JSONB;

