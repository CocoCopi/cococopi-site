#!/usr/bin/env bash
# Vercel build script for cococopi-site.
#
# The whole site is rendered by Corros: `site.cro` builds every page in
# dist/ using the vendored glazecraft components. This script only makes
# sure the `corros` binary exists, then hands the work to the language.
set -euo pipefail
cd "$(dirname "$0")/.."

# --- ensure corros -------------------------------------------------------
if ! command -v corros >/dev/null 2>&1; then
  echo "corros not found — installing (prebuilt binary, source fallback)..."
  export PREFIX="$HOME/.corros"
  curl -fsSL https://raw.githubusercontent.com/CocoCopi/corros/main/install.sh | sh
  export PATH="$HOME/.corros/bin:$PATH"
fi

corros --version >/dev/null 2>&1 || { echo "corros installed but not runnable" >&2; exit 1; }

# --- render the site -----------------------------------------------------
corros site.cro

# sanity: the pages must exist or the deploy is broken
[[ -f dist/index.html ]] || { echo "build failed: dist/index.html missing" >&2; exit 1; }
[[ -f dist/style.css ]] || { echo "build failed: dist/style.css missing" >&2; exit 1; }

echo "cococopi-site built: $(ls dist/projects/*.html | wc -l) project pages"
