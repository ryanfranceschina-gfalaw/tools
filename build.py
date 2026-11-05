#!/usr/bin/env python3
"""GFA LAW website builder.

src/pages/*.html   page bodies with a small header block (path, title, desc, ...)
src/data/*.json    press releases, news coverage, merch listings
src/assets/        css, js, images (copied as-is)
src/static/        files published unchanged (tool pages, PDF, study portal)
src/embeds/        self-contained apps shown in an iframe (complaints portal)

`python3 build.py` writes the finished site to _site/. Links are written
root-relative (/about-the-firm) and the build turns them into relative links,
so the output works at www.gfalaw.us and on a github.io preview alike.
"""
import re, os, json, html, glob, shutil, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, '_site')
SITE = 'https://www.gfalaw.us'
GA = 'G-MZX8KLNZTD'
NOW = datetime.datetime.now(datetime.timezone.utc)
V = NOW.strftime('%Y%m%d%H%M')
ADDR = {"@type": "PostalAddress", "streetAddress": "4970 E. Business 190", "addressLocality": "Temple",
        "addressRegion": "TX", "postalCode": "76501", "addressCountry": "US"}
FIRM_ID = SITE + '/#firm'
MYCASE_CIVIL = 'https://gfa-law-pllc.mycase.com/contact_us/tV99Frbor6aVhkfXGLK2Abhc'
MYCASE_CRIM = 'https://gfa-law-pllc.mycase.com/contact_us/KRA1LYw2Dno1vnJTEp49mCft'
LAWPAY = 'https://secure.lawpay.com/pages/gfalaw/trust?amount=350.00&amp;reference=Consultation%20Fee&amp;readOnlyFields=amount'

ICON = {
 'phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
 'mail': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
 'pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
 'arrow': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 'chev': '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m2 4 4 4 4-4"/></svg>',
 'facebook': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8V6.5c0-.7.5-1 1.1-1H17V2h-3a4 4 0 0 0-4 4v2H7.5v3.5H10V22h4V11.5h2.8L17.5 8z"/></svg>',
 'x': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 2H21l-7 8 8.2 12h-6.4l-5-7.2L4.9 22H1.7l7.5-8.6L1.3 2h6.6l4.5 6.6zM16.7 20h1.8L7.4 3.9H5.5z"/></svg>',
 'youtube': '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15.1V8.9L15.4 12z"/></svg>',
 'shop': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>',
 'star': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>',
 'quiz': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>',
 'clock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
 'route': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12"/></svg>',
 'doc': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
 'shield': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
 'card': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>',
 'book': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
}

NAV = [
 ('Home', '/'),
 ('About', [('About the Firm', '/about-the-firm', 'Our partnership and the people behind it', 0),
   ('Practice Areas', '/about-the-firm/practice-areas', 'Everything we handle, in one place', 0),
   ('Section 1983 Civil Rights Lawsuits', '/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits', '', 1),
   ('Innocent Defense', '/about-the-firm/practice-areas/innocent-defense', '', 1),
   ('Firearm Rights and Expunction', '/about-the-firm/practice-areas/firearm-rights-and-expunction', '', 1),
   ('CJ Grisham', '/about-the-firm/cj-grisham', 'Senior Partner', 0),
   ('Ryan Franceschina', '/about-the-firm/ryan-franceschina', 'Managing Partner', 0),
   ('David T. Amad 1791 Scholarship', '/about-the-firm/david-t-amad-1791-scholarship-application', '', 0)]),
 ('Tools', [('All Free Tools', '/tools', 'Know your rights, deadlines and records', 0),
   ('Can the Cop Do That?', '/tools/can-the-cop-do-that', '', 1), ('Deadline Checker', '/tools/deadline-checker', '', 1),
   ('Case Review Finder', '/tools/case-review-finder', '', 1), ('Records Request Builder', '/tools/records-request-builder', '', 1),
   ('Firearm Return and Expunction Checker', '/tools/firearm-return-and-expunction-checker', '', 1),
   ('Know Your Rights Guide', '/tools/know-your-rights-guide', '', 1), ('Restore My Rights', '/tools/restore-my-rights', 'Federal firearm rights restoration', 1)]),
 ('Press', '/press-releases'),
 ('Contact', [('Contact GFA LAW', '/contact/contact-gfa-law', 'Request a case review', 0), ('FAQ', '/contact/faq', '', 0),
   ('Payments', '/payments', 'Consultation fee', 0), ('Socials', '/contact/socials', '', 0), ('Español', '/contact/espanol', '', 0),
   ('Complaints', '/complaints', 'GFA HR Department Portal', 0)]),
 ('Merch', '/merch'),
]
TITLES = {}  # path -> short name, for breadcrumbs
for name, tgt in NAV:
    if isinstance(tgt, str): TITLES[tgt] = name
    else:
        for n, p, _, _ in tgt: TITLES[p] = n
TITLES.update({'/about-the-firm': 'About the Firm', '/contact': 'Contact', '/press-releases': 'Press Releases', '/tools': 'Tools'})

esc = html.escape
KNOWN = set()

def rel(prefix, path):
    p = path.split('#')[0]; frag = path[len(p):]
    q = ''
    if '?' in p: p, q = p.split('?', 1); q = '?' + q
    p = p.strip('/')
    if not p: return (prefix or './') + q + frag
    if '.' in p.split('/')[-1]: return prefix + p + q + frag
    return prefix + p + '/' + q + frag

def fix_links(s, prefix):
    def sub(m):
        attr, q, url = m.group(1), m.group(2), m.group(3)
        u = url
        for base in (SITE, 'http://www.gfalaw.us', 'https://gfalaw.us'):
            if u.startswith(base): u = u[len(base):] or '/'
        if u.startswith('/') and not u.startswith('//'):
            return f'{attr}={q}{rel(prefix, u)}{q}'
        return m.group(0)
    return re.sub(r'(href|src|srcset|content)=(["\'])([^"\']*)\2', lambda m: m.group(0) if m.group(1) == 'content' else sub(m), s)

def picture(src, alt, w, h, cls='', eager=False, sizes=None):
    """<picture> with webp + jpg/png fallback. src is /assets/img/name.ext"""
    base, ext = os.path.splitext(src)
    load = '' if eager else ' loading="lazy" decoding="async"'
    c = f' class="{cls}"' if cls else ''
    webp = base + '.webp'
    has_webp = os.path.exists(os.path.join(SRC, webp.lstrip('/')))
    img = f'<img src="{src}" alt="{esc(alt)}" width="{w}" height="{h}"{c}{load}>'
    if not has_webp: return img
    return f'<picture><source srcset="{webp}" type="image/webp">{img}</picture>'

def nav_html(cur):
    out = ['<ul>']
    for name, tgt in NAV:
        if isinstance(tgt, str):
            ac = ' aria-current="page"' if tgt == cur else ''
            out.append(f'<li><a href="{tgt}"{ac}>{esc(name)}</a></li>')
        else:
            out.append(f'<li><button type="button" aria-haspopup="true" aria-expanded="false">{esc(name)}{ICON["chev"]}</button><ul class="sub">')
            for n, p, sm, ind in tgt:
                ac = ' aria-current="page"' if p == cur else ''
                small = f'<small>{esc(sm)}</small>' if sm else ''
                out.append(f'<li><a class="{"in" if ind else ""}" href="{p}"{ac}><span>{esc(n)}{small}</span></a></li>')
            out.append('</ul></li>')
    out.append('<li class="m-cta"><a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a></li>')
    out.append('<li class="m-cta"><a class="btn ghost" href="tel:+12544051726">Call 254-405-1726</a></li>')
    out.append('</ul>')
    return ''.join(out)

def crumbs(path, title):
    parts = path.strip('/').split('/') if path != '/' else []
    items = [('Home', '/')]
    acc = ''
    for i, p in enumerate(parts):
        acc += '/' + p
        name = title if i == len(parts) - 1 else TITLES.get(acc, p.replace('-', ' ').title())
        items.append((name, acc))
    return items

def crumbs_html(items):
    lis = []
    for i, (n, p) in enumerate(items):
        if i == len(items) - 1: lis.append(f'<li aria-current="page">{esc(n)}</li>')
        elif KNOWN and p not in KNOWN: lis.append(f'<li>{esc(n)}</li>')
        else: lis.append(f'<li><a href="{p}">{esc(n)}</a></li>')
    return '<ol class="crumbs">' + ''.join(lis) + '</ol>'

def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        dict({"@type": "ListItem", "position": i + 1, "name": n}, **({"item": SITE + ('/' if p == '/' else p + '/')} if (not KNOWN or p in KNOWN or i == len(items) - 1) else {})) for i, (n, p) in enumerate(items)]}

FIRM = {"@type": ["LegalService", "LocalBusiness"], "@id": FIRM_ID, "name": "GFA LAW, PLLC",
        "legalName": "Grisham Franceschina Attorneys-at-Law, PLLC", "url": SITE + "/",
        "telephone": "+1-254-405-1726", "email": "intake@gfalaw.us",
        "image": SITE + "/assets/img/og-gfa-law.jpg", "logo": SITE + "/assets/img/seal-300.png",
        "address": ADDR, "geo": {"@type": "GeoCoordinates", "latitude": 31.0982, "longitude": -97.3080},
        "areaServed": [{"@type": "State", "name": "Texas"}, {"@type": "State", "name": "Maryland"}],
        "priceRange": "Free case review; $350 consultation",
        "knowsAbout": ["Civil rights litigation", "42 U.S.C. 1983", "First Amendment", "Second Amendment",
                       "Criminal defense", "Expunction", "Firearm return", "Federal firearm rights restoration"],
        "founder": [{"@id": SITE + "/about-the-firm/cj-grisham#person"}, {"@id": SITE + "/about-the-firm/ryan-franceschina#person"}],
        "sameAs": ["https://www.facebook.com/profile.php?id=61586460771001", "https://www.youtube.com/@gfalaw",
                   "https://www.etsy.com/shop/GFALAWmerchandise"]}

FOOT = '''<section class="band sec tight"><div class="wrap band-in">
<div><h2>Request a case review</h2><p>Requesting a case review is free. If we can help, the consultation is $350. Submitting a request does not create an attorney-client relationship.</p></div>
<div class="btns" style="margin:0"><a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a><a class="btn ghost" href="tel:+12544051726">CALLICON 254-405-1726</a></div>
</div></section>'''

FOOTER = '''<footer class="ftr"><div class="wrap">
<div class="ftr-grid">
<div><a class="brand" href="/"><img src="/assets/img/seal-300.png" alt="" width="44" height="44"><span class="brand-t"><b>GFA LAW, PLLC</b><span>Attorneys-at-Law</span></span></a>
<p>Grisham Franceschina Attorneys-at-Law, PLLC<br>4970 E. Business 190<br>Temple, TX 76501</p>
<p><a href="tel:+12544051726">254-405-1726</a><br><a href="mailto:intake@gfalaw.us">intake@gfalaw.us</a><br>Media: <a href="mailto:press@gfalaw.us">press@gfalaw.us</a></p></div>
<div><p class="fh">Practice</p><ul><li><a href="/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits">Civil Rights Lawsuits</a></li><li><a href="/about-the-firm/practice-areas/innocent-defense">Innocent Defense</a></li><li><a href="/about-the-firm/practice-areas/firearm-rights-and-expunction">Firearm Rights and Expunction</a></li><li><a href="/tools/restore-my-rights">Restore My Rights</a></li><li><a href="/about-the-firm/practice-areas">All Practice Areas</a></li></ul></div>
<div><p class="fh">Firm</p><ul><li><a href="/about-the-firm">About the Firm</a></li><li><a href="/about-the-firm/cj-grisham">CJ Grisham</a></li><li><a href="/about-the-firm/ryan-franceschina">Ryan Franceschina</a></li><li><a href="/press-releases">Press Releases</a></li><li><a href="/about-the-firm/david-t-amad-1791-scholarship-application">1791 Scholarship</a></li><li><a href="/merch">Merch</a></li></ul></div>
<div><p class="fh">Get Help</p><ul><li><a href="/contact/contact-gfa-law">Request a Case Review</a></li><li><a href="/tools/case-review-finder">Case Review Finder</a></li><li><a href="/tools">Free Tools</a></li><li><a href="/payments">Payments</a></li><li><a href="/contact/faq">FAQ</a></li><li><a href="/contact/espanol">Español</a></li><li><a href="/contact/socials">Socials</a></li><li><a href="/complaints">Complaints</a></li></ul></div>
</div>
<div class="legal">
<p>Lawyers responsible for the content of this website are Ryan Franceschina and CJ Grisham. Primary practice location: Temple, Texas. The attorneys of GFA LAW, PLLC are not certified by the Texas Board of Legal Specialization.</p>
<p>The information provided on this website is for general informational purposes only and does not constitute legal advice. No attorney-client relationship is formed by viewing this site or contacting the firm through this website. Past results do not guarantee future outcomes.</p>
<p>&copy; YEAR GFA LAW, PLLC. All rights reserved.</p>
</div></div></footer>
<nav class="callbar" aria-label="Quick contact"><a class="btn" href="tel:+12544051726">CALLICON Call</a><a class="btn ghost" href="/contact/contact-gfa-law">Case Review</a></nav>'''

SIDE_PRACTICE = '''<aside class="side">
<div class="side-card"><h3>Talk to GFA LAW</h3><p>Requesting a case review is free. If we can help, the consultation is $350.</p>
<a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a><a class="btn ghost" href="tel:+12544051726">Call 254-405-1726</a></div>
<div class="side-card"><h3 style="font-size:18px">Practice Areas</h3><ul>
<li><a href="/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits">Section 1983 Civil Rights Lawsuits</a></li>
<li><a href="/about-the-firm/practice-areas/innocent-defense">Innocent Defense</a></li>
<li><a href="/about-the-firm/practice-areas/firearm-rights-and-expunction">Firearm Rights and Expunction</a></li>
<li><a href="/tools/restore-my-rights">Restore My Rights (Federal)</a></li>
<li><a href="/tools">Free Tools</a></li></ul></div>
</aside>'''

def expand(body, meta):
    body = body.replace('{{band}}', FOOT).replace('{{side:practice}}', SIDE_PRACTICE)
    body = re.sub(r'\{\{icon:(\w+)\}\}', lambda m: ICON[m.group(1)], body)
    body = re.sub(r'\{\{pic:([^|}]+)\|([^|}]*)\|(\d+)\|(\d+)(?:\|([^|}]*))?(?:\|(eager))?\}\}',
                  lambda m: picture(m.group(1), m.group(2), m.group(3), m.group(4), m.group(5) or '', bool(m.group(6))), body)
    body = re.sub(r'<div class="tool" data-src="([^"]+)"></div>',
                  lambda m: f'<div class="tool-frame"><iframe class="emb auto" src="/{m.group(1)}" title="{esc(meta["title"].split(" - ")[-1])}" scrolling="no"></iframe></div>', body)
    body = re.sub(r'<div class="emb" data-src="([^"]+)"></div>',
                  lambda m: f'<iframe class="emb auto" src="/embeds/{m.group(1)}.html" title="{esc(meta["title"].split(" - ")[-1])}" scrolling="no"></iframe>', body)
    body = body.replace('CALLICON', ICON['phone'])
    return body

def faq_ld(body):
    qs = re.findall(r'<summary>(.*?)</summary>\s*<div class="a">(.*?)</div>\s*</details>', body, re.S)
    if not qs: return None
    clean = lambda t: html.unescape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', t))).strip()
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": clean(q),
            "acceptedAnswer": {"@type": "Answer", "text": clean(a)}} for q, a in qs]}

def render(meta, body):
    path = meta['path']
    depth = 0 if path == '/' else len(path.strip('/').split('/'))
    prefix = '../' * depth
    title = meta['title']; desc = meta['desc']
    canon = SITE + ('/' if path in ('/', '/404') else path + '/')
    if meta.get('canon'): canon = SITE + meta['canon']
    if path == '/' and not meta.get('canon'): canon = SITE + '/'
    short = meta.get('short') or title.split(' - ')[-1].split(' | ')[0]
    items = crumbs(path, short)
    body = body.replace('{{crumbs}}', crumbs_html(items) if path != '/' else '')
    body = expand(body, meta)
    graph = [FIRM, {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "GFA LAW, PLLC", "publisher": {"@id": FIRM_ID}, "inLanguage": "en-US"}] if path == '/' else []
    page_type = meta.get('schema', 'WebPage')
    wp = {"@type": page_type, "@id": canon + "#page", "url": canon, "name": title, "description": desc,
          "isPartOf": {"@id": SITE + "/#site"}, "about": {"@id": FIRM_ID}, "inLanguage": meta.get('lang', 'en') + ('-US' if meta.get('lang', 'en') == 'en' else '')}
    if path != '/': wp["breadcrumb"] = crumbs_ld(items)
    graph.append(wp)
    for extra in meta.get('ld', []):
        graph.append(extra)
        if page_type == 'ProfilePage' and extra.get('@type') == 'Person': wp['mainEntity'] = {"@id": extra['@id']}
    f = faq_ld(body)
    if f: graph.append(f)
    ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + '</script>'
    robots = '<meta name="robots" content="noindex">' if meta.get('noindex') else ''
    ogimg = meta.get('ogimg', SITE + '/assets/img/og-gfa-law.jpg')
    ogtype = meta.get('ogtype', 'website')
    extra_head = meta.get('head', '')
    doc = f'''<!doctype html>
<html lang="{meta.get('lang', 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
{robots}<link rel="canonical" href="@@CANON@@">
<meta property="og:type" content="{ogtype}"><meta property="og:site_name" content="GFA LAW, PLLC">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="@@CANON@@"><meta property="og:image" content="{ogimg}"><meta property="og:locale" content="{'es_US' if meta.get('lang') == 'es' else 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d1a11">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/img/favicon-64.png"><link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css?v={V}">
<link rel="alternate" type="application/rss+xml" title="GFA LAW press releases" href="/press-releases/feed.xml">
<script async src="https://www.googletagmanager.com/gtag/js?id={GA}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','{GA}');</script>
{ld}{extra_head}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="hdr"><div class="hdr-in">
<a class="brand" href="/"><img src="/assets/img/seal-300.png" alt="" width="44" height="44"><span class="brand-t"><b>GFA LAW</b><span>Attorneys-at-Law, PLLC</span></span></a>
<nav class="nav" id="nav" aria-label="Main">{nav_html(path)}</nav>
<a class="btn sm hdr-cta" href="/contact/contact-gfa-law">Request a Case Review</a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu"><span></span></button>
</div></header>
<main id="main">
{body}
</main>
{expand(FOOTER, meta).replace('YEAR', str(NOW.year))}
<script src="/assets/site.js?v={V}" defer></script>
</body>
</html>
'''
    doc = fix_links(doc, prefix).replace('@@CANON@@', canon)
    return doc

def write(path, doc):
    fp = os.path.join(OUT, 'index.html') if path == '/' else os.path.join(OUT, path.strip('/'), 'index.html')
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    open(fp, 'w', encoding='utf-8').write(doc)

def parse(fn):
    s = open(fn, encoding='utf-8').read()
    head, body = s.split('\n---\n', 1)
    meta = {}
    for l in head.strip().split('\n'):
        k, v = l.split(': ', 1)
        meta[k] = json.loads(v) if k == 'ld' else v
    return meta, body

# ---------- generated pages ----------
def fmt_date(d):
    return datetime.date.fromisoformat(d).strftime('%B %-d, %Y')

def release_pages(R):
    pages = []
    R = sorted(R, key=lambda r: r['date'], reverse=True)
    for i, r in enumerate(R):
        body_html = []
        for b in r['body']:
            if isinstance(b, str): body_html.append(f'<p>{esc(b)}</p>')
            else: body_html.append(f'<blockquote><p>{esc(b["q"])}</p><cite>{esc(b["by"])}</cite></blockquote>')
        newer = R[i - 1] if i > 0 else None
        older = R[i + 1] if i + 1 < len(R) else None
        pn = '<nav class="pn" aria-label="More releases">'
        if older: pn += f'<a href="/press-releases/{older["id"]}"><small>Older</small><span>{esc(older["title"])}</span></a>'
        if newer: pn += f'<a class="next" href="/press-releases/{newer["id"]}"><small>Newer</small><span>{esc(newer["title"])}</span></a>'
        pn += '</nav>'
        tags = ''.join(f'<span class="tag">{esc(t)}</span>' for t in r['tags'])
        url = f'{SITE}/press-releases/{r["id"]}/'
        share = (f'<div class="share"><a class="btn sm ghost" href="https://www.facebook.com/sharer/sharer.php?u={url}" target="_blank" rel="noopener">{ICON["facebook"]} Share</a>'
                 f'<a class="btn sm ghost" href="https://x.com/intent/post?url={url}" target="_blank" rel="noopener">{ICON["x"]} Post</a>'
                 f'<a class="btn sm ghost" href="#" data-copy>Copy link</a></div>')
        body = f'''<section class="phero"><div class="wrap release-head">{{{{crumbs}}}}
<p class="eyebrow">GFA LAW, PLLC &middot; Press Release</p>
<h1>{esc(r["title"])}</h1>
<p class="sub">{esc(r["sub"])}</p>
<div class="meta"><span>{fmt_date(r["date"])}</span><span>{esc(r["loc"])}</span></div>
<div class="tags">{tags}</div>
</div></section>
<section class="sec"><div class="wrap layout"><article class="prose">
{''.join(body_html)}
<div class="release-foot"><p>Press releases reflect the statements of GFA LAW, PLLC as of the date of each release. Allegations in pending cases have not been proven in court. Past results do not guarantee future outcomes. Media inquiries: <a href="mailto:press@gfalaw.us">press@gfalaw.us</a>.</p></div>
{share}
{pn}
</article>
<aside class="side"><div class="side-card"><h2 class="h3">Media inquiries</h2><p>Reporters can reach the firm at <a href="mailto:press@gfalaw.us">press@gfalaw.us</a> or 254-405-1726.</p><a class="btn ghost" href="/press-releases">All press releases</a></div>
<div class="side-card"><h2 class="h3">Need help with a case?</h2><p>Requesting a case review is free. If we can help, the consultation is $350.</p><a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a></div></aside>
</div></section>'''
        meta = {'path': f'/press-releases/{r["id"]}', 'title': f'{r["title"]} | GFA LAW, PLLC', 'short': r['title'],
                'desc': r.get('summary') or r['sub'], 'ogtype': 'article', 'schema': 'WebPage',
                'head': f'<meta property="article:published_time" content="{r["date"]}T12:00:00-05:00">',
                'ld': [{"@type": "NewsArticle", "headline": r['title'][:110], "description": r['sub'], "datePublished": r['date'],
                        "dateline": r['loc'], "author": {"@id": FIRM_ID}, "publisher": {"@id": FIRM_ID},
                        "mainEntityOfPage": url, "image": [SITE + '/assets/img/og-gfa-law.jpg'], "keywords": r['tags'],
                        "articleBody": ' '.join(b if isinstance(b, str) else b['q'] for b in r['body'])}]}
        pages.append((meta, body))
    return pages, R

def press_index(R, C):
    tags = []
    for r in R:
        for t in r['tags']:
            if t not in tags: tags.append(t)
    chips = '<button class="chip" type="button" data-val="All" aria-pressed="true">All</button>' + ''.join(
        f'<button class="chip" type="button" data-val="{esc(t)}" aria-pressed="false">{esc(t)}</button>' for t in tags)
    cards = ''.join(f'''<a class="card news-card rv" href="/press-releases/{r["id"]}" data-in="pr" data-tags="{esc('|'.join(r['tags']))}">
<div class="meta"><span>{fmt_date(r["date"])}</span></div><h2 class="h3">{esc(r["title"])}</h2><p>{esc(r["sub"])}</p>
<div class="tags">{''.join(f'<span class="tag">{esc(t)}</span>' for t in r['tags'])}</div><span class="more">Read release</span></a>''' for r in R)
    cov = ''.join(f'''<li><a href="{esc(c["url"])}" target="_blank" rel="noopener"><span class="o">{esc(c["outlet"])}<small>{fmt_date(c["date"])}</small></span><span class="t">{esc(c["title"])}</span><span class="x">Read &#8599;</span></a></li>''' for c in sorted(C, key=lambda c: c['date'], reverse=True))
    body = f'''<section class="phero"><div class="wrap">{{{{crumbs}}}}
<p class="eyebrow">Newsroom</p><h1>Press Releases</h1>
<p class="lede">Statements and announcements from GFA LAW, PLLC, the Temple, Texas civil rights and criminal defense firm of Grisham Franceschina Attorneys-at-Law. Media inquiries: <a href="mailto:press@gfalaw.us">press@gfalaw.us</a></p>
</div></section>
<section class="sec"><div class="wrap">
<h2 class="vh">All press releases</h2>
<input class="search" type="search" placeholder="Search press releases" data-search="pr" aria-label="Search press releases">
<div class="chips" data-filter="pr" role="group" aria-label="Filter by topic">{chips}</div>
<div class="grid g2">{cards}</div>
</div></section>
<section class="sec alt" id="in-the-news"><div class="wrap">
<div class="sec-head"><p class="eyebrow">Coverage</p><h2>In the News</h2><p class="lede">Independent news coverage of matters handled by GFA LAW. Links open the outlet's website. GFA LAW does not control this content, and inclusion does not imply endorsement.</p></div>
<ul class="coverage">{cov}</ul>
</div></section>
{{{{band}}}}'''
    meta = {'path': '/press-releases', 'title': 'Press Releases | GFA LAW, PLLC', 'short': 'Press Releases', 'schema': 'CollectionPage',
            'desc': 'Statements and announcements from GFA LAW, PLLC, the Temple, Texas civil rights and criminal defense firm, plus independent news coverage of our cases.'}
    return meta, body

def feed(R):
    items = ''.join(f'''<item><title>{esc(r["title"])}</title><link>{SITE}/press-releases/{r["id"]}/</link><guid>{SITE}/press-releases/{r["id"]}/</guid>
<pubDate>{datetime.datetime.fromisoformat(r["date"] + "T12:00:00-05:00").strftime("%a, %d %b %Y %H:%M:%S -0500")}</pubDate><description>{esc(r["sub"])}</description></item>''' for r in R)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>GFA LAW, PLLC press releases</title><link>{SITE}/press-releases/</link>
<description>Statements and announcements from GFA LAW, PLLC.</description><language>en-us</language>{items}</channel></rss>
'''

def merch_page(M):
    cats = M['categories']
    chips = '<button class="chip" type="button" data-val="All" aria-pressed="true">All</button>' + ''.join(
        f'<button class="chip" type="button" data-val="{esc(c)}" aria-pressed="false">{esc(c)}</button>' for c in cats if any(i['cat'] == c for i in M['items']))
    cards = ''.join(f'''<a class="mcard" href="{esc(i["url"])}" target="_blank" rel="noopener" data-in="m" data-tags="{esc(i["cat"])}"><div class="im"><img src="{esc(i["img"])}" alt="{esc(i["title"])}" loading="lazy" decoding="async" width="570" height="570"></div><div class="bd"><span class="tt">{esc(i["title"])}</span><span class="pr">{esc(i["price"])}</span></div></a>''' for i in M['items'])
    upd = M.get('updated', '')
    body = f'''<section class="phero"><div class="wrap">{{{{crumbs}}}}
<p class="eyebrow">Wear the Shield</p><h1>GFA LAW Merch</h1>
<p class="lede">Official GFA LAW, PLLC apparel and gear. Every order is handled through our <a href="https://www.etsy.com/shop/GFALAWmerchandise" target="_blank" rel="noopener">Etsy shop</a>.</p>
<div class="btns"><a class="btn" href="https://www.etsy.com/shop/GFALAWmerchandise" target="_blank" rel="noopener">{ICON["shop"]} Visit the Etsy shop</a></div>
</div></section>
<section class="sec"><div class="wrap">
<h2 class="vh">Shop by category</h2>
<input class="search" type="search" placeholder="Search merch" data-search="m" aria-label="Search merch">
<div class="chips" data-filter="m" role="group" aria-label="Filter by category">{chips}</div>
<p class="mcount" data-count="m" aria-live="polite"></p>
<div class="merch-grid">{cards}</div>
<p class="sm" style="margin-top:26px">Prices and availability are set on Etsy and may change.{(" Listings last refreshed " + upd + ".") if upd else ""}</p>
</div></section>'''
    meta = {'path': '/merch', 'title': 'GFA LAW Merch | GFA LAW, PLLC', 'short': 'Merch', 'schema': 'CollectionPage',
            'desc': 'Official GFA LAW, PLLC apparel and gear: shirts, hoodies, hats, drinkware, stickers and more. Every order is handled through our Etsy shop.'}
    return meta, body

def home_news(R):
    return ''.join(f'''<a class="card news-card rv" href="/press-releases/{r["id"]}"><div class="meta"><span>{fmt_date(r["date"])}</span></div><h3>{esc(r["title"])}</h3><p>{esc(r["sub"])}</p><span class="more">Read release</span></a>''' for r in R[:3])

if __name__ == '__main__':
    if os.path.exists(OUT): shutil.rmtree(OUT)
    shutil.copytree(os.path.join(SRC, 'static'), OUT)
    shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))
    shutil.copytree(os.path.join(SRC, 'embeds'), os.path.join(OUT, 'embeds'))
    R = json.load(open(os.path.join(SRC, 'data', 'releases.json')))
    C = json.load(open(os.path.join(SRC, 'data', 'coverage.json')))
    M = json.load(open(os.path.join(SRC, 'data', 'merch.json')))
    rp, R = release_pages(R)
    pages = [parse(f) for f in sorted(glob.glob(os.path.join(SRC, 'pages', '*.html')))]
    pages += rp + [press_index(R, C), merch_page(M)]
    urls = []
    KNOWN.update(m['path'] for m, _ in pages)
    for meta, body in pages:
        body = body.replace('{{home_news}}', home_news(R))
        write(meta['path'], render(meta, body))
        if not meta.get('noindex'): urls.append(meta['path'])
        if meta['path'] == '/':
            m2 = dict(meta); m2['path'] = '/home'; m2['canon'] = '/'; m2['noindex'] = '1'
            write('/home', render(m2, body))
    # 404 uses absolute links, it is served at any depth
    m404 = {'path': '/404', 'title': 'Page not found | GFA LAW, PLLC', 'short': 'Page not found', 'desc': 'This page could not be found.', 'noindex': '1'}
    b404 = '''<section class="sec"><div class="wrap center"><p class="eyebrow">Error 404</p><h1>Page not found</h1><p class="lede">The page you are looking for has moved or no longer exists.</p>
<div class="btns"><a class="btn" href="/">Go to the home page</a><a class="btn ghost" href="/contact/contact-gfa-law">Request a Case Review</a></div></div></section>'''
    d404 = render(m404, b404).replace('href="../', 'href="/').replace('src="../', 'src="/')
    open(os.path.join(OUT, '404.html'), 'w', encoding='utf-8').write(d404)
    # study portal: hidden page, never indexed or linked
    sp = open(os.path.join(SRC, 'static', 'study-portal.src.html'), encoding='utf-8').read()
    sp = re.sub(r'<head([^>]*)>', lambda m: '<head' + m.group(1) + '><meta name="robots" content="noindex,nofollow">', sp, count=1)
    os.makedirs(os.path.join(OUT, 'study-portal'), exist_ok=True)
    open(os.path.join(OUT, 'study-portal', 'index.html'), 'w', encoding='utf-8').write(sp)
    os.remove(os.path.join(OUT, 'study-portal.src.html'))
    # tool pages: links inside a framed tool open in the full window
    for t in glob.glob(os.path.join(OUT, '*.html')):
        ts = open(t, encoding='utf-8').read()
        if 'gfa-framed' in ts and '<base target="_top">' not in ts:
            open(t, 'w', encoding='utf-8').write(ts.replace('<meta charset="utf-8">', '<meta charset="utf-8"><base target="_top">', 1))
    os.makedirs(os.path.join(OUT, 'press-releases'), exist_ok=True)
    open(os.path.join(OUT, 'press-releases', 'feed.xml'), 'w', encoding='utf-8').write(feed(R))
    today = NOW.date().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        loc = SITE + ('/' if u == '/' else u + '/')
        sm.append(f'<url><loc>{loc}</loc><lastmod>{today}</lastmod></url>')
    sm.append(f'<url><loc>{SITE}/know-your-rights-guide.pdf</loc></url>')
    sm.append('</urlset>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w').write('\n'.join(sm) + '\n')
    open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /embeds/\nSitemap: {SITE}/sitemap.xml\n')
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    open(os.path.join(OUT, 'CNAME'), 'w').write('www.gfalaw.us\n')
    print('built', len(urls), 'pages into _site/')
