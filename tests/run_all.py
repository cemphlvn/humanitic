"""Run every suite. Usage:  PYTHONPATH=. python3 tests/run_all.py"""
import sys
import traceback
import test_kernel
import test_backtest
import test_constitution
import test_index
import test_trigram
import test_commons
import test_spine
import test_spine_props
import test_court_props
import test_privacy_props
import test_index_props
import test_health
import test_news_probe
import test_trigram_strategy
import test_jepa
import test_critic
import test_vsa_mlx
import test_cross_seam
import test_autonomous
import test_partners
import test_personal_os
import test_secure_temp
import test_data
import test_agent_economy
import test_harness
import test_detection
import test_security
import test_secrets
import test_machine
import test_training
import test_runtime
import test_embodied
import test_atoms
import test_stream_eval
import test_align_crypto
import test_stats
import test_screening
import test_candidates
import test_real_adapters
import test_pace_of_place
import test_search
import test_significance
import test_unsupervised
import test_containment
import test_ingest


def main():
    suites = [test_kernel, test_backtest, test_constitution, test_index, test_trigram,
              test_commons, test_spine, test_spine_props, test_court_props,
              test_privacy_props, test_index_props, test_health,
              test_news_probe, test_trigram_strategy, test_jepa, test_critic, test_vsa_mlx,
              test_cross_seam, test_autonomous, test_partners, test_personal_os, test_secure_temp,
              test_data, test_agent_economy, test_harness, test_detection, test_security, test_secrets,
              test_machine, test_training, test_runtime, test_embodied, test_atoms, test_stream_eval,
              test_align_crypto, test_stats, test_screening, test_candidates, test_real_adapters,
              test_pace_of_place, test_search, test_significance, test_unsupervised, test_containment,
              test_ingest]
    ok = 0
    for s in suites:
        try:
            s.run()
            ok += 1
        except Exception:
            print(f"FAIL {s.__name__}")
            traceback.print_exc()
    print(f"\n{ok}/{len(suites)} suites green")
    return 0 if ok == len(suites) else 1


if __name__ == "__main__":
    sys.exit(main())
