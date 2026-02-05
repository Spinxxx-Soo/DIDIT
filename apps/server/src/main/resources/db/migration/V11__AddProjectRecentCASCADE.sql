-- 1) 기존 FK 제거
ALTER TABLE project_recents
DROP FOREIGN KEY fk_project_recents_user_id;

ALTER TABLE project_recents
DROP FOREIGN KEY fk_project_recents_project_id;

-- 2) CASCADE 옵션으로 FK 재생성
ALTER TABLE project_recents
    ADD CONSTRAINT fk_project_recents_user_id
        FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE;

ALTER TABLE project_recents
    ADD CONSTRAINT fk_project_recents_project_id
        FOREIGN KEY (project_id)
            REFERENCES projects (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE;