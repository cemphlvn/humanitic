"""
vla — Vision-Language-Action policy adapters (Pi0, Gr00t, OpenVLA — RLinf collection / RoboTwin
baselines). VLA models are the EMBODIED ACTION policies: GPU models that run on remote NVIDIA, not the
Mac's Metal GPU. They FUSE with ark's kernels through the shared regime layer — the VSA+JEPA substrate
is the latent world-model (local), and the VLA is the action head per domain. One substrate, many heads.
"""
import sys


class _VLAPolicy:
    kind = "policy"

    def __init__(self, remote=None):
        self.remote = remote

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["vision-language-action", "embodied", "remote-nvidia"]}

    def act(self, *args, **kwargs):
        if sys.platform == "darwin" and not self.remote:
            raise RuntimeError("%s is a GPU VLA policy — it runs on remote NVIDIA, not the Mac's Metal "
                               "GPU. (VSA+JEPA regime layer = local; the VLA action head = remote.)"
                               % self.name)
        raise RuntimeError("%s runs on the configured remote NVIDIA cluster" % self.name)


class Pi0(_VLAPolicy):
    name = "pi0"


class Gr00t(_VLAPolicy):
    name = "gr00t"


class OpenVLA(_VLAPolicy):
    name = "openvla"
