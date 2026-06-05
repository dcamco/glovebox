#!/usr/bin/env python3
"""Garage router (UserPromptSubmit hook).

Fires ONLY when Drew is talking about a specific car that he OWNS. Two ways a
car matches:
  1. strong_regex  — an identifier that names THIS specific car (nickname, VIN).
                     Triggers on its own.
  2. model_regex   — marque/model terms (porsche, 911, 308, range rover ...).
                     Triggers ONLY if the prompt also contains an ownership cue
                     ("my", "mine", "I own", "I bought", ...).

This prevents false fires when Drew is just discussing cars generically in
another window (e.g. "911s are great"). When matched, it injects routing
context so the `garage-manager` agent uses the right manual; ambiguous owned
references ("my range rover") trigger an explicit "ask which one" instruction.

Reads the vehicle list from registry.tsv — adding a car never touches code.
Emits nothing for non-vehicle / non-owned prompts (silent pass-through).
"""
import sys
import json
import re
import os

REGISTRY = os.path.expanduser("~/glovebox/registry.tsv")

# Possessive / ownership cues. Model/marque terms require one of these to fire.
OWNERSHIP = re.compile(
    r"\bmy\b|\bmine\b|\bour\b|\bi own\b|\bi bought\b|\bi just bought\b|"
    r"\bi have a\b|\bi have an\b|\bi've got\b|\bi drive\b|\bi picked up\b"
)

# Generic marque terms that signal "a Range Rover" but don't pin down which one.
# (Still gated by ownership below.)
GENERIC = re.compile(r"range rover|\brrc\b|land rover|the rover|\bp38\b")


def load_registry():
    cars = []
    try:
        with open(REGISTRY) as f:
            for line in f:
                line = line.rstrip("\n")
                if not line.strip() or line.lstrip().startswith("#"):
                    continue
                parts = line.split("\t")
                if len(parts) < 4:
                    continue
                cars.append({
                    "id": parts[0].strip(),
                    "display": parts[1].strip(),
                    "manual": parts[2].strip(),
                    "model": parts[3].strip() if len(parts) > 3 else "",
                    "strong": parts[4].strip() if len(parts) > 4 else "",
                })
    except FileNotFoundError:
        pass
    return cars


def search(pattern, text):
    if not pattern:
        return False
    try:
        return bool(re.search(pattern, text))
    except re.error:
        return False


def main():
    raw = sys.stdin.read()
    prompt = ""
    try:
        data = json.loads(raw)
        prompt = data.get("prompt") or data.get("user_prompt") or ""
    except Exception:
        prompt = raw
    prompt = prompt.lower()
    if not prompt.strip():
        return 0

    owned = bool(OWNERSHIP.search(prompt))
    cars = load_registry()

    matched = []
    for c in cars:
        if search(c["strong"], prompt):
            matched.append(c)
        elif owned and search(c["model"], prompt):
            matched.append(c)

    generic = GENERIC.search(prompt)
    # Generic marque term, but only act on it if Drew signaled ownership.
    if not matched and not (generic and owned):
        return 0

    out = ["[garage-router] This prompt references one of Drew's OWNED vehicles. Handle it through "
           "the `garage-manager` agent, which MUST read the relevant manual before answering."]

    if len(matched) == 1:
        c = matched[0]
        out.append(f"Vehicle identified: {c['display']} (id: {c['id']}).")
        out.append(f"Read its manual first: {c['manual']}")
    elif len(matched) > 1:
        out.append("AMBIGUOUS — more than one owned vehicle matched this prompt:")
        for c in matched:
            out.append(f"  - {c['display']} (manual: {c['manual']})")
        out.append("Ask Drew which vehicle he means BEFORE doing any work. Do NOT assume.")
    else:
        out.append("AMBIGUOUS — Drew used a generic Range Rover / Land Rover term about a car he owns, "
                   "but it didn't pin down which one. He owns more than one. Ask which one BEFORE "
                   "proceeding; do NOT assume.")
        if cars:
            out.append("Known vehicles:")
            for c in cars:
                out.append(f"  - {c['display']} (manual: {c['manual']})")

    print("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
