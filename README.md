# cococopi-site

The cococopi website — **rendered entirely by Corros**.

Every page is built with [glazecraft](https://github.com/CocoCopi/glazecraft)
components (vendored in `vendor/glaze.cro`) and written out as static HTML by
`site.cro` — no JavaScript, no build tools, no dependencies. The output in
`dist/` is what Vercel serves.

## The projects

Nine open-source repos, one language, zero shortcuts:

| repo | what it is |
|---|---|
| [corros](https://github.com/CocoCopi/corros) | a scripting language forged from scratch — lexer, bytecode compiler, VM, and an AOT backend that compiles Corros straight to C |
| [courierforge](https://github.com/CocoCopi/courierforge) | a requests-style HTTP client |
| [brothforge](https://github.com/CocoCopi/brothforge) | a BeautifulSoup-style HTML parser |
| [oremath](https://github.com/CocoCopi/oremath) | a NumPy-style ndarray library, pure Corros |
| [cryoquench](https://github.com/CocoCopi/cryoquench) | a from-scratch deep learning engine (8.6 GFLOPS matmul on a phone) |
| [cryotorch](https://github.com/CocoCopi/cryotorch) | a PyTorch-shaped deep learning API |
| [glazecraft](https://github.com/CocoCopi/glazecraft) | a React-style frontend framework — this site is rendered by it |
| [kilncraft](https://github.com/CocoCopi/kilncraft) | an Express-style web framework |
| [crucible](https://github.com/CocoCopi/crucible) | a local LLM forge — pull GGUF models, get a RAM-fit recommendation, serve a streaming chat API |

## Build locally

```sh
# needs corros: curl -fsSL https://raw.githubusercontent.com/CocoCopi/corros/main/install.sh | sh
corros site.cro        # renders dist/
bash tests/run.sh      # validates the whole build
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → import the repo**.
3. Framework preset: **Other**. Vercel reads `vercel.json` automatically:
   - build command: `bash deploy/build.sh` (installs Corros if needed, then runs `site.cro`)
   - output directory: `dist`
4. Deploy. The site is fully static, so it ships from the edge instantly.

**One-command alternative** — build locally and push the rendered site to any
static host (GitHub Pages, Netlify drop, etc.):

```sh
corros site.cro && npx vercel --prod
```

## Layout

```
site.cro             the whole site: data + components + build, in Corros
vendor/glaze.cro     glazecraft, vendored (the framework that renders this site)
public/style.css     the design — dark forge theme, responsive, zero JS
deploy/build.sh      Vercel build script
vercel.json          Vercel config (static output, clean URLs, caching)
tests/run.sh         build validation
dist/                generated output (gitignored)
```

© 2026 cococopi · MIT
