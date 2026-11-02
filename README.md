# innoraze.com

The website for Innoraze, football analytics and dashboards for clubs.

It is a static site served by GitHub Pages from the `main` branch. There is no build step: edit the HTML, CSS or JavaScript and push.

Links leave off `.html` (for example `/platform`), which GitHub Pages serves from `platform.html`. To click through the site on your own computer, run `npx serve` in this folder (it handles links without `.html` the same way) and open the address it prints.

After changing `assets/style.css`, `assets/app.js` or the icons, raise the `?v=` number where they are linked in each page's `<head>` so browsers fetch the new version.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `platform.html` | Platform and plans |
| `sample-report.html` | Interactive sample match report |
| `about.html` | About |
| `contact.html` | Demo and free report requests |
| `privacy.html`, `terms.html` | Legal |
| `404.html` | Not found |
| `solutions.html` | Redirects to `platform.html` for old links |

## Assets

- `assets/style.css`: all styles
- `assets/app.js`: navigation, the hero replay, matchweek tour, tracking replay, sample report and contact form
- `assets/fonts/`: Mona Sans, self-hosted under the SIL Open Font License (see `OFL.txt`)
- `assets/logo.svg`, `assets/logo-light.svg`, `assets/favicon.svg`: logo files
- `assets/og.png`: image shown when a link to the site is shared

## Contact form

The form on `contact.html` posts to Formspree (form `xovkdgnv`). Submissions arrive at the email address set up in the Formspree dashboard.

## Example data

Every match, team, player and number shown on the site is a fictional example.

## Domain

`CNAME` points GitHub Pages at innoraze.com.
