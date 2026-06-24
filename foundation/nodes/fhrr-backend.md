# Node — The FHRR Backend (phase-angle carrier; torchhd encoding; the genome)

> **TR** — GPU'da karmaşık-sayı cebiri bozuk. FHRR'yi faz açıları (float32) üzerinden çalıştırıyoruz —
> aynı cebir, tam Metal hızında. Kodlama için torchhd, toplu işlemler için ince bir faz-açı katmanı.
> **EN** — Complex algebra is broken on GPU. We run FHRR over phase angles (float32) — same algebra,
> full Metal speed. torchhd for encoding setup; a thin phase-angle layer for bulk ops.
> **ZH** — GPU 上的复数代数有缺陷。我们用相位角（float32）运行 FHRR——同样的代数，完整的 Metal 加速。
> 用 torchhd 做编码设置；用一层薄的相位角层做批量运算。

**Status:** ADOPTED · code: [`foundation/kernel/vsa_mlx.py`](../kernel/vsa_mlx.py) (the phase-angle layer).

## The blocker (measured, not theoretical)
FHRR's `bind` is complex multiplication, and GPU complex algebra is unreliable:
- **PyTorch MPS (Metal):** `1j·(−1j)` returns `−1` (issue #148156); conjugate is wrong; complex
  `einsum`/`gather` crash. So `torchhd.FHRRTensor(device="mps")` **silently computes garbage**.
- **MLX complex64** is likewise incomplete on the GPU for some ops (einsum/gather), even where basic
  `mul`/`conj` happen to work.

## The fix is exact, not a compromise
FHRR over unit-complex vectors is **isomorphic to arithmetic on phase angles** in real float32:
```
bind   = (θa + θb) mod 2π          unbind = (θc − θb)
bundle = atan2(Σ sin θ, Σ cos θ)   sim    = cos(Δθ).mean()
```
Every op is float32 → **fully MPS/Metal-accelerated**, and it is the *same algebra* (qFHRR's carrier).
qFHRR K=8 → 95.3% compression @ 0.9497 fidelity — matches the substrate's "~95% @ >0.94". Our
`vsa_mlx.py` is this layer; `test_vsa_mlx` cross-validates it scalar-for-scalar against the numpy floor.

## The recommended path — `FHRRBackend` with a runtime probe
- **torchhd** for *encoding setup*: its `Level` / `Circular` ordinal embeddings (regime levels are
  ordinal — inflation low→high is `Circular`/`Level`, not random) and item-`Memory` cleanup.
- **Bulk ops** (bind/bundle/similarity/cleanup) through the thin **phase-angle layer** behind an
  `FHRRBackend` interface, with a **3-line runtime probe** (test complex-mul on the device; fall to
  angles if wrong). `vsa_mlx.gpu_complex_trustworthy()` is that probe — future-proof if the MPS bug
  is ever fixed.

## The genome encoding (queryability IP)
- A **trigram = bundle-of-binds**: `bundle([ bind(ROLE_drive, hv(g)), … ])` — **not** a sequential
  bind — so each slot stays **unbind-recoverable** (you can query any role back out). This is the VSA
  form of the strategy IP, and it is exactly how `index/trigram.py::encode_trigram` already works
  (positional `bind` then `bundle`).
- **Hybrid filler** = an orthogonal handle ⊕ a `gemini-embedding-2` phasor — the substrate's "rent
  the geometry": the only scheme high on *both* binding fidelity and neighbor-recall at scale (it ties
  the cross-seam: a real embedding model's native topology, carried as phasors).

## Commons tie
*"Anyone who owns or produces these should be able to join **synthetically** and earn
**authentically**."* — synthetic personas (nemotron) and synthetic producers may *join* the commons,
but attribution/reward (HUMANITIK) is on the *authentic* contribution. See [`HUMANITIK.md`](HUMANITIK.md).
