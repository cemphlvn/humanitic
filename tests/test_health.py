"""run_health contract: stable schema, all checks present + isolated, deterministic, JSON-serializable."""
import json
import run_health


def run():
    r = run_health.build_report(seed=0, write=False, quick=True)
    assert r["schema_version"] == run_health.SCHEMA_VERSION
    assert r["status"] in ("PASS", "WARN", "FAIL", "ERROR")
    assert all(k in r["env"] for k in ("python", "numpy", "platform"))
    assert "timestamp_utc" in r

    names = [c["name"] for c in r["checks"]]
    assert names == sorted(names) and len(names) == 5          # deterministic order, all 5 checks

    for c in r["checks"]:
        assert c["status"] in ("PASS", "WARN", "FAIL", "ERROR")
        assert "summary" in c and "data" in c
        if c["status"] != "PASS":
            assert c["remediation"], c                          # actionable hint on every non-pass

    json.dumps(r)                                               # fully serializable (agent-parseable)

    r2 = run_health.build_report(seed=0, write=False, quick=True)
    assert r2["status"] == r["status"]                          # deterministic status
    assert [c["name"] for c in r2["checks"]] == names
    print("test_health: OK")
    return True


if __name__ == "__main__":
    run()
