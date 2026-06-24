# ark — local-only. Honesty is the metric.
.PHONY: floor test f01 health

floor:        ## the floor: VSA laws + court + guards + edge-in-bits
	PYTHONPATH=. python3 -m foundation.selftest

test:         ## all suites
	PYTHONPATH=. python3 tests/run_all.py

f01:          ## the ethical backtest, end to end
	PYTHONPATH=. python3 experiments/f01_ethical_backtest/run.py

health:       ## computational health, clean runner (--json for agents, -q for exit code only)
	PYTHONPATH=. python3 run_health.py
