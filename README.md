# Stonkzz School: main site (review build)

A static site. No build step: `index.html` loads everything with relative paths, so it works from any folder or sub-path.

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `stonkzz-school-site`).
2. Upload everything in this folder to the repository root (drag the files into "Add file > Upload files"), then commit.
3. In the repository, open Settings > Pages. Under "Build and deployment", choose "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

Note: on a free GitHub account, Pages only works from a public repository, so the link is open to anyone who has it.

## Files

- `index.html`: the page
- `css/journey.css`: styles
- `js/world.js`: the 3D scene and page logic (bundled, includes three.js)
- `assets/`, `fonts/`: logo, medal image, web fonts
- `.nojekyll`: tells GitHub Pages to serve the files as they are

## Still placeholder

Course pages, app, report page and LinkedIn links show a "not live yet" message.
