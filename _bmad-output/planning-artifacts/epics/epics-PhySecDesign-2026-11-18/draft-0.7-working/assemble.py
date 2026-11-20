"""Check the seven parts, renumber stories, and write ../epics.md.

Run from the repository root:
    python3 <this folder>/assemble.py            check only
    python3 <this folder>/assemble.py --write    also write epics.md and old-to-new.json
"""
import re, sys, os, json, collections

W = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.normpath(W + '../epics.md')
SID = r'\d+\.\d+[a-z]?'
LABELS = ['Core behaviour', 'Refusals and edge cases', 'Limits and values', 'Access and restore', 'Evidence to record']
problems, notes = [], []

parts = {g: open(W + f'part{g}.md', encoding='utf-8').read().rstrip() + '\n\n' for g in 'ABCDEFG'}
body = ''.join(parts[g] for g in 'ABCDEFG')
front, back = open(W + 'front.md', encoding='utf-8').read(), open(W + 'back.md', encoding='utf-8').read()

# ---- old ids, in order of appearance, and the renumbering map ----
epic_order, old_ids = [], collections.OrderedDict()
for m in re.finditer(r'(?m)^## Epic (\d+): (.+)$|^### Story (' + SID + r'): (.+)$', body):
    if m.group(1):
        epic_order.append(int(m.group(1)))
    else:
        old = m.group(3)
        if old in old_ids: problems.append(f'duplicate story id {old}')
        if int(old.split('.')[0]) != epic_order[-1]: problems.append(f'story {old} sits under Epic {epic_order[-1]}')
        old_ids[old] = m.group(4).strip()
counter, remap = collections.Counter(), {}
for old in old_ids:
    e = old.split('.')[0]; counter[e] += 1
    remap[old] = f'{e}.{counter[e]}'
base = collections.defaultdict(list)          # unsuffixed id -> pieces
for old in old_ids: base[re.sub(r'[a-z]$', '', old)].append(old)
ambiguous = collections.defaultdict(list)

def renumber(text, where):
    def one(m):
        ref = m.group(2)
        if ref in remap: return m.group(1) + remap[ref]
        if ref in base:
            if len(base[ref]) == 1: return m.group(1) + remap[base[ref][0]]
            ambiguous[ref].append(where + ': ' + text[max(0, m.start() - 70):m.end() + 50].replace('\n', ' '))
            return m.group(0)
        problems.append(f'{where}: refers to missing story {ref}')
        return m.group(0)
    return re.sub(r'\b([Ss]tory )(' + SID + r')(?![\d.]*\d)', one, text)

for bad in re.findall(r'[Ss]tories \d+\.\d+[^.\n]{0,40}', body + front + back):
    problems.append('plural story reference (write "story N.M" each time): ' + bad)

head_map = lambda t: re.sub(r'(?m)^(### Story )(' + SID + r')(:)', lambda m: m.group(1) + remap[m.group(2)] + m.group(3), t)
body_new = ''.join(renumber(head_map(parts[g]).replace('### Story ', '### St\0ry '), 'part' + g).replace('St\0ry', 'Story') for g in 'ABCDEFG')
# headings were protected from the reference pass by the temporary marker
front_new, back_new = renumber(front, 'front'), renumber(back, 'back')

# ---- parse the renumbered body ----
key = lambda s: tuple(map(int, s.split('.')))
epics, stories, cur = [], collections.OrderedDict(), None
for m in re.finditer(r'(?m)^## Epic (\d+): (.+)$|^### Story (\d+\.\d+): (.+)$', body_new):
    if m.group(1):
        cur = dict(n=int(m.group(1)), title=m.group(2).strip(), start=m.end(), stories=[]); epics.append(cur)
    else:
        stories[m.group(3)] = dict(title=m.group(4).strip(), start=m.end(), hstart=m.start()); cur['stories'].append(m.group(3))
ids = list(stories); pos = [stories[i]['hstart'] for i in ids] + [len(body_new)]
sizes = []
for i, sid in enumerate(ids):
    nxt = body_new.find('\n## Epic ', stories[sid]['start'], pos[i + 1])
    text = body_new[stories[sid]['start']:(nxt if nxt != -1 else pos[i + 1])]
    stories[sid]['text'] = text
    cov = re.search(r'(?m)^Covers: (.+)$', text)
    if not cov: problems.append(f'{sid}: no Covers line')
    stories[sid]['covers'] = cov.group(1) if cov else ''
    if not re.search(r'(?m)^As .+, I want .+', text): problems.append(f'{sid}: no user-story sentence')
    n = len(re.findall(r'(?m)^- ', text)); sizes.append((n, sid))
    if n < 2: problems.append(f'{sid}: fewer than 2 criteria')
    if re.search(r'(?m)^  +- ', text): problems.append(f'{sid}: nested bullet')
    found = re.findall(r'(?m)^\*\*(.+?)\*\*\s*$', text)
    if 'Core behaviour' not in found: problems.append(f'{sid}: no Core behaviour group')
    if [l for l in found if l not in LABELS]: problems.append(f'{sid}: unknown label {[l for l in found if l not in LABELS]}')
    if [l for l in LABELS if l in found] != found: problems.append(f'{sid}: labels out of order or repeated {found}')
    if len(re.findall(r'(?m)^Notes:', text)) > 1: problems.append(f'{sid}: more than one Notes line')
    for line in text.split('\n'):
        if line.startswith('- ') and line.count('; ') >= 2: notes.append(f'{sid}: chained bullet: {line[:90]}')
        if line.startswith(('Notes:', 'Covers:')): continue
        for r in re.findall(r'[Ss]tory (\d+\.\d+)', line):
            if r in stories and key(r) > key(sid): problems.append(f'{sid}: criterion names later story {r}: {line[:90]}')
for e in epics:
    intro = body_new[e['start']:body_new.find('\n### Story ', e['start'])]
    for lab in ('Outcome', 'Depends on', 'Why here'):
        mm = re.search(r'\*\*' + lab + r'\.\*\* (.+)', intro)
        if not mm: problems.append(f"Epic {e['n']}: no {lab}")
        e[lab] = mm.group(1).strip() if mm else ''

def expand(prefix, s):
    out = set()
    for a, b in re.findall(prefix + r'-(\d+)(?:\s*(?:–|-|to)\s*(?:' + prefix + r'-)?(\d+))?', s):
        out.update(range(int(a), int(b or a) + 1))
    return out
cover = {p: collections.defaultdict(list) for p in ('FR', 'NFR', 'SM', 'AD', 'R')}
for sid in ids:
    c = stories[sid]['covers']
    for n in expand('FR', c.replace('NFR-', 'N_F_R-')): cover['FR'][n].append(sid)
    for p in ('NFR', 'SM', 'AD'):
        for n in expand(p, c): cover[p][n].append(sid)
    for n in re.findall(r'\bR(\d+)\b', c): cover['R'][int(n)].append(sid)
miss = [f'FR-{n}' for n in range(1, 79) if n not in cover['FR']] + [f'NFR-{n}' for n in range(1, 9) if n not in cover['NFR']] + \
       [f'SM-{n}' for n in range(1, 8) if n not in cover['SM']] + [f'R{n}' for n in range(1, 19) if n not in cover['R']] + \
       [f'AD-{n}' for n in list(range(1, 15)) + list(range(16, 23)) if n not in cover['AD']]
if miss: problems.append('not covered: ' + ', '.join(miss))

# ---- choices ----
crit_lines = [l for l in body_new.split('\n') if l.startswith('- ')]  # criteria only, not Notes
for l in body_new.split('\n'):
    if not l.startswith('- ') and re.search(r'\(C[A-G]-\d+\)', l): problems.append('choice ID outside a criterion: ' + l[:70])
choices = []
for g in 'ABCDEFG':
    for ln, line in enumerate(open(W + f'choices{g}.md', encoding='utf-8'), 1):
        line = line.strip().strip('|').strip()
        if not line or line.startswith('#'): continue
        f = [x.strip() for x in line.split('|')]
        if len(f) not in (6, 7) or not re.fullmatch(r'C[A-G]-\d+', f[0]) or f[2] not in ('decide', 'value', 'reading'):
            problems.append(f'choices{g}.md line {ln}: not "ID | story | class | choice | alternative | why [| decision]": {line[:70]}'); continue
        old = re.split(r'[,; ]+', f[1])[0]
        new = remap.get(old) or (remap[base[old][0]] if len(base.get(old, [])) == 1 else None)
        if not new: problems.append(f'choices{g}.md {f[0]}: story {old} unknown or split; name the piece')
        n_in = sum(len(re.findall(r'\(' + f[0] + r'\)', l)) for l in crit_lines)
        if n_in < 1: problems.append(f'{f[0]}: is on no criterion')
        choices.append(dict(id=f[0], story=new or old, cls=f[2], choice=f[3], alt=f[4], why=f[5], decision=f[6] if len(f) == 7 else ''))
for cid in set(re.findall(r'\((C[A-G]-\d+)\)', '\n'.join(crit_lines))) - {c['id'] for c in choices}:
    problems.append(f'{cid} is on a criterion but not in a choices file')
choices.sort(key=lambda c: (key(c['story']) if re.fullmatch(r'\d+\.\d+', c['story']) else (99, 0), c['id']))

# ---- generated sections ----
L = lambda xs: ', '.join(sorted(set(xs), key=key))
esc = lambda s: s.replace('|', '/')
NFR = {1: 'Record integrity', 2: 'Shared-save clarity', 3: 'Browser, field and accessibility', 4: 'Honest analysis and responsiveness', 5: 'Access boundary', 6: 'Consistent deliverables', 7: 'Same product on either host', 8: 'Safe updates'}
DONE = {1, 2, 6, 7, 8, 9, 10}
PARTLY = {11, 13, 14}   # run in part on 2026-11-19; the rest is still to run or repeats each release
EXP_STATE = lambda n: 'Done; see the experiments record' if n in DONE else ('Partly run; see the experiments record' if n in PARTLY else 'To run')
KIND = {'decide': 'decision', 'value': 'value', 'reading': 'reading'}
cov = ['| Requirement | Stories |', '| --- | --- |'] + [f"| FR-{n} | {L(cover['FR'][n])} |" for n in range(1, 79)] + \
      [f"| NFR-{n} {NFR[n]} | {L(cover['NFR'][n])} |" for n in range(1, 9)] + [f"| SM-{n} | {L(cover['SM'][n])} |" for n in range(1, 8)]
exp = ['| Experiment | Status | Story |', '| --- | --- | --- |'] + [f"| R{n} | {EXP_STATE(n)} | {L(cover['R'][n])} |" for n in range(1, 19)]
ads = ['| Architecture decision | Stories |', '| --- | --- |'] + [f"| AD-{n} | {L(cover['AD'][n])} |" for n in list(range(1, 15)) + list(range(16, 23))]
overview = ['| Epic | Outcome | Stories |', '| --- | --- | --- |'] + [f"| {e['n']}. {e['title']} | {e['Outcome']} | {len(e['stories'])} |" for e in epics]
def table(cls, decision_col, by_epic=False):
    rows = [c for c in choices if c['cls'] == cls]
    head = '| ID | Story | Choice | Alternative | Why |' + (' Kevin\'s decision |' if decision_col else '')
    rule = '| --- | --- | --- | --- | --- |' + (' --- |' if decision_col else '')
    line = lambda c: f"| {c['id']} | {c['story']} | {esc(c['choice'])} | {esc(c['alt'])} | {esc(c['why'])} |" + (f" {esc(c['decision'])} |" if decision_col else '')
    if not by_epic:
        return '\n'.join([head, rule] + [line(c) for c in rows]), len(rows)
    out, groups = [], collections.OrderedDict()
    for c in rows: groups.setdefault(c['story'].split('.')[0], []).append(c)
    for e, cs in groups.items():
        title = next((x['title'] for x in epics if str(x['n']) == e), '')
        out += [f'*Epic {e}: {title} ({len(cs)})*', '', head, rule] + [line(c) for c in cs] + ['']
    return '\n'.join(out).rstrip(), len(rows)
t_dec, n_dec = table('decide', True); t_val, n_val = table('value', True, True); t_read, n_read = table('reading', True, True)
changed = [(o, n) for o, n in remap.items() if o != n]
mapt = ['| Draft 0.6 | Draft 0.7 | Title |', '| --- | --- | --- |'] + [f'| {re.sub("[a-z]$", "", o)}{" (part)" if re.search("[a-z]$", o) else ""} | {n} | {old_ids[o]} |' for o, n in changed]
subs = {'N_EPICS': len(epics), 'N_STORIES': len(ids), 'OVERVIEW': '\n'.join(overview), 'COVERAGE': '\n'.join(cov), 'EXPERIMENTS': '\n'.join(exp),
        'ADS': '\n'.join(ads), 'T_DECIDE': t_dec, 'T_VALUE': t_val, 'T_READING': t_read, 'N_DECIDE': n_dec, 'N_VALUE': n_val, 'N_READING': n_read,
        'RENUMBER': '\n'.join(mapt), 'N_CRITERIA': sum(n for n, _ in sizes)}
for k, v in subs.items():
    front_new = front_new.replace('{{' + k + '}}', str(v)); back_new = back_new.replace('{{' + k + '}}', str(v))
# show the kind of each choice where it is marked on a criterion: (CA-03) -> (CA-03 · value)
kind_of = {c['id']: KIND[c['cls']] for c in choices}
body_out = '\n'.join(re.sub(r'\((C[A-G]-\d+)\)', lambda m: f'({m.group(1)} · {kind_of.get(m.group(1), "?")})', l) if l.startswith('- ') else l
                     for l in body_new.split('\n'))
doc = front_new.rstrip() + '\n\n' + body_out.rstrip() + '\n\n' + back_new.rstrip() + '\n'
for left in set(re.findall(r'\{\{\w+\}\}', doc)): problems.append('unfilled placeholder ' + left)

print('epics', len(epics), 'stories', len(ids), 'criteria', subs['N_CRITERIA'], 'words', len(doc.split()))
print('per epic', [len(e['stories']) for e in epics])
print('choices: decide', n_dec, 'value', n_val, 'reading', n_read)
print('largest stories', sorted(sizes, reverse=True)[:10])
print('renumbered', len(changed))
print('AMBIGUOUS references to split stories', sum(len(v) for v in ambiguous.values()))
for k, v in ambiguous.items():
    print(f'  story {k} -> pieces {base[k]}:')
    for x in v: print('     ', x[:200])
print('PROBLEMS', len(problems)); [print('  ', p) for p in problems]
print('NOTES', len(notes)); [print('  ', p) for p in notes[:40]]
if '--write' in sys.argv:
    if problems or ambiguous: sys.exit('not written: fix problems and ambiguous references first')
    open(OUT, 'w', encoding='utf-8').write(doc); json.dump(remap, open(W + 'old-to-new.json', 'w', encoding='utf-8'), indent=1); print('written')
