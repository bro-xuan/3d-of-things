# 3D of Things

A static site (Vite, TypeScript, three.js) of real machines you can take apart in 3D. An object is `content/<slug>.json` plus `public/models/<slug>.glb`.

- **Adding, changing or checking an object: use the `/3d-of-things` skill** (`.claude/skills/3d-of-things/SKILL.md`). It is the standard procedure, with the references for every stage.
- Commands: `npm run dev` · `npm run new -- <slug> --tier A|B|C` · `npm run models:build -- <slug>` · `npm run check` · `npm run qa -- <slug>` · `npm run qa -- --all --quick` · `npm run posters -- <slug>` · `npm run truth -- <slug>` · `npm run build` · `npm run export -- --out <dir>`.
- The site lives inside afrodance.fun (bro-xuan/afrodance.fun, Next.js on Vercel) at `/3d-of-everything`: `npm run export -- --out <that checkout>/public/3d-of-everything` bakes it in (README, Deploying). That repo has other work in progress, so use a worktree off its `main`, and commit or push there only when asked.
- Content files with a builder are generated: edit `objects/<slug>/content.mjs` (or `scripts/cars/content.mjs <car>`), not the JSON.
- Browser checks run through `scripts/qa/` (headless Chromium on the GPU). Don't write one-off Playwright scripts; extend the runner.
- Git is `/Library/Developer/CommandLineTools/usr/bin/git` (the `/usr/bin/git` shim needs an Xcode licence). No `sudo`. Commit only when asked.
- CSS sizes in rem with the viewport-scaled root size; no small fixed pixel fonts.
