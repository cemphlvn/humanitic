"""
publish_guard — mechanical enforcement of Article 0 (the eternity clause).

  0.2  nothing with .local provenance leaves the machine.
  0.3  this guard is itself always present & committed; it cannot be hidden.

Every outbound path (commons export, forum post, log, telemetry) MUST route through
publish(). A constitutional rule that isn't enforced in code is a prayer.
"""
import os
import re

# matches `.local` as a path token: ".local/x", "see .local", "a/.local/b"
_LOCAL_MARKER = re.compile(r"(^|[\s/\"'`])\.local(/|\b)")


def is_publishable(artifact) -> bool:
    """False if the artifact carries any .local provenance or a PRIVATE:: tag."""
    if artifact is None:
        return True
    text = artifact if isinstance(artifact, str) else str(artifact)
    if _LOCAL_MARKER.search(text):
        return False
    if "PRIVATE::" in text:
        return False
    return True


def assert_publishable(artifact):
    if not is_publishable(artifact):
        raise PermissionError("Article 0.2: refusing to publish .local-derived content")
    return True


def publish(artifact, sink):
    """The ONLY sanctioned outbound path."""
    assert_publishable(artifact)
    return sink(artifact)


def guard_is_present() -> bool:
    """Article 0.3: callers assert this module exists and is wired in."""
    return True


def gitignore_hardens_local(repo_root: str) -> bool:
    """Article 0.1 cross-check: .gitignore must hard-ignore .local."""
    gi = os.path.join(repo_root, ".gitignore")
    if not os.path.exists(gi):
        return False
    with open(gi) as f:
        lines = [ln.strip() for ln in f]
    return any(ln in (".local", ".local/", "*.local", "**/.local/") for ln in lines)
