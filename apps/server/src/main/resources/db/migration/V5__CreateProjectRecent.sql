CREATE TABLE project_recents (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 user_id BIGINT NOT NULL,
                                 project_id BIGINT NOT NULL,
                                 last_viewed_at DATETIME(6) NOT NULL,
                                 CONSTRAINT uk_project_recents_user_project UNIQUE (user_id, project_id),
                                 CONSTRAINT fk_project_recents_user_id FOREIGN KEY (user_id) REFERENCES users (id),
                                 CONSTRAINT fk_project_recents_project_id FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE INDEX idx_project_recents_user_id ON project_recents (user_id);
CREATE INDEX idx_project_recents_last_viewed_at ON project_recents (last_viewed_at);