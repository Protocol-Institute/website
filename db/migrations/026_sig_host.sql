-- Add SIG host fields to members table
ALTER TABLE members ADD COLUMN is_sig_host INTEGER NOT NULL DEFAULT 0;
ALTER TABLE members ADD COLUMN sig_host_slugs TEXT;
