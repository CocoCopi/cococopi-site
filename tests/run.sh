#!/usr/bin/env bash
# Build validation for cococopi-site — run from the repo root.
#   bash tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

command -v corros >/dev/null 2>&1 || { echo "corros not on PATH" >&2; exit 1; }

rm -rf dist
corros site.cro

fail=0
check() { # check <desc> <cond...>
  local desc="$1"; shift
  if "$@"; then echo "ok   — $desc"; else echo "FAIL — $desc"; fail=1; fi
}

check "index renders"            test -f dist/index.html
check "styles copied"            test -f dist/style.css
check "404 page renders"         test -f dist/404.html
check "sitemap renders"          test -f dist/sitemap.xml
check "robots renders"           test -f dist/robots.txt

for slug in corros courierforge brothforge oremath cryoquench cryotorch glazecraft kilncraft crucible; do
  check "project page: $slug"    test -f "dist/projects/$slug.html"
done

check "index mentions all 9 projects" \
  bash -c '[ "$(grep -o "class=\"tile tile-" dist/index.html | wc -l)" = "9" ]'
check "no external js loaded"    bash -c '! grep -q "<script" dist/index.html'
check "sitemap has 10 urls"      bash -c '[ "$(grep -c "<loc>" dist/sitemap.xml)" = "10" ]'
check "index links to style.css" bash -c 'grep -q "href=\"/style.css\"" dist/index.html'
check "project page links back"  bash -c 'grep -q "href=\"/#projects\"" dist/projects/glazecraft.html'
check "typing terminal present"  bash -c 'grep -q "tw" dist/index.html'
check "embers generated"         bash -c '[ "$(grep -o "class=\"ember\"" dist/index.html | wc -l)" = "12" ]'
check "marquee present"          bash -c 'grep -q "class=\"mq\"" dist/index.html'
check "prev/next nav on pages"   bash -c 'grep -q "class=\"p-nav\"" dist/projects/corros.html'
check "file tabs present"        bash -c '[ "$(grep -o "class=\"tab\"" dist/index.html | wc -l)" = "3" ]'

echo
if [[ "$fail" = "0" ]]; then echo "all checks passed"; else echo "some checks FAILED"; exit 1; fi
