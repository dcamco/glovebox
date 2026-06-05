# Glovebox

**Owner's manuals + maintenance brain for the cars I own.**

Where the manual lives. Glovebox keeps a per-car HTML manual (build, history, known issues,
maintenance log), a dashboard over the whole fleet, and a small router that makes Claude Code
load the right car's manual whenever I talk about one of my cars.

> Sibling project: **Reserve** (github.com/dcamco/reserve) is the *market analyzer* for cars I might
> buy. Glovebox is for cars I already **own**.

## Layout
```
glovebox/
├── dashboard.html        # landing page over all owned cars (open in a browser)
├── manuals/              # one HTML manual per car
│   ├── lazarus.html      #   1995 Range Rover Classic County LWB "Lazarus"
│   ├── rrc88.html        #   1988 Range Rover Classic (skeleton)
│   ├── 911sc.html        #   1980 Porsche 911 SC
│   └── 308gtsi.html      #   1982 Ferrari 308 GTSi
├── registry.tsv          # one line per car: id, display, manual path, match regexes
├── router.py             # UserPromptSubmit hook — routes car talk to the right manual
└── agents/
    └── garage-manager.md # snapshot of the agent (the LIVE copy is in ~/.claude/agents/)
```
Invoices/records are kept **outside this repo** at `~/Documents/Garage/<id>/` (personal docs).

## How it works
- **`registry.tsv`** is the source of truth: `id <TAB> display <TAB> manual_path <TAB> model_regex <TAB> strong_regex`.
- **`router.py`** runs as a Claude Code `UserPromptSubmit` hook (registered in `~/.claude/settings.json`).
  It's **ownership-gated**: model/marque terms (porsche, 911, 308, range rover…) only trigger when the
  prompt also has an ownership cue (my / mine / I own / …); the nickname ("lazarus") and VINs trigger
  on their own. A bare "my range rover" (two of them) makes it ask which one.
- **`garage-manager`** agent reads the registry, opens the right manual, and keeps it updated. The
  loaded copy lives at `~/.claude/agents/garage-manager.md`; the copy here is versioned alongside the rest.

## Add a car
1. Create `manuals/<id>.html` (copy an existing manual's structure).
2. Add a line to `registry.tsv` with a `model_regex` that won't collide with the other cars.
3. (Optional) add a card to `dashboard.html` and a `~/Documents/Garage/<id>/` folder for its records.

No code changes needed.
