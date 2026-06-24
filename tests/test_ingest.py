"""Ingestion discipline: point-in-time (no look-ahead), quality gates+quarantine, survivorship, lineage,
and the Deflated Sharpe trial-count haircut."""
from foundation.ingest import bitemporal as bt
from foundation.ingest import quality as q
from foundation.ingest import universe as uni
from foundation.ingest import lineage as lin
from foundation.eval import significance as sig


def run():
    # POINT-IN-TIME: a GDP print released day 100, revised day 130 -> no look-ahead
    s = bt.PointInTimeStore()
    s.record(valid_from=90, value=2.0, known_from=100)          # advance estimate
    s.record(valid_from=90, value=2.5, known_from=130)          # revision
    assert s.latest_as_of(95, 90) is None                       # not yet released
    assert s.latest_as_of(110, 90) == 2.0                       # only the advance is knowable
    assert s.latest_as_of(140, 90) == 2.5                       # revision now knowable

    # QUALITY gates + quarantine (never silently dropped/clipped)
    c = q.SchemaContract(fields={"px": float}, ranges={"px": (0.0, 1e6)})
    clean, quar = q.gate([{"px": 100.0}, {"px": -5.0}, {"px": "x"}], c)
    assert len(clean) == 1 and len(quar) == 2
    assert quar[0]["reason"].startswith("RANGE") and quar[1]["reason"].startswith("BAD_TYPE")

    # SURVIVORSHIP-safe universe
    u = uni.Universe([("AAA", 0, None, "active"), ("FAIL", 0, 50, "delisted")])
    assert u.members_as_of(40) == ["AAA", "FAIL"] and u.members_as_of(60) == ["AAA"]

    # LINEAGE manifest (content-hashed, reproducible)
    m = lin.manifest("mine.geodnet", inputs={"fixture": lin.sha256_bytes(b"abc")},
                     outputs={}, code_version="deadbeef", ts=1_718_900_000)
    assert m["inputs"]["fixture"] == lin.sha256_bytes(b"abc") and m["code_version"] == "deadbeef"

    # DEFLATED SHARPE: the SAME observed Sharpe is skilled with 1 trial, NOT after 500 (multiple testing)
    few = sig.deflated_sharpe(0.18, n_trials=1, n_obs=500, sr_variance=0.01)
    many = sig.deflated_sharpe(0.18, n_trials=500, n_obs=500, sr_variance=0.01)
    assert few["deflated_sharpe"] > many["deflated_sharpe"]
    assert many["expected_max_sr_under_null"] > few["expected_max_sr_under_null"]

    print("test_ingest: OK (PIT no-lookahead; quality quarantine; survivorship; lineage; "
          "deflated-sharpe haircut %.2f@1 -> %.2f@500 trials)"
          % (few["deflated_sharpe"], many["deflated_sharpe"]))
    return True


if __name__ == "__main__":
    run()
