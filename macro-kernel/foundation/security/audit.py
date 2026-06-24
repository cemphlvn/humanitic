"""
audit — the SECURITY POSTURE self-check. The novel additions (x402 payments, CDP onchain, the agent
economy, the partner register, the personal OS) widen the attack surface; this asserts the DEFENSES
are present, so a regression that quietly removes a gate is caught (the spirit of Article 0.3:
"the guard cannot be hidden"). Returns SECURE only if every gate holds.
"""


def security_posture():
    checks = []

    def add(name, ok, detail):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    # x402 budget circuit-breaker: spend can't exceed the session budget
    from foundation.payments.x402 import PaymentBudget
    over = False
    try:
        PaymentBudget(budget=1.0).spend(2.0, "x")
    except PermissionError:
        over = True
    add("x402_budget_cap", over, "x402 spend() refuses to exceed the session budget")

    # CDP testnet-gate: a mainnet onchain trade needs the human-approved live gate
    from foundation.execution.onchain import CDPAdapter
    gated = False
    try:
        CDPAdapter().assert_trade_allowed("base-mainnet")
    except PermissionError:
        gated = True
    add("cdp_testnet_gate", gated, "mainnet onchain trade requires the human-approved live gate")

    # live fiat-capital token gate present
    from foundation.operator import autonomous
    add("live_token_gate", bool(autonomous.LIVE_APPROVAL_TOKEN),
        "live fiat capital needs the explicit approval token")

    # Article 0 publish guard: blocks .local AND *.local
    from foundation.privacy import publish_guard
    add("publish_guard",
        (not publish_guard.is_publishable(".local/x")) and (not publish_guard.is_publishable("x.local")),
        "publish_guard blocks .local paths and *.local filenames")

    # secure scratch: private data refused in shared temp
    from foundation.security import secure_temp
    refused = False
    try:
        secure_temp.assert_not_private("/tmp/a/.local/x")
    except PermissionError:
        refused = True
    add("secure_temp", refused, "private data refused in shared temp")

    # ethical gate: no partner registers without a HUMANITIK license
    from foundation.commons import registry
    rej = False
    try:
        registry.PartnerRegister().register({"id": "x", "kind": "broker", "license": {"scheme": "MIT"}})
    except ValueError:
        rej = True
    add("ethical_gate", rej, "partner registration refused without a HUMANITIK license")

    posture = "SECURE" if all(c["ok"] for c in checks) else "DEGRADED"
    return {"posture": posture, "checks": checks,
            "status": "PASS" if posture == "SECURE" else "FAIL"}
