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


def main():
    suites = [test_kernel, test_backtest, test_constitution, test_index, test_trigram,
              test_commons, test_spine, test_spine_props, test_court_props,
              test_privacy_props, test_index_props, test_health]
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
