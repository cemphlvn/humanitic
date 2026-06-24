# Node — Secure Scratch Dirs in the Agentic Stack

> **TR** — Ajansal yığında geçici/scratch dizinleri güvenli kıl: yalnızca `mkdtemp` (0700), ajan-başına
> kapsam, sembolik-bağ reddi, garantili temizlik, ve Madde 0: özel veri paylaşılan /tmp'e asla gitmez.
> **EN** — Harden temp/scratch dirs in the agentic stack: `mkdtemp` only (0700), per-agent scoping,
> symlink refusal, guaranteed teardown, and Article 0: private data never lands in shared /tmp.
> **ZH** — 加固智能体栈中的临时/暂存目录：仅用 `mkdtemp`（0700）、按智能体隔离、拒绝符号链接、
> 保证清理，以及第 0 条：私有数据绝不进入共享 /tmp。

**Status:** ADOPTED. Code: `foundation/security/secure_temp.py`. Reference: index `secure-temp-agentic`.

## The rules (SOTA, applied)
| risk | defense |
|---|---|
| predictable name / TOCTOU (CWE-377) | `tempfile.mkdtemp` only — atomic `O_EXCL\|O_CREAT`, unpredictable |
| insecure perms (CWE-379, CVE-2024-4030) | 0700 dir asserted after creation |
| world-writable shared `/tmp` | explicit process-owned `base`, never bare `/tmp` |
| cross-agent tampering / file prompt-injection (OWASP LLM01) | **per-agent** `mkdtemp(dir=root)` child; siblings get zero access |
| symlink redirect | `secure_open` refuses symlinks (`O_NOFOLLOW` + islink precheck) |
| leftover artifacts | guaranteed `shutil.rmtree` in `finally` — destroy, don't empty |
| **private data leak (Article 0)** | `assert_not_private` refuses any `.local` path in shared temp |

## Why it matters for ark
Subagents write scratch artifacts that later become other agents' inputs — a file-based prompt-injection
surface. Per-agent 0700 scoping + symlink refusal + guaranteed teardown close it. And the Article-0
rule is the same eternity-clause boundary at the filesystem layer: **`.local` never transits shared
temp** — privacy holds even in the scratch path.
