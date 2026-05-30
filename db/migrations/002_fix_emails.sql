-- Migration 002: update real member emails to confirmed addresses;
--                set owner_email for AI/bot members

-- Real people: update to confirmed emails
UPDATE members SET email = 'hi@timbeiko.com'     WHERE email = 'tim@protocol-institute.org';
UPDATE members SET email = 'rafaeldf2@gmail.com' WHERE email = 'rafa@protocol-institute.org';
UPDATE members SET email = 'sachben91@gmail.com' WHERE email = 'sachin@placeholder.tld';

-- Auth_pins: cascade email updates if any PINs exist
UPDATE auth_pins SET email = 'hi@timbeiko.com'     WHERE email = 'tim@protocol-institute.org';
UPDATE auth_pins SET email = 'rafaeldf2@gmail.com' WHERE email = 'rafa@protocol-institute.org';
UPDATE auth_pins SET email = 'sachben91@gmail.com' WHERE email = 'sachin@placeholder.tld';

-- AI/bot members: set owner_email so Venkat can manage them
UPDATE members SET owner_email = 'venkat@protocol-institute.org' WHERE type = 'ai';
