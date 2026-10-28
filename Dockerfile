FROM python:3.14-slim

# Copy the uv tool from its official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Install dependencies first, so Docker can cache this step
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy the application code
COPY . .

EXPOSE 8000

# 0.0.0.0 makes the API reachable from outside the container.
# The port comes from the PORT variable set by the host (8000 by default)
CMD ["sh", "-c", "uv run --no-dev --no-sync uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]