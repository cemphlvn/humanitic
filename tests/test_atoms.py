"""Atoms: non-abelian (order-dependent) encoding; mine robot↔market correspondence; predict, order-aware."""
from foundation.regime import atoms
from foundation.kernel import vsa


def run():
    # NON-ABELIAN: order matters (unlike plain abelian bind/bundle)
    ab = atoms.encode_sequence(["phase:reach", "gripper:open"])
    ba = atoms.encode_sequence(["gripper:open", "phase:reach"])
    assert vsa.similarity(ab, ab) > 0.99              # same order -> identical
    assert vsa.similarity(ab, ba) < 0.6               # swapped order -> different (non-abelian)

    # mine atoms of robot signal <-> market correspondent, then predict the correspondent
    st = atoms.AtomStore()
    st.mine(["phase:reach", "gripper:open"], ["regime:risk_on", "edge:momentum"])
    st.mine(["phase:retract", "gripper:closed"], ["regime:risk_off", "edge:mean_reversion"])

    top = st.predict_market(["phase:reach", "gripper:open"], k=1)
    assert top[0][0] == ["regime:risk_on", "edge:momentum"] and top[0][1] > 0.5

    # an order-swapped robot signal does NOT confidently match the same atom (order-sensitive retrieval)
    swapped = st.predict_market(["gripper:open", "phase:reach"], k=1)
    assert swapped[0][1] < top[0][1]

    print("test_atoms: OK (non-abelian order-sensitive; robot->market correspondence mined + predicted)")
    return True


if __name__ == "__main__":
    run()
