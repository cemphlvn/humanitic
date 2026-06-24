"""test_jepa: the JEPA-lite transition predictor beats persistence BECAUSE it reads the macro event."""
import numpy as np
from foundation.regime import jepa


def run():
    R, d = 4, 48

    # --- data: shapes consistent, labels in range ---
    latent_t, event_t, latent_next, label_t, label_next, L = jepa.make_transition_data(
        2000, R=R, d=d, p_event=0.3, seed=0)
    n = latent_t.shape[0]
    assert latent_t.shape == (n, d), latent_t.shape
    assert event_t.shape == (n, d), event_t.shape
    assert latent_next.shape == (n, d), latent_next.shape
    assert label_t.shape == (n,) and label_next.shape == (n,)
    assert L.shape == (R, d), L.shape
    assert label_t.min() >= 0 and label_t.max() < R
    assert label_next.min() >= 0 and label_next.max() < R

    # --- train / held-out split ---
    cut = n // 2
    W = jepa.fit(latent_t[:cut], event_t[:cut], latent_next[:cut], ridge=1e-2)
    assert W.shape == (2 * d, d), W.shape

    # out-of-sample slices
    lt, ev, ln, lab_t, lab_n = (latent_t[cut:], event_t[cut:], latent_next[cut:],
                                label_t[cut:], label_next[cut:])

    jepa_acc = jepa.evaluate(W, lt, ev, lab_n, L)
    pers_acc = jepa.persistence_accuracy(lab_t, lab_n)

    # JEPA beats persistence by >= 10pp — the edge comes from seeing the event.
    assert jepa_acc >= pers_acc + 0.10, (jepa_acc, pers_acc)

    # JEPA predicts the LATENT well, not just the label: mean cosine(pred, true_next) > 0.5 OOS.
    pred = jepa.predict(W, lt, ev)
    cos = np.mean(np.sum(pred * ln, axis=1) /
                  (np.linalg.norm(pred, axis=1) * np.linalg.norm(ln, axis=1) + 1e-12))
    assert cos > 0.5, cos

    # --- determinism: same seed -> identical accuracy ---
    lt2, ev2, ln2, labt2, labn2, L2 = jepa.make_transition_data(2000, R=R, d=d, p_event=0.3, seed=0)
    W2 = jepa.fit(lt2[:cut], ev2[:cut], ln2[:cut], ridge=1e-2)
    jepa_acc2 = jepa.evaluate(W2, lt2[cut:], ev2[cut:], labn2[cut:], L2)
    assert jepa_acc2 == jepa_acc, (jepa_acc2, jepa_acc)
    assert np.array_equal(W, W2)

    print("test_jepa: OK (JEPA OOS next-regime acc=%.3f vs persistence=%.3f, "
          "latent cos=%.3f)" % (jepa_acc, pers_acc, cos))
    return True


if __name__ == "__main__":
    run()
