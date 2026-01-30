ALTER TABLE meeting_users
    ADD COLUMN token VARCHAR(512) NULL AFTER user_id;

CREATE INDEX idx_meeting_users_token
    ON meeting_users (token);
