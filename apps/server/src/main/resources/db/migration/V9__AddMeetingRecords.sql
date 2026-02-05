-- Vxx__create_meeting_records.sql
-- meeting_records: 회의 녹화(레코딩) 기록

CREATE TABLE meeting_records (
                                 id BIGINT NOT NULL AUTO_INCREMENT,

                                 meeting_id BIGINT NOT NULL,
                                 created_by BIGINT NOT NULL,

                                 start_at DATETIME NULL,
                                 end_at DATETIME NULL,

                                 recording_session_id VARCHAR(512) NULL,
                                 recording_name VARCHAR(512) NOT NULL,

                                 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 PRIMARY KEY (id),

    -- recording_session_id는 (NULL은 여러개 허용), 값이 있을 때는 중복 방지
                                 CONSTRAINT uk_meeting_records_recording_session_id
                                     UNIQUE (recording_session_id),

                                 CONSTRAINT fk_meeting_records_meeting
                                     FOREIGN KEY (meeting_id) REFERENCES meetings (id)
                                         ON DELETE CASCADE
                                         ON UPDATE RESTRICT,

                                 CONSTRAINT fk_meeting_records_creator
                                     FOREIGN KEY (created_by) REFERENCES users (id)
                                         ON DELETE RESTRICT
                                         ON UPDATE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX idx_meeting_records_meeting_id
    ON meeting_records (meeting_id);

CREATE INDEX idx_meeting_records_created_by
    ON meeting_records (created_by);

CREATE INDEX idx_meeting_records_created_at
    ON meeting_records (created_at);
