# ark — production-strength containment. The system is interactable ONLY through the CLI entrypoint,
# runs as a non-root user, and (offline) has no network. Build & run:
#   docker build -t ark -f templates/Dockerfile .
#   docker run --rm --network none -v "$PWD/.local:/app/.local" ark once        # offline, .local mounted
#   docker run --rm --read-only --tmpfs /tmp -v "$PWD/.local:/app/.local" ark mine --target geodnet
# Live data: attach a network with an ALLOWLISTING egress proxy (do not use the host network); mount
# secrets at runtime (never bake them into the image). Resource caps: --memory, --cpus, --pids-limit.
FROM python:3.12-slim
RUN useradd --create-home --uid 10001 ark
WORKDIR /app
RUN pip install --no-cache-dir numpy
COPY foundation/ ./foundation/
COPY tests/ ./tests/
COPY run.sh ark.machine.example.yaml ./
ENV PYTHONPATH=/app
USER ark
# the SOLE interface: every interaction is a CLI command (once | loop | mine | edge | join | creds | contain | status)
ENTRYPOINT ["python3", "-m", "foundation.runtime.cli"]
CMD ["status"]
