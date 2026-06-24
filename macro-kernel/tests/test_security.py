"""Security posture: the gates the novel additions introduce are all present (regression guard)."""
from foundation.security import audit
from foundation.payments.x402 import PaymentBudget


def run():
    p = audit.security_posture()
    assert p["posture"] == "SECURE", [c for c in p["checks"] if not c["ok"]]
    ok = {c["name"]: c["ok"] for c in p["checks"]}
    for gate in ("x402_budget_cap", "cdp_testnet_gate", "live_token_gate", "publish_guard",
                 "secure_temp", "ethical_gate"):
        assert ok.get(gate) is True, gate

    # the new x402 single-payment cap: a single drain is refused even within total budget
    pb = PaymentBudget(budget=10.0, max_single=1.0)
    pb.spend(0.5, "a")
    try:
        pb.spend(2.0, "b")
        raise AssertionError("x402 single-payment cap must fire")
    except PermissionError:
        pass

    print("test_security: OK (posture=SECURE; %d gates present; x402 single-cap enforced)"
          % len(p["checks"]))
    return True


if __name__ == "__main__":
    run()
