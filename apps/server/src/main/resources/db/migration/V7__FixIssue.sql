ALTER TABLE issues
    MODIFY COLUMN github_issue_id BIGINT NULL,
    # ,때문에 버그나옴
    MODIFY COLUMN issue_no INT NULL
