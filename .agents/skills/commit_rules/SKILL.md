---
name: Commit Message Rules
description: Guidelines for generating git commit messages based on specific project rules.
---

# Commit Message Rules

This skill provides the structure and rules for generating git commit messages.

## 1. Summary Rules
- summarize only the work done since the previous commit.
- Provide the message inside a code block.
- **NEVER** include file paths or URLs.
- Generate messages per project.
- **DO NOT** use bold text in the commit message.

## 2. Commit Message Types
| Type | Description | Example |
| :--- | :--- | :--- |
| `feat` | New feature addition | `feat: 로그인 API 개발` |
| `fix` | Bug fix | `fix: DB 연결 이슈 해결` |
| `docs` | Documentation update | `docs: README 업데이트` |
| `style` | Code formatting, missing semicolons, etc. (no logic change) | `style: Lint 수정 및 코드 포맷팅 적용` |
| `refactor` | Code refactoring (no functional change) | `refactor: 유효성 검사 로직 개선` |
| `test` | Add/update test code | `test: 사용자 서비스 단위 TEST` |
| `chore` | Build, package, configuration | `chore: 라이브러리 버전 업데이트` |
