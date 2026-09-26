from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx

from .config import settings


class BedrockAnswerProvider:
    def status(self) -> str:
        if settings.model_mode != "bedrock":
            return "local_deterministic"
        return "configured" if settings.bedrock_model_id else "unavailable_missing_model_id"

    def generate(self, prompt: str) -> str:
        if not settings.bedrock_model_id:
            raise RuntimeError("BEDROCK_MODEL_ID is required for Bedrock mode")
        import boto3

        client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        response = client.converse(
            modelId=settings.bedrock_model_id,
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"temperature": 0, "maxTokens": 700},
        )
        return response["output"]["message"]["content"][0]["text"]


class BioThingsExplorer:
    CONCEPTS = {
        "type 2 diabetes": ("MONDO:0005148", "biolink:Disease"),
        "pancreatic cancer": ("MONDO:0004982", "biolink:Disease"),
        "jaundice": ("HP:0000952", "biolink:PhenotypicFeature"),
    }

    def __init__(self, cache_path: Path):
        self.cache_path = cache_path

    def _cache(self) -> dict[str, Any]:
        if not self.cache_path.exists():
            return {}
        return json.loads(self.cache_path.read_text())

    async def relationship(self, subject: str, object_: str) -> dict[str, Any]:
        key = f"{subject}|{object_}"
        cache = self._cache()
        if key in cache:
            return {"status": "cached", "relationships": cache[key]}
        if settings.bte_mode == "mock":
            return {"status": "mocked", "relationships": []}
        if settings.bte_mode == "off":
            return {"status": "not_requested", "relationships": []}
        if subject not in self.CONCEPTS or object_ not in self.CONCEPTS:
            return {"status": "no_match", "relationships": []}

        subject_id, subject_category = self.CONCEPTS[subject]
        object_id, object_category = self.CONCEPTS[object_]
        payload = {
            "message": {
                "query_graph": {
                    "nodes": {
                        "n0": {"ids": [subject_id], "categories": [subject_category]},
                        "n1": {"ids": [object_id], "categories": [object_category]},
                    },
                    "edges": {"e0": {"subject": "n0", "object": "n1"}},
                }
            }
        }
        headers = {"content-type": "application/json"}
        if settings.bte_api_key:
            headers["authorization"] = f"Bearer {settings.bte_api_key}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(settings.bte_url, json=payload, headers=headers)
                response.raise_for_status()
                body = response.json()
        except (httpx.HTTPError, ValueError):
            return {"status": "unavailable", "relationships": []}

        relationships: list[dict[str, Any]] = []
        message = body.get("message", {})
        knowledge_graph = message.get("knowledge_graph", {})
        edges = knowledge_graph.get("edges", {})
        for result in message.get("results", [])[:5]:
            for analysis in result.get("analyses", [])[:1]:
                for binding in analysis.get("edge_bindings", {}).get("e0", [])[:1]:
                    edge = edges.get(binding.get("id"), {})
                    relationships.append(
                        {
                            "subject": edge.get("subject"),
                            "predicate": edge.get("predicate"),
                            "object": edge.get("object"),
                            "qualifiers": edge.get("qualifiers", []),
                            "sources": edge.get("sources", []),
                            "publications": [
                                attribute.get("value")
                                for attribute in edge.get("attributes", [])
                                if attribute.get("attribute_type_id") == "biolink:publications"
                            ],
                        }
                    )
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache_path.write_text(json.dumps({**cache, key: relationships}, indent=2))
        return {"status": "live" if relationships else "no_match", "relationships": relationships}
