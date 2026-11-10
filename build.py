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
 'sms': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>',
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
   ('Federal Firearm Rights Restoration', '/about-the-firm/practice-areas/federal-firearm-rights-restoration', '', 1),
   ('Areas We Serve', '/areas-we-serve', 'Central Texas and statewide', 0),
   ('CJ Grisham', '/about-the-firm/cj-grisham', 'Senior Partner', 0),
   ('Ryan Franceschina', '/about-the-firm/ryan-franceschina', 'Managing Partner', 0),
   ('On the Radio', '/about-the-firm/on-the-radio', 'Hear us on KMIL 105.1 FM', 0),
   ('David T. Amad 1791 Scholarship', '/about-the-firm/david-t-amad-1791-scholarship-application', '', 0)]),
 ('Resources', [('Search the Site', '/search', 'Find any page, guide or tool', 0),
   ('Know Your Rights', '/resources/know-your-rights', 'Plain-English guides to Texas law', 0),
   ('Videos', '/videos', 'Lessons, case updates and testimony', 0),
   ('Pocket Constitution', '/constitution', 'Every article and amendment', 0)]),
 ('Gun Bills', '/resources/gun-bill-tracker'),
 ('Daily Game', '/trivia'),
 ('Press', '/press-releases'),
 ('Contact', [('Contact GFA LAW', '/contact/contact-gfa-law', 'Request a case review', 0), ('What Happens Next', '/contact/what-happens-next', 'Review, consultation and fees', 0), ('FAQ', '/contact/faq', '', 0),
   ('Payments', '/payments', 'Consultation fee', 0), ('Socials', '/contact/socials', '', 0), ('Español', '/es', '', 0),
   ('Complaints', '/complaints', 'GFA HR Department Portal', 0)]),
 ('Merch', '/merch'),
 ('Client Login', 'https://www.mycase.com/login'),
]
TITLES = {}  # path -> short name, for breadcrumbs
for name, tgt in NAV:
    if isinstance(tgt, str): TITLES[tgt] = name
    else:
        for n, p, _, _ in tgt: TITLES[p] = n
TITLES.update({'/about-the-firm': 'About the Firm', '/contact': 'Contact', '/press-releases': 'Press Releases', '/tools': 'Tools', '/resources': 'Resources'})

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
            if tgt.startswith('http'):
                ac = ' class="ext" target="_blank" rel="noopener"'
            hot = ' class="hot"' if tgt == '/resources/gun-bill-tracker' else ''
            out.append(f'<li><a href="{tgt}"{hot}{ac}>{esc(name)}</a></li>')
        else:
            out.append(f'<li><button type="button" aria-haspopup="true" aria-expanded="false">{esc(name)}{ICON["chev"]}</button><ul class="sub">')
            for n, p, sm, ind in tgt:
                ac = ' aria-current="page"' if p == cur else ''
                small = f'<small>{esc(sm)}</small>' if sm else ''
                out.append(f'<li><a class="{"in" if ind else ""}" href="{p}"{ac}><span>{esc(n)}{small}</span></a></li>')
            out.append('</ul></li>')
    out.append('<li class="m-cta"><a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a></li>')
    out.append('<li class="m-cta"><a class="btn ghost" href="tel:+12544051726">Call 254-405-1726</a></li>')
    out.append('<li class="m-cta"><a class="btn ghost" href="sms:+12544051726">Text 254-405-1726</a></li>')
    out.append('</ul>')
    return ''.join(out)

ES_PAIRS = {'/': '/es', '/about-the-firm/practice-areas': '/es/areas-de-practica', '/contact/contact-gfa-law': '/es/contacto'}

def hreflang(path):
    en = {v: k for k, v in ES_PAIRS.items()}
    if path in ES_PAIRS: pair = (path, ES_PAIRS[path])
    elif path in en: pair = (en[path], path)
    else: return ''
    u = lambda p: '@@SITE@@' + ('/' if p == '/' else p + '/')
    return (f'<link rel="alternate" hreflang="en" href="{u(pair[0])}">'
            f'<link rel="alternate" hreflang="es" href="{u(pair[1])}">'
            f'<link rel="alternate" hreflang="x-default" href="{u(pair[0])}">\n')

def crumbs(path, title):
    parts = path.strip('/').split('/') if path != '/' else []
    items = [('Home', '/')]
    if parts and parts[0] == 'es':
        items = [('Inicio', '/es')]
        parts = parts[1:]
        acc = '/es'
        for i, p in enumerate(parts):
            acc += '/' + p
            items.append((title if i == len(parts) - 1 else TITLES.get(acc, p), acc))
        return items
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

FIRM = {"@type": ["LegalService", "LocalBusiness", "Attorney"], "@id": FIRM_ID, "name": "GFA LAW, PLLC",
        "legalName": "Grisham Franceschina Attorneys-at-Law, PLLC", "url": SITE + "/",
        "telephone": "+1-254-405-1726", "email": "intake@gfalaw.us",
        "image": SITE + "/assets/img/og-gfa-law.jpg", "logo": SITE + "/assets/img/seal-300.png",
        "address": ADDR, "geo": {"@type": "GeoCoordinates", "latitude": 31.0982, "longitude": -97.3080},
        "areaServed": [{"@type": "State", "name": "Texas"},
                       {"@type": "City", "name": "Temple, Texas"}, {"@type": "City", "name": "Belton, Texas"}, {"@type": "City", "name": "Killeen, Texas"},
                       {"@type": "City", "name": "Waco, Texas"}, {"@type": "City", "name": "Austin, Texas"},
                       {"@type": "AdministrativeArea", "name": "Bell County, Texas"}, {"@type": "AdministrativeArea", "name": "Coryell County, Texas"},
                       {"@type": "AdministrativeArea", "name": "McLennan County, Texas"}, {"@type": "AdministrativeArea", "name": "Williamson County, Texas"}],
        "hasMap": "https://www.google.com/maps/search/?api=1&query=4970+E+Business+190+Temple+TX+76501",
        "contactPoint": [{"@type": "ContactPoint", "telephone": "+1-254-405-1726", "contactType": "customer service", "areaServed": ["US-TX"], "availableLanguage": ["English", "Spanish"]}],
        "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Legal services", "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Section 1983 civil rights lawsuits", "url": SITE + "/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Criminal defense (Innocent Defense)", "url": SITE + "/about-the-firm/practice-areas/innocent-defense"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Firearm rights, firearm return and expunction", "url": SITE + "/about-the-firm/practice-areas/firearm-rights-and-expunction"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Federal firearm rights restoration (18 U.S.C. 925(c))", "url": SITE + "/tools/restore-my-rights"}}]},
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
<p><a href="tel:+12544051726">254-405-1726</a> (call or <a href="sms:+12544051726">text</a>)<br><a href="mailto:intake@gfalaw.us">intake@gfalaw.us</a><br>Media: <a href="mailto:press@gfalaw.us">press@gfalaw.us</a></p></div>
<div><p class="fh">Practice</p><ul><li><a href="/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits">Civil Rights Lawsuits</a></li><li><a href="/about-the-firm/practice-areas/innocent-defense">Innocent Defense</a></li><li><a href="/about-the-firm/practice-areas/firearm-rights-and-expunction">Firearm Rights and Expunction</a></li><li><a href="/about-the-firm/practice-areas/federal-firearm-rights-restoration">Federal Rights Restoration</a></li><li><a href="/about-the-firm/practice-areas">All Practice Areas</a></li></ul></div>
<div><p class="fh">Firm</p><ul><li><a href="/about-the-firm">About the Firm</a></li><li><a href="/about-the-firm/cj-grisham">CJ Grisham</a></li><li><a href="/about-the-firm/ryan-franceschina">Ryan Franceschina</a></li><li><a href="/press-releases">Press Releases</a></li><li><a href="/about-the-firm/david-t-amad-1791-scholarship-application">1791 Scholarship</a></li><li><a href="/merch">Merch</a></li></ul></div>
<div><p class="fh">Get Help</p><ul><li><a href="/contact/contact-gfa-law">Request a Case Review</a></li><li><a href="/tools/case-review-finder">Case Review Finder</a></li><li><a href="/payments">Payments</a></li><li><a href="/contact/faq">FAQ</a></li><li><a href="/es">Español</a></li><li><a href="/contact/socials">Socials</a></li><li><a href="/videos">Videos</a></li><li><a href="/complaints">Complaints</a></li></ul></div>
</div>
<div class="legal">
<p>Lawyers responsible for the content of this website are Ryan Franceschina and CJ Grisham. Primary practice location: Temple, Texas. The attorneys of GFA LAW, PLLC are not certified by the Texas Board of Legal Specialization.</p>
<p>The information provided on this website is for general informational purposes only and does not constitute legal advice. No attorney-client relationship is formed by viewing this site or contacting the firm through this website. Past results do not guarantee future outcomes.</p>
<p>&copy; YEAR GFA LAW, PLLC. All rights reserved. <a href="/privacy-policy">Privacy Policy</a></p>
</div></div></footer>
<nav class="callbar" aria-label="Quick contact"><a class="btn" href="tel:+12544051726">CALLICON Call</a><a class="btn ghost" href="sms:+12544051726">SMSICON Text</a><a class="btn ghost" href="/contact/contact-gfa-law">Case Review</a></nav>'''

SIDE_PRACTICE = '''<aside class="side">
<div class="side-card"><h3>Talk to GFA LAW</h3><p>Requesting a case review is free. If we can help, the consultation is $350.</p>
<a class="btn" href="/contact/contact-gfa-law">Request a Case Review</a><a class="btn ghost" href="tel:+12544051726">Call 254-405-1726</a></div>
<div class="side-card"><h3 style="font-size:18px">Practice Areas</h3><ul>
<li><a href="/about-the-firm/practice-areas/section-1983-civil-rights-lawsuits">Section 1983 Civil Rights Lawsuits</a></li>
<li><a href="/about-the-firm/practice-areas/innocent-defense">Innocent Defense</a></li>
<li><a href="/about-the-firm/practice-areas/firearm-rights-and-expunction">Firearm Rights and Expunction</a></li>
<li><a href="/about-the-firm/practice-areas/federal-firearm-rights-restoration">Federal Firearm Rights Restoration</a></li>
</ul></div>
</aside>'''

LEGAL_ES = '''<div class="legal" lang="es">
<p>Los abogados responsables del contenido de este sitio web son Ryan Franceschina y CJ Grisham. Lugar principal de práctica: Temple, Texas. Los abogados de GFA LAW, PLLC no están certificados por la Junta de Especialización Legal de Texas (Texas Board of Legal Specialization).</p>
<p>La información de este sitio web es solo de carácter general y no constituye asesoría legal. Ver este sitio o comunicarse con la firma no crea una relación abogado-cliente. Los resultados anteriores no garantizan resultados futuros.</p>
</div>'''

def foot_for(meta):
    f = expand(FOOTER, meta).replace('YEAR', str(NOW.year))
    if meta.get('lang') == 'es':
        f = f.replace('<div class="legal">', LEGAL_ES + '\n<div class="legal">', 1)
        f = f.replace('<nav class="callbar" aria-label="Quick contact">', '<nav class="callbar" aria-label="Contacto rápido" lang="es">')
        f = f.replace(ICON['phone'] + ' Call</a><a class="btn ghost" href="sms:+12544051726">' + ICON['sms'] + ' Text</a><a class="btn ghost" href="/contact/contact-gfa-law">Case Review</a>', ICON['phone'] + ' Llamar</a><a class="btn ghost" href="sms:+12544051726">' + ICON['sms'] + ' Texto</a><a class="btn ghost" href="/es/contacto">Revisión de caso</a>')
    return f

def expand(body, meta):
    body = body.replace('{{band}}', FOOT).replace('{{side:practice}}', SIDE_PRACTICE)
    body = re.sub(r'\{\{icon:(\w+)\}\}', lambda m: ICON[m.group(1)], body)
    body = re.sub(r'\{\{pic:([^|}]+)\|([^|}]*)\|(\d+)\|(\d+)(?:\|([^|}]*))?(?:\|(eager))?\}\}',
                  lambda m: picture(m.group(1), m.group(2), m.group(3), m.group(4), m.group(5) or '', bool(m.group(6))), body)
    body = re.sub(r'<div class="tool" data-src="([^"]+)"></div>',
                  lambda m: f'<div class="tool-frame"><iframe class="emb auto" src="/{m.group(1)}" title="{esc(meta["title"].split(" - ")[-1])}" scrolling="no"></iframe></div>', body)
    body = re.sub(r'<div class="emb" data-src="([^"]+)"></div>',
                  lambda m: f'<iframe class="emb auto" src="/embeds/{m.group(1)}.html" title="{esc(meta["title"].split(" - ")[-1])}" scrolling="no"></iframe>', body)
    body = body.replace('CALLICON', ICON['phone']).replace('SMSICON', ICON['sms'])
    return body

def faq_ld(body):
    qs = re.findall(r'<summary>(.*?)</summary>\s*<div class="a">(.*?)</div>\s*</details>', body, re.S)
    if not qs: return None
    clean = lambda t: html.unescape(re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', t))).strip()
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": clean(q),
            "acceptedAnswer": {"@type": "Answer", "text": clean(a)}} for q, a in qs]}

def make_og(meta):
    """Per-page share image (1200x630). Falls back to the default image if Pillow is missing."""
    default = SITE + '/assets/img/og-gfa-law.jpg'
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return default
    fdir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scripts', 'fonts')
    try:
        tf = ImageFont.truetype(os.path.join(fdir, 'Playfair.ttf'), 64)
        try: tf.set_variation_by_name('Bold')
        except Exception: pass
        sf = ImageFont.truetype(os.path.join(fdir, 'Inter.ttf'), 26)
        try: sf.set_variation_by_name('SemiBold')
        except Exception: pass
    except Exception:
        return default
    title = (meta.get('ogtitle') or meta.get('short') or meta['title'].split(' | ')[0]).strip()
    slug = meta['path'].strip('/').replace('/', '--') or 'home'
    W, H = 1200, 630
    im = Image.new('RGB', (W, H), (16, 33, 15))
    d = ImageDraw.Draw(im)
    for y in range(H):  # soft vertical gradient
        t = y / H
        d.line([(0, y), (W, y)], fill=(int(16 + 10 * (1 - t)), int(33 + 16 * (1 - t)), int(15 + 8 * (1 - t))))
    seal = Image.open(os.path.join(SRC, 'assets', 'img', 'seal-300.png')).convert('RGBA').resize((300, 300))
    im.paste(seal, (W - 300 - 70, (H - 300) // 2), seal)
    gold = (201, 165, 75)
    d.rectangle([70, 92, 130, 95], fill=gold)
    d.text((146, 76), 'GFA LAW, PLLC', font=sf, fill=gold)
    # wrap title to the left column
    words, lines, cur = title.split(), [], ''
    maxw = W - 70 - 300 - 70 - 60
    size = 64
    while True:
        lines, cur = [], ''
        for w in words:
            test = (cur + ' ' + w).strip()
            if d.textlength(test, font=tf) <= maxw: cur = test
            else:
                if cur: lines.append(cur)
                cur = w
        if cur: lines.append(cur)
        if len(lines) <= 4 or size <= 40: break
        size -= 6; tf = tf.font_variant(size=size)
        try: tf.set_variation_by_name('Bold')
        except Exception: pass
    lh = int(size * 1.18)
    sub = meta.get('ogsub', '')
    y = (H - lh * len(lines) - (54 if sub else 0)) // 2
    for ln in lines:
        d.text((70, y), ln, font=tf, fill=(247, 242, 229)); y += lh
    if sub:
        sub2 = sub
        while d.textlength(sub2, font=sf) > maxw and len(sub2) > 10: sub2 = sub2[:-2]
        if sub2 != sub: sub2 = sub2.rstrip(' ,.;:') + '\u2026'
        d.text((70, y + 18), sub2, font=sf, fill=(196, 190, 168))
    d.text((70, H - 96), 'gfalaw.us  \u00b7  254-405-1726  \u00b7  Temple, Texas', font=sf, fill=(226, 198, 124))
    os.makedirs(os.path.join(OUT, 'assets', 'og'), exist_ok=True)
    im.save(os.path.join(OUT, 'assets', 'og', slug + '.jpg'), quality=86, optimize=True)
    return SITE + '/assets/og/' + slug + '.jpg'

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
    graph = [FIRM, {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "GFA LAW, PLLC", "publisher": {"@id": FIRM_ID}, "inLanguage": "en-US",
             "potentialAction": {"@type": "SearchAction", "target": SITE + "/search?q={search_term_string}", "query-input": "required name=search_term_string"}}] if path == '/' else [FIRM]
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
{hreflang(path)}
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
<main id="main"{'' if (meta.get('noindex') or meta.get('hidden')) else ' data-pagefind-body'}>
{body}
</main>
{foot_for(meta)}
<script src="/assets/site.js?v={V}" defer></script>
<script src="/assets/fun.js?v={V}" defer></script>
</body>
</html>
'''
    doc = fix_links(doc, prefix).replace('@@CANON@@', canon).replace('@@SITE@@', SITE)
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

def videos_page(V):
    secs = []
    for g in V:
        cards = ''.join(f'''<div class="vcard rv"><button class="vid" type="button" data-yt="{esc(v["id"])}" aria-label="Play video: {esc(v["title"])}"><img src="https://i.ytimg.com/vi/{esc(v["id"])}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async"><span class="play" aria-hidden="true"></span><span class="len" aria-hidden="true">{esc(v["len"])}</span></button><div class="bd"><h3>{esc(v["title"])}</h3>{("<p>" + esc(v["note"]) + "</p>") if v["note"] else ""}<a class="more" href="https://www.youtube.com/watch?v={esc(v["id"])}" target="_blank" rel="noopener">Watch on YouTube</a></div></div>''' for v in g['items'])
        secs.append(f'<h2>{esc(g["group"])}</h2><div class="vgrid">{cards}</div>')
    body = f'''<section class="phero"><div class="wrap">{{{{crumbs}}}}
<p class="eyebrow">Watch</p><h1>Videos</h1>
<p class="lede">Know-your-rights lessons, case updates and testimony from GFA LAW. More videos are on our <a href="https://www.youtube.com/@gfalaw" target="_blank" rel="noopener">GFA Law HQ YouTube channel</a>.</p>
<div class="btns"><a class="btn" href="https://www.youtube.com/@gfalaw" target="_blank" rel="noopener">{ICON["youtube"]} Subscribe on YouTube</a></div>
</div></section>
<section class="sec"><div class="wrap vsecs">{"".join(secs)}
<p class="sm" style="margin-top:30px">Videos play from YouTube. Preview images come from YouTube, and the video player loads only when you press play. Videos are general information, not legal advice for your situation.</p>
</div></section>
{{{{band}}}}'''
    meta = {'path': '/videos', 'title': 'Videos | GFA LAW, PLLC', 'short': 'Videos', 'schema': 'CollectionPage',
            'desc': 'Know-your-rights videos, case updates and legislative testimony from GFA LAW, PLLC, civil rights and Second Amendment attorneys in Temple, Texas.'}
    return meta, body

def home_news(R):
    return ''.join(f'''<a class="card news-card rv" href="/press-releases/{r["id"]}"><div class="meta"><span>{fmt_date(r["date"])}</span></div><h3>{esc(r["title"])}</h3><p>{esc(r["sub"])}</p><span class="more">Read release</span></a>''' for r in R[:3])


def const_body(e):
    out = ''
    if e.get('sections'):
        for sx in e['sections']:
            lab = ('<b>Section %s.</b> ' % sx['n']) if sx.get('n') else ''
            parts = sx['text'].split('\n\n')
            out += '<p class="sx">' + lab + esc(parts[0]) + '</p>' + ''.join('<p class="sx">' + esc(x) + '</p>' for x in parts[1:])
            for am in sx.get('amended', []):
                out += '<p class="sm">The passage beginning "' + esc(' '.join(am['passage'].split()[:8])) + '..." was changed by ' + esc(am['by']) + '.</p>'
    else:
        out += ''.join('<p>' + esc(x) + '</p>' for x in e['text'].split('\n\n'))
    for c in e.get('closing', []):
        out += '<p class="sm">' + esc(c) + '</p>'
    if e.get('footnote'): out += '<p class="sm">' + esc(e['footnote']) + '</p>'
    return out

def const_meta_line(e):
    r = ' &middot; Ratified ' + fmt_date(e['ratified']) if e.get('ratified') else ''
    return '<p class="topic">' + esc(e.get('topic', 'We the People')) + r + '</p>'

LB_URL = ''  # Google Apps Script web app URL for the trivia leaderboard
CONST_FONT = '<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Pinyon+Script&display=swap" rel="stylesheet">'

def const_pages(J):
    pages = []
    toc = ''.join('<a href="#%s">%s</a>' % (e['id'], esc(e['short'])) for e in J)
    blocks = ''
    for e in J:
        blocks += ('<div class="cblock" id="%s"><h2>%s</h2>%s<div class="ctext">%s</div>'
                   '<div class="tools"><a class="btn sm ghost" href="/constitution/%s">Share %s</a></div></div>') % (
                   e['id'], esc(e['title']), const_meta_line(e), const_body(e), e['id'], esc(e['short']))
    body = ('<section class="phero"><div class="wrap">{{crumbs}}\n<p class="eyebrow">Pocket Constitution</p><h1 class="chead">The Constitution of the United States</h1>\n'
            '<p class="lede">The full text of the Constitution and all 27 amendments, from the National Archives transcription. Every article and amendment has its own page you can share.</p>\n'
            '<div class="btns"><a class="btn" href="#amendment-1">Jump to the Bill of Rights</a><a class="btn ghost" href="/trivia">Test yourself with daily trivia</a></div>\n</div></section>\n'
            '<section class="sec tight"><div class="wrap" style="max-width:860px"><nav class="toc" aria-label="Articles and amendments">' + toc + '</nav>' + blocks +
            '<p class="sm" style="margin-top:30px">Text from the National Archives transcription of the Constitution and amendments, with original spelling and punctuation. Portions of the original text have been changed by later amendments, as noted. This page is general information, not legal advice.</p></div></section>{{band}}')
    pages.append(({'path': '/constitution', 'title': 'The U.S. Constitution, Full Text | Pocket Constitution | GFA LAW, PLLC',
                   'desc': 'Read the full text of the U.S. Constitution and all 27 amendments, including the Bill of Rights, with a shareable page for every article and amendment.',
                   'short': 'Pocket Constitution', 'schema': 'CollectionPage', 'head': CONST_FONT, 'ogsub': 'Every article and amendment, free to read and share'}, body))
    for i, e in enumerate(J):
        prev = J[i - 1] if i else None
        nxt = J[i + 1] if i + 1 < len(J) else None
        first = (e.get('text') or e['sections'][0]['text']).split('\n\n')[0]
        snippet = first if len(first) <= 150 else first[:147].rsplit(' ', 1)[0] + '...'
        hist = '<p class="sm">' + esc(e['history']) + '</p>' if e.get('history') else ''
        slot = '<div data-seal-slot="a2" style="margin-top:18px"></div>' if e['id'] == 'amendment-2' else ''
        pn = '<div class="btns">'
        if prev: pn += '<a class="btn ghost sm" href="/constitution/%s">&larr; %s</a>' % (prev['id'], esc(prev['short']))
        if nxt: pn += '<a class="btn ghost sm" href="/constitution/%s">%s &rarr;</a>' % (nxt['id'], esc(nxt['short']))
        pn += '<a class="btn ghost sm" href="/constitution">Full Constitution</a></div>'
        body = ('<section class="phero"><div class="wrap">{{crumbs}}\n<p class="eyebrow">Pocket Constitution</p><h1 class="chead">' + esc(e['title']) + '</h1>' + const_meta_line(e) + '\n</div></section>\n'
                '<section class="sec tight"><div class="wrap" style="max-width:860px"><div class="ctext">' + const_body(e) + '</div>' + hist +
                '<div class="btns"><button class="btn sm" type="button" data-share="' + esc(e['title']) + '">Share</button><a class="btn sm ghost" href="#" data-copy>Copy link</a></div>\n'
                + pn + slot + '<p class="sm" style="margin-top:30px">Text from the National Archives transcription. This page is general information, not legal advice.</p></div></section>{{band}}')
        kind = 'to' if e['id'].startswith('amendment') else 'of'
        pages.append(({'path': '/constitution/' + e['id'], 'title': e['title'] + ' | Full Text | Pocket Constitution | GFA LAW, PLLC',
                       'desc': '%s %s the U.S. Constitution, full text: "%s"' % (e['title'], kind, snippet),
                       'short': e['title'], 'head': CONST_FONT, 'ogtitle': e['title'], 'ogsub': e.get('topic', 'We the People of the United States')}, body))
    return pages


LEAN = {'pro': 'Pro-gun', 'anti': 'Anti-gun', 'neutral': 'Neutral', '': 'Not yet sorted'}
CATL = {'proposed': 'Proposed', 'passed': 'Passed', 'dead': 'Did not pass'}

def fdate(s):
    try:
        d = datetime.date.fromisoformat((s or '')[:10]); return '%d/%d/%d' % (d.month, d.day, d.year)
    except ValueError:
        return ''

TX_LAWS = [('Penal Code 46.02', 'Unlawful carrying of a handgun: who may not carry, and how a handgun may be carried', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.02'), ('Penal Code 46.03', 'Places where weapons are prohibited', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.03'), ('Penal Code 46.04', 'Unlawful possession of a firearm, including by a person convicted of a felony', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.04'), ('Penal Code 46.05', 'Prohibited weapons, such as machine guns, explosive weapons and armor-piercing ammunition', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.05'), ('Penal Code 46.06', 'Unlawful transfer of certain weapons, including to minors', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.06'), ('Penal Code 46.13', 'Making a firearm accessible to a child', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.46.htm#46.13'), ('Government Code ch. 411, subch. H', 'The License to Carry a Handgun; section 411.172 sets eligibility, generally age 21', 'https://statutes.capitol.texas.gov/Docs/GV/htm/GV.411.htm#H'), ('Local Government Code 229.001', 'Limits on city regulation of firearms, ammunition and accessories', 'https://statutes.capitol.texas.gov/Docs/LG/htm/LG.229.htm#229.001'), ('Penal Code 30.05, 30.06, 30.07', 'Trespass notices: firearms generally, and concealed or open carry by license holders', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.30.htm#30.06'), ('Penal Code 9.31, 9.32, 9.41, 9.42', 'Self-defense, deadly force, and protection of property', 'https://statutes.capitol.texas.gov/Docs/PE/htm/PE.9.htm#9.31'), ('Code of Criminal Procedure art. 18.191', 'Firearms seized when a person is taken into custody for mental health reasons', 'https://statutes.capitol.texas.gov/Docs/CR/htm/CR.18.htm#18.191')]
MD_LAWS = [('Public Safety 5-117.1', 'Handgun Qualification License, required to buy, rent or receive a handgun (with exceptions)', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gps&section=5-117.1&enactments=false'), ('Public Safety Title 5, Subtitle 1', 'Regulated firearms: sales, transfers and who may possess them (starting at 5-101)', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gps&section=5-101&enactments=false'), ('Public Safety Title 5, Subtitle 3', 'Permits to wear, carry or transport a handgun (starting at 5-301)', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gps&section=5-301&enactments=false'), ('Criminal Law 4-203', 'Wearing, carrying or transporting a handgun, and the exceptions', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcr&section=4-203&enactments=false'), ('Criminal Law 4-111', 'Carrying a firearm in specified locations', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcr&section=4-111&enactments=false'), ('Criminal Law 4-303', 'Assault weapons', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcr&section=4-303&enactments=false'), ('Criminal Law 4-305', 'Detachable magazines holding more than 10 rounds: manufacture, sale, purchase, receipt and transfer', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcr&section=4-305&enactments=false'), ('Criminal Law 4-104', 'Leaving a loaded firearm where an unsupervised minor can reach it', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gcr&section=4-104&enactments=false'), ('Public Safety Title 5, Subtitle 6', 'Extreme risk protective orders (starting at 5-601)', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gps&section=5-601&enactments=false'), ('Public Safety Title 5, Subtitle 7', 'Unfinished frames and receivers, and unserialized firearms (starting at 5-701)', 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gps&section=5-701&enactments=false')]

def law_panel(key, title, items, src):
    if not items: return ''
    rows = ''.join('<li><a href="%s" target="_blank" rel="noopener"><b>%s</b></a><span>%s</span></li>' % (esc(u), esc(c), esc(d)) for c, d, u in items)
    return ('<details class="lawpanel" data-for="%s"><summary><span class="eyebrow">Current law</span> %s</summary>'
            '<ul class="lawlist">%s</ul><p class="sm">Links open the official text at %s. Laws change; the official site has the current version.</p></details>') % (key, title, rows, src)

def bill_tab(b):
    if b['juris'] == 'TX':
        return 'TX' if b.get('legSession', '90R') == '90R' and not re.match(r'8\d', b['session']) else 'TX25'
    return b['juris']

def bill_pages():
    p = os.path.join(SRC, 'data', 'gun-bills.json')
    D = json.load(open(p)) if os.path.exists(p) else {'bills': [], 'updated': ''}
    cp = os.path.join(SRC, 'data', 'gun-bills-curated.json')
    CU = json.load(open(cp)) if os.path.exists(cp) else {}
    lean, excl = CU.get('lean', {}), set(CU.get('exclude', []))
    bills = [dict(b, lean=lean.get(b['id'], b.get('lean', ''))) for b in D.get('bills', []) if b['id'] not in excl]
    for b in bills: b['tab'] = bill_tab(b)
    base = '/resources/gun-bill-tracker'
    upd = D.get('updated', '')
    upd_txt = fdate(upd[:10]) if upd else 'pending first update'
    def card(b):
        q = (b['number'] + ' ' + b['title'] + ' ' + b.get('sponsor', '') + ' ' + b['jurisName']).lower()
        meta = []
        if b.get('sponsor'): meta.append(esc(b['sponsor']))
        d = fdate(b.get('filed'))
        if d: meta.append(('Filed ' if b['juris'] != 'US' else 'Introduced ') + d)
        if b['tab'] != 'TX': meta.append(esc(b['session']))
        return ('<article class="bill" data-j="%s" data-c="%s" data-q="%s"><div class="bhead"><span class="bnum"><span class="bj">%s</span> %s</span>'
                '<span class="bst st-%s">%s</span></div><p class="btitle">%s</p><p class="bmeta">%s</p>'
                '<div class="bact"><a class="btn sm" href="%s/%s">Read the bill</a><a class="btn sm ghost" href="%s" target="_blank" rel="noopener">Official page</a></div></article>') % (
                b['tab'], b['category'], esc(q), {'TX': 'TX', 'TX25': 'TX', 'US': 'U.S.', 'MD': 'MD'}[b['tab']], esc(b['number']), b['category'], esc(b['status']),
                esc(b['title']), ' &middot; '.join(meta), base, b['id'], esc(b['official']))
    cols = ''
    for key in ('pro', 'anti', 'neutral', ''):
        bs = [b for b in bills if b['lean'] == key]
        if not bs and key in ('neutral', ''): continue
        cols += ('<section class="bcol bcol-%s" aria-labelledby="h-%s"><h3 id="h-%s">%s <span class="bcount" data-count></span></h3>%s<p class="bnone" hidden>No bills match these filters.</p></section>') % (
            key or 'unsorted', key or 'unsorted', key or 'unsorted', LEAN[key], ''.join(card(b) for b in bs))
    def cnt(tab, lean_=None):
        return sum(1 for b in bills if b['tab'] == tab and (lean_ is None or b['lean'] == lean_))
    stats = {t: [cnt(t), cnt(t, 'pro'), cnt(t, 'anti'), cnt(t, 'neutral')] for t in ('TX', 'TX25', 'US', 'MD')}
    game = [{'n': ('Texas ' if b['juris'] == 'TX' else 'Federal ' if b['juris'] == 'US' else 'Maryland ') + b['number'], 't': b['title'], 'l': b['lean'], 'u': base + '/' + b['id']}
            for b in bills if b['lean'] in ('pro', 'anti') and b['tab'] in ('TX', 'TX25', 'US')]
    tabs = [('TX', '90th Texas Legislature', 'Bills filed for 2027'), ('TX25', 'Recent Texas laws', 'Passed 2021 to 2025'), ('US', 'Federal', '119th Congress'), ('MD', 'Maryland', 'Bills and recent laws')]
    tabhtml = ''.join('<button type="button" role="tab" class="btab%s" data-v="%s" aria-selected="%s"><b>%s</b><small>%s</small><span class="bt-n">%d</span></button>' % (
        ' on' if t == 'TX' else '', t, 'true' if t == 'TX' else 'false', n, s, stats[t][0]) for t, n, s in tabs)
    steps = [('Prefiling', 'Bills for the 90th Legislature could be filed starting November 9, 2026. Every bill filed so far appears on this page.'),
             ('Session opens', 'The regular session convenes January 12, 2027, and can last no longer than 140 days (Tex. Const. art. III, sec. 24), through May 31, 2027.'),
             ('Committee', 'Each bill is referred to a committee in the House or Senate, which can hold a public hearing and vote the bill out.'),
             ('Both chambers', 'To pass, a bill must be approved by both the House and the Senate in the same form.'),
             ('The governor', 'The governor can sign, veto, or let a bill become law without a signature. While the Legislature is in session the governor has 10 days, Sundays excepted; after adjournment, a veto must be filed within 20 days (Tex. Const. art. IV, sec. 14).'),
             ('Effective date', 'A new law ordinarily takes effect 90 days after the session adjourns, unless two-thirds of each house votes for an earlier date (Tex. Const. art. III, sec. 39).')]
    tl = ''.join('<li><span class="tl-n">%d</span><div><h3>%s</h3><p>%s</p></div></li>' % (i + 1, h, t) for i, (h, t) in enumerate(steps))
    recent = [('2025', 'New Texas gun laws', 'The 89th Legislature passed new laws on handgun licenses, reciprocity with other states, short-barreled firearms, local firearm regulation and more. Read every one in the <a href="#TX25" data-tabjump="TX25">Recent Texas laws</a> tab.'),
              ('Jan. 1, 2026', 'The NFA tax drops to $0', 'The federal making and transfer tax is now $0 for suppressors, short-barreled rifles and shotguns, and "any other weapons" (26 U.S.C. 5811, 5821). Machine guns and destructive devices still carry the $200 tax, and NFA registration and approval are still required.'),
              ('2025', '<i>Bondi v. VanDerStok</i>', 'The Supreme Court rejected a facial challenge to the ATF rule treating certain weapon parts kits and partially complete frames or receivers as "firearms" (604 U.S. 458).'),
              ('2025', '<i>Smith &amp; Wesson v. Mexico</i>', 'The Supreme Court held that the Protection of Lawful Commerce in Arms Act bars Mexico\'s lawsuit against American gun manufacturers (605 U.S. 280).'),
              ('2024', '<i>United States v. Rahimi</i>', 'The Supreme Court upheld the federal law that temporarily disarms a person subject to a domestic violence restraining order after a court finds the person is a credible threat (602 U.S. 680).'),
              ('2024', '<i>Garland v. Cargill</i>', 'The Supreme Court held that a bump stock is not a "machinegun" under federal law (602 U.S. 406).')]
    rc = ''.join('<article class="lcard"><p class="eyebrow">%s</p><h3>%s</h3><p>%s</p></article>' % r for r in recent)
    longs = [('The Second Amendment', 'The Supreme Court has held that the Second Amendment protects an individual right to keep and bear arms (<i>District of Columbia v. Heller</i>, 2008), that it applies to the states (<i>McDonald v. City of Chicago</i>, 2010), and that it covers carrying a handgun in public for self-defense, with gun laws judged against the nation\'s historical tradition of firearm regulation (<i>N.Y. State Rifle &amp; Pistol Ass\'n v. Bruen</i>, 2022).', ''),
             ('The Texas Constitution', 'Article I, section 23: "Every citizen shall have the right to keep and bear arms in the lawful defence of himself or the State; but the Legislature shall have power, by law, to regulate the wearing of arms, with a view to prevent crime."', ''),
             ('Permitless carry', 'Since September 1, 2021 (H.B. 1927, the Firearm Carry Act of 2021), Texans 21 and older who are not otherwise prohibited can carry a handgun, openly in a holster or concealed, without a license (Penal Code 46.02).', '/resources/know-your-rights/carrying-a-handgun-in-texas'),
             ('Why a License to Carry still matters', 'A license helps with carry in other states that recognize it and with certain locations. License holders are also subject to "30.06" and "30.07" notices, written signs or oral notice that a property owner forbids concealed or open carry (Penal Code 30.06, 30.07).', '/resources/know-your-rights/carrying-a-handgun-in-texas'),
             ('Places weapons are prohibited', 'Penal Code 46.03 lists places where weapons are off limits, such as polling places during voting, courts and court offices, racetracks, secured airport areas and certain businesses that serve alcohol.', ''),
             ('Defending your home, car or business', 'Texas law presumes deadly force was reasonable against someone who unlawfully and forcibly enters your occupied home, vehicle or place of business, if you did not provoke them and were not engaged in other criminal activity. There is no duty to retreat where you have a right to be (Penal Code 9.32).', '/resources/know-your-rights')]
    lc = ''.join('<article class="lcard"><h3>%s</h3><p>%s</p>%s</article>' % (h, t, ('<a class="more" href="%s">Learn more</a>' % u) if u else '') for h, t, u in longs)
    body = ('<section class="phero bhero"><div class="wrap">{{crumbs}}\n<p class="eyebrow">90th Texas Legislature &middot; 2027 Session</p><h1>Texas Gun Bill Tracker</h1>\n'
            '<p class="lede">Every firearm and weapons bill filed for the 2027 Texas legislative session, sorted as pro-gun or anti-gun, with the official text one click away. We also track Congress and Maryland.</p>\n'
            '<div class="bcount-pill" id="bcd" aria-live="polite">Session opens January 12, 2027</div>'
            '<div class="bstats" id="bstats" data-stats=\'%s\'><div class="bs"><b data-k="0">%d</b><span>Bills tracked</span></div><div class="bs bs-pro"><b data-k="1">%d</b><span>Pro-gun</span></div><div class="bs bs-anti"><b data-k="2">%d</b><span>Anti-gun</span></div><div class="bs"><b data-k="3">%d</b><span>Neutral</span></div></div>'
            '<p class="sm">Updated from official sources every night. Last updated %s.</p></div></section>\n'
            '<section class="sec tight"><div class="wrap">'
            '<div class="btabs" role="tablist" aria-label="Choose a legislature">%s</div>'
            '<div class="bfilters" role="group" aria-label="Filter bills">'
            '<div class="chips" data-f="c"><button type="button" class="chip on" aria-pressed="true" data-v="proposed">Proposed</button><button type="button" class="chip on" aria-pressed="true" data-v="passed">Passed</button><button type="button" class="chip" aria-pressed="false" data-v="dead">Did not pass</button></div>'
            '<label class="vh" for="bq">Search bills</label><input id="bq" class="search" type="search" placeholder="Search by number, title or author"></div>'
            '%s<div class="bcols">%s</div></div></section>\n'
            '<section class="sec bgame-sec"><div class="wrap" style="max-width:820px"><div class="sec-head center"><p class="eyebrow">Play</p><h2>Pro-gun or anti-gun? You make the call</h2><p>Read a real bill title and guess how it would affect lawful gun owners. Then read the bill and decide for yourself.</p></div>'
            '<div class="game bgame" id="bgame"><p class="q">Loading a bill...</p></div></div></section>\n'
            '<section class="sec"><div class="wrap"><div class="sec-head"><p class="eyebrow">How It Works</p><h2>How a Texas bill becomes law</h2></div><ol class="btl">%s</ol></div></section>\n'
            '<section class="sec alt"><div class="wrap"><div class="sec-head"><p class="eyebrow">Recent Changes</p><h2>What changed lately</h2></div><div class="lgrid">%s</div></div></section>\n'
            '<section class="sec"><div class="wrap"><div class="sec-head"><p class="eyebrow">The Foundation</p><h2>Long-standing gun law every Texan should know</h2></div><div class="lgrid">%s</div>'
            '<div class="btns" style="margin-top:26px"><a class="btn" href="/resources/know-your-rights">Read our Know Your Rights guides</a><a class="btn ghost" href="/constitution">Read the Pocket Constitution</a><a class="btn ghost" href="/trivia">Daily trivia</a></div>'
            '<p class="sm" style="margin-top:28px">Bills come from the Texas Legislature, the U.S. Government Publishing Office and the Maryland General Assembly. Titles, captions, statuses and bill text are the official versions those bodies publish. GFA LAW sorts each bill as pro-gun (expands or protects the right to keep and bear arms), anti-gun (restricts it) or neutral; new bills show as "Not yet sorted" until we review them. Always check the official page for the latest action. This page is general information, not legal advice.</p>'
            '</div></section>\n'
            '<script>window.BILLGAME=%s;</script>'
            '<script>(function(){var tab="TX",f={proposed:1,passed:1},q="",S=JSON.parse(document.getElementById("bstats").dataset.stats);'
            'function run(){document.querySelectorAll(".bcol").forEach(function(col){var n=0,lim=col.dataset.all||q?1e9:10;col.querySelectorAll(".bill").forEach(function(b){var ok=b.dataset.j===tab&&f[b.dataset.c]&&(!q||b.dataset.q.indexOf(q)>-1);if(ok)n++;b.hidden=!ok||n>lim});col.querySelector("[data-count]").textContent="("+n+")";col.querySelector(".bnone").hidden=n>0;var m=col.querySelector(".bmore");if(!m){m=document.createElement("button");m.type="button";m.className="btn sm ghost bmore";m.onclick=function(){col.dataset.all=col.dataset.all?"":"1";run()};col.appendChild(m)}m.hidden=n<=10||!!q;m.textContent=col.dataset.all?"Show fewer":"Show all "+n});'
            'var s=S[tab];document.querySelectorAll("#bstats [data-k]").forEach(function(e){e.textContent=s[+e.dataset.k]})}'
            'function setTab(v){tab=v;document.querySelectorAll(".btab").forEach(function(x){var on=x.dataset.v===v;x.classList.toggle("on",on);x.setAttribute("aria-selected",on)});'
            'if(v==="TX25"){f.dead=0;}document.querySelectorAll(".lawpanel").forEach(function(p){p.hidden=p.dataset.for.split(" ").indexOf(v)<0});history.replaceState(null,"","#"+v);run()}'
            'document.querySelectorAll(".btab").forEach(function(b){b.onclick=function(){setTab(b.dataset.v)}});'
            'document.querySelectorAll("[data-tabjump]").forEach(function(a){a.onclick=function(e){e.preventDefault();setTab(a.dataset.tabjump);document.querySelector(".btabs").scrollIntoView({behavior:"smooth"})}});'
            'document.querySelector(".chips[data-f=c]").addEventListener("click",function(e){var c=e.target.closest(".chip");if(!c)return;c.classList.toggle("on");c.setAttribute("aria-pressed",c.classList.contains("on"));f[c.dataset.v]=c.classList.contains("on")?1:0;run()});'
            'var i=document.getElementById("bq");i.addEventListener("input",function(){q=i.value.trim().toLowerCase();run()});'
            'var h=(location.hash||"").slice(1).toUpperCase();setTab(/^(TX|TX25|US|MD)$/.test(h)?h:"TX");'
            'var cd=document.getElementById("bcd"),now=new Date(),st=new Date(2027,0,12),en=new Date(2027,4,31,23,59),day=864e5;'
            'if(now<st){var d=Math.ceil((st-now)/day);cd.innerHTML="<b>"+d+"</b> days until the 90th Legislature convenes on January 12, 2027"}else if(now<=en){cd.innerHTML="Session is live: <b>Day "+(Math.floor((now-st)/day)+1)+"</b> of 140"}else{cd.textContent="The 2027 regular session adjourned May 31, 2027"}'
            'var G=window.BILLGAME||[],box=document.getElementById("bgame"),sc={r:0,n:0};function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}'
            'function play(){if(!G.length){box.innerHTML="<p>Check back soon.</p>";return}var b=G[Math.floor(Math.random()*G.length)];'
            'box.innerHTML="<p class=\\"eyebrow\\">"+esc(b.n)+"</p><p class=\\"q\\">"+esc(b.t)+"</p><div class=\\"btns\\" style=\\"margin-top:6px\\"><button class=\\"btn bpro\\" type=\\"button\\" data-g=\\"pro\\">Pro-gun</button><button class=\\"btn banti\\" type=\\"button\\" data-g=\\"anti\\">Anti-gun</button></div><div id=\\"bgfb\\"></div>";'
            'box.querySelectorAll("[data-g]").forEach(function(x){x.onclick=function(){var ok=x.dataset.g===b.l;sc.n++;if(ok)sc.r++;box.querySelectorAll("[data-g]").forEach(function(y){y.disabled=true});if(window.gtag)gtag("event","bill_game",{correct:ok});'
            'document.getElementById("bgfb").innerHTML="<div class=\\"fb "+(ok?"ok":"no")+"\\"><b>"+(ok?"You called it.":"We sorted this one differently.")+"</b> GFA LAW sorted this bill as <b>"+(b.l==="pro"?"pro-gun":"anti-gun")+"</b>. Score: "+sc.r+" of "+sc.n+".</div><div class=\\"btns\\" style=\\"margin-top:0\\"><a class=\\"btn sm\\" href=\\""+b.u+"\\">Read the bill</a><button class=\\"btn sm ghost\\" type=\\"button\\" id=\\"bgn\\">Next bill</button></div>";document.getElementById("bgn").onclick=play;if(sc.n>=3&&window.GFA&&GFA.find)GFA.find("bills")}})}play()})()</script>{{band}}') % (
            json.dumps(stats), stats['TX'][0], stats['TX'][1], stats['TX'][2], stats['TX'][3], upd_txt, tabhtml, law_panel('TX TX25', 'Texas gun law: the main statutes', TX_LAWS, 'statutes.capitol.texas.gov') + law_panel('MD', 'Maryland gun law: the main statutes', MD_LAWS, 'mgaleg.maryland.gov'), cols, tl, rc, lc, json.dumps(game, ensure_ascii=False).replace('</', '<\\/'))
    pages = [({'path': base, 'title': 'Texas Gun Bill Tracker: 2027 Session Firearm Bills | GFA LAW, PLLC',
               'desc': 'Track every firearm bill filed for the 2027 Texas legislative session, sorted as pro-gun or anti-gun, with official bill text, new Texas gun laws, and federal and Maryland bills.',
               'short': 'Gun Bill Tracker', 'schema': 'CollectionPage', 'ogsub': 'Every 2027 Texas gun bill, sorted pro and anti, with the official text'}, body)]
    for b in bills:
        rows = [('Jurisdiction', b['jurisName']), ('Session', b['session']), ('Sponsor' if b['juris'] != 'TX' else 'Author', b.get('sponsor', '')),
                ('Status', b['status']), ('Last action', ((fdate(b.get('lastActionDate')) + ': ') if b.get('lastActionDate') else '') + b.get('lastAction', '')),
                ('Filed' if b['juris'] != 'US' else 'Introduced', fdate(b.get('filed'))), ('Cross-filed with', b.get('crossfile', ''))]
        tbl = ''.join('<tr><th scope="row">%s</th><td>%s</td></tr>' % (k, esc(v)) for k, v in rows if v)
        if b.get('text'):
            viewer = ('<div class="billview" data-pdf="%s"><p class="bload">Loading the official bill text...</p></div>'
                      '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>'
                      '<script>(function(){var el=document.querySelector(".billview"),url=el.dataset.pdf;if(!window.pdfjsLib){el.innerHTML=\'<p>The bill viewer could not load. <a href="\'+url+\'">Open the bill text (PDF)</a>.</p>\';return}'
                      'pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";'
                      'pdfjsLib.getDocument(url).promise.then(function(pdf){el.innerHTML="";var w=Math.min(el.clientWidth,900),chain=Promise.resolve();for(var i=1;i<=pdf.numPages;i++){(function(n){chain=chain.then(function(){return pdf.getPage(n).then(function(pg){var v1=pg.getViewport({scale:1}),s=w/v1.width,dpr=window.devicePixelRatio||1,v=pg.getViewport({scale:s*dpr}),c=document.createElement("canvas");c.width=v.width;c.height=v.height;c.style.width=(v.width/dpr)+"px";c.setAttribute("aria-label","Page "+n+" of "+pdf.numPages);c.className="bpage";el.appendChild(c);return pg.render({canvasContext:c.getContext("2d"),viewport:v}).promise})})})(i)}'
                      'return chain.then(function(){if(window.GFA&&GFA.find)GFA.find("billtext")})}).catch(function(){el.innerHTML=\'<p>The bill text could not be displayed here. <a href="\'+url+\'">Open the bill text (PDF)</a>.</p>\'})})()</script>') % b['text']
            dl = '<a class="btn sm ghost" href="%s" download>Download PDF</a>' % b['text']
        elif b.get('textExternal'):
            viewer = '<p>This bill is too large to display here. <a href="%s" target="_blank" rel="noopener">Open the official bill text (PDF)</a>.</p>' % esc(b['textExternal'])
            dl = ''
        else:
            viewer = '<p>The official text of this bill has not been published yet. Check the <a href="%s" target="_blank" rel="noopener">official bill page</a>.</p>' % esc(b['official'])
            dl = ''
        lb = '<span class="blean bl-%s">%s</span>' % (b['lean'] or 'unsorted', LEAN[b['lean']])
        body = ('<section class="phero"><div class="wrap">{{crumbs}}\n<p class="eyebrow">Gun Bill Tracker &middot; %s</p><h1>%s</h1>\n<p class="lede">%s</p>'
                '<p>%s <span class="bst st-%s">%s</span></p></div></section>\n'
                '<section class="sec tight"><div class="wrap" style="max-width:940px"><table class="btbl">%s</table>'
                '<div class="btns"><a class="btn sm" href="%s" target="_blank" rel="noopener">Official bill page</a>%s<a class="btn sm ghost" href="%s#%s">Back to the tracker</a></div>'
                '<h2 style="margin-top:30px">Official bill text</h2>%s'
                '<p class="sm" style="margin-top:24px">Text as published by the %s. Check the official bill page for later versions and actions. This page is general information, not legal advice.</p></div></section>{{band}}') % (
                esc(b['jurisName']), esc(b['number']), esc(b['title']), lb, b['category'], esc(b['status']), tbl, esc(b['official']), dl, base, b['tab'], viewer,
                {'TX': 'Texas Legislature', 'US': 'U.S. Government Publishing Office', 'MD': 'Maryland General Assembly'}[b['juris']])
        t = '%s %s' % (b['jurisName'] if b['juris'] != 'US' else 'Federal', b['number'])
        pages.append(({'path': base + '/' + b['id'], 'title': '%s: %s | Gun Bill Tracker | GFA LAW, PLLC' % (t, b['title'][:70]),
                       'desc': ('%s (%s). Status: %s. Read the official bill text.' % (b['title'][:150], b['session'], b['status'])),
                       'short': t, 'ogimg': SITE + '/assets/img/og-gfa-law.jpg'}, body))
    return pages


VAULT_CODE = 'HUNT1791'
VAULT_TERMS = '15% off GFA LAW merchandise in our Etsy shop, one use per Etsy buyer. The button below applies the code automatically, or enter it at Etsy checkout. Merch only: it has no connection to legal services or fees. Etsy promotion terms apply, and the offer may end at any time.'

def vault_page(M):
    items = M['items'][:12]
    cards = ''.join('<a class="mcard" href="%s" target="_blank" rel="noopener"><div class="im"><img src="%s" alt="%s" loading="lazy" decoding="async" width="570" height="570"></div><div class="bd"><span class="tt">%s</span><span class="pr">%s</span></div></a>' % (esc(i['url']), esc(i['img']), esc(i['title']), esc(i['title']), esc(i['price'])) for i in items)
    body = ('<section class="phero"><div class="wrap">{{crumbs}}\n<p class="eyebrow">Members of the 1791 Club only</p><h1>The Merch Vault</h1>\n'
            '<p class="lede">You found the vault. Seal hunters get a reward on official GFA LAW gear.</p></div></section>\n'
            '<section class="sec tight"><div class="wrap">'
            '<div id="vlock" hidden><p class="lede">The vault is sealed. Find all ten 1791 seals hidden across the site to open it. <a href="/1791">See your progress</a>.</p></div>'
            '<div id="vopen" hidden><p>Your code:</p><div class="code-box"><span id="vcode"></span><button class="btn sm" type="button" id="vcp">Copy</button></div>'
            '<p class="sm">' + esc(VAULT_TERMS) + '</p>'
            '<div class="btns"><a class="btn" id="vshop" href="https://www.etsy.com/shop/GFALAWmerchandise" target="_blank" rel="noopener">' + ICON['shop'] + ' Shop with my code</a><a class="btn ghost" href="/1791/certificate">Print your certificate</a></div>'
            '<h2 style="margin-top:48px">Vault picks</h2><div class="merch-grid">' + cards + '</div></div>'
            '</div></section>\n'
            '<script>document.addEventListener("DOMContentLoaded",function(){var G=window.GFA,ok=G&&G.got().length>=G.SEALS.length;document.getElementById(ok?"vopen":"vlock").hidden=false;if(!ok)return;'
            'var c=["HUNT","1791"].join("");document.getElementById("vcode").textContent=c;document.getElementById("vshop").href="https://gfalawmerchandise.etsy.com?coupon="+c;if(window.gtag)gtag("event","vault_open");'
            'document.getElementById("vcp").onclick=function(){var b=this;if(navigator.clipboard)navigator.clipboard.writeText(c).then(function(){b.textContent="Copied"})}})</script>')
    meta = {'path': '/vault', 'title': 'The Merch Vault | GFA LAW, PLLC', 'short': 'The Merch Vault', 'desc': 'A secret reward for 1791 Hunt finishers.', 'noindex': '1', 'hidden': '1'}
    return meta, body

if __name__ == '__main__':
    if os.path.exists(OUT): shutil.rmtree(OUT)
    shutil.copytree(os.path.join(SRC, 'static'), OUT)
    shutil.copytree(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))
    shutil.copytree(os.path.join(SRC, 'embeds'), os.path.join(OUT, 'embeds'))
    R = json.load(open(os.path.join(SRC, 'data', 'releases.json')))
    C = json.load(open(os.path.join(SRC, 'data', 'coverage.json')))
    M = json.load(open(os.path.join(SRC, 'data', 'merch.json')))
    V = json.load(open(os.path.join(SRC, 'data', 'videos.json')))
    rp, R = release_pages(R)
    pages = [parse(f) for f in sorted(glob.glob(os.path.join(SRC, 'pages', '*.html')))]
    pages += rp + [press_index(R, C), merch_page(M), videos_page(V)]
    CJ = json.load(open(os.path.join(SRC, 'assets', 'fun', 'constitution.json')))
    pages += const_pages(CJ)
    pages.append(vault_page(M))
    pages += bill_pages()
    TRIVIA_WIDGET = '<p><a class="btn" href="/trivia">Play today&rsquo;s Daily Game</a></p>'  # the daily game lives on /trivia
    urls = []
    KNOWN.update(m['path'] for m, _ in pages)
    for meta, body in pages:
        body = body.replace('{{home_news}}', home_news(R))
        body = body.replace('__LB_URL__', LB_URL)
        if '{{trivia_widget}}' in body:
            body = body.replace('{{trivia_widget}}', TRIVIA_WIDGET)
        if not meta.get('noindex') and not meta.get('ogimg') and meta['path'] != '/':
            meta['ogimg'] = make_og(meta)
        write(meta['path'], render(meta, body))
        if not meta.get('noindex'): urls.append(meta['path'])
        if meta['path'] == '/':
            m2 = dict(meta); m2['path'] = '/home'; m2['canon'] = '/'; m2['noindex'] = '1'
            write('/home', render(m2, body))
    # 404 uses absolute links, it is served at any depth
    m404 = {'path': '/404', 'title': 'Page not found | GFA LAW, PLLC', 'short': 'Page not found', 'desc': 'This page could not be found.', 'noindex': '1'}
    b404 = '''<section class="sec"><div class="wrap center"><p class="eyebrow">Error 404</p><h1>This page is exercising its right to remain silent</h1><p class="lede">We searched, but without a warrant we could not find the page you asked for. It may have moved, or it never existed.</p>
<p>While you are here: try the <a href="/trivia">daily Constitution trivia</a>, check the <a href="/resources/gun-bill-tracker">Gun Bill Tracker</a>, or <a href="/games">visit the game room</a>.</p>
<div data-seal-slot="lost" style="margin:6px 0 0"></div>
<div class="btns"><a class="btn" href="/">Go to the home page</a><a class="btn ghost" href="/contact/contact-gfa-law">Request a Case Review</a></div>
<form class="hsearch" action="/search/" method="get" role="search"><label class="vh" for="q404">Search the site</label><input id="q404" name="q" type="search" placeholder="Search the site"><button class="btn" type="submit">Search</button></form></div></section>'''
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
    sm.append('</urlset>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w').write('\n'.join(sm) + '\n')
    open(os.path.join(OUT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /embeds/\nSitemap: {SITE}/sitemap.xml\n')
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    open(os.path.join(OUT, 'CNAME'), 'w').write('www.gfalaw.us\n')
    print('built', len(urls), 'pages into _site/')
