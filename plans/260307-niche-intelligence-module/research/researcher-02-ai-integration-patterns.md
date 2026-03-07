# Research: AI Integration Patterns

## Unified Caller
- `callAI(systemPrompt, userPrompt, maxTokens, taskType)` → multi-provider
- Provider detection from model ID prefix (claude→anthropic, gpt→openai, gemini→google)
- Task types: scoring, content_brief, channel_profile, morning_brief, weekly_report

## Background Task Pattern
- `createTask({type, label, channelId?})` → returns taskId
- `updateTaskProgress(taskId, progress, detail)`
- `completeTask(taskId, detail, result)` / `failTask(taskId, error)`
- Client polls `/api/tasks/{taskId}` for status

## Channel Profile Generation (closest pattern)
- Input: {niche, targetAudience, tone}
- Calls `callAI()` → JSON parse → validate → return ChannelProfileResult
- 2 retries with exponential backoff
- Strips markdown fences from AI response
- `after()` callback for async execution (but unreliable on Vercel — use inline or relay)

## New Feature Checklist
1. Add task type to AiTaskType union
2. Create prompt builder module
3. Create generator function with retry+validation
4. Create API endpoint with BackgroundTask
5. Add to VALID_TASK_TYPES in settings
6. Vietnamese error messages throughout
