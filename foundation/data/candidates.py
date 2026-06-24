"""
candidates — crypto/web3 projects that may possess ROBOTIC streaming data alignable to their market /
on-chain dynamics (parallel research, June 2026). Each is a CANDIDATE to be scored with
foundation/data/screening.py. Alignability: YES (stream + market + tractable as-of join), PARTIAL (one
side weak), NO (conceptual only). [UNCERTAIN] = unverified; re-check before scoping. Not investment
advice — a research target list for the robot↔market atom miner.
"""
from collections import namedtuple

from foundation.data import screening

Candidate = namedtuple("Candidate", "id name token streaming access alignability note")

CANDIDATES = [
    Candidate("frodobots", "FrodoBots-2K / BitRobot", "none-yet", "yes",
              "open (HF CC-BY-SA-4.0, ~1TB S3)", "partial",
              "richest OPEN robot stream (GPS@1Hz, IMU@100Hz, stereo video); token not launched — proxy via FIL/TAO"),
    Candidate("geodnet", "GEODNET", "GEOD", "yes",
              "commercial API + free trial + github ntrip", "yes",
              "most operationally ready: RTCM 1s GPS-time epochs; GEOD Coinbase-listed, 80% rev->burn"),
    Candidate("robonomics", "Robonomics", "XRT", "partial",
              "open ROS2 wrapper; logs on IPFS, hash on-chain", "partial",
              "ideal architecture (ROS2->datalog->IPFS+on-chain hash) but thin, lab-scale volume"),
    Candidate("peaq", "peaq", "PEAQ", "partial",
              "open SDK; app telemetry gated", "partial",
              "best L1 substrate; Universal Machine Time (ns PTP on-chain) is the perfect join clock; data per-app"),
    Candidate("hivemapper", "Hivemapper / Bee Maps", "HONEY", "yes",
              "ODC API open-source; map data sold", "partial",
              "quickest prototype: GPS+4K video timestamped; HONEY burns on map purchase are on-chain"),
    Candidate("natix", "NATIX Network", "NATIX", "partial",
              "StreetVision subnet open; raw feed gated", "partial",
              "360 dashcam + Bittensor inference; burns on-chain; raw camera proprietary"),
    Candidate("openmind", "OpenMind / Fabric", "ROBO", "partial",
              "OM1 OS open; fleet data gated", "partial",
              "credible robot OS + on-chain machine identity; 10-dog fleet data not yet public; ROBO liquid"),
    Candidate("rice", "RICE AI (Rice Robotics)", "RICE", "partial",
              "commercial data marketplace (licensed)", "partial",
              "real multi-modal teleop data (vision/joint/force) across 500+ robots; access by license"),
    Candidate("auki", "Auki Labs / Posemesh", "AUKI", "partial",
              "protocol open; domain data private", "partial",
              "spatial pose telemetry; private per operator by design; AUKI live on Base"),
    Candidate("tashi", "Tashi Protocol", "TASHI", "partial",
              "no open dataset found", "partial",
              "[UNCERTAIN] M2M consensus layer; pre-revenue; no verified robot stream"),
    Candidate("codecflow", "CodecFlow", "CODEX", "partial",
              "Optr/Fabric SDK live; data ephemeral", "partial",
              "[UNCERTAIN] per-task agent video streaming; transient, no persistent archive; early"),
    Candidate("xmaquina", "XMAQUINA", "DEUS", "no",
              "no verifiable telemetry pipeline", "no",
              "equity-tokenization DAO for robotics firms; 'telemetry oracle' is roadmap language, not data"),
    Candidate("aixcrypto", "AIxCrypto / RoboShare", "AIXC", "no",
              "proprietary; Nasdaq company", "no",
              "[UNCERTAIN] robot lifecycle data -> asset value framing; proprietary, not a crypto protocol"),
    Candidate("gradient", "Gradient Network", "none-yet", "no",
              "compute metrics only", "no",
              "compute DePIN; no robot telemetry"),
]

# rubric answers (0-3 per question) for the top targets, grounded in the June-2026 research. The point is
# to COMPUTE the verdict from the questions, not assert it. (set() = no automatic disqualifiers tripped.)
SCREENED = {
    "geodnet": ({"data_modality": [3, 2, 3], "streaming_timestamps": [3, 3, 3], "access_openness": [2, 2, 3],
                 "verifiability": [1, 2, 1], "market_linkage": [3, 3, 3], "alignment_feasibility": [3, 2, 2, 3],
                 "legal_ethical": [3, 2, 2]}, set()),
    "hivemapper": ({"data_modality": [3, 3, 3], "streaming_timestamps": [3, 2, 2], "access_openness": [2, 2, 2],
                    "verifiability": [2, 2, 1], "market_linkage": [3, 3, 3], "alignment_feasibility": [3, 3, 2, 2],
                    "legal_ethical": [1, 2, 2]}, set()),
    "peaq": ({"data_modality": [2, 2, 2], "streaming_timestamps": [3, 2, 2], "access_openness": [2, 1, 2],
              "verifiability": [3, 2, 2], "market_linkage": [3, 2, 3], "alignment_feasibility": [3, 2, 2, 2],
              "legal_ethical": [2, 2, 2]}, set()),
    "frodobots": ({"data_modality": [3, 3, 3], "streaming_timestamps": [2, 3, 2], "access_openness": [2, 3, 2],
                   "verifiability": [1, 2, 1], "market_linkage": [1, 1, 1], "alignment_feasibility": [2, 3, 2, 3],
                   "legal_ethical": [1, 3, 2]}, set()),
    "xmaquina": ({"data_modality": [0, 0, 0], "streaming_timestamps": [0, 0, 0], "access_openness": [0, 0, 0],
                  "verifiability": [0, 0, 0], "market_linkage": [3, 0, 0], "alignment_feasibility": [0, 0, 0, 0],
                  "legal_ethical": [1, 1, 1]}, {"no_provenance"}),
}


def by_id(cid):
    return next(c for c in CANDIDATES if c.id == cid)


def screen(cid):
    answers, disqualifiers = SCREENED[cid]
    return screening.score(answers, disqualifiers)


def ranked():
    """Screened candidates by fitness, high to low."""
    rows = [(cid, screen(cid)) for cid in SCREENED]
    rows.sort(key=lambda r: -r[1]["score"])
    return [(cid, r["score"], r["verdict"]) for cid, r in rows]
