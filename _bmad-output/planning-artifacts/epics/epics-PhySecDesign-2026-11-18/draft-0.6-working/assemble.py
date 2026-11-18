import re, sys, collections, glob
import os
W = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = '_bmad-output/planning-artifacts/epics/epics-PhySecDesign-2026-11-18/epics.md'
body = ''.join(open(W + f'part{g}.md').read().rstrip() + '\n\n' for g in 'ABCDEF')
key = lambda s: tuple(map(int, s.split('.')))

# ---- parse ----
epics = []  # (n, title, outcome, depends, [story ids])
stories = collections.OrderedDict()
cur_e = None
for m in re.finditer(r'(?m)^## Epic (\d+): (.+)$|^### Story (\d+\.\d+): (.+)$', body):
    if m.group(1):
        cur_e = dict(n=int(m.group(1)), title=m.group(2).strip(), start=m.end(), stories=[])
        epics.append(cur_e)
    else:
        stories[m.group(3)] = dict(title=m.group(4).strip(), start=m.end(), hstart=m.start())
        cur_e['stories'].append(m.group(3))
ids = list(stories)
pos = [stories[i]['hstart'] for i in ids] + [len(body)]
problems = []
for i, sid in enumerate(ids):
    nxt = body.find('\n## Epic ', stories[sid]['start'], pos[i + 1])
    text = body[stories[sid]['start']:(nxt if nxt != -1 else pos[i + 1])]
    stories[sid]['text'] = text
    cov = re.search(r'(?m)^Covers: (.+)$', text)
    if not cov: problems.append(f'{sid}: no Covers line')
    stories[sid]['covers'] = cov.group(1) if cov else ''
    if not re.search(r'(?m)^As .+, I want .+', text): problems.append(f'{sid}: no user-story sentence')
    if text.count('\n- ') < 2: problems.append(f'{sid}: fewer than 2 criteria')
    if re.search(r'(?m)^  +- ', text): problems.append(f'{sid}: nested bullet')
for e in epics:
    end = body.find('\n### Story ', e['start'])
    intro = body[e['start']:end]
    o = re.search(r'\*\*Outcome\.\*\* (.+)', intro); d = re.search(r'\*\*Depends on\.\*\* (.+)', intro)
    if not o: problems.append(f"Epic {e['n']}: no Outcome")
    if not d: problems.append(f"Epic {e['n']}: no Depends on")
    e['outcome'] = o.group(1).strip() if o else ''; e['depends'] = d.group(1).strip() if d else ''
    nums = [int(s.split('.')[1]) for s in e['stories']]
    if nums != list(range(1, len(nums) + 1)): problems.append(f"Epic {e['n']}: story numbers not consecutive {nums}")

def expand(prefix, s):
    out = set()
    for a, b in re.findall(prefix + r'-(\d+)(?:\s*(?:–|-|to)\s*(?:' + prefix + r'-)?(\d+))?', s):
        out.update(range(int(a), int(b or a) + 1))
    return out
cover = {p: collections.defaultdict(list) for p in ('FR', 'NFR', 'SM', 'AD', 'R')}
for sid in ids:
    c = stories[sid]['covers']
    c_nonfr = re.sub(r'NFR-', 'N_F_R-', c)
    for n in expand('FR', c_nonfr): cover['FR'][n].append(sid)
    for n in expand('NFR', c): cover['NFR'][n].append(sid)
    for n in expand('SM', c): cover['SM'][n].append(sid)
    for n in expand('AD', c): cover['AD'][n].append(sid)
    for n in re.findall(r'\bR(\d+)\b', c): cover['R'][int(n)].append(sid)
miss = [f'FR-{n}' for n in range(1, 73) if n not in cover['FR']] + [f'NFR-{n}' for n in range(1, 9) if n not in cover['NFR']] + \
       [f'SM-{n}' for n in range(1, 7) if n not in cover['SM']] + [f'R{n}' for n in range(1, 17) if n not in cover['R']] + \
       [f'AD-{n}' for n in list(range(1, 15)) + list(range(16, 22)) if n not in cover['AD']]
if miss: problems.append('not covered: ' + ', '.join(miss))
if 15 in cover['AD']: problems.append('AD-15 cited: ' + str(cover['AD'][15]))

# forward criteria check: references to later stories outside Notes lines
fwd = []
for sid in ids:
    for line in stories[sid]['text'].split('\n'):
        if line.startswith('Notes:') or line.startswith('Covers:'): continue
        for r in re.findall(r'(?:story|stories|Story|Stories) (\d+\.\d+)', line):
            if r not in stories: problems.append(f'{sid}: refers to missing story {r}')
            elif key(r) > key(sid): fwd.append(f'{sid} -> {r}: {line[:110]}')
for line in body.split('\n'):
    for r in re.findall(r'(?:story|stories|Story|Stories) (\d+\.\d+)', line):
        if r not in stories: problems.append(f'missing story ref {r}: {line[:80]}')

# ---- generated sections ----
L = lambda xs: ', '.join(sorted(set(xs), key=key))
NFR = {1: 'Record integrity', 2: 'Shared-save clarity', 3: 'Browser, field and accessibility', 4: 'Honest analysis and responsiveness', 5: 'Access boundary', 6: 'Consistent deliverables', 7: 'Same product on either host', 8: 'Safe updates'}
DONE = {1, 2, 6, 7, 8, 10}
cov = ['## Requirement coverage', '', 'Generated from each story\'s "Covers" line. Where a requirement is split, the first story listed delivers its base and the later ones complete it.', '',
       '| Requirement | Stories |', '| --- | --- |']
cov += [f"| FR-{n} | {L(cover['FR'][n])} |" for n in range(1, 73)]
cov += [f"| NFR-{n} {NFR[n]} | {L(cover['NFR'][n])} |" for n in range(1, 9)]
cov += [f"| SM-{n} | {L(cover['SM'][n])} |" for n in range(1, 7)]
cov += ['', '| Experiment | Status | Story |', '| --- | --- | --- |']
cov += [f"| R{n} | {'Done; see the experiments record' if n in DONE else 'To run'} | {L(cover['R'][n])} |" for n in range(1, 17)]
overview = ['| Epic | Outcome | Stories | Depends on |', '| --- | --- | --- | --- |']
overview += [f"| {e['n']}. {e['title']} | {e['outcome']} | {len(e['stories'])} | {e['depends']} |" for e in epics]

choices = []
for f in sorted(glob.glob(W + 'choices?.md')):
    for line in open(f):
        line = line.strip().strip('|').strip()
        if line.count('|') >= 2 and not line.lower().startswith('story') and not set(line) <= set('-| '):
            a, b, c = [x.strip() for x in line.split('|', 2)]
            choices.append((a, b, c.replace('|', '/')))
ch = ['| Story | Choice made | Why |', '| --- | --- | --- |'] + [f'| {a} | {b} | {c} |' for a, b, c in choices]

front = open(W + 'front06.md').read()
back = open(W + 'back06.md').read()
front = front.replace('{{N_EPICS}}', str(len(epics))).replace('{{N_STORIES}}', str(len(ids))).replace('{{OVERVIEW}}', '\n'.join(overview))
back = back.replace('{{COVERAGE}}', '\n'.join(cov)).replace('{{CHOICES}}', '\n'.join(ch)).replace('{{N_CHOICES}}', str(len(choices))).replace('{{N_STORIES}}', str(len(ids)))
doc = front.rstrip() + '\n\n' + body.rstrip() + '\n\n' + back.rstrip() + '\n'
print('epics', len(epics), 'stories', len(ids), 'choices', len(choices), 'chars', len(doc))
print('per epic', [len(e['stories']) for e in epics])
print('PROBLEMS', len(problems)); [print('  ', p) for p in problems]
print('FORWARD refs in criteria', len(fwd)); [print('  ', p) for p in fwd]
if '--write' in sys.argv:
    open(OUT, 'w').write(doc); print('written')
