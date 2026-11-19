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

## Stonkzz Daily (stonkzz.com redesign)

The Stonkzz Daily landing page lives in `daily/`. On GitHub Pages it opens at `<pages-url>/daily/`. It's one self-contained `index.html` plus two icons. The Subscribe buttons show a placeholder until Razorpay is connected, and the footer's Terms, Privacy, Refunds and Disclaimer links point to pages that don't exist yet.

## Course pages

Two separate course landing pages, each a self-contained folder (no build step, no links between them):

- `personal-finance/`: Personal Finance Mastery. On GitHub Pages: `<pages-url>/personal-finance/`
- `stock-market/`: A to Z of the Stock Market. On GitHub Pages: `<pages-url>/stock-market/`

Each folder has its own `index.html`, `assets/`, `fonts/` and `play/` (the course game, website copy: scores points, never rupees). Either folder can be moved to its own repository or domain as it is.

### Editing a course page

- Text and sections: edit `index.html` in the course folder. Styles and scripts are inside the same file.
- Launch settings: the `PAGE CONFIG` block near the top of `index.html`.
  - `checkoutUrl`: leave empty until payment is tested end to end. While empty the page shows "Enrollment opens …" and a Notify me form; once set, it switches to "Enroll now".
  - `opensOn`: the opening date text.
  - `notifyUrl`: where Notify me sign-ups are sent (JSON POST). While empty, the form opens an email to `supportEmail`.
  - `videos.trailer`: the course trailer file or URL. Empty shows "Coming soon".
- Amber dashed tags (for example `X HOURS`, `VERIFY LIVE`) mark details still to be confirmed.
