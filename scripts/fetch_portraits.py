"""Download public-domain portraits of the founders for the daily games.

Runs inside the nightly website workflow (called from refresh_merch.py), because
the build machine can reach Wikimedia Commons. Each portrait is a public-domain
painting; the source file is listed in PORTRAITS so it can be credited. Files that
already exist are left alone, so this only downloads once.
"""
import hashlib, os, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'img', 'founders')
PORTRAITS = {
    'washington': 'Gilbert_Stuart_Williamstown_Portrait_of_George_Washington.jpg',
    'franklin': 'Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg',
    'jefferson': 'Official_Presidential_portrait_of_Thomas_Jefferson_(by_Rembrandt_Peale,_1800).jpg',
    'adams': 'Gilbert_Stuart,_John_Adams,_c._1800-1815,_NGA_42933.jpg',
    'hamilton': 'Alexander_Hamilton_(NPG).jpg',
    'jay': 'John_Jay_(Gilbert_Stuart_portrait).jpg',
    'madison': 'James_Madison.jpg',
}

def url(name, width=330):
    h = hashlib.md5(name.encode()).hexdigest()
    q = urllib.parse.quote(name)
    return f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{width}px-{q}'

def main():
    os.makedirs(OUT, exist_ok=True)
    for key, name in PORTRAITS.items():
        dest = os.path.join(OUT, key + '.jpg')
        if os.path.exists(dest):
            continue
        try:
            req = urllib.request.Request(url(name), headers={'User-Agent': 'GFALAW-website/1.0 (https://www.gfalaw.us)'})
            data = urllib.request.urlopen(req, timeout=30).read()
            if data[:2] != b'\xff\xd8':
                raise ValueError('not a JPEG')
            open(dest, 'wb').write(data)
            print('Saved portrait', key, len(data), 'bytes')
        except Exception as e:
            print('Portrait download failed for', key, e)

# Other source images the website needs, downloaded once into incoming/ (not published) for editing.
EXTRA = {
    'incoming/cj-grisham-headshot-original.jpg': 'https://bloximages.newyork1.vip.townnews.com/tdtnews.com/content/tncms/assets/v3/editorial/0/c2/0c2bb8bc-c080-4d00-b1db-4dfe0d209984/67f400e4e5420.image.jpg',
}

def extra():
    root = os.path.join(os.path.dirname(__file__), '..')
    for rel, src in EXTRA.items():
        dest = os.path.join(root, rel)
        if os.path.exists(dest):
            continue
        try:
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0 (GFALAW-website)'})
            data = urllib.request.urlopen(req, timeout=30).read()
            open(dest, 'wb').write(data)
            print('Saved', rel, len(data), 'bytes')
        except Exception as e:
            print('Download failed for', rel, e)

if __name__ == '__main__':
    main()
    extra()
