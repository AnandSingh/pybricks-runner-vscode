# Quick Release Reference

## Setup (One-Time)

```bash
# 1. Install tools
npm install -g @vscode/vsce ovsx

# 2. Set tokens (add to ~/.bashrc or ~/.zshrc)
export VSCE_TOKEN="your-vsce-token-here"
export OVSX_TOKEN="your-ovsx-token-here"

# 3. Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

## Release Command

```bash
# Patch release (0.3.2 -> 0.3.3)
./release.sh patch

# Minor release (0.3.2 -> 0.4.0)
./release.sh minor

# Major release (0.3.2 -> 1.0.0)
./release.sh major
```

## What the Script Does

1. ✅ Checks if tokens are set
2. ✅ Prompts to commit any uncommitted changes
3. ✅ Cleans up old .vsix files
4. ✅ Runs linter
5. ✅ Publishes to VS Code Marketplace
6. ✅ Publishes to Open VSX Registry
7. ✅ Creates git tag
8. ✅ Pushes to remote
9. ✅ Shows next steps for GitHub release

## After Running Script

1. Go to: https://github.com/AnandSingh/pybricks-runner-vscode/releases/new
2. Select the new tag
3. Copy release notes from CHANGELOG.md
4. Attach the generated .vsix file
5. Publish release

## Manual Commands (If Script Fails)

```bash
# Package only
vsce package

# Publish to VS Code Marketplace
vsce publish patch -p $VSCE_TOKEN

# Publish to Open VSX
npx ovsx publish -p $OVSX_TOKEN

# Create and push tag
git tag v0.3.2
git push origin main
git push origin v0.3.2
```

## Troubleshooting

- **Token errors:** Check `echo $VSCE_TOKEN` and `echo $OVSX_TOKEN`
- **Permission errors:** Run `chmod +x release.sh`
- **Version exists:** Update version manually in package.json
- **Script not found:** Run from project root directory

## Files Created

- `release.sh` - Automated release script
- `RELEASE_GUIDE.md` - Detailed release documentation
- `QUICK_RELEASE.md` - This quick reference
- `.gitignore` - Updated to ignore temp files
