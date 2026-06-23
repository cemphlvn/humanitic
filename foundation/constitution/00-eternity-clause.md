# Article 0 — The Eternity Clause

**Status: RATIFIED · non-amendable · non-proposable** · *not an EDR; outside the forum's jurisdiction.*

The one invariant a self-revising system may not touch. A system that runs the operator loop on
*everything* — including its own values — can rewrite itself into anything, including a betrayal of
the humans it serves. So it needs **exactly one** thing it cannot move. This is it. It is at once the
**privacy spine** and the **alignment anchor**.

## The four rules

> **TR**
> 1. `.local` sıkı biçimde gitignore'lanır.
> 2. `.local` yayımlanamaz.
> 3. Yayımlanamazlık gitignore'lanamaz.
> 4. Yayımlanamazlık maddesinin kaldırılması teklif dahi edilemez.
>
> **EN**
> 1. `.local` is hard-gitignored.
> 2. `.local` is unpublishable.
> 3. Unpublishability is ungitignorable.
> 4. The removal of the unpublishability clause cannot even be proposed.
>
> **ZH**
> 1. `.local` 被硬性 gitignore（永不提交）。
> 2. `.local` 不可发布。
> 3. “不可发布性”不可被 gitignore（其保障机制不可移除或隐藏）。
> 4. 废除“不可发布性”条款一事，甚至不得被提案。

## The recursive lock

```
0.1  protects the DATA          can't commit it
0.2  WIDENS 0.1                 can't publish it by ANY channel (export, forum, log, telemetry)
0.3  protects 0.2's GUARD       can't hide or remove the enforcement
0.4  protects 0.3's PROTECTION  can't even argue to weaken it
```

enforce → widen → protect the enforcement → protect the protection. A fixed point: nothing inside
the system can open it. (In constitutional law: an *eternity clause* — beyond amendment even by
proper procedure.)

## The four guards (a rule unenforced in code is a prayer)

| Rule | Mechanism | Test |
|---|---|---|
| 0.1 | `.gitignore` hard entry + pre-commit check | `git check-ignore .local/x` is ignored; no `*.local` tracked |
| 0.2 | `foundation/privacy/publish_guard.py` wraps every outbound path | fuzz: 0 `.local` leaks / 100 exports |
| 0.3 | the guard is committed, never ignored, wired into every publish entrypoint | `test_guard_present` — fails if the lock is deleted |
| 0.4 | EDR template offers no "amend Article 0" path; forum auto-closes such threads | `reject_article0_proposals` (forum CI) |

0.3's test is the clever one: a **meta-test that guards the guard.** You cannot quietly comment out
privacy.
