# Node — Your Own Agentic OS (everyone builds one, inside `.local`)

> **TR** — Herkes kendi ajansal işletim sistemini kurar — GİZLİCE, `.local` içinde. Bu kamuya açık
> şablondur; senin çalışma-zamanın onu kendi `.local` köküne kurar. Madde 0: bu kod asla `.local`
> oluşturmaz/okumaz — kökü sen verirsin.
> **EN** — Everyone builds their own agentic OS — PRIVATELY, inside `.local`. This is the public
> template; your runtime instantiates it against your own `.local` root. Article 0: this code never
> creates or reads `.local` — you pass the root yourself.
> **ZH** — 每个人都构建自己的智能体操作系统——私密地，在 `.local` 内。这是公共模板；你的运行时将其
> 实例化到你自己的 `.local` 根目录。第 0 条：此代码从不创建/读取 `.local`——根目录由你提供。

**Status:** ADOPTED (template). Code: `foundation/personal_os.py`.

## What it is
A `PersonalOS` binds the whole ark foundation into one **private, autonomous research+trading
environment**: a private trigram **vault**, a local **inference** engine (stub → MLX-LM/Ollama), the
HUMANITIK **partner register**, the safe **autonomous core**, and a private **calibration** memory.
Three verbs: `think(thesis)` (the operator proposes a genome), `run(prices)` (autonomous paper
trading through the safe core), `contribute(lesson)` (offer a de-identified lesson to the commons).

## The private layout (your runtime creates it in `.local`)
```
.local/                 ← your OS root (private, system-written; this code never touches it)
  vault/                ← your private trigram strategy IP
  theses/               ← your private macro theses
  calibration/          ← your private post-trade memory
  index.local/          ← your private knowledge index
  os.config.json        ← your engine / broker / risk config
```
You instantiate it yourself: `from foundation.personal_os import scaffold; scaffold(".local")`.
The dev/test path only ever scaffolds a temp dir (Article 0).

## The boundary
The OS lives in `.local`; **only de-identified lessons leave, and only through `publish_guard`**
(a `.local`-tainted contribution is refused). What you share is attributed and rewarded under
HUMANITIK; what you keep stays yours. Everyone's OS is independent — sovereignty by architecture.
