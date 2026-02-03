package com.didit.server.api.response;

import com.didit.server.data.entity.enums.IssuePriority;
import com.didit.server.data.entity.enums.IssueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AiResponse {
    private Long issueId;
    private String title;
    private String body;
    private IssueStatus status;
    private IssuePriority priority;
    private List<Long> assigneeIds;
}
