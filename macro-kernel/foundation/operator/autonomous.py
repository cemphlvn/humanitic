"""
autonomous — the SAFE autonomous core. Event-driven, causal, PAPER by default. LIVE capital is
HARD-GATED behind an explicit human-approval token: no code path reaches a live broker without it
(staged escalation synthetic -> paper -> tiny live). Strategies come from a vault INTERFACE; the real
`.local` vault is the runtime's — this module never reads or writes `.local`.

The risk-gate stack runs every tick: hard gross cap -> turnover throttle -> (post-fill) drawdown
circuit-breaker + single-bar loss limit (the KILL: flatten and halt). Admission gate: a strategy must
clear the agent-CRITIC before it ever trades.
"""
import numpy as np
from foundation.operator import critic
from foundation.operator.trigram_strategy import decode
from foundation.execution.paper import PaperBroker

# The ONLY string that unlocks live capital. The runtime sets it after a human reads the paper report.
LIVE_APPROVAL_TOKEN = "I-HUMAN-APPROVE-LIVE-CAPITAL"


class RiskConfig:
    def __init__(self, max_gross=0.25, max_drawdown=0.10, max_daily_loss=0.05, max_turnover=1.0):
        self.max_gross = max_gross
        self.max_drawdown = max_drawdown
        self.max_daily_loss = max_daily_loss
        self.max_turnover = max_turnover


def paper_session(prices, strategy, rng, risk=None, warmup=25, broker=None):
    """Run one strategy through the paper engine with the full risk-gate stack.
    `broker` lets you swap a partner's execution model (backtest across brokers)."""
    risk = risk or RiskConfig()
    prices = np.asarray(prices, float)
    broker = broker if broker is not None else PaperBroker(rng=rng)
    halted = None
    kills = []
    for t in range(warmup, len(prices) - 1):
        if halted:
            target = 0.0                                          # killed -> stay flat
        else:
            w = float(np.clip(strategy.target_weight(prices, t), -risk.max_gross, risk.max_gross))
            if abs(w - broker.w) > risk.max_turnover:             # turnover throttle
                w = broker.w + np.sign(w - broker.w) * risk.max_turnover
            target = w
        pnl = broker.step(target, prices[t + 1] / prices[t] - 1.0)
        if not halted and broker.drawdown <= -risk.max_drawdown:  # primary circuit-breaker
            halted = "DRAWDOWN"; kills.append((int(t), "DRAWDOWN", round(broker.drawdown, 4)))
        elif not halted and pnl <= -risk.max_daily_loss:          # single-bar loss limit
            halted = "DAILY_LOSS"; kills.append((int(t), "DAILY_LOSS", round(float(pnl), 4)))
    return {"final_equity": float(broker.equity), "max_drawdown": float(broker.max_dd),
            "mean_tracking_err": float(broker.mean_tracking_err), "halted": halted, "kills": kills}


def run_autonomous(vault, prices, rng, risk=None, live=False, approval=None):
    """Admit strategies via the CRITIC (the synthetic->paper gate), run paper sessions. LIVE gated."""
    if live and approval != LIVE_APPROVAL_TOKEN:
        raise PermissionError("live trading requires explicit human approval (staged escalation)")
    risk = risk or RiskConfig()
    prices = np.asarray(prices, float)
    sessions = []
    for concepts in vault.list_strategies():
        strat = decode(concepts)
        audit = critic.audit(strat, prices, np.random.default_rng(1),
                             point_in_time=True, max_gross=risk.max_gross)
        if audit["verdict"] != "CLEAN":                           # admission gate
            sessions.append({"trigram": concepts, "admitted": False, "verdict": audit["verdict"]})
            continue
        rep = paper_session(prices, strat, np.random.default_rng(2), risk)
        rep.update({"trigram": concepts, "admitted": True, "mode": "PAPER"})
        sessions.append(rep)
    return {"mode": "LIVE" if live else "PAPER", "sessions": sessions}
