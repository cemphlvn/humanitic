# Learnings — Compressed

> The idea→machine-work stack, accelerator ecosystems, and what it means for TALP/VSA.
> Compressed from a working session (2026-06). Sources cited for load-bearing facts; everything else is mental-model.

---

## 0. The spine

The whole subject is one question: **how an idea becomes machine work.**

```
  idea
   → tensor / buffer            (a representation)
   → shape + dtype + layout     (its metadata)
   → backend                    (the execution world)
   → kernel                     (one hardware motion)
   → thread / block / SM / GPU  (where it runs)
   → node / cluster             (how machines split it)
   → served product             (latency + throughput + margin)
```

You are not "learning GPU stuff." You are learning **constraint translation**:
behavior system → math representation → tensor shape → kernel bottleneck → backend choice → infra sentence → business advantage.

---

## 1. The vocabulary (and the two name-traps)

```
ENGINE   = the conductor       orchestrates inference: schedule, batch, KV cache,
                                launch kernels, stream tokens, track memory
BACKEND  = the execution world decides WHICH KINDS of kernels can exist (CUDA/Metal/…)
KERNEL   = one instrument stroke  one low-level op touching hardware (GEMM, attention, dequant)
```

Two names that mean two unrelated things — most confusion lives here:

```
"Triton"   →  Triton LANGUAGE  = write custom GPU kernels (compiles to PTX)
           →  Triton SERVER    = NVIDIA's production inference server   ← unrelated

"llama"    →  Llama            = a MODEL family (Meta's weights/architecture)  ← an artifact
           →  llama.cpp        = a RUNTIME (C/C++ inference engine)            ← a program
```

So "does MLX exclude llama?" → No. MLX-LM **runs** Llama models. llama.cpp is just an
*alternative runtime*, not an exclusion. Both run on a Mac; you pick one.

CPU vs GPU in one line: **CPU = a time-loop; GPU = the same loop exploded into space**
(one worker per index: `b[i] = amount * a[i]`).

---

## 2. The kernel layer is vendor-locked — the five walls

"Vendor-locked to the silicon" is not one wall. It's five compounding ones, each sticky alone.
Almost every strategic move in the industry is a bet about *which wall to attack*.

```
5  LIBRARY MOAT          cuDNN / cuBLAS / NCCL / TensorRT   ← the real business moat:
                                                              replicating PERFORMANCE = years
4  EXECUTION + MEMORY     SIMT warps (NV, 32) · wavefronts   ← why "just recompile" is a LIE:
   MODEL                  (AMD, 64) · systolic array (TPU)     kernel is WRITTEN AROUND the model
3  COMPILER TOOLCHAIN     NVCC → PTX → SASS (ptxas)          ← vendor owns the IR
2  DRIVER / RUNTIME       CUDA driver API                    ← can't load/launch without it
1  ISA (machine opcodes)  SASS / CDNA / AGX                  ← physics-level; "no x86 for GPUs"
   ── plus, in practice ──
   NETWORKING             NVLink + NVSwitch + InfiniBand     ← Mellanox ($6.9B, 2020); $10B+/yr;
                                                              an independent switching cost
```

Walls 1–3 are hard (physics + proprietary toolchain). Wall 4 is why porting = rewriting
(the *parallelism shape* differs). Wall 5 is soft but is the actual moat.
Cross-vendor abstractions (OpenCL/SYCL/Vulkan) run, but pay **10–30% vs native** and can't reach
matrix-engine (Tensor Core) paths without vendor extensions — "portable correctness, not portable performance."

Each GPU vendor owns its own kernel-writing layer:

```
NVIDIA  → CUDA          (Triton & TensorRT compile DOWN to this)
AMD     → HIP / ROCm
Apple   → Metal (MSL)
TPU     → XLA-generated; custom = Pallas → Mosaic
cross   → Vulkan, SYCL, OpenCL, WebGPU   (the portability bets)
```

---

## 3. Mac reality

**Mac = Apple GPU = Metal, full stop.** That single fact partitions the ecosystem:

```
RUNS ON A MAC (Metal family)        NOT ON MAC GPU (needs NVIDIA/AMD)
────────────────────────────        ─────────────────────────────────
MLX / MLX-LM   (Metal)              CUDA            (NVIDIA only)
llama.cpp      (Metal)              Triton language (cuda/hip only — NO Metal)
Ollama → wraps llama.cpp           TensorRT-LLM    (NVIDIA only)
PyTorch MPS    (Metal)             vLLM / SGLang   (CUDA-first)
                                   TGI             (CUDA-first)
```

The real split isn't "Mac vs not" — it's **portable-by-design vs vendor-pinned**:
- **MLX** now ships **Metal + CUDA + CPU** backends → same MLX code re-dispatches to NVIDIA later (re-embed, not redesign).
- **llama.cpp / ggml** is portable at the *model-file* level → one GGUF, many backends (Metal/CUDA/HIP/Vulkan/SYCL/…).

**Who writes the kernel?** Two jobs, usually confused:
1. *The runtime already wrote it.* You call `mx.matmul`; it dispatches. ← 95% of people, incl. you today.
2. *You write a custom kernel.* Only when no runtime ships the op (e.g. a **fused** bind-then-reduce).
   On Mac that custom path is **Metal Shading Language** — Triton/CUDA are off the table.

---

## 4. Google's answer to lock-in — attack a *higher* wall

The TPU is genuinely different silicon (**systolic array / MXU**, no SIMT, native **bfloat16**),
so Google couldn't win wall-by-wall against CUDA. Instead it abstracted *above* the kernel:

```
GRAPH LEVEL                              KERNEL LEVEL
───────────                              ────────────
JAX / PyTorch / TF                       one Pallas program
   → StableHLO (portable MLIR op set)        → TPU: Mosaic  (systolic/MXU)
   → XLA / IREE compiler                     → GPU: Mosaic-GPU or Triton → PTX → CUDA
   → TPU / GPU / CPU / edge
   "same model, swap the compiler"        "same custom kernel, two silicons"
```

- **XLA / StableHLO** = "portability layer between frameworks and compilers" (its own words). Same model → TPU or GPU by swapping the backend, not rewriting.
- **Pallas** = "custom kernels for GPU and TPU"; *"the Pallas:MGPU model is similar to Triton but lower level."* The compiler solves the wall-4 problem instead of hand-tuning.
- **Pathways** = orchestration runtime making 9k-chip pods one logical unit (trained PaLM 540B).
- **AI Hypercomputer** = not a chip — a *bundled system*: TPU pods **+ NVIDIA GPUs** + Jupiter optical net (13+ Pbps) + Parallelstore + JAX/XLA/Pathways. The deliberate mirror of NVIDIA's full stack.

The takeaway: **escape lock-in by choosing which abstraction layer to stand on, not by switching vendors.**

---

## 5. The history — six eras (each = a wall under attack)

```
ERA 0  GPGPU HACKS          1999–2006   compute disguised as rendering (BrookGPU 2004 → G80 2006)
ERA 1  CUDA + SCIENCE       2006–2011   CUDA 1.0 (2007); won on PROGRAMMABILITY, not FLOPS  [builds all walls]
ERA 2  DL IGNITION          2012–2016   AlexNet (2012) → cuDNN 1.0 (2014) = the moat is born [wall 4]
ERA 3  MOAT SOLIDIFIES      2016–2020   Tensor Cores (2017) · Mellanox $6.9B (2019) · MLIR (2019) [wall 5]
ERA 4  COMPILER WAVE        2021–2023   Triton (2021) · torch.compile (2023) → CUDA gets "hidden" [attack 3–4]
ERA 5  INFERENCE ASIC RACE  2024–2026   Trillium · Ironwood · Trainium2 · TPU 8t/8i [escape wall-5 PRICE]
```

Two hinge events: **AlexNet→cuDNN** created the moat (fast+reliable before any alternative);
**PyTorch 2.0 / torch.compile** started dissolving it (Triton, not hand-CUDA, became the path to good kernels).

---

## 6. The moat economics

The moat is **not the chip** (NVIDIA wasn't clearly ahead on FLOPS in 2012). It's five switching costs
+ the margin that funds escape attempts:

```
WHY IT HOLDS                       THE NUMBER
library lock-in (multiplicative)   each layer adds independent switching cost
17 yrs mindshare                   every ML eng's first GPU = CUDA; AMD's HIP mimics CUDA syntax
research network effects           FlashAttn/AWQ/GPTQ ship CUDA-first; AMD ports lag 6–18 mo
networking (Mellanox)              $10B+/yr; NVLink+InfiniBand is its own wall
financial moat                     74.6% gross margin (Q3 FY25); H100 ~$30–40K = "the NVIDIA tax"
```

That 74.6% margin **is why hyperscalers build their own silicon** — TPU, Trainium, Maia, MTIA exist to
dodge the tax, not to win a benchmark.

```
SETTLED                                    CONTESTED
CUDA's 17-yr lead is real; nothing as       NVIDIA inference share → 20–30% by 2028? (speculative)
  complete (2026)                           MLIR/IREE → portable PERFORMANCE not just correctness?
PyTorch 2.x + Triton = the real             Groq determinism scales to 10k-chip training? (unproven)
  CUDA-alt path; ROCm now production        open standards (UXL/SYCL) ever matter? (history: no)
training stays GPU; inference is            Google vs NVIDIA at frontier training? (3rd parties still NV)
  where ASICs bite
training ≠ inference, accelerating
```

Structural insight: the moat **migrates up the stack**. Standard ops (GEMM/attention/LayerNorm) commoditize
via compilers; each *new* op (MoE routing, speculative decoding) reopens an advantage window. The question
becomes "who compiles best," not "who hand-writes the fastest kernel."

---

## 7. The TPU lineup (incl. the v8 correction)

```
GEN   NAME        YEAR    ADDED                              HEADLINE
v1    —           2015    inference only                     92 TOPS INT8, 40W
v2    —           2017    TRAINING + bfloat16 + HBM          ~45 TF BF16/chip
v3    —           2018    2× compute, liquid cooling         ~420 TF BF16/chip
v4    —           2020    optical circuit switches, 3D torus 2.1× v3
v5e   —           2023    cost-optimized                     low $/TFLOP
v5p   —           2023    perf + AI Hypercomputer            2× FLOPS vs v4, 8960/pod
v6e   Trillium    2024    biggest leap since v2              4.7× compute vs v5e
v7    Ironwood    2025    FIRST inference-first TPU           192GB HBM3e, 42.5 EF/pod
8i    Zebrafish   2026*   inference die (MediaTek)           288GB HBM3e   (GA ~2027)
8t    Sunfish     2026*   training die (Broadcom)            121 EF/pod, 2PB shared
```

**Correction baked in:** "TPU v8" is **real**. Google's 8th gen (announced 2026) is the **first split into two
chips** — **8t "Sunfish" (training)** and **8i "Zebrafish" (inference)**, TSMC 2nm, GA targeted late 2027.
So the shorthand resolves cleanly: **"tpu/8" = 8th gen, "tpu/i" = TPU 8i.** This split *is* the headline trend —
training and inference diverged enough to need different silicon.

"**iTPU**" is not an official term → it means either inference-TPU (8i / Ironwood) or the **Edge TPU / Coral**
(tiny on-device inference chip, a separate product line).

---

## 8. The alternatives — and the one that matters for VSA

```
Groq LPU       deterministic, SRAM-only, NO HBM → kills the memory-bandwidth bottleneck; inference only
Cerebras WSE-3 wafer-scale, 900K cores, 40GB on-chip SRAM → whole model in SRAM
Tenstorrent    RISC-V MIMD (not SIMT), open ISA → the open-ecosystem bet
SambaNova      reconfigurable dataflow, tiered SRAM+HBM+DRAM
AWS Trainium2/ in-production hyperscaler ASIC; ~50% claimed cost cut vs GPU
  Inferentia
```

---

## 9. What it all means for TALP / VSA  ← the payoff

VSA `bind` (`c[i]=a[i]*b[i]`), `bundle`, and `similarity` are **memory-bandwidth-bound**, not FLOP-bound:
many bytes moved, little math per byte. That single fact drives every hardware choice:

```
memory-bound  → wants HIGH-BANDWIDTH / on-chip-SRAM silicon: GPU HBM, Groq, Cerebras
              → a SYSTOLIC TPU is the WORST fit (it's built for dense matmul)
compute-bound → (e.g. a JEPA latent MLP — dense matmul) is what TPU/Tensor-Cores are for
```

Path for the substrate work (ties to FHRR + hybrid verdict, `labs/vsa-role-geometry/`):
- **Mac, off-the-shelf VSA ops** → MLX (Metal). No kernel writing.
- **Mac, need a fused VSA op** → Metal Shading Language (only option; Triton/Pallas can't target Apple GPU).
- **Remote NVIDIA later** → same MLX code (CUDA backend), or Triton/Pallas for fusion.
- **If ever on accelerated HW** → GPU (HBM bandwidth) beats TPU for VSA. Architectural consequence of wall 4.

Meta-lesson: **choosing your abstraction layer = choosing which wall you're locked to.** Stay portable at the
graph level (JAX→XLA) or the model-file level (ggml/GGUF); drop to a custom kernel only when no runtime ships
the op.

---

## Appendix — quick-reference cards

**Name traps**
```
Triton  → language (write kernels)  ≠  server (NVIDIA serving)
llama   → model family (Meta)       ≠  llama.cpp (C++ runtime)
iTPU    → inference TPU (8i/Ironwood) or Edge TPU/Coral — NOT an official name
```

**Compute-heavy vs memory-heavy**
```
COMPUTE  many math ops / byte    big GEMM, conv, JEPA predictor   ("brain sweating")
MEMORY   many bytes / little math embed lookup, KV move,          ("body fetching")
                                  VSA bind/bundle/similarity, top-k, ANN search
```

**The grounding request template (turn "I need a GPU" into an infra sentence)**
```
operation:   VSA similarity / top-k cleanup / JEPA latent predict
data:        #vectors = … · dim = … · dtype = … · batch = …
backend:     local = …        remote = …
constraints: p95 latency = … · throughput = … · mem limit = … · budget = …
question:    bottleneck = memory bandwidth | compute | launch overhead | serving concurrency?
```

**The infra-sentence ladder**
```
BAD     "I need a GPU."
BETTER  "I need an A10 / L40S / H100 test box."
EXPERT  "A memory-bandwidth-bound VSA similarity kernel, 100k×10k vectors, batch 32,
         p95 < 300ms, starting on MLX locally then Triton/CUDA remotely."
```

**The micro→macro test ladder**
```
local microtest (NumPy correctness) → local backend (MLX/Torch) → remote kernel (Triton/CUDA microbench)
→ remote engine (vLLM/SGLang/TensorRT-LLM) → serverless (Modal/Runpod) → dedicated scale (CoreWeave/Triton Server)
→ business test (cost/prediction · p95 · throughput · reliability)
```
