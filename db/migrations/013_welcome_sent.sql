-- Track whether welcome email was successfully sent after approval.
-- welcome_sent = 0 means email not yet confirmed sent; startup script flags these.
ALTER TABLE members ADD COLUMN welcome_sent INTEGER DEFAULT 0;
