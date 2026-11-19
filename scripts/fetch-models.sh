#!/usr/bin/env bash
# Downloads the small English <-> Portuguese translation models from Mozilla's
# Firefox Translations project and writes models/registry.json.
# Needs git and git-lfs. Run by the GitHub Action, or by hand: bash scripts/fetch-models.sh
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f models/registry.json ]; then echo "Models already present."; exit 0; fi
command -v git-lfs >/dev/null || { echo "git-lfs is required (https://git-lfs.com)"; exit 1; }
git lfs install --skip-repo
TMP="$(mktemp -d)"
git clone --depth 1 --filter=blob:none --sparse https://github.com/mozilla/firefox-translations-models "$TMP/fm"
( cd "$TMP/fm"
  git sparse-checkout set --no-cone '/models/tiny/enpt/*' '/models/tiny/pten/*'
  git lfs pull --include="models/tiny/enpt/*,models/tiny/pten/*" )
mkdir -p models/enpt models/pten
for pair in enpt pten; do
  for f in "$TMP/fm/models/tiny/$pair/"*.gz; do
    gzip -t "$f" || { echo "Not a real gzip file (still an LFS pointer?): $f"; exit 1; }
    gunzip -c "$f" > "models/$pair/$(basename "${f%.gz}")"
  done
done
python3 - <<'PY'
import hashlib, json, os
reg = {}
for pair in ("enpt", "pten"):
    entry = {}
    for name in sorted(os.listdir("models/" + pair)):
        if name.endswith(".json"):
            continue
        path = "models/%s/%s" % (pair, name)
        part = "model" if name.startswith("model.") else "lex" if name.startswith("lex.") else "vocab" if name.startswith("vocab.") else None
        if not part:
            continue
        data = open(path, "rb").read()
        assert len(data) > 10000, "file too small: " + path
        entry[part] = {"name": path, "size": len(data), "expectedSha256Hash": hashlib.sha256(data).hexdigest()}
    assert set(entry) == {"model", "lex", "vocab"}, (pair, list(entry))
    reg[pair] = entry
json.dump(reg, open("models/registry.json", "w"), indent=1)
print("Wrote models/registry.json")
PY
rm -rf "$TMP"
du -sh models
