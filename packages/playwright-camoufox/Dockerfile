FROM ghcr.io/astral-sh/uv:python3.13-bookworm

RUN --mount=type=cache,target=/root/.cache/uv \
  uvx playwright install-deps firefox
RUN --mount=type=cache,target=/root/.cache/uv \
  uvx camoufox fetch