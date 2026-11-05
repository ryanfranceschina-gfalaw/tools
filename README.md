# gfalaw.us

The website of GFA LAW, PLLC, published with GitHub Pages at https://www.gfalaw.us.

- `src/pages/` one file per page (a short header, then the page content)
- `src/data/` press releases, news coverage and merch listings
- `src/assets/` styles, scripts and images
- `src/static/` the free tools, the Know Your Rights PDF and the study portal
- `build.py` turns the source into the finished site

Every change to `main` rebuilds and republishes the site automatically
(Actions > Build and publish website). The same workflow refreshes the merch
page from Etsy every night once the `ETSY_API_KEY` secret is set, and the
Weekly website check tests every page, form and outside link each Monday.

Public repository: never add client information, internal firm material or
licensed research content.
