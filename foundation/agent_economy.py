"""
agent_economy — the UNIFYING ARCHITECTURE. Merge both halves of ark under one loop: the strategy
SUBSTRATE (a PersonalOS: regime -> strategy -> backtest, paper-gated) and the AGENT ECONOMY (earn via
HUMANITIK, pay via x402, trade via broker / CDP onchain). One composable language; one loop:

    earn (HUMANITIK contribution)  ->  budget  ->  pay (x402 per-call for data/compute)  ->
    trade (paper / broker / CDP onchain, gated)  ->  calibrate

Every outward economic action is gated: x402 spend can't exceed the budget; onchain mainnet trades
need the human-approved live gate; wallet/API secrets live in dot-local, never shared temp, never
published. This is "we need both, merged under the unifying architecture."
"""
from foundation.index.trigram import reward_split


class AgentEconomy:
    def __init__(self, os, payments, register=None, balance=0.0):
        self.os = os                      # PersonalOS — the strategy substrate
        self.payments = payments          # x402 PaymentBudget — the pay rail
        self.register = register          # HUMANITIK partner register
        self.balance = float(balance)     # earned credits
        self.ledger = []

    def earn(self, contribution_value):
        """HUMANITIK: a de-identified contribution earns 95%, 5% to the foundation."""
        split = reward_split(contribution_value)
        self.balance += split["cartographer"]
        self.ledger.append(("earn", split["cartographer"], split["foundation"]))
        return split

    def pay(self, amount, resource):
        """x402 per-call payment (budget-gated). Returns the settlement receipt."""
        receipt = self.payments.spend(amount, resource)
        self.ledger.append(("pay", float(amount), resource))
        return receipt

    def run(self, prices, seed=0):
        """Trade the strategy substrate (paper, gated by the critic + risk stack + live token)."""
        return self.os.run(prices, seed=seed)
