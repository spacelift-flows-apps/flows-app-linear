# Linear Integration (Flows App)

A Flows app that integrates with [Linear](https://linear.app) for issue management and workflow automation.

## Configuration

### API Key

A Linear personal API key is required.

1. Go to **Linear Settings > Account > API > Personal API keys**
2. Create a new API key
3. Paste the key when installing the app in Flows

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
