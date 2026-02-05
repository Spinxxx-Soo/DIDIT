-- 1) project_id 컬럼 추가(일단 NULL 허용으로)
ALTER TABLE meeting_summary
    ADD COLUMN project_id BIGINT NULL AFTER id;

ALTER TABLE meeting_summary
    ADD COLUMN title VARCHAR(512) NULL AFTER id;

-- 2) meeting_id NULL 허용으로 변경
ALTER TABLE meeting_summary
    MODIFY COLUMN meeting_id BIGINT NULL;

-- 3) 기존 FK(meeting) 삭제 후 ON DELETE SET NULL로 재생성
ALTER TABLE meeting_summary
DROP FOREIGN KEY fk_meeting_summary_meeting;

ALTER TABLE meeting_summary
    ADD CONSTRAINT fk_meeting_summary_meeting
        FOREIGN KEY (meeting_id) REFERENCES meetings(id)
            ON DELETE SET NULL;

-- 5) project_id NOT NULL로 변경
ALTER TABLE meeting_summary
    MODIFY COLUMN project_id BIGINT NOT NULL;

-- 6) 인덱스 및 유니크키 재구성
-- 기존 유니크키 이름이 uk_meeting_summary_meeting_version 라는 전제
ALTER TABLE meeting_summary
DROP INDEX uk_meeting_summary_meeting_version;

-- project_id 인덱스 추가
ALTER TABLE meeting_summary
    ADD KEY idx_meeting_summary_project_id (project_id);

-- 7) project FK 추가(ON DELETE CASCADE)
ALTER TABLE meeting_summary
    ADD CONSTRAINT fk_meeting_summary_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
            ON DELETE CASCADE;
