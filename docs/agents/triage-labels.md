# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker (GitHub).

| Label in mattpocock/skills | Label in our tracker |                 Meaning                  |
|----------------------------|----------------------|------------------------------------------|
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Note on label creation

Of these labels, only `wontfix` currently exists in the GitHub repo (it's a GitHub default). The other four (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`) will need to be created the first time the `triage` skill applies them — either ahead of time via `gh label create <name>` or on demand.
