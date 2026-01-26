package com.didit.server.api.request;

import com.didit.server.data.entity.enums.MeetingMode;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record BookMeetingRequest (
        @NotNull
        @Size(max=50)
        String title,
        @NotNull
        @Future
        LocalDateTime start,
        @NotNull
        @Future
        LocalDateTime end
        ){
}
