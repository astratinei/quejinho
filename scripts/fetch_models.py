#!/usr/bin/env python3
"""Downloads the English <-> Portuguese translation models that Firefox Translations uses
(from Mozilla's public model catalog) and writes models/registry.json.
Run by the GitHub Action before publishing. Needs python3 and the zstandard package."""
import hashlib, io, json, os, re, sys, urllib.request

API = os.environ.get("MODEL_API", "https://firefox.settings.services.mozilla.com/v1").rstrip("/")
PAIRS = [("en", "pt"), ("pt", "en")]
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

if os.path.exists("models/registry.json"):
    print("Models already present.")
    sys.exit(0)

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "queijinho-build"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return r.read()

def decompress(data):
    if data[:4] == b"\x28\xb5\x2f\xfd":
        import zstandard
        out = io.BytesIO()
        zstandard.ZstdDecompressor().copy_stream(io.BytesIO(data), out)
        return out.getvalue()
    if data[:2] == b"\x1f\x8b":
        import gzip
        return gzip.decompress(data)
    return data

def version_key(v):
    v = v or "0"
    return (not re.search(r"[A-Za-z]", v), tuple(int(n) for n in re.findall(r"\d+", v)))

info = json.loads(get(API + "/"))
base = info["capabilities"]["attachments"]["base_url"]
records = json.loads(get(API + "/buckets/main/collections/translations-models/records?_limit=5000"))["data"]
print("Catalog has", len(records), "files")

registry = {}
for src, dst in PAIRS:
    pair = src + dst
    cands = [r for r in records if r.get("fromLang") == src and r.get("toLang") == dst and r.get("attachment")]
    if not cands:
        sys.exit("No models for %s->%s in the catalog" % (src, dst))
    by_type = {}
    for r in cands:
        by_type.setdefault(r.get("fileType"), []).append(r)
    os.makedirs("models/" + pair, exist_ok=True)
    entry = {}
    for ftype, rs in by_type.items():
        if ftype not in ("model", "lex", "vocab", "srcvocab", "trgvocab"):
            continue
        rs.sort(key=lambda r: (version_key(r.get("version")), -r["attachment"].get("size", 0)), reverse=True)
        r = rs[0]
        att = r["attachment"]
        raw = get(base.rstrip("/") + "/" + att["location"].lstrip("/"))
        if att.get("hash") and hashlib.sha256(raw).hexdigest() != att["hash"]:
            sys.exit("Checksum mismatch for " + att["location"])
        data = decompress(raw)
        assert len(data) > 10000, "file too small: " + str(r.get("name"))
        name = r.get("name") or re.sub(r"\.(zst|gz)$", "", att.get("filename", ftype))
        path = "models/%s/%s" % (pair, name)
        with open(path, "wb") as f:
            f.write(data)
        entry[ftype] = {"name": path, "size": len(data), "expectedSha256Hash": hashlib.sha256(data).hexdigest()}
        print(pair, ftype, r.get("version"), name, len(data))
    if "vocab" not in entry and not ("srcvocab" in entry and "trgvocab" in entry):
        sys.exit("Missing vocab for " + pair)
    if "model" not in entry or "lex" not in entry:
        sys.exit("Missing model or lex for " + pair)
    registry[pair] = entry

with open("models/registry.json", "w") as f:
    json.dump(registry, f, indent=1)
print("Wrote models/registry.json")
