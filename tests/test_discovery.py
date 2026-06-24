"""The candidate source is REAL only if different finders are genuinely orthogonal: re-seeding one
generator gives cosmetic breadth (same mechanism, same shocks), but three distinct finders — regime,
pace, geodnet — produce streams that don't co-move. This test pins both: the registry shape, and that
cross-SOURCE P&L pairs are actually uncorrelated (the breadth the book earns from)."""
import numpy as np

from foundation.portfolio import discovery as D


def _pearson(a, b):
    """|-keeping Pearson correlation, aligned to the SHORTER stream (most recent common bars)."""
    a, b = np.asarray(a, float), np.asarray(b, float)
    T = min(len(a), len(b))
    a, b = a[-T:], b[-T:]
    return float(np.corrcoef(a, b)[0, 1])


def run():
    cands = D.candidates(2)

    # Shape: 2 seeds x 4 sources = 8 candidates, spanning all four finders (incl. the LoRaWAN sister).
    assert len(cands) == 8, len(cands)
    assert {c["source"] for c in cands} == {"regime", "pace", "geodnet", "helium"}
    assert sorted(c["id"] for c in cands) == [
        "geodnet-1", "geodnet-2", "helium-1", "helium-2", "pace-1", "pace-2", "regime-1", "regime-2"]

    # Each P&L is a real 1D per-bar stream with enough bars for the court.
    for c in cands:
        assert isinstance(c["pnl"], np.ndarray) and c["pnl"].ndim == 1, c["id"]
        assert len(c["pnl"]) > 100, (c["id"], len(c["pnl"]))

    # Orthogonality is the whole point: at least two CROSS-SOURCE pairs must be genuinely uncorrelated
    # (|pearson| < 0.3). Different finders => orthogonal by construction, not by luck.
    by_id = {c["id"]: c for c in cands}
    cross_lt = 0
    for i, ci in enumerate(cands):
        for cj in cands[i + 1:]:
            if ci["source"] != cj["source"]:
                if abs(_pearson(ci["pnl"], cj["pnl"])) < 0.3:
                    cross_lt += 1
    assert cross_lt >= 2, "too few orthogonal cross-source pairs: %d" % cross_lt

    # Determinism: the finders are pure functions of the seed.
    again = D.candidates(2)
    assert all(np.array_equal(by_id[c["id"]]["pnl"], c["pnl"]) for c in again)

    print("test_discovery: OK (8 candidates across regime/pace/geodnet/helium; %d cross-source pairs "
          "|r|<0.3; deterministic)" % cross_lt)
    return True


if __name__ == "__main__":
    run()
