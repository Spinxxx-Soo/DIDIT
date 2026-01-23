package com.didit.server.api.request;

import com.didit.server.data.entity.enums.MeetingMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.Length;

public record CreateMeetingRequest (
        @NotNull
        @Size(max=50)
        String title,
        @NotNull
        MeetingMode mode){
}
