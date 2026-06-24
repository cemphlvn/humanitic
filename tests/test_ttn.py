"""TTN is the LoRaWAN SECTOR FACTOR, not a candidate: a token-free baseline of sector-wide IoT activity
used to control for sector beta in the tokenized DePINs. So describe()["token"] is None, and the adapter
still speaks the common partner language and feeds the same demo_fixture -> stream floor as helium/geodnet."""
import numpy as np

from foundation.commons import protocol
from foundation.data.adapters.ttn import TTNetwork, activity_stream


def run():
    t = TTNetwork(endpoint=None)

    # Speaks the common adapter language and is a data partner
    assert protocol.conforms(t)
    assert t.kind == "data"

    # It is a SECTOR FACTOR, not a tradeable token: describe() carries no token
    d = t.describe()
    assert d["token"] is None
    assert "no-token" in d["capabilities"] and "sector-factor" in d["capabilities"]

    # Unconfigured live read raises with setup instructions (no network in the offline path)
    raised = False
    try:
        t.activity()
    except RuntimeError:
        raised = True
    assert raised

    # demo_fixture -> activity_stream gives a real, varying sector-activity series
    records = TTNetwork.demo_fixture()
    times, activity = activity_stream(records, window_s=300)
    assert len(times) == len(activity)
    assert len(activity) > 30
    assert activity.std() > 0
    assert np.all(activity >= 0)

    print("test_ttn: OK (sector factor: token is None; conforms+data; activity() raises unconfigured; "
          "demo_fixture -> activity_stream varies)")
    return True


if __name__ == "__main__":
    run()
