"""
adapter — market-data sources behind the weight-vector contract. A source exposes `prices()` (and
regime labels); causality (point-in-time) is enforced downstream by the strategy/court, which only
ever reads prices[:t+1]. Real sources (Stooq / Polygon / CDP onchain) are RUNTIME adapters behind the
same interface — registered partners speaking the common language. Offline we use the synthetic and
the persona-driven (nemotron-alike) sources.
"""
from foundation.backtest import synthetic
from foundation.data import synthetic_personas


class SyntheticSource:
    name = "synthetic"

    def __init__(self, n_days=1500, seed=0):
        self._d = synthetic.generate(n_days=n_days, seed=seed)

    def prices(self):
        return self._d["prices"]

    def regime_labels(self):
        return self._d["regime_labels"]


class PersonaSource:
    """Nemotron-alike: synthetic personas drive the regime that drives the market."""
    name = "nemotron-persona"

    def __init__(self, n_days=1500, n_personas=2000, seed=0):
        self._d = synthetic_personas.persona_market(n_days=n_days, n_personas=n_personas, seed=seed)

    def prices(self):
        return self._d["prices"]

    def regime_labels(self):
        return self._d["regime_labels"]

    def sentiment(self):
        return self._d["sentiment"]
