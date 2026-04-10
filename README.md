# Linear Integration (Flows App)

A Flows app that integrates with [Linear](https://linear.app) for issue
management and workflow automation.

## Configuration

### API Key (required)

A Linear personal API key is required.

1. Go to **Linear Settings > Account > API > Personal API keys**
2. Create a new API key
3. Paste the key when installing the app in Flows

### Team Key (optional)

Scope webhooks to a specific Linear team by providing its key (e.g. `ENG`). The
team key is visible in Linear next to the team name in the sidebar. If left
empty, the app receives events from all public teams.

## Blocks

### Run GraphQL Query

Execute any GraphQL query or mutation against the Linear API. This is an
escape-hatch block for operations not covered by specific blocks.

### Linear Webhook Event

Entrypoint block that receives any webhook event from Linear. Use this to
trigger flows based on Linear activity.

**Optional filters:**

- **Resource Type** — restrict to a specific resource type (e.g. `Issue`,
  `Comment`, `Project`, `Cycle`, `IssueLabel`, `Reaction`, `ProjectUpdate`).
  Available as a dropdown.
- **Action** — restrict to a specific action (`create`, `update`, `remove`).
  Available as a dropdown.

If no filters are set, all webhook events are emitted.

## Webhook Management

Webhooks are managed automatically — no manual setup needed.

- The app registers a webhook in Linear on install (subscribing to all
  supported resource types) and cleans it up on uninstall.
- If webhook events stop arriving, trigger a **re-sync** from the Flows UI. The
  app will detect and fix the issue (re-create if deleted, re-enable if
  disabled, update URL if changed).
- The webhook URL and status are visible as app signals in the flow editor.

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
npm install
```

### Available Scripts

```bash
npm run typecheck    # Type checking
npm run format       # Code formatting
npm run bundle       # Create deployment bundle
```

## Releasing

Follow [Semantic Versioning](https://semver.org/). Tag-based releases:

```bash
git tag v1.0.0
git push origin v1.0.0
```

CI automatically creates the release and updates the version registry.
