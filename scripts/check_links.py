#!/usr/bin/env python3
"""Fail the build if any page links to a file that does not exist in the built site."""
import os, re, sys, urllib.parse
root = sys.argv[1] if len(sys.argv) > 1 else '_site'
bad = []
for dp, _, fs in os.walk(root):
    for f in fs:
        if not f.endswith('.html') or f == '404.html' or 'study-portal' in dp: continue
        fp = os.path.join(dp, f)
        s = open(fp, encoding='utf-8').read()
        for u in re.findall(r'(?:href|src)="([^"]+)"', s):
            if u.startswith(('http', 'mailto:', 'tel:', '#', 'data:', 'javascript:', '//')) or "'" in u or '+' in u or '${' in u: continue
            p = urllib.parse.urlparse(u).path
            if not p: continue
            t = os.path.normpath(os.path.join(dp, urllib.parse.unquote(p)))
            if p.endswith('/') or os.path.isdir(t): t = os.path.join(t, 'index.html')
            if not os.path.exists(t): bad.append(f'{os.path.relpath(fp, root)} -> {u}')
for b in bad: print('BROKEN', b)
print(f'{len(bad)} broken internal links')
sys.exit(1 if bad else 0)
