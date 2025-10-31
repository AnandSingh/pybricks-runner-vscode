#!/bin/bash

# Pybricks Runner Release Script
# Usage: ./release.sh [patch|minor|major]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if tokens are set
if [ -z "$VSCE_TOKEN" ]; then
    echo -e "${RED}Error: VSCE_TOKEN environment variable is not set${NC}"
    echo "Set it with: export VSCE_TOKEN='your-token-here'"
    exit 1
fi

if [ -z "$OVSX_TOKEN" ]; then
    echo -e "${RED}Error: OVSX_TOKEN environment variable is not set${NC}"
    echo "Set it with: export OVSX_TOKEN='your-token-here'"
    exit 1
fi

# Get version bump type (default to patch)
VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Version type must be 'patch', 'minor', or 'major'${NC}"
    echo "Usage: ./release.sh [patch|minor|major]"
    exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Pybricks Runner Release Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: ${CURRENT_VERSION}${NC}"
echo -e "${YELLOW}Version bump type: ${VERSION_TYPE}${NC}"
echo ""

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Working directory has uncommitted changes${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add -A
        git commit -m "$commit_msg"
        echo -e "${GREEN}✓ Changes committed${NC}"
    else
        echo -e "${RED}Please commit or stash changes before releasing${NC}"
        exit 1
    fi
fi

# Clean up old .vsix files
echo -e "${BLUE}🧹 Cleaning up old .vsix files...${NC}"
rm -f *.vsix
echo -e "${GREEN}✓ Old .vsix files removed${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Run linting
echo -e "${BLUE}🔍 Running linter...${NC}"
npm run lint
echo -e "${GREEN}✓ Linting passed${NC}"
echo ""

# Package and publish to VS Code Marketplace
echo -e "${BLUE}📦 Publishing to VS Code Marketplace...${NC}"
vsce publish $VERSION_TYPE -p $VSCE_TOKEN
echo -e "${GREEN}✓ Published to VS Code Marketplace${NC}"
echo ""

# Publish to Open VSX Registry
echo -e "${BLUE}📦 Publishing to Open VSX Registry...${NC}"
npx ovsx publish -p $OVSX_TOKEN
echo -e "${GREEN}✓ Published to Open VSX Registry${NC}"
echo ""

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✓ Version updated: ${CURRENT_VERSION} → ${NEW_VERSION}${NC}"
echo ""

# Create git tag
echo -e "${BLUE}🏷️  Creating git tag v${NEW_VERSION}...${NC}"
git tag "v${NEW_VERSION}"
echo -e "${GREEN}✓ Tag created: v${NEW_VERSION}${NC}"
echo ""

# Push changes and tags
echo -e "${BLUE}⬆️  Pushing to remote...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"
echo -e "${GREEN}✓ Pushed to remote${NC}"
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Release Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Version: ${NEW_VERSION}${NC}"
echo -e "${GREEN}Tag: v${NEW_VERSION}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Create a GitHub release at: ${BLUE}https://github.com/AnandSingh/pybricks-runner-vscode/releases/new${NC}"
echo -e "  2. Select tag: ${GREEN}v${NEW_VERSION}${NC}"
echo -e "  3. Add release notes from CHANGELOG.md"
echo -e "  4. Attach the .vsix file: ${GREEN}pybricks-runner-${NEW_VERSION}.vsix${NC}"
echo ""
