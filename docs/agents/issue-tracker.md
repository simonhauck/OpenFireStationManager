
# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues at `simonhauck/OpenFireStationManager`. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Create a sub-issue**: `gh issue create --parent <number> --title "..." --body "..."`. To link an existing issue afterwards: `gh issue edit <child> --parent <number>` (or `gh issue edit <parent> --add-sub-issue <child>`).
- **Link a blocking edge**: `gh issue create --blocked-by <number>,<number>` or `gh issue edit <issue> --add-blocked-by <number>`. Prefer these native links over a `Blocked by` line in the body.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. If the skill is breaking an existing issue (a spec) into tickets, create every ticket with `--parent <spec-number>` so the spec becomes their parent. Never close or modify the spec.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
