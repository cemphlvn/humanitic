"""
lineage — provenance manifest: each pipeline run records its inputs (content-hashed), code version, and
outputs, so any historical result is reproducible and auditable (OpenLineage / DVC spirit, numpy-free).
The caller stamps `ts`/`code_version` (no wall-clock in the library, for deterministic replay).
"""
import json
import hashlib


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def file_hash(path):
    with open(path, "rb") as f:
        return sha256_bytes(f.read())


def manifest(run, inputs, outputs, code_version, ts):
    """A reproducibility record. inputs/outputs are {name: sha256}. Returns a JSON-serializable dict."""
    return {"run": run, "code_version": code_version, "ts": ts,
            "inputs": dict(inputs), "outputs": dict(outputs)}


def dumps(m):
    return json.dumps(m, sort_keys=True)
