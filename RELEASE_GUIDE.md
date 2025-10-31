# Release Guide

## Prerequisites

### 1. Install Required Tools

```bash
npm install -g @vscode/vsce
npm install -g ovsx
```

### 2. Get Access Tokens

**VS Code Marketplace Token (VSCE_TOKEN):**
1. Go to [Azure DevOps](https://dev.azure.com/)
2. Click on your profile → Security → Personal Access Tokens
3. Create new token with:
   - Organization: `All accessible organizations`
   - Scopes: `Marketplace (Manage)`
4. Copy the token

**Open VSX Token (OVSX_TOKEN):**
1. Go to [Open VSX Registry](https://open-vsx.org/)
2. Sign in with your account
3. Go to Settings → Access Tokens
4. Generate a new token
5. Copy the token

### 3. Set Environment Variables

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export VSCE_TOKEN="your-vsce-token-here"
export OVSX_TOKEN="your-ovsx-token-here"
```

Then reload:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

## Quick Release

```bash
# For a patch release (0.3.1 -> 0.3.2)
./release.sh patch

# For a minor release (0.3.1 -> 0.4.0)
./release.sh minor

# For a major release (0.3.1 -> 1.0.0)
./release.sh major
```

## Manual Release

If you prefer to release manually:

### Step 1: Update Version

```bash
# Update version in package.json
npm version patch  # or minor, or major
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Release v0.3.2"
```

### Step 3: Package Extension

```bash
vsce package
```

### Step 4: Publish to VS Code Marketplace

```bash
vsce publish -p $VSCE_TOKEN
```

### Step 5: Publish to Open VSX

```bash
npx ovsx publish -p $OVSX_TOKEN
```

### Step 6: Create Git Tag

```bash
git tag v0.3.2
git push origin main
git push origin v0.3.2
```

### Step 7: Create GitHub Release

1. Go to: https://github.com/AnandSingh/pybricks-runner-vscode/releases/new
2. Select the tag you just created
3. Add release notes from CHANGELOG.md
4. Attach the `.vsix` file
5. Publish release

## Troubleshooting

### Error: "Authentication failed"
- Check that your tokens are valid
- Make sure tokens have correct scopes
- Try regenerating the tokens

### Error: "Version already exists"
- Update the version in package.json manually
- Make sure you haven't already published this version

### Error: "Package not found"
- Make sure `vsce package` completed successfully
- Check that the .vsix file exists

### Error: "Token expired"
- Regenerate tokens from Azure DevOps and Open VSX
- Update environment variables

## Release Checklist

- [ ] All tests passing
- [ ] Linting passing
- [ ] CHANGELOG.md updated
- [ ] README.md updated if needed
- [ ] All changes committed
- [ ] Tokens set in environment
- [ ] Run `./release.sh [patch|minor|major]`
- [ ] Verify extension published to VS Code Marketplace
- [ ] Verify extension published to Open VSX
- [ ] Create GitHub release with notes and .vsix file
- [ ] Test install from marketplace

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes, major new features
- **MINOR** (0.4.0): New features, backward compatible
- **PATCH** (0.3.2): Bug fixes, backward compatible
