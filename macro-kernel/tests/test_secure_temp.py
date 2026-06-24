"""secure_temp: 0700 per-agent scoping, guaranteed teardown, symlink refusal, Article-0 boundary."""
import os
import stat
from foundation.security import secure_temp


def run():
    # 0700, per-agent-scoped, destroyed on exit
    with secure_temp.secure_tempdir(agent="worker") as d:
        root = os.path.dirname(d)
        assert os.path.isdir(d)
        assert stat.S_IMODE(os.lstat(d).st_mode) == 0o700              # owner-only
        assert os.path.dirname(d) == root                              # per-agent child under root
        with open(os.path.join(d, "scratch.txt"), "w") as f:
            f.write("ok")
    assert not os.path.exists(root)                                    # destroyed (tree gone)

    # symlink refusal
    with secure_temp.secure_tempdir() as d:
        real = os.path.join(d, "real.txt")
        open(real, "w").write("x")
        link = os.path.join(d, "link.txt")
        os.symlink(real, link)
        try:
            secure_temp.secure_open(link)
            raise AssertionError("must refuse a symlink")
        except PermissionError:
            pass

    # Article 0: no private data in shared temp
    assert secure_temp.assert_not_private("/tmp/ark-xyz/scratch.txt")
    try:
        secure_temp.assert_not_private("/Users/x/repo/.local/positions.json")
        raise AssertionError("must refuse a .local path")
    except PermissionError:
        pass

    print("test_secure_temp: OK (0700 per-agent, destroyed on exit, symlink refused, .local refused)")
    return True


if __name__ == "__main__":
    run()
