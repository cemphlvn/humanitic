"""The unifying architecture: x402 budget-gated pay, CDP testnet-gate, the earn->pay->trade loop."""
import numpy as np
from foundation.payments import x402
from foundation.execution import onchain
from foundation.commons import protocol
from foundation import agent_economy, personal_os
from foundation.operator import vault, trigram_strategy
from foundation.backtest import synthetic


def run():
    # x402: budget-gated micropayments; over-budget refused; offline meter settles deterministically
    pb = x402.PaymentBudget(budget=0.10)
    assert pb.spend(0.03, "https://data.example/quote")["status"] == "ok"
    assert abs(pb.remaining - 0.07) < 1e-9
    try:
        pb.spend(0.20, "https://data.example/big")
        raise AssertionError("over-budget must be refused")
    except PermissionError:
        pass
    # the runtime CDP facilitator raises offline (needs a funded wallet)
    try:
        x402.CDPFacilitator().settle(0.01, "x")
        raise AssertionError("CDP facilitator must raise offline")
    except RuntimeError:
        pass

    # CDP onchain adapter: speaks the common language, testnet-gated, raises offline
    cdp = onchain.CDPAdapter()
    assert protocol.conforms(cdp) and cdp.kind == "onchain"
    assert cdp.assert_trade_allowed("base-sepolia")                       # testnet ok
    try:
        cdp.assert_trade_allowed("base-mainnet")
        raise AssertionError("mainnet trade must require approval")
    except PermissionError:
        pass
    assert cdp.assert_trade_allowed("base-mainnet", escalation_approved=True)
    try:
        cdp.trade("ETH", "USDC", 1.0, escalation_approved=True)
        raise AssertionError("trade offline must raise")
    except RuntimeError:
        pass

    # adapters across kinds speak the common language
    assert protocol.conforms(x402.X402Meter())

    # the unified loop: earn (HUMANITIK 95/5) -> pay (x402) -> trade (paper)
    me = personal_os.PersonalOS(vault.InMemoryVault(trigram_strategy.FIXTURE_TRIGRAMS), owner="cem")
    econ = agent_economy.AgentEconomy(me, x402.PaymentBudget(budget=1.0))
    split = econ.earn(1.0)
    assert abs(split["foundation"] - 0.05) < 1e-9 and econ.balance > 0
    econ.pay(0.02, "https://data.example/regime")
    assert econ.payments.remaining < 1.0
    assert econ.run(synthetic.generate(n_days=800, seed=7)["prices"])["mode"] == "PAPER"

    print("test_agent_economy: OK (x402 budget-gated, CDP testnet-gated, earn->pay->trade unified loop)")
    return True


if __name__ == "__main__":
    run()
