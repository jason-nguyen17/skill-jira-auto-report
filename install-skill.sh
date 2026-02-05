#!/bin/bash

# skill-jira-auto-report installer
# Copy skill to ~/.claude/skills/ and setup .env

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_NAME="jira-self-hosted"
SKILL_SRC="$SCRIPT_DIR/skills/$SKILL_NAME"
SKILL_DEST="$HOME/.claude/skills/$SKILL_NAME"

echo "🚀 Installing $SKILL_NAME skill..."

# Check if source exists
if [ ! -d "$SKILL_SRC" ]; then
    echo "❌ Error: Skill source not found at $SKILL_SRC"
    exit 1
fi

# Create destination directory
mkdir -p "$HOME/.claude/skills"

# Backup skill .env if exists
ENV_FILE="$SKILL_DEST/.env"
ENV_BACKUP=""

if [ -f "$ENV_FILE" ]; then
    ENV_BACKUP=$(cat "$ENV_FILE")
    echo "ℹ️  Backed up existing skill .env"
fi

# Copy skill (overwrite if exists)
if [ -d "$SKILL_DEST" ]; then
    echo "⚠️  Skill already exists, updating..."
    rm -rf "$SKILL_DEST"
fi

cp -r "$SKILL_SRC" "$SKILL_DEST"
echo "✅ Copied skill to $SKILL_DEST"

# Make scripts executable
chmod +x "$SKILL_DEST/scripts/"*.sh 2>/dev/null || true
echo "✅ Made scripts executable"

# Restore or create .env from env.claude template
ENV_TEMPLATE="$SCRIPT_DIR/env.claude"

if [ -n "$ENV_BACKUP" ]; then
    echo "$ENV_BACKUP" > "$ENV_FILE"
    echo "✅ Restored existing .env"
    echo ""
    echo "ℹ️  If you need to update config, check template: $ENV_TEMPLATE"
else
    if [ -f "$ENV_TEMPLATE" ]; then
        cp "$ENV_TEMPLATE" "$ENV_FILE"
        echo "✅ Created .env from env.claude template"
    else
        echo "⚠️  env.claude template not found, creating default .env"
        cat > "$ENV_FILE" << 'EOF'
# Jira Server/Data Center Configuration
# Get PAT: Jira → Profile → Personal Access Tokens

JIRA_DOMAIN=https://your-jira-instance.com
JIRA_PAT=your_personal_access_token
EOF
    fi
fi

# Setup project .env (for Telegram config) if not exists
PROJECT_ENV="$SCRIPT_DIR/.env"
PROJECT_ENV_EXAMPLE="$SCRIPT_DIR/.env.example"

if [ ! -f "$PROJECT_ENV" ] && [ -f "$PROJECT_ENV_EXAMPLE" ]; then
    cp "$PROJECT_ENV_EXAMPLE" "$PROJECT_ENV"
    echo "✅ Created .env from .env.example (Telegram config)"
fi

echo ""
echo "📋 Next steps:"
echo "   1. Edit ~/.claude/skills/$SKILL_NAME/.env with your Jira credentials"
echo "   2. Edit $SCRIPT_DIR/.env with your Telegram credentials"
echo "   3. Test: ~/.claude/skills/$SKILL_NAME/scripts/jira-auth-test.sh"
echo "   4. Use in Claude: /jira-self-hosted or ask about Jira naturally"
echo ""
echo "ℹ️  Note: Create .env.dev in project root for dev testing (daily-report.mjs only)"
echo ""
echo "✨ Installation complete!"
