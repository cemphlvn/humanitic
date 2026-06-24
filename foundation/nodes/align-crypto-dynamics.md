# Node — Time-Mapped Robot ↔ Crypto-Dynamics Alignment

> **TR** — Zaman-eşlemeli robotik akışı, kripto projesi dinamiğine NEDENSEL as-of birleştirme ile
> hizala (geleceğe bakış yok), sonra çapraz-alan analizini prequential ölç. Açık veri.
> **EN** — Time-map a robotic data stream to a crypto project's dynamics via CAUSAL as-of join (no
> lookahead), then measure the cross-domain analysis prequentially. Open data.
> **ZH** — 通过因果 as-of 连接（无前视）将带时间戳的机器人数据流映射到加密项目动态，然后用
> prequential 度量跨域分析。开放数据。

**Status:** ADOPTED. Code: `foundation/data/{align,crypto}.py`.

## The time map
Two clocks: a crypto project trades on an **irregular** clock; a robot streams on its **own regular**
clock. `align.asof_align(t_robot, t_crypto)` maps each robot frame to the **most-recent crypto frame at
or before it** — a backward as-of join (the open `merge_asof` standard). `assert_causal` proves no
lookahead: every matched crypto timestamp ≤ its robot timestamp. The future never aligns into the past.

## The analysis
The aligned tuple is `(robot state + crypto event) → next crypto regime`, scored by the open prequential
protocol (`eval/prequential.py`): train online on the strict past, test on each new aligned frame, report
accuracy / persistence / lift / **skill in bits**. Crypto sources (`coingecko`, `defillama`, `base-rpc`)
are **open** in `sources.CATALOG`.

## The open question (under research)
*Which crypto projects actually possess robotic streaming data that can be checked and aligned?* That is
the DePIN / machine-economy frontier — answered by `nodes/crypto-robotic-data-screening.md` (the
identifying questions + candidate projects from parallel research).
