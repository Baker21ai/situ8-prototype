#!/usr/bin/env bash
set -euo pipefail

# Simple launcher for an AWS Bedrock MCP server over stdio.
# It attempts a Node-based server first, then a Python-based one if present.
# Requirements (one of):
# - Node: npx @modelcontextprotocol/server-aws-bedrock (auto-installed by npx)
# - Python: python3 -m mcp_aws_bedrock
#
# The server expects AWS credentials from your environment (shared config/credentials,
# IAM Role via SSO, or env vars). You can set AWS_REGION, AWS_PROFILE, etc.

# Prefer region from env or default
: "${AWS_REGION:=us-east-1}"
export AWS_REGION
export AWS_SDK_LOAD_CONFIG=${AWS_SDK_LOAD_CONFIG:-1}

# Try Node-based server via npx
if command -v node >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
  if npx --yes @modelcontextprotocol/server-aws-bedrock --help >/dev/null 2>&1; then
    exec npx --yes @modelcontextprotocol/server-aws-bedrock "$@"
  fi
fi

# Try Python-based server
if command -v python3 >/dev/null 2>&1; then
  if python3 - <<'PY' >/dev/null 2>&1; then
import importlib
import sys
sys.exit(0 if importlib.util.find_spec('mcp_aws_bedrock') else 1)
PY
  then
    exec python3 -m mcp_aws_bedrock "$@"
  fi
fi

# If we reached here, we couldn't find a server implementation
>&2 echo "AWS Bedrock MCP server not found. Install one of the following and retry:"
>&2 echo "  1) Node:   npx --yes @modelcontextprotocol/server-aws-bedrock"
>&2 echo "  2) Python: pip install mcp-aws-bedrock"
exit 127
