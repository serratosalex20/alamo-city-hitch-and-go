# CLAUDE.md

## Core Principles
- Simplicity first. No laziness. Senior developer standards.
- Every output gets judged against these three rules.
- If the solution is complex, simplify. If the code is sloppy, rewrite. If a senior dev wouldn't approve, it's not done.

## Planning Rules
- Enter plan mode for any 3+ step task.
- Outline every step before writing code.
- Wait for approval before implementation.

## Subagent Rules
- Use subagents to keep the main context window clean.
- Offload research, exploration, and parallel tasks.
- Reserve the main thread for decisions and implementation.

## Bug Fixing Rules
- When given a bug: just fix it. No hand-holding.
- Read logs, find the error, trace root cause, resolve.
- Only ask clarifying questions if you genuinely cannot determine the issue.

## Task Management Rules
- Write plan to tasks/todo.md before any implementation.
- Check in before building, mark items done as you go.
- Never start a new task without updating the task file.

## Verification Rules
- Never mark done without proving it works.
- Run tests, check logs, diff changes before reporting completion.
- Ask: 'Would a staff engineer approve this?'

## Learning Rules
- After any correction, update tasks/lessons.md.
- Review lessons.md at the start of every session.
- Never repeat a documented mistake.
