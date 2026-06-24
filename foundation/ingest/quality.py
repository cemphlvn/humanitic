"""
quality — data-quality gates as executable contracts. A record must clear schema -> range -> freshness
before it is trusted; failures are QUARANTINED (kept with a reason code), never silently dropped or
clipped. Schema contracts catch ~90% of vendor-feed breaks before they corrupt history (Soda / Great
Expectations spirit, numpy-free).
"""


class SchemaContract:
    def __init__(self, fields, ranges=None, max_staleness=None):
        self.fields = dict(fields)                              # name -> expected type
        self.ranges = ranges or {}                              # name -> (lo, hi)
        self.max_staleness = max_staleness                      # now - valid_from must be <= this

    def check(self, rec, now=None):
        """Return (ok, reason). reason is a quarantine code when not ok."""
        for k, typ in self.fields.items():
            if k not in rec:
                return False, "MISSING_FIELD:%s" % k
            if isinstance(rec[k], bool) or not isinstance(rec[k], typ):
                return False, "BAD_TYPE:%s" % k
        for k, (lo, hi) in self.ranges.items():
            if not (lo <= rec[k] <= hi):
                return False, "RANGE_VIOLATION:%s" % k
        if self.max_staleness is not None and now is not None and "valid_from" in rec:
            if (now - rec["valid_from"]) > self.max_staleness:
                return False, "STALE"
        return True, None


def gate(records, contract, now=None):
    """Split records into (clean, quarantined). Quarantine keeps the record + the reason — never dropped."""
    clean, quarantine = [], []
    for r in records:
        ok, reason = contract.check(r, now=now)
        if ok:
            clean.append(r)
        else:
            quarantine.append({"record": r, "reason": reason})
    return clean, quarantine
