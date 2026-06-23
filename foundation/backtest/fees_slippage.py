"""
Transaction costs. The cheapest way to kill a beautiful backtest is to ignore these.
    cost = (bps / 10_000) * turnover,   turnover = sum|w_t - w_{t-1}|
Default 5 bps round-trip-ish per unit turnover. Conservative > optimistic, always.
"""
import numpy as np


def turnover(prev_w, new_w):
    return float(np.sum(np.abs(np.asarray(new_w, float) - np.asarray(prev_w, float))))


def cost(prev_w, new_w, bps=5.0):
    return bps / 10_000.0 * turnover(prev_w, new_w)
