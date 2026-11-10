#!/usr/bin/env python3
"""Refresh src/data/merch.json from the GFALAW Merch Etsy shop.

Needs the ETSY_API_KEY repository secret: your Etsy app's keystring and
shared secret joined by a colon (keystring:sharedsecret). Without it, or if
Etsy errors, the existing merch.json is left untouched.
"""
import json, os, re, sys, urllib.request, urllib.parse, datetime

KEY = os.environ.get('ETSY_API_KEY', '').strip()
SHOP = os.environ.get('ETSY_SHOP', 'GFALAWmerchandise')
PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'merch.json')
API = 'https://openapi.etsy.com/v3/application'

CATS = [('Hoodies & Polos', r'hoodie|sweatshirt|polo|crewneck|pullover'),
        ('Hats & Socks', r'\bhat\b|\bcap\b|beanie|sock'),
        ('Drinkware', r'mug|tumbler|cup|bottle|glass|koozie'),
        ('Stickers & Accessories', r'sticker|decal|patch|pin\b|keychain|magnet|phone case|tote|bag'),
        ('Home & Office', r'poster|print|canvas|blanket|pillow|mouse ?pad|notebook|journal|desk|flag|sign|ornament|calendar'),
        ('Collectibles', r'card|collect|coin|holographic'),
        ('T-Shirts', r't-?shirt|tee\b|shirt|tank')]

def get(url):
    req = urllib.request.Request(url, headers={'x-api-key': KEY, 'User-Agent': 'GFA LAW website merch refresh'})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)

def short_title(t):
    t = re.split(r'\s[|–—-]\s', t)[0].strip()
    return t[:90]

def main():
    if not KEY:
        print('ETSY_API_KEY not set; keeping the current merch list.'); return
    old = json.load(open(PATH))
    known = {re.sub(r'\D', '', i['url'].rsplit('/', 1)[-1]): i for i in old['items']}
    try:
        shops = get(f'{API}/shops?shop_name={urllib.parse.quote(SHOP)}')
        shop_id = shops['results'][0]['shop_id']
        items, offset = [], 0
        while True:
            page = get(f'{API}/shops/{shop_id}/listings/active?limit=100&offset={offset}&includes=Images')
            for L in page['results']:
                lid = str(L['listing_id'])
                img = (L.get('images') or [{}])[0].get('url_570xN', '')
                p = L.get('price') or {}
                amt = p.get('amount', 0) / (p.get('divisor') or 100)
                prev = known.get(lid)
                title = prev['title'] if prev else short_title(L['title'])
                cat = prev['cat'] if prev else next((c for c, rx in CATS if re.search(rx, L['title'], re.I)), 'Home & Office')
                items.append({'cat': cat, 'url': f'https://www.etsy.com/listing/{lid}', 'img': img or (prev or {}).get('img', ''),
                              'title': title, 'price': f'From ${amt:,.2f}'})
            offset += 100
            if offset >= page.get('count', 0) or not page['results']: break
    except Exception as e:
        print('Etsy refresh failed, keeping the current list:', e); return
    if not items:
        print('Etsy returned no active listings; keeping the current list.'); return
    out = {'categories': old['categories'], 'items': items,
           'updated': datetime.date.today().strftime('%B %-d, %Y')}
    if [i['url'] for i in items] == [i['url'] for i in old['items']] and [i['price'] for i in items] == [i['price'] for i in old['items']]:
        print('No merch changes.'); return
    json.dump(out, open(PATH, 'w'), indent=1)
    print(f'Merch updated: {len(items)} listings.')

if __name__ == '__main__':
    try:  # one-time download of the founders' portraits for the daily games
        sys.path.insert(0, os.path.dirname(__file__)); import fetch_portraits; fetch_portraits.main()
    except Exception as e:
        print('Portrait step skipped:', e)
    main()
