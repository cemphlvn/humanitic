"""
protocol — the COMMON ADAPTER LANGUAGE that unifies every partner kind: data, inference, broker,
onchain, payments. One shape (name, kind, describe()) so partners compose. This is the unifying
architecture's seam: the strategy substrate (regime -> strategy -> backtest) and the agent economy
(earn -> pay -> trade) speak the same language and plug together (composable architecture).
"""
PARTNER_KINDS = ("data", "inference", "broker", "onchain", "payments", "training", "simulator",
                 "policy")


def conforms(obj):
    """An adapter speaks the common language iff it has a str `name`, a valid `kind`, and `describe()`."""
    return (isinstance(getattr(obj, "name", None), str)
            and getattr(obj, "kind", None) in PARTNER_KINDS
            and callable(getattr(obj, "describe", None)))
