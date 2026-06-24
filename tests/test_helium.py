"""Helium adapter floor: it speaks the common adapter language (data kind), refuses to read live when
unconfigured, and its offline fixture drives a varying DATA-TRANSFER throughput stream (DC burned per
window — the burn-and-mint physical signal behind HNT)."""
from foundation.commons import protocol
from foundation.data.adapters import helium


def run():
    hv = helium.HeliumAPI(endpoint=None)

    # speaks the common adapter language, as a data partner
    assert protocol.conforms(hv)
    assert hv.kind == "data"

    # unconfigured live read refuses (no network in the system path)
    try:
        hv.activity()
        raised = False
    except RuntimeError:
        raised = True
    assert raised, "activity() must raise RuntimeError when HELIUM_API_URL is unset"

    # offline fixture -> data-transfer stream that actually VARIES (busy/quiet diurnal pattern)
    recs = helium.HeliumAPI.demo_fixture()
    t, transfer = helium.transfer_stream(recs, window_s=300)
    assert len(t) == len(transfer) > 30
    assert transfer.std() > 0                                  # DC-burn throughput varies over time

    print("test_helium: OK (conforms+data; live refuses unconfigured; demo_fixture -> varying DC-burn "
          "transfer_stream)")
    return True


if __name__ == "__main__":
    run()
