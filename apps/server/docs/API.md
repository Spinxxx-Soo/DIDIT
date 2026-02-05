# Didit Server API (v1)

Base path: `/api/v1` (default port: `8080`)

## Authentication

This server uses Spring Security OAuth2 (GitHub) with a session cookie (`JSESSIONID`).

- `GET /api/v1/auth/login`: Redirects to GitHub OAuth authorization (`/oauth2/authorization/github`).
- `POST /api/v1/auth/logout`: Invalidates session and clears `JSESSIONID` cookie.
- `GET /api/v1/auth/me`: Returns the authenticated user (`UserResponse`).

All endpoints are authenticated by default, except:
- `/`
- `/openapi.yaml`
- `/swagger-ui.html`
- `/swagger-ui/**`
- `/v3/api-docs/swagger-config`
- `/api/v1/auth/login`
- `/api/v1/auth/logout`
- `/login/**`
- `/oauth2/**`
- `/error`
- `/api/v1/webhooks/openvidu`

## Conventions

- Request/response body: JSON (unless noted).
- Timestamps: ISO-8601 `LocalDateTime` (e.g. `2026-01-26T14:30:00`).
- Pagination: Spring `Pageable` params (`page`, `size`, `sort`).
- Cursor: Some endpoints accept `lastId` or `cursor` as the last item id from the previous page.

### Enums

- `MeetingMode`: `CHAT | VOICE`
- `MeetingStatus`: `SCHEDULED | RUNNING | ENDED`
- `IssueStatus`: `OPEN | CLOSED`
- `IssuePriority`: `HIGH | MEDIUM | LOW`
- `MessageType`: `TEXT | SYSTEM`

### Error response

Most endpoints return an error body via `ErrorResponse`:

```json
{
  "StatusCode": "NOT_FOUND",
  "Message": "..."
}
```

HTTP status is also set to the matching status code.

## Schemas (response)

### ProjectResponse

```json
{
  "id": 1,
  "name": "my-project",
  "ownerId": 10,
  "repoId": 123456,
  "repoFullName": "org/repo",
  "thumbnailUrl": "https://...",
  "createdAt": "2026-01-26T14:30:00",
  "updatedAt": "2026-01-26T14:30:00"
}
```

### UserResponse

```json
{
  "id": 10,
  "githubId": 999999,
  "githubLogin": "octocat",
  "name": "Octo Cat",
  "avatarUrl": "https://...",
  "createdAt": "2026-01-26T14:30:00",
  "lastLoginAt": "2026-01-26T14:30:00"
}
```

### MeetingResponse

```json
{
  "id": 100,
  "project": { "id": 1, "name": "my-project", "ownerId": 10, "repoId": 123456, "repoFullName": "org/repo", "thumbnailUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "updatedAt": "2026-01-26T14:30:00" },
  "createdBy": { "id": 10, "githubId": 999999, "githubLogin": "octocat", "name": "Octo Cat", "avatarUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "lastLoginAt": "2026-01-26T14:30:00" },
  "sessionId": "uuid-string",
  "title": "Daily",
  "status": "SCHEDULED",
  "mode": "VOICE",
  "startedAt": "2026-01-26T14:30:00",
  "endedAt": "2026-01-26T15:00:00",
  "createdAt": "2026-01-26T14:30:00",
  "updatedAt": "2026-01-26T14:30:00"
}
```

### IssueResponse

```json
{
  "id": 500,
  "project": { "id": 1, "name": "my-project", "ownerId": 10, "repoId": 123456, "repoFullName": "org/repo", "thumbnailUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "updatedAt": "2026-01-26T14:30:00" },
  "githubIssueId": 123456789,
  "issueNo": 42,
  "title": "Fix bug",
  "body": "...",
  "status": "OPEN",
  "priority": "MEDIUM",
  "author": { "id": 10, "githubId": 999999, "githubLogin": "octocat", "name": "Octo Cat", "avatarUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "lastLoginAt": "2026-01-26T14:30:00" },
  "createdAt": "2026-01-26T14:30:00",
  "updatedAt": "2026-01-26T14:30:00",
  "closedAt": null,
  "assignees": []
}
```

### ProjectRecentResponse

```json
{
  "id": 1,
  "user": { "id": 10, "githubId": 999999, "githubLogin": "octocat", "name": "Octo Cat", "avatarUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "lastLoginAt": "2026-01-26T14:30:00" },
  "project": { "id": 1, "name": "my-project", "ownerId": 10, "repoId": 123456, "repoFullName": "org/repo", "thumbnailUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "updatedAt": "2026-01-26T14:30:00" },
  "lastViewedAt": "2026-01-26T14:30:00"
}
```

### ChatResponse

```json
{
  "id": 1000,
  "userId": 10,
  "messageType": "TEXT",
  "message": "Hello",
  "createdAt": "2026-01-26T14:30:00",
  "editedAt": null
}
```

### AiResponse

```json
{
  "issueId": 100,
  "title": "Fix bug",
  "body": "...",
  "status": "OPEN",
  "priority": "MEDIUM",
  "assigneeIds": [10, 11]
}
```

### GithubRepoResponse

```json
{
  "repoId": 123456,
  "repoName": "org/repo"
}
```

## Endpoints

### Auth

#### `GET /api/v1/auth/login`

Redirects to GitHub OAuth login flow.

Response:
- `302 Found` with `Location: /oauth2/authorization/github`

#### `POST /api/v1/auth/logout`

Logs out (invalidates session; clears `JSESSIONID`).

Response:
- `200 OK` (empty body)

#### `GET /api/v1/auth/me`

Returns the current authenticated user.

Response:
- `200 OK` -> `UserResponse`
- `401 Unauthorized` if not logged in

### Projects

#### `GET /api/v1/projects`

List projects for the authenticated user.

Response:
- `200 OK` -> `ProjectResponse[]`

#### `POST /api/v1/projects`

Create a project and register the creator as `ADMIN`.

Request body:

```json
{
  "projectName": "my-project",
  "githubUrl": "https://github.com/org/repo"
}
```

Notes:
- Validation: `projectName` max 64, `githubUrl` must be a valid URL.

Response:
- `200 OK` (empty body)

#### `GET /api/v1/projects/{projectId}`

Get project details (also updates recent view for the authenticated user).

Response:
- `200 OK` -> `ProjectResponse`

#### `GET /api/v1/projects/recents`

Get up to 4 recently viewed projects for the authenticated user.

Response:
- `200 OK` -> `ProjectRecentResponse[]`

#### `GET /api/v1/projects/{projectId}/participants`

Get project participants.

Response:
- `200 OK` -> `UserResponse[]`

#### `DELETE /api/v1/projects/{projectId}`

Delete a project (owner only).

Response:
- `200 OK` (empty body)

#### `DELETE /api/v1/projects/{projectId}/leave`

Leave a project.

Response:
- `200 OK` (empty body)

#### `DELETE /api/v1/projects/{projectId}/participants/{userId}`

Remove a participant from a project (owner only).

Response:
- `200 OK` (empty body)

#### `POST /api/v1/projects/{projectId}/github/validate`

Validate a GitHub repository for a project.

Request body:

```json
{
  "orgName": "org",
  "repoName": "repo"
}
```

Response:
- `200 OK` -> `GithubRepoResponse`

#### `PATCH /api/v1/projects/{projectId}`

Update project repository info.

Request body:

```json
{
  "repoId": 123456,
  "repoFullName": "org/repo"
}
```

Response:
- `200 OK` (empty body)

#### `PATCH /api/v1/projects/{projectId}/owner`

Transfer project ownership.

Request body:

```json
{
  "newOwnerId": 99
}
```

Response:
- `200 OK` (empty body)

#### `PATCH /api/v1/projects/{projectId}/name`

Update project name.

Request body:

```json
{
  "name": "new-project-name"
}
```

Notes:
- Validation: `name` is required and max 100 chars.

Response:
- `200 OK` (empty body)

### Invites

#### `POST /api/v1/projects/invites`

Create an invite code for a project (admin only).

Request body:

```json
{
  "projectId": 1,
  "expireDate": "2026-01-26T14:30:00"
}
```

Notes:
- `expireDate` is optional; if omitted the server sets it far in the future.

Response:
- `200 OK` -> invite code (UUID)

```json
"3fa85f64-5717-4562-b3fc-2c963f66afa6"
```

#### `GET /api/v1/projects/invites/{inviteCode}`

Get a project by invite code.

Response:
- `200 OK` -> `ProjectResponse`
- `400 Bad Request` if `inviteCode` is not a UUID

#### `POST /api/v1/projects/invites/{inviteCode}`

Join a project using an invite code.

Response:
- `200 OK` (empty body)
- `400 Bad Request` if `inviteCode` is not a UUID

### Meetings (Channels)

#### `POST /api/v1/projects/{projectId}/add-channel`

Create a meeting (channel) in the project (admin only). The meeting is created with status `RUNNING`.

Request body:

```json
{
  "title": "Daily",
  "mode": "VOICE"
}
```

Response:
- `200 OK` -> created meeting id

```json
123
```

#### `POST /api/v1/projects/{projectId}/book-channel`

Reserve a meeting (channel) in the project (admin only). The meeting is created with status `SCHEDULED` and mode `VOICE`.

Request body:

```json
{
  "title": "Planning",
  "start": "2026-01-26T14:30:00",
  "end": "2026-01-26T15:30:00"
}
```

Notes:
- Validation: `title` max 50, `start`/`end` must be in the future.
- The server rejects requests when `start` is after `end`.

Response:
- `200 OK` -> created meeting id

```json
456
```

#### `GET /api/v1/projects/{projectId}/channels`

List meetings (channels) in a project.

Query params:
- `status` (optional): `SCHEDULED | RUNNING | ENDED`
- `cursor` (recommended): last item id from the previous page; use `0` for the first page
- `page`, `size`, `sort`: Spring `Pageable` params (`size` default: `20`)

Response:
- `200 OK` -> `MeetingResponse[]` (ordered by `id` descending)

#### `GET /api/v1/projects/{projectId}/channels/date`

List meetings in a project within a time range.

Query params (required):
- `start` (ISO-8601 `LocalDateTime`)
- `end` (ISO-8601 `LocalDateTime`)

Response:
- `200 OK` -> `MeetingResponse[]` (ordered by `id` descending)

#### `GET /api/v1/channels/{channelId}`

Get meeting details.

Response:
- `200 OK` -> `MeetingResponse`

#### `PATCH /api/v1/channels/{channelId}`

Update meeting title and/or time range.

Query params (all optional):
- `title` (string)
- `start` (ISO-8601 `LocalDateTime`)
- `due` (ISO-8601 `LocalDateTime`, end time)

Response:
- `200 OK` (empty body)

#### `DELETE /api/v1/channels/{channelId}`

Delete a meeting.

Response:
- `200 OK` (empty body)

#### `POST /api/v1/channels/{channelId}/webrtc`

Join a VOICE meeting (creates a media connection and marks the user as joined).

Response:
- `200 OK` -> connection token (string)
- `409 Conflict` if the meeting mode is not `VOICE`

#### `DELETE /api/v1/channels/{channelId}/webrtc`

Leave a VOICE meeting (closes the media connection and marks the user as left).

Response:
- `200 OK` (empty body)
- `409 Conflict` if the meeting mode is not `VOICE`

#### `GET /api/v1/channels/{channelId}/webrtc/users`

List users connected to a VOICE meeting.

Response:
- `200 OK` -> `UserResponse[]`
- `409 Conflict` if the meeting mode is not `VOICE`

#### `POST /api/v1/channels/{channelId}/recording/start`

Start a recording for a VOICE meeting.

Response:
- `200 OK` -> recording id (long)

```json
789
```

#### `POST /api/v1/channels/{channelId}/recording/stop/{recordId}`

Stop a recording for a VOICE meeting.

Response:
- `200 OK` (empty body)

### Chat Messages

#### `POST /api/v1/channels/{channelId}/chats`

Send a chat message to a channel.

Request body:

```json
{
  "content": "Hello"
}
```

Response:
- `200 OK` (empty body)

#### `GET /api/v1/channels/{channelId}/chats`

List chat messages in a channel.

Query params:
- `lastId` (optional): last chat id from the previous page
- `page`, `size`, `sort`: Spring `Pageable` params (`size` default: `20`)

Response:
- `200 OK` -> `ChatResponse[]` (ordered by `id` ascending)

#### `PATCH /api/v1/channels/chats/{chatId}`

Update a chat message (only the author can update).

Request body:

```json
{
  "content": "Edited message"
}
```

Response:
- `200 OK` (empty body)

#### `DELETE /api/v1/channels/chats/{chatId}`

Delete a chat message (only the author can delete).

Response:
- `200 OK` (empty body)

### SSE (Server-Sent Events)

#### `GET /api/v1/channels/{channelId}/stream`

Subscribes to real-time events for a channel. The user must be a member of the channel's project.

Response:
- `200 OK` with `Content-Type: text/event-stream`
- `403 Forbidden` if the user is not a member

Emitter behavior:
- Timeout: 30 minutes (clients should reconnect).
- Keep-alive: `ping` event every 20 seconds.

Events:
- `message`: new chat message.
- `chat_update`: chat message updated.
- `chat_delete`: chat message deleted.
- `media_participant_joined`
- `media_participant_left`
- `media_recording_start`
- `media_recording_stop`
- `media_error`
- `ping`

Event payloads:

`message` data:

```json
{
  "channelId": 1,
  "senderId": 10,
  "content": "Hello",
  "sentAtEpochMs": 1738209000000
}
```

`chat_update` data:

```json
{
  "chatId": 1000,
  "content": "Edited message",
  "editedAt": "2026-01-26T14:30:00"
}
```

`chat_delete` data:

```json
{
  "chatId": 1000,
  "content": "Original message"
}
```

`media_participant_joined` data:

```json
{
  "channelId": 1,
  "timestamp": "2026-01-26T14:30:00",
  "sessionId": "session-id",
  "connectionId": "connection-id",
  "user": { "id": 10, "githubId": 999999, "githubLogin": "octocat", "name": "Octo Cat", "avatarUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "lastLoginAt": "2026-01-26T14:30:00" }
}
```

`media_participant_left` data:

```json
{
  "channelId": 1,
  "timestamp": "2026-01-26T14:30:00",
  "sessionId": "session-id",
  "connectionId": "connection-id",
  "user": { "id": 10, "githubId": 999999, "githubLogin": "octocat", "name": "Octo Cat", "avatarUrl": "https://...", "createdAt": "2026-01-26T14:30:00", "lastLoginAt": "2026-01-26T14:30:00" }
}
```

`media_recording_start` data:

```json
{
  "channelId": 1,
  "timestamp": "2026-01-26T14:30:00",
  "sessionId": "session-id"
}
```

`media_recording_stop` data:

```json
{
  "channelId": 1,
  "timestamp": "2026-01-26T14:30:00",
  "sessionId": "session-id"
}
```

`media_error` data:

```json
{
  "channelId": 1,
  "errorResponse": { "StatusCode": "INTERNAL_SERVER_ERROR", "Message": "..." }
}
```

Notes:
- `chat_update` and `chat_delete` are currently broadcast using `projectId` as the channel id. Clients that need those updates should also subscribe to `/api/v1/channels/{projectId}/stream`.

#### `GET /api/v1/projects/{projectId}/stream`

Subscribes to project-level events. The user must be a project member.

Response:
- `200 OK` with `Content-Type: text/event-stream`
- `403 Forbidden` if the user is not a member

Emitter behavior:
- Timeout: 30 minutes (clients should reconnect).
- Keep-alive: `ping` event every 20 seconds.

Events:
- `ai_sort_result`: ordered issue ids after AI sorting.
- `ping`

`ai_sort_result` data:

```json
[100, 101, 102]
```

Notes:
- `GET /api/v1/projects/{projectId}/issues/active` enqueues a sort job and triggers `ai_sort_result` when the async result arrives.

### Issues

#### `GET /api/v1/projects/{projectId}/issues/active`

Get up to 5 active (OPEN) issues in a project, ordered by `updatedAt` desc.

Response:
- `200 OK` -> `IssueResponse[]`

Notes:
- Also enqueues an AI sort job for these issues.

#### `GET /api/v1/projects/{projectId}/issues`

Get all issues in a project.

Response:
- `200 OK` -> `IssueResponse[]`

#### `POST /api/v1/projects/{projectId}/issue/analyze`

Analyze issue priority (creates a draft issue and enqueues AI analysis).

Request body:

```json
{
  "title": "Fix bug",
  "body": "Steps to reproduce...",
  "status": "OPEN",
  "assigneeIds": [10, 11]
}
```

Response:
- `200 OK` -> `AiResponse`

#### `POST /api/v1/projects/{projectId}/issues`

Create a GitHub issue from a draft issue (created by analyze).

Request body:

```json
{
  "orgName": "org",
  "repoName": "repo",
  "issueId": 100,
  "issueStatus": "OPEN",
  "issuePriority": "HIGH",
  "title": "Fix bug",
  "body": "Steps to reproduce...",
  "assigneeIds": [10, 11]
}
```

Notes:
- `issueId` must refer to an existing draft issue created by the same author.
- `issueStatus` is accepted but currently not used by the server.

Response:
- `200 OK` -> `IssueResponse[]` (0 or 1 item)

#### `PATCH /api/v1/projects/{projectId}/issues/{issueId}`

Update an issue (author only).

Request body:

```json
{
  "title": "Updated title",
  "body": "Updated body",
  "assigneeIds": [10]
}
```

Response:
- `200 OK` (empty body)

#### `DELETE /api/v1/projects/{projectId}/issues/{issueId}`

Delete an issue (author only).

Response:
- `200 OK` (empty body)

### Webhooks

#### `POST /api/v1/webhooks/openvidu`

OpenVidu server webhook endpoint.

Headers:
- `X-OpenVidu-Token`: optional shared secret (configured server-side)

Request body:
- OpenVidu webhook JSON payload (event name in `event` field).

Response:
- `200 OK` on success or even if payload parsing fails
- `401 Unauthorized` if `X-OpenVidu-Token` is configured and does not match
