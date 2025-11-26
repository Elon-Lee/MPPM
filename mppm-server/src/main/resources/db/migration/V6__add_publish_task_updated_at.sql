ALTER TABLE publish_tasks
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

