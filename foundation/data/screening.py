"""
screening — the identifying QUESTIONS for whether a crypto project possesses robotic streaming data that
can be CHECKED and time-ALIGNED with its market / on-chain dynamics.

A research-grade due-diligence rubric (7 weighted dimensions + automatic disqualifiers), distilled from
parallel research. Score a candidate's answers (0-3 per question) into a 0-100 fitness and a verdict.
Refutation posture: assume DISQUALIFIED until the gates pass — most projects fail several questions, and
a project clearing all of them is rare. That rarity is the signal.
"""

DIMENSIONS = [
    {"key": "data_modality", "weight": 0.15, "questions": [
        "Q1.1 What specific physical actuator/sensor generates the data (named hardware)?",
        "Q1.2 How rich is each frame (>=5 distinct physical quantities)?",
        "Q1.3 Continuous streaming telemetry, or post-mission batch upload?"]},
    {"key": "streaming_timestamps", "weight": 0.20, "questions": [
        "Q2.1 What clock stamps each frame (GPS/NTP vs block-timestamp-at-ingestion)?",
        "Q2.2 Nominal frame rate and documented jitter / skew / gaps?",
        "Q2.3 End-to-end latency from physical event to availability (P50/P99)?"]},
    {"key": "access_openness", "weight": 0.10, "questions": [
        "Q3.1 Where is raw telemetry stored, who controls access (on-chain/CID vs gated API)?",
        "Q3.2 License, cost, rate limits, full history from genesis?",
        "Q3.3 Documented, versioned schema?"]},
    {"key": "verifiability", "weight": 0.20, "questions": [
        "Q4.1 Cryptographic proof telemetry came from a specific machine (DID/HSM/PoPW)?",
        "Q4.2 Independent audit or cross-validation against ground truth?",
        "Q4.3 Can individual frames be challenged/disputed (fraud proof, slashing)?"]},
    {"key": "market_linkage", "weight": 0.15, "questions": [
        "Q5.1 Liquid token/market (ADV, spread) plausibly co-moving with physical work?",
        "Q5.2 Documented, falsifiable causal mechanism (physical work -> on-chain event)?",
        "Q5.3 Measurable on-chain activity varying with fleet activity?"]},
    {"key": "alignment_feasibility", "weight": 0.15, "questions": [
        "Q6.1 Translatable shared clock (UTC), skew bounded vs shortest event timescale?",
        "Q6.2 Sampling-rate compatibility (within 1-2 orders of magnitude)?",
        "Q6.3 Timestamped event logs marking robot-state transitions, linkable on-chain?",
        "Q6.4 Any leakage / insider-preview window reversing causal order?"]},
    {"key": "legal_ethical", "weight": 0.05, "questions": [
        "Q7.1 PII / privacy-sensitive content and data-minimization policy?",
        "Q7.2 ToS permits signal extraction, derivative works, commercial use?",
        "Q7.3 Jurisdiction / regulatory status of data operations?"]},
]

# any tripped automatic disqualifier zeroes the score regardless of the weighted dimensions
AUTO_DISQUALIFIERS = {
    "block_timestamp_only": "Q2.1: timestamps are block timestamps applied at ingestion, no sensor clock",
    "no_provenance":        "Q4.1: no cryptographic provenance of any kind",
    "illiquid_token":       "Q5.1: token ADV below $500K on any exchange",
    "insider_preview":      "Q6.4: known insider preview window before public commitment",
}


def all_questions():
    return [q for d in DIMENSIONS for q in d["questions"]]


def score(answers, disqualifiers=None):
    """answers: {dimension_key: [int 0..3 per question]}. disqualifiers: iterable of tripped auto-DQ keys.
    Returns {score 0..100, verdict, per_dimension, disqualified}."""
    tripped = [AUTO_DISQUALIFIERS[k] for k in (disqualifiers or []) if k in AUTO_DISQUALIFIERS]
    per = {}
    total = 0.0
    for dim in DIMENSIONS:
        vals = answers.get(dim["key"], [])
        norm = (sum(vals) / len(vals) / 3.0) if vals else 0.0      # 0..1
        contrib = norm * dim["weight"] * 100.0
        per[dim["key"]] = round(contrib, 1)
        total += contrib
    if tripped:
        total = 0.0
    total = round(total, 1)
    verdict = ("DISQUALIFIED" if tripped or total < 40 else
               "LONG_SHOT" if total < 60 else
               "CONDITIONAL" if total < 80 else "STRONG")
    return {"score": total, "verdict": verdict, "per_dimension": per, "disqualified": tripped}
