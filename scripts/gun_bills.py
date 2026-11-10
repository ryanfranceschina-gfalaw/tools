#!/usr/bin/env python3
"""Gun bill tracker: pull firearm-related bills and their official text.

Sources (official only):
  Texas    capitol.texas.gov filed-bill reports + bill text PDFs
  Federal  govinfo.gov BILLSTATUS bulk data + bill text PDFs
  Maryland mgaleg.maryland.gov open-data legislation.json + bill PDFs

Writes src/data/gun-bills.json and copies each bill's latest official text
PDF to src/assets/bills/. Sorting (pro / anti / neutral), exclusions and
forced inclusions live in src/data/gun-bills-curated.json, which is edited
by hand (or by the Friday task) and is never overwritten here.

Run from the repository root:  python3 scripts/gun_bills.py
"""
import datetime as dt
import html
import io
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from concurrent.futures import ThreadPoolExecutor

T0 = time.time()


def log(*a):
    print(f'[{time.time() - T0:6.0f}s]', *a, flush=True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'src', 'data', 'gun-bills.json')
CUR = os.path.join(ROOT, 'src', 'data', 'gun-bills-curated.json')
PDFDIR = os.path.join(ROOT, 'src', 'assets', 'bills')
UA = {'User-Agent': 'GFA-LAW-bill-tracker/1.0 (+https://www.gfalaw.us/resources/gun-bill-tracker)'}

TX_SESSIONS = [('90R', '90th Legislature, Regular Session')]
TX_START = {'90R': dt.date(2027, 1, 12)}
# Recently enacted Texas laws (shown as "recent changes"): only bills signed or filed without signature
TX_ENACTED = [('89R', '89th Legislature, Regular Session (2025)'), ('891', '89th Legislature, 1st Called Session (2025)'),
              ('892', '89th Legislature, 2nd Called Session (2025)'),
              ('88R', '88th Legislature, Regular Session (2023)'), ('881', '88th Legislature, 1st Called Session (2023)'),
              ('882', '88th Legislature, 2nd Called Session (2023)'), ('883', '88th Legislature, 3rd Called Session (2023)'),
              ('884', '88th Legislature, 4th Called Session (2023)'),
              ('87R', '87th Legislature, Regular Session (2021)'), ('871', '87th Legislature, 1st Called Session (2021)'),
              ('872', '87th Legislature, 2nd Called Session (2021)'), ('873', '87th Legislature, 3rd Called Session (2021)')]
MAX_PDF = 4_000_000  # larger official PDFs are linked, not copied
US_CONGRESSES = [119]
MD_SESSIONS = ['2026RS', '2027RS', '2025RS', '2024RS', '2023RS']
MD_PASSED_ONLY = {'2025RS', '2024RS', '2023RS'}  # earlier sessions: enacted laws only

KW = re.compile(r'firearm|handgun|\bguns?\b|\brifles?\b|shotgun|ammunition|\bweapons?\b|license to carry|'
                r'concealed carry|suppressor|silencer|second amendment|bump stock|machine ?gun|'
                r'\bknife|\bknives|switchblade|body armor', re.I)
US_KW = re.compile(r'firearm|handgun|\bguns?\b(?! lake)|\brifles?\b|shotgun|ammunition|concealed carry|'
                   r'suppressor|silencer|second amendment|bump stock|machine ?gun|assault weapon|'
                   r'right to keep and bear|gun violence|ghost gun|\bATF\b|National Firearms Act', re.I)
NOT_GUN = re.compile(r'weapons? of mass destruction|nuclear weapon|chemical weapon|biological weapon|'
                     r'hypersonic weapon|directed energy weapon|gun lake|weapons system|weapon system|'
                     r'cyber ?weapon|weapons? programs?', re.I)


def get(url, binary=False, tries=3, timeout=60):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                b = r.read()
                return b if binary else b.decode('utf-8', 'replace')
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 + 3 * i)
    raise last


OLD = {}


def head_ok(url):
    try:
        req = urllib.request.Request(url, headers=UA, method='HEAD')
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status == 200 and 'pdf' in (r.headers.get('Content-Type') or 'pdf').lower()
    except Exception:  # noqa: BLE001
        return False


def clean(s):
    s = html.unescape(re.sub(r'<[^>]+>', ' ', s or ''))
    return re.sub(r'\s+', ' ', s).strip()


def mdy(s):
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})', s or '')
    return f'{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}' if m else ''


# ---------------------------------------------------------------- Texas
TX_PFX = {'HB': 'HB', 'SB': 'SB', 'HJR': 'HJ', 'SJR': 'SJ', 'HCR': 'HC', 'SCR': 'SC'}


def tx_status(action, session_open):
    a = action.lower()
    if 'effective' in a or 'signed by the governor' in a:
        return 'Signed into law', 'passed'
    if 'sent to the governor' in a or 'enrolled' in a:
        return 'Passed the Legislature', 'passed'
    if 'vetoed' in a:
        return 'Vetoed', 'dead'
    if re.search(r'\bfiled\b', a) and not re.search(r'referred|reported|passed|read', a):
        return ('Prefiled' if not session_open else 'Filed'), 'proposed'
    if 'passed' in a or 'reported' in a or 'referred' in a or 'read' in a:
        return 'In the Legislature', 'proposed'
    return 'Filed', 'proposed'


def texas(cur, force):
    out = []
    prev_all = OLD
    jobs = [(s_, n_, ('housefiled', 'senatefiled'), False) for s_, n_ in TX_SESSIONS] + \
           [(s_, n_, ('signedbygov', 'filedwogovsign'), True) for s_, n_ in TX_ENACTED]
    seen = set()
    for sess, sess_name, reports, enacted in jobs:
        start = TX_START.get(sess, dt.date.today())
        session_open = dt.date.today() >= start
        for rid in reports:
            try:
                page = get(f'https://capitol.texas.gov/Reports/Report.aspx?LegSess={sess}&ID={rid}', timeout=120)
            except Exception as e:  # noqa: BLE001
                raise RuntimeError(f'TX report failed {sess} {rid}: {e}')
            for m in re.finditer(r'Bill=([A-Z]+)(\d+)">.*?Author</b>:\s*</div>\s*<div[^>]*>(.*?)</div>.*?'
                                 r'Last Action:</b></div>\s*<div[^>]*>(.*?)</div>.*?Caption</b>:\s*</div>\s*<div[^>]*>(.*?)</div>',
                                 page, re.S):
                typ, num, author, action, caption = m.group(1), int(m.group(2)), clean(m.group(3)), clean(m.group(4)), clean(m.group(5))
                bid = f'tx-{sess.lower()}-{typ.lower()}{num}'
                if bid in seen or bid in cur['exclude']:
                    continue
                if not (KW.search(caption) or bid in force) or (NOT_GUN.search(caption) and bid not in force):
                    continue
                seen.add(bid)
                status, cat = tx_status(action, session_open)
                if enacted:
                    status, cat = ('Signed into law' if rid == 'signedbygov' else 'Became law without signature'), 'passed'
                hist = f'https://capitol.texas.gov/BillLookup/History.aspx?LegSess={sess}&Bill={typ}{num}'
                base = f'https://capitol.texas.gov/tlodocs/{sess}/billtext/pdf/{TX_PFX.get(typ, typ)}{num:05d}'
                pv = prev_all.get(bid, {})
                reuse = pv.get('textSource') and pv.get('lastAction') == re.sub(r'^\d{1,2}/\d{1,2}/\d{4}\s*', '', action)
                pdf = (pv['textSource'], pv.get('textVersion', '')) if reuse else ('?' + base, '')
                out.append({
                    'id': bid, 'juris': 'TX', 'jurisName': 'Texas', 'session': sess_name, 'legSession': sess,
                    'number': f'{typ} {num}', 'title': caption, 'sponsor': author,
                    'status': status, 'category': cat,
                    'lastAction': re.sub(r'^\d{1,2}/\d{1,2}/\d{4}\s*', '', action),
                    'lastActionDate': mdy(action), 'filed': mdy(action) if status in ('Prefiled', 'Filed') else '',
                    'official': hist, 'textSource': pdf[0] if pdf else '', 'textVersion': pdf[1] if pdf else '',
                })
            time.sleep(1)
        log('TX', sess, 'done', len(out))

    def probe(b):
        if b['textSource'].startswith('?'):
            base = b['textSource'][1:]
            b['textSource'], b['textVersion'] = '', ''
            for ver in ('F', 'S', 'E', 'H', 'I'):
                if head_ok(base + ver + '.pdf'):
                    b['textSource'], b['textVersion'] = base + ver + '.pdf', ver
                    break
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(probe, out))
    log('TX probed', len(out))
    return out


# ---------------------------------------------------------------- Federal
def x(el, path, default=''):
    f = el.find(path)
    return (f.text or '').strip() if f is not None and f.text else default


def federal(cur, force):
    out = []
    for cong in US_CONGRESSES:
        for typ in ('hr', 's', 'hjres', 'sjres'):
            try:
                z = zipfile.ZipFile(io.BytesIO(get(f'https://www.govinfo.gov/bulkdata/BILLSTATUS/{cong}/{typ}/BILLSTATUS-{cong}-{typ}.zip', True, timeout=300)))
            except Exception as e:  # noqa: BLE001
                if typ in ('hr', 's'):
                    raise RuntimeError(f'US zip failed {cong} {typ}: {e}')
                print('US zip failed', cong, typ, e)
                continue
            log('US zip', cong, typ)
            for name in z.namelist():
                if not name.endswith('.xml'):
                    continue
                try:
                    root = ET.fromstring(z.read(name))
                except ET.ParseError:
                    continue
                b = root.find('bill')
                if b is None:
                    continue
                num = x(b, 'number')
                bid = f'us-{cong}-{typ}{num}'
                if bid in cur['exclude']:
                    continue
                title = x(b, 'title')
                subjects = [clean(s.text) for s in b.findall('subjects/legislativeSubjects/item/name') if s.text]
                hit = 'Firearms and explosives' in subjects or (US_KW.search(title) and not NOT_GUN.search(title))
                if not (hit or bid in force):
                    continue
                types = [x(t, 'type') for t in b.findall('textVersions/item')]
                laws = b.findall('laws/item')
                la_text, la_date = x(b, 'latestAction/text'), x(b, 'latestAction/actionDate')
                if laws:
                    status, cat = f"Became law ({x(laws[0], 'type')} {x(laws[0], 'number')})", 'passed'
                elif any('Enrolled' in t for t in types) or re.search(r'presented to president', la_text, re.I):
                    status, cat = 'Passed Congress', 'passed'
                elif re.search(r'vetoed', la_text, re.I):
                    status, cat = 'Vetoed', 'dead'
                elif any('Engrossed in House' in t for t in types):
                    status, cat = 'Passed the House', 'proposed'
                elif any('Engrossed in Senate' in t for t in types):
                    status, cat = 'Passed the Senate', 'proposed'
                else:
                    status, cat = 'Introduced', 'proposed'
                pdf, ver = '', ''
                tv = sorted(b.findall('textVersions/item'), key=lambda t: x(t, 'date'), reverse=True)
                for t in tv:
                    u = x(t, 'formats/item/url')
                    if u:
                        pdf = re.sub(r'/(?:xml|uslm)/((?:BILLS|PLAW)-[^/]+)\.xml$', r'/pdf/\1.pdf', u)
                        ver = re.search(r'BILLS-\d+[a-z]+\d+([a-z]+)', u).group(1) if re.search(r'BILLS-\d+[a-z]+\d+([a-z]+)', u) else ''
                        break
                spon = b.find('sponsors/item')
                label = {'hr': 'H.R.', 's': 'S.', 'hjres': 'H.J.Res.', 'sjres': 'S.J.Res.'}[typ]
                cg = {'hr': 'house-bill', 's': 'senate-bill', 'hjres': 'house-joint-resolution', 'sjres': 'senate-joint-resolution'}[typ]
                out.append({
                    'id': bid, 'juris': 'US', 'jurisName': 'Federal', 'session': f'{cong}th Congress',
                    'number': f'{label} {num}', 'title': title,
                    'sponsor': x(spon, 'fullName') if spon is not None else '',
                    'status': status, 'category': cat, 'lastAction': la_text, 'lastActionDate': la_date,
                    'filed': x(b, 'introducedDate'),
                    'official': f'https://www.congress.gov/bill/{cong}th-congress/{cg}/{num}',
                    'textSource': pdf, 'textVersion': ver,
                })
    return out


# ---------------------------------------------------------------- Maryland
def maryland(cur, force):
    out = []
    for sess in MD_SESSIONS:
        try:
            data = json.loads(get(f'https://mgaleg.maryland.gov/{sess}/misc/billsmasterlist/legislation.json', timeout=180))
        except Exception as e:  # noqa: BLE001
            if sess == MD_SESSIONS[0]:
                raise RuntimeError(f'MD feed failed {sess}: {e}')
            print('MD feed not available', sess, e)
            continue
        year = int(sess[:4])
        over = dt.date.today() > dt.date(year, 4, 15)
        for b in data:
            bn = b.get('BillNumber', '')
            bid = f'md-{sess.lower()}-{bn.lower()}'
            if bid in cur['exclude']:
                continue
            subs = [s.get('Name', '') for s in (b.get('NarrowSubjects') or [])]
            title = b.get('Title', '')
            hit = any(s in ('Guns', 'Weapons -see also- Guns') for s in subs)
            if not (hit or bid in force):
                continue
            chap = b.get('ChapterNumber') or ''
            if sess in MD_PASSED_ONLY and not (chap or b.get('PassedByMGA')):
                continue
            st = b.get('Status') or ''
            if chap:
                status, cat = f'Signed into law (Chapter {chap})', 'passed'
            elif b.get('PassedByMGA'):
                status, cat = 'Passed the General Assembly', 'passed'
            elif over:
                status, cat = 'Did not pass', 'dead'
            elif st.lower().startswith('pre-filed') or 'prefiled' in st.lower():
                status, cat = 'Prefiled', 'proposed'
            else:
                status, cat = st or 'Introduced', 'proposed'
            kind = re.match(r'[A-Z]+', bn).group(0).lower()
            folder = {'hb': 'hb', 'sb': 'sb', 'hj': 'hj', 'sj': 'sj'}.get(kind, kind)
            pv = OLD.get(bid, {})
            if pv.get('textSource') and pv.get('lastAction') == st and pv.get('status') == status:
                pdf, ver = pv['textSource'], pv.get('textVersion', '')
            else:
                pdf, ver = '?' + '|'.join(f'https://mgaleg.maryland.gov/{sess}/bills/{folder}/{bn.lower()}{v}.pdf' for v in dict.fromkeys([(b.get('BillVersion') or '').lower(), 't', 'e', 'f']) if v), ''
            dates = [b.get(k) or '' for k in ('ThirdReadingDateOppositeHouse', 'ThirdReadingDateHouseOfOrigin',
                                             'SecondReadingDateHouseOfOrigin', 'ReportDateHouseOfOrigin',
                                             'FirstReadingDateHouseOfOrigin')]
            last = next((d[:10] for d in dates if d and d != 'null'), '')
            cross = b.get('CrossfileBillNumber') or ''
            out.append({
                'id': bid, 'juris': 'MD', 'jurisName': 'Maryland', 'session': f'{year} Regular Session',
                'number': re.sub(r'([A-Z]+)0*(\d+)', r'\1 \2', bn), 'title': title,
                'sponsor': b.get('SponsorPrimary', ''), 'status': status, 'category': cat,
                'lastAction': st, 'lastActionDate': (b.get('StatusCurrentAsOf') or last or '')[:10],
                'filed': (b.get('FirstReadingDateHouseOfOrigin') or '')[:10],
                'crossfile': re.sub(r'([A-Z]+)0*(\d+)', r'\1 \2', cross) if cross else '',
                'official': f'https://mgaleg.maryland.gov/mgawebsite/Legislation/Details/{bn.lower()}?ys={sess}',
                'textSource': pdf, 'textVersion': ver,
            })
        log('MD', sess, len(out))

    def probe(b):
        if b['textSource'].startswith('?'):
            urls = b['textSource'][1:].split('|')
            b['textSource'], b['textVersion'] = '', ''
            for u in urls:
                if head_ok(u):
                    b['textSource'], b['textVersion'] = u, re.search(r'([a-z])\.pdf$', u).group(1)
                    break
    with ThreadPoolExecutor(8) as ex:
        list(ex.map(probe, out))
    log('MD probed', len(out))
    return out


# ---------------------------------------------------------------- main
def main():
    os.makedirs(PDFDIR, exist_ok=True)
    cur = {'lean': {}, 'exclude': [], 'include': []}
    if os.path.exists(CUR):
        cur.update(json.load(open(CUR)))
    cur['exclude'] = set(cur.get('exclude', []))
    force = set(cur.get('include', []))
    old = {}
    if os.path.exists(DATA):
        old = {b['id']: b for b in json.load(open(DATA)).get('bills', [])}
    OLD.update(old)

    bills, ok = [], {}
    for name, fn in (('TX', texas), ('US', federal), ('MD', maryland)):
        try:
            got = fn(cur, force)
            ok[name] = True
        except Exception as e:  # noqa: BLE001
            print('Source failed', name, e)
            got, ok[name] = [b for b in old.values() if b['juris'] == name], False
        bills.extend(got)
        log(name, len(got))

    keep_files = set()

    def fetch(b):
        prev = old.get(b['id'], {})
        src = b.get('textSource')
        if not src:
            return
        fname = f"{b['id']}-{b.get('textVersion') or 'x'}.pdf"
        path = os.path.join(PDFDIR, fname)
        if not os.path.exists(path) and not (prev.get('textExternal') == src):
            try:
                data = get(src, binary=True, timeout=120)
                if data[:4] == b'%PDF' and len(data) > MAX_PDF:
                    b['textExternal'] = src
                elif data[:4] == b'%PDF':
                    open(path, 'wb').write(data)
            except Exception as e:  # noqa: BLE001
                print('PDF failed', b['id'], e)
        if prev.get('textExternal') == src:
            b['textExternal'] = src
        if os.path.exists(path):
            b['text'] = '/assets/bills/' + fname
            keep_files.add(fname)
        elif prev.get('text'):
            b['text'] = prev['text']
            keep_files.add(os.path.basename(prev['text']))

    for b in bills:
        b['lean'] = cur['lean'].get(b['id'], '')
        b['firstSeen'] = old.get(b['id'], {}).get('firstSeen') or dt.date.today().isoformat()
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(fetch, bills))
    log('PDFs done', len(keep_files))
    for f in os.listdir(PDFDIR):
        if f.endswith('.pdf') and f not in keep_files:
            os.remove(os.path.join(PDFDIR, f))

    bills.sort(key=lambda b: (b.get('lastActionDate') or b.get('filed') or ''), reverse=True)
    out = {'updated': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'),
           'sourcesOk': ok, 'count': len(bills),
           'unsorted': [b['id'] for b in bills if not b['lean'] and b['category'] != 'dead'],
           'bills': bills}
    json.dump(out, open(DATA, 'w'), indent=1, ensure_ascii=False)
    print('Total', len(bills), 'unsorted', len(out['unsorted']))


if __name__ == '__main__':
    sys.exit(main())
