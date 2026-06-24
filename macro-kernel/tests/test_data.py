"""Persona-driven (nemotron-alike) data: personas -> sentiment -> regime -> market; backtests behind w_t."""
import numpy as np
from foundation.data import synthetic_personas, adapter
from foundation.backtest import walk_forward
from foundation.operator import trigram_strategy


def run():
    # personas: deterministic, appetite bounded
    P = synthetic_personas.generate_personas(500, seed=1)
    assert len(P["archetype"]) == 500 and P["appetite"].min() >= 0 and P["appetite"].max() <= 1
    assert np.array_equal(P["archetype"], synthetic_personas.generate_personas(500, seed=1)["archetype"])

    # persona market: shapes, regimes, bounded sentiment; the regime tracks the sentiment it's built from
    m = synthetic_personas.persona_market(n_days=1000, n_personas=1500, seed=2)
    assert m["prices"].shape == (1000,)
    assert set(np.unique(m["regime_labels"])).issubset({0, 1, 2})
    assert m["sentiment"].min() >= -1.0 and m["sentiment"].max() <= 1.0
    on = m["sentiment"][m["regime_labels"] == 0]
    off = m["sentiment"][m["regime_labels"] == 1]
    if len(on) and len(off):
        assert on.mean() > off.mean()                         # risk_on sentiment > risk_off

    # the adapter conforms, and a strategy backtests on the nemotron-alike data behind the w_t contract
    src = adapter.PersonaSource(n_days=1200, n_personas=2000, seed=3)
    assert src.name == "nemotron-persona" and src.prices().shape == (1200,)
    res = walk_forward.walk_forward(
        src.prices(), trigram_strategy.decode(["regime:risk_off", "edge:mean_reversion", "risk:tight"]),
        np.random.default_rng(0))
    assert res["oos"]["n"] > 0 and np.isfinite(res["edge"]["oos"]["held_bits"])

    print("test_data: OK (personas->sentiment->regime->market; regime tracks sentiment; backtests on it)")
    return True


if __name__ == "__main__":
    run()
