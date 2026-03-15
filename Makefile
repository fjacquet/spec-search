.PHONY: all clean data serve build mcp test test-pipeline test-mcp test-web lint lint-python lint-js sbom ci

all: lint test build

clean:
	rm -rf web/dist web/public/data/results.json web/public/data/facets.json web/public/data/processors

data:
	uv run python scripts/convert_csv.py

serve:
	cd web && npm run dev

build: data
	cd web && npm run build

mcp:
	cd mcp_server && uv run python server.py

test: test-pipeline test-mcp test-web

test-pipeline:
	uv run pytest tests/ -v

test-mcp:
	cd mcp_server && uv run pytest tests/ -v

test-web:
	cd web && npx vitest run

lint: lint-python lint-js

lint-python:
	uv run ruff check .
	uv run ruff format --check .
	cd mcp_server && uv run ruff check . && uv run ruff format --check .

lint-js:
	cd web && npx biome check .

sbom:
	cd web && npx @cyclonedx/cyclonedx-npm --output-file ../sbom-web.cdx.json
	cd mcp_server && uv run cyclonedx-py environment -o ../sbom-mcp.cdx.json

ci: lint test build
