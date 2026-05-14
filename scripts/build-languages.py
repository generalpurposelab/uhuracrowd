#!/usr/bin/env python3
"""
Build languages.json from Wikidata raw export.
- Deduplicates by ISO 639-3 (keeps highest speaker count)
- Uses direct coord (P625) where available, falls back to country centroid
- Derives language family from ISO prefix lookup
- Preserves benchmark data from existing languages.json
- Filters: must have speakers > 0, iso639_3, and geo signal
"""

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW  = ROOT / "data" / "wikidata-raw.json"
OLD  = ROOT / "data" / "languages.json"
OUT  = ROOT / "data" / "languages.json"

# ── Country centroids [lng, lat] ──────────────────────────────────────────────
COUNTRY_CENTROIDS = {
    "Afghanistan": [67.7, 33.9], "Albania": [20.2, 41.2], "Algeria": [2.6, 28.0],
    "Angola": [17.9, -11.2], "Argentina": [-63.6, -38.4], "Armenia": [45.0, 40.1],
    "Australia": [133.8, -25.3], "Austria": [14.6, 47.7], "Azerbaijan": [47.6, 40.1],
    "Bangladesh": [90.4, 23.7], "Belarus": [28.0, 53.5], "Belgium": [4.5, 50.5],
    "Benin": [2.3, 9.3], "Bolivia": [-64.7, -16.3], "Bosnia and Herzegovina": [17.7, 44.2],
    "Botswana": [24.7, -22.3], "Brazil": [-51.9, -14.2], "Bulgaria": [25.5, 42.7],
    "Burkina Faso": [-1.6, 12.4], "Burundi": [29.9, -3.4], "Cambodia": [104.9, 12.6],
    "Cameroon": [12.4, 5.7], "Canada": [-96.8, 56.1], "Central African Republic": [20.9, 6.6],
    "Chad": [18.7, 15.5], "Chile": [-71.5, -35.7], "People's Republic of China": [104.2, 35.9],
    "China": [104.2, 35.9], "Colombia": [-74.3, 4.6], "Congo": [15.8, -0.2],
    "Democratic Republic of the Congo": [23.7, -2.9], "Costa Rica": [-84.0, 9.7],
    "Croatia": [15.2, 45.1], "Cuba": [-79.5, 21.5], "Czech Republic": [15.5, 49.8],
    "Czechia": [15.5, 49.8], "Denmark": [10.0, 56.3], "Ecuador": [-78.1, -1.8],
    "Egypt": [30.8, 26.8], "El Salvador": [-88.9, 13.8], "Ethiopia": [40.5, 9.1],
    "Finland": [26.3, 64.5], "France": [2.2, 46.2], "Georgia": [43.4, 42.3],
    "Germany": [10.5, 51.2], "Ghana": [-1.0, 8.0], "Greece": [21.8, 39.1],
    "Guatemala": [-90.2, 15.8], "Guinea": [-11.8, 11.0], "Haiti": [-72.3, 18.9],
    "Honduras": [-86.2, 15.2], "Hungary": [19.5, 47.2], "India": [78.9, 20.6],
    "Indonesia": [113.9, -0.8], "Iran": [53.7, 32.4], "Iraq": [43.7, 33.2],
    "Israel": [34.9, 31.5], "Italy": [12.6, 42.5], "Japan": [138.3, 36.2],
    "Jordan": [36.2, 31.2], "Kazakhstan": [67.0, 48.0], "Kenya": [37.9, 0.0],
    "Kosovo": [21.0, 42.6], "Kuwait": [47.5, 29.3], "Kyrgyzstan": [74.8, 41.2],
    "Laos": [103.0, 18.2], "Latvia": [25.0, 57.0], "Lebanon": [35.9, 33.9],
    "Liberia": [-9.4, 6.4], "Libya": [17.2, 26.3], "Lithuania": [23.9, 55.9],
    "Madagascar": [46.9, -19.4], "Malawi": [34.3, -13.3], "Malaysia": [109.7, 4.2],
    "Mali": [-2.0, 17.6], "Mauritania": [-10.9, 21.0], "Mexico": [-102.6, 23.6],
    "Moldova": [28.4, 47.4], "Mongolia": [103.8, 46.9], "Morocco": [-7.1, 31.8],
    "Mozambique": [35.5, -18.7], "Myanmar": [95.9, 17.1], "Namibia": [18.5, -22.3],
    "Nepal": [84.1, 28.4], "Netherlands": [5.3, 52.3], "Nicaragua": [-85.2, 12.9],
    "Niger": [8.1, 17.6], "Nigeria": [8.7, 9.1], "North Korea": [127.5, 40.3],
    "North Macedonia": [21.7, 41.6], "Norway": [8.5, 60.5], "Oman": [57.6, 21.5],
    "Pakistan": [69.3, 30.4], "Palestine": [35.3, 31.9], "Panama": [-80.1, 8.5],
    "Papua New Guinea": [143.9, -6.3], "Paraguay": [-58.4, -23.4], "Peru": [-75.0, -9.2],
    "Philippines": [121.8, 12.9], "Poland": [19.1, 52.1], "Portugal": [-8.2, 39.4],
    "Romania": [24.9, 45.9], "Russia": [105.3, 61.5], "Rwanda": [29.9, -1.9],
    "Saudi Arabia": [45.1, 23.9], "Senegal": [-14.5, 14.5], "Serbia": [21.0, 44.0],
    "Sierra Leone": [-11.8, 8.5], "Slovakia": [19.7, 48.7], "Slovenia": [14.8, 46.1],
    "Somalia": [46.2, 5.2], "South Africa": [25.1, -29.0], "South Korea": [127.8, 36.0],
    "South Sudan": [31.3, 7.9], "Spain": [-3.7, 40.2], "Sri Lanka": [80.7, 7.9],
    "Sudan": [29.9, 15.6], "Sweden": [18.6, 63.1], "Switzerland": [8.2, 46.8],
    "Syria": [38.2, 35.0], "Taiwan": [121.0, 23.7], "Tajikistan": [71.3, 38.9],
    "Tanzania": [34.9, -6.4], "Thailand": [101.0, 15.9], "Togo": [0.8, 8.6],
    "Tunisia": [9.5, 33.9], "Turkey": [35.2, 39.1], "Turkmenistan": [59.6, 39.1],
    "Uganda": [32.3, 1.4], "Ukraine": [31.2, 49.0], "United Arab Emirates": [54.0, 24.0],
    "United Kingdom": [-3.4, 55.4], "United States of America": [-100.4, 37.1],
    "United States": [-100.4, 37.1], "Uruguay": [-56.0, -32.5], "Uzbekistan": [63.9, 41.4],
    "Venezuela": [-66.6, 6.4], "Vietnam": [108.3, 14.1], "Yemen": [48.5, 16.0],
    "Zambia": [27.8, -13.1], "Zimbabwe": [29.9, -19.0],
}

# ── ISO 639-3 prefix → language family ───────────────────────────────────────
# Based on SIL/Ethnologue macro-family groupings
ISO_FAMILY = {
    # Niger-Congo
    "swh": "Niger-Congo", "yor": "Niger-Congo", "ibo": "Niger-Congo",
    "zul": "Niger-Congo", "xho": "Niger-Congo", "sot": "Niger-Congo",
    "sna": "Niger-Congo", "nya": "Niger-Congo", "lin": "Niger-Congo",
    "lug": "Niger-Congo", "kin": "Niger-Congo", "run": "Niger-Congo",
    "bem": "Niger-Congo", "toi": "Niger-Congo", "nso": "Niger-Congo",
    "tsn": "Niger-Congo", "ssw": "Niger-Congo", "nde": "Niger-Congo",
    "ven": "Niger-Congo", "wol": "Niger-Congo", "ful": "Niger-Congo",
    "twi": "Niger-Congo", "ewe": "Niger-Congo", "fon": "Niger-Congo",
    "bam": "Niger-Congo", "dyu": "Niger-Congo", "aka": "Niger-Congo",
    "kon": "Niger-Congo", "kik": "Niger-Congo", "kam": "Niger-Congo",
    "mer": "Niger-Congo", "luo": "Niger-Congo", "kln": "Niger-Congo",
    "guz": "Niger-Congo", "mfe": "Niger-Congo", "cgg": "Niger-Congo",
    # Afro-Asiatic
    "ara": "Afro-Asiatic", "amh": "Afro-Asiatic", "hau": "Afro-Asiatic",
    "som": "Afro-Asiatic", "orm": "Afro-Asiatic", "tir": "Afro-Asiatic",
    "aar": "Afro-Asiatic", "heb": "Afro-Asiatic", "mlt": "Afro-Asiatic",
    "ber": "Afro-Asiatic", "kab": "Afro-Asiatic", "shi": "Afro-Asiatic",
    "zgh": "Afro-Asiatic", "tzm": "Afro-Asiatic", "rif": "Afro-Asiatic",
    # Indo-European
    "eng": "Indo-European", "spa": "Indo-European", "fra": "Indo-European",
    "por": "Indo-European", "rus": "Indo-European", "deu": "Indo-European",
    "ita": "Indo-European", "nld": "Indo-European", "pol": "Indo-European",
    "ron": "Indo-European", "ces": "Indo-European", "slk": "Indo-European",
    "hrv": "Indo-European", "srp": "Indo-European", "bos": "Indo-European",
    "slv": "Indo-European", "bul": "Indo-European", "ukr": "Indo-European",
    "bel": "Indo-European", "lit": "Indo-European", "lav": "Indo-European",
    "est": "Indo-European", "hin": "Indo-European", "ben": "Indo-European",
    "pan": "Indo-European", "urd": "Indo-European", "mar": "Indo-European",
    "guj": "Indo-European", "ori": "Indo-European", "sin": "Indo-European",
    "nep": "Indo-European", "fas": "Indo-European", "pes": "Indo-European",
    "prs": "Indo-European", "pus": "Indo-European", "tgk": "Indo-European",
    "swe": "Indo-European", "nor": "Indo-European", "dan": "Indo-European",
    "isl": "Indo-European", "afr": "Indo-European", "yid": "Indo-European",
    "gle": "Indo-European", "cym": "Indo-European", "kat": "Kartvelian",
    "mai": "Indo-European", "bho": "Indo-European", "awa": "Indo-European",
    "raj": "Indo-European", "mag": "Indo-European", "new": "Sino-Tibetan",
    "hne": "Indo-European", "dcc": "Indo-European", "gbm": "Indo-European",
    "kas": "Indo-European", "sdh": "Indo-European", "glg": "Indo-European",
    "cat": "Indo-European", "oci": "Indo-European", "ast": "Indo-European",
    "srd": "Indo-European", "vec": "Indo-European", "nap": "Indo-European",
    "scn": "Indo-European", "lmo": "Indo-European", "pms": "Indo-European",
    "lij": "Indo-European", "fur": "Indo-European", "roh": "Indo-European",
    "lat": "Indo-European", "ang": "Indo-European", "frm": "Indo-European",
    # Sino-Tibetan
    "cmn": "Sino-Tibetan", "yue": "Sino-Tibetan", "wuu": "Sino-Tibetan",
    "nan": "Sino-Tibetan", "hak": "Sino-Tibetan", "gan": "Sino-Tibetan",
    "cjy": "Sino-Tibetan", "hsn": "Sino-Tibetan", "mnp": "Sino-Tibetan",
    "zho": "Sino-Tibetan", "bod": "Sino-Tibetan", "dzo": "Sino-Tibetan",
    "mya": "Sino-Tibetan", "kac": "Sino-Tibetan", "lhu": "Sino-Tibetan",
    "lus": "Sino-Tibetan", "hlt": "Sino-Tibetan", "cfm": "Sino-Tibetan",
    # Dravidian
    "tam": "Dravidian", "tel": "Dravidian", "kan": "Dravidian",
    "mal": "Dravidian", "tulu": "Dravidian", "knn": "Dravidian",
    "gon": "Dravidian", "kur": "Dravidian", "kui": "Dravidian",
    # Turkic
    "tur": "Turkic", "azb": "Turkic", "uzb": "Turkic", "kaz": "Turkic",
    "uig": "Turkic", "kir": "Turkic", "tuk": "Turkic", "bak": "Turkic",
    "tat": "Turkic", "chv": "Turkic", "sah": "Turkic", "nog": "Turkic",
    "kmr": "Turkic", "crh": "Turkic", "klj": "Turkic", "otk": "Turkic",
    # Austronesian
    "ind": "Austronesian", "msa": "Austronesian", "tgl": "Austronesian",
    "jav": "Austronesian", "sun": "Austronesian", "mad": "Austronesian",
    "min": "Austronesian", "bug": "Austronesian", "mlg": "Austronesian",
    "haw": "Austronesian", "mao": "Austronesian", "fij": "Austronesian",
    "bis": "Austronesian", "ceb": "Austronesian", "ilo": "Austronesian",
    "war": "Austronesian", "pam": "Austronesian", "bcl": "Austronesian",
    "bik": "Austronesian", "hil": "Austronesian", "mga": "Austronesian",
    # Austroasiatic
    "vie": "Austroasiatic", "khm": "Austroasiatic", "mon": "Austroasiatic",
    "sat": "Austroasiatic", "mni": "Austroasiatic", "kha": "Austroasiatic",
    # Tai-Kadai
    "tha": "Tai-Kadai", "lao": "Tai-Kadai", "zha": "Tai-Kadai",
    "pcc": "Tai-Kadai", "khb": "Tai-Kadai",
    # Japonic
    "jpn": "Japonic", "ryu": "Japonic",
    # Koreanic
    "kor": "Koreanic",
    # Mongolic
    "khk": "Mongolic", "mvf": "Mongolic", "bxr": "Mongolic",
    # Uralic
    "fin": "Uralic", "hun": "Uralic", "est": "Uralic", "erzya": "Uralic",
    "myv": "Uralic", "mdf": "Uralic", "udm": "Uralic", "koi": "Uralic",
    "kom": "Uralic", "sme": "Uralic",
    # Kartvelian
    "kat": "Kartvelian", "lzz": "Kartvelian", "mgr": "Kartvelian",
    # Nilo-Saharan
    "knc": "Nilo-Saharan", "kau": "Nilo-Saharan", "din": "Nilo-Saharan",
    "nus": "Nilo-Saharan", "luo": "Nilo-Saharan", "mas": "Nilo-Saharan",
    # Quechuan
    "que": "Quechuan", "quz": "Quechuan", "qub": "Quechuan",
    # Tupian
    "grn": "Tupian", "gug": "Tupian",
    # Creole
    "hat": "Creole", "gcf": "Creole", "mfe": "Creole",
}

# Family → familyGroup (for map clustering)
FAMILY_GROUP = {
    "Niger-Congo": "Niger-Congo",
    "Afro-Asiatic": "Afro-Asiatic",
    "Indo-European": "Indo-European",
    "Dravidian": "Dravidian",
    "Sino-Tibetan": "Sino-Tibetan",
    "Turkic": "Turkic",
    "Austronesian": "Austronesian",
    "Austroasiatic": "Austroasiatic",
    "Tai-Kadai": "Tai-Kadai",
    "Japonic": "Japonic",
    "Koreanic": "Koreanic",
    "Mongolic": "Mongolic",
    "Uralic": "Uralic",
    "Kartvelian": "Kartvelian",
    "Nilo-Saharan": "Nilo-Saharan",
    "Quechuan": "Quechuan",
    "Tupian": "Tupian",
    "Creole": "Creole",
}

# ── Manual coord overrides for languages where Wikidata gives wrong country ───
# These override both P625 and country centroid fallback
ISO_COORD_OVERRIDE = {
    "ara": [42.0, 24.0],    # Arabic → Arabian Peninsula center
    "eng": [-2.0, 52.0],    # English → Britain
    "fra": [2.3, 46.6],     # French → France
    "por": [-8.0, 39.5],    # Portuguese → Portugal
    "spa": [-3.7, 40.2],    # Spanish → Spain
    "cmn": [104.2, 35.9],   # Mandarin → China
    "zho": [104.2, 35.9],   # Chinese → China
    "pan": [74.7, 31.1],    # Punjabi → Punjab
    "pcm": [6.5, 5.5],      # Nigerian Pidgin → Nigeria
}

def parse_coord(coord_str):
    """Parse 'Point(lng lat)' → [lng, lat]"""
    if not coord_str:
        return None
    m = re.match(r'Point\(([-\d.]+)\s+([-\d.]+)\)', coord_str)
    if m:
        return [round(float(m.group(1)), 4), round(float(m.group(2)), 4)]
    return None

def get_coord(iso, row):
    if iso in ISO_COORD_OVERRIDE:
        return ISO_COORD_OVERRIDE[iso]
    coord = parse_coord(row.get('coord'))
    if coord:
        return coord
    country = row.get('countryLabel', '')
    return COUNTRY_CENTROIDS.get(country)

def get_family(iso):
    return ISO_FAMILY.get(iso, "Other")

def safe_float(v):
    try:
        return float(v)
    except (ValueError, TypeError):
        return None

# ── Load raw Wikidata ─────────────────────────────────────────────────────────
with open(RAW) as f:
    raw = json.load(f)

raw = [r for r in raw if safe_float(r.get('speakers')) is not None]

# ── Deduplicate: group by ISO 639-3, keep highest speaker count ───────────────
by_iso = defaultdict(list)
no_iso = []
for r in raw:
    iso = r.get('iso639_3', '').strip()
    if iso:
        by_iso[iso].append(r)
    else:
        no_iso.append(r)

# For each ISO, pick row with highest speakers (and prefer one with coord)
deduped = []
for iso, rows in by_iso.items():
    rows_sorted = sorted(rows, key=lambda r: (bool(r.get('coord')), float(r['speakers'])), reverse=True)
    best = rows_sorted[0]
    best['iso639_3'] = iso
    deduped.append(best)

print(f"Raw rows: {len(raw)}")
print(f"Unique ISO codes: {len(by_iso)}")
print(f"No ISO (skipped): {len(no_iso)}")

# ── Load existing benchmark data ──────────────────────────────────────────────
with open(OLD) as f:
    old_langs = json.load(f)

benchmarks_by_iso = {l['iso639_3']: l['benchmarks'] for l in old_langs if l.get('benchmarks')}

# ── Build output ──────────────────────────────────────────────────────────────
output = []
skipped_no_geo = 0
skipped_no_speakers = 0

for r in deduped:
    iso = r.get('iso639_3', '').strip()
    speakers = safe_float(r.get('speakers', 0))

    if not speakers or speakers <= 0:
        skipped_no_speakers += 1
        continue

    coord = get_coord(iso, r)
    if not coord:
        skipped_no_geo += 1
        continue

    family = get_family(iso)
    family_group = FAMILY_GROUP.get(family, family)
    benchmarks = benchmarks_by_iso.get(iso, [])

    # Derive region from coord
    lng, lat = coord
    if lat < -10:
        region = "Southern Hemisphere"
    elif lng < -30:
        region = "Americas"
    elif lng < 40 and lat > 35:
        region = "Europe"
    elif lng < 60 and lat < 35:
        region = "Middle East & Africa"
    elif lat > 0 and lng > 40 and lng < 100:
        region = "Asia"
    else:
        region = "Asia-Pacific"

    # Country label as subregion
    subregion = r.get('countryLabel', '')

    lang_id = iso

    output.append({
        "id": lang_id,
        "name": r.get('langLabel', iso),
        "iso639_3": iso,
        "region": region,
        "subregion": subregion,
        "family": family,
        "familyGroup": family_group,
        "speakers": int(speakers),
        "coordinates": coord,
        "hasBenchmark": len(benchmarks) > 0,
        "benchmarks": benchmarks,
    })

# ── Merge in old curated dataset for languages missing from Wikidata ──────────
OLD_BACKUP = ROOT / "data" / "wikidata-raw.json"  # already written; use the HEAD version
import subprocess
try:
    old_json = subprocess.run(
        ['git', 'show', 'HEAD:data/languages.json'],
        capture_output=True, text=True, cwd=str(ROOT)
    ).stdout
    old_langs = json.loads(old_json) if old_json.strip() else []
except Exception:
    old_langs = []

output_isos = {l['iso639_3'] for l in output}
merged_count = 0
for ol in old_langs:
    if ol['iso639_3'] not in output_isos:
        output.append(ol)
        output_isos.add(ol['iso639_3'])
        merged_count += 1
    else:
        # Update benchmarks if old has them and new doesn't
        existing = next(l for l in output if l['iso639_3'] == ol['iso639_3'])
        if ol.get('benchmarks') and not existing.get('benchmarks'):
            existing['benchmarks'] = ol['benchmarks']
            existing['hasBenchmark'] = True

print(f"Merged in {merged_count} languages from old curated dataset")

# Sort by speakers descending
output.sort(key=lambda l: l['speakers'], reverse=True)

print(f"\nOutput: {len(output)} languages")
print(f"Skipped (no geo): {skipped_no_geo}")
print(f"Skipped (no speakers): {skipped_no_speakers}")
print(f"With benchmarks: {sum(1 for l in output if l['hasBenchmark'])}")
print(f"\nSpeaker range: {output[0]['speakers']:,} to {output[-1]['speakers']:,}")
print(f"> 1M:   {sum(1 for l in output if l['speakers'] >= 1_000_000)}")
print(f"> 100K: {sum(1 for l in output if l['speakers'] >= 100_000)}")
print(f"> 10K:  {sum(1 for l in output if l['speakers'] >= 10_000)}")

print(f"\nTop 15:")
for l in output[:15]:
    print(f"  {l['name']} ({l['iso639_3']}) — {l['speakers']:,} — {l['family']} — {l['coordinates']}")

with open(OUT, 'w') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nWritten to {OUT}")
