# Node — Mining Atoms (robot ↔ market, non-abelian)

> **TR** — `.local`'te ATOM madenciliği: robot sinyalleri ile piyasa karşılıkları arasındaki en küçük
> karşılık birimi. Sıra önemlidir (NON-ABELIAN) — `permute` ile kodlanır. Açık veriden madencilik;
> atomlar özel kalır.
> **EN** — Mine ATOMS in `.local`: the smallest correspondence unit between robot signals and their
> market correspondents. Order matters (NON-ABELIAN) — encoded with `permute`. Mine from open data;
> the atoms stay private.
> **ZH** — 在 `.local` 中挖掘原子：机器人信号与其市场对应物之间的最小对应单元。顺序很重要
> （非阿贝尔）——用 `permute` 编码。从开放数据挖掘；原子保持私有。

**Status:** ADOPTED. Code: `foundation/regime/atoms.py`.

## The atom
The smallest cross-domain unit: an **ordered robot signal** bound to its **ordered market correspondent**.
```
atom = bind( seq(robot_signal) , seq(market_correspondent) )
seq([a, b]) = bundle( permute(a, 0), permute(b, 1) )      # order is carried by permute
```

## Why non-abelian
Plain `bind` is **abelian** — `a ⊗ b = b ⊗ a` — the lineage's measured wall (the substrate is
commutative). But robot action sequences and market operator pipelines are **order-dependent**: reach→
grasp ≠ grasp→reach; select→size→hedge ≠ hedge→size→select. `permute` (a positional roll per slot) makes
`seq([a,b]) ≠ seq([b,a])`, so the atom carries the **non-abelian** structure the abelian substrate can't
get from `bind` alone. `test_atoms` proves it: same order → sim 1.0; swapped order → sim < 0.6; and
prediction is order-sensitive.

## Mine private, predict open
- **Mine** (`AtomStore.mine`) from open data — robot signals (RoboTwin / open robotics datasets) paired
  with market regimes — into `.local/atoms/` (private; the runtime writes there, never this code).
- **Predict** (`predict_market`) — given a robot signal, retrieve its market correspondent (order-aware).
- The atoms are your private IP; only **de-identified correspondences** leave for the commons (HUMANITIK).
This is the unified-regime-kernel made minable: the seam between embodiment and markets, atom by atom.
