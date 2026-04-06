# -*- coding: utf-8 -*-
"""
Google Embedding Adapter
========================

Adapter for Google's embedding API using google-generativeai SDK.
"""

from typing import Any, Dict, List

from .base import BaseEmbeddingAdapter, EmbeddingRequest, EmbeddingResponse


class GoogleEmbeddingAdapter(BaseEmbeddingAdapter):
    """
    Embedding adapter for Google's Generative AI embeddings.
    
    Uses the google-generativeai SDK.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Google embedding adapter.

        Args:
            config: Configuration dict with:
                - api_key: Google API key
                - model: Model name (default: text-embedding-004)
                - dimensions: Output dimensions (optional)
        """
        super().__init__(config)
        self.api_key = config.get("api_key")
        self.model = config.get("model", "text-embedding-004")
        self.dimensions = config.get("dimensions", 768)

        if not self.api_key:
            raise ValueError("Google API key is required for embedding")

        # Configure the SDK
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)

    async def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """
        Get embeddings using Google's embedding API.

        Args:
            request: Embedding request with texts to embed

        Returns:
            EmbeddingResponse with embeddings
        """
        import google.generativeai as genai
        import asyncio

        embeddings = []
        total_tokens = 0
        
        # Determine task type based on input_type
        task_type = "retrieval_document"
        if request.input_type:
            if "query" in request.input_type.lower():
                task_type = "retrieval_query"
            elif "document" in request.input_type.lower():
                task_type = "retrieval_document"
        
        # Google's embed_content works with single text or list
        # We process in batches for efficiency
        try:
            for text in request.texts:
                # embed_content is sync, so run in executor
                result = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda t=text: genai.embed_content(
                        model=f"models/{self.model}",
                        content=t,
                        task_type=task_type,
                    )
                )
                embeddings.append(result["embedding"])
                # Estimate tokens (Google doesn't always return token count)
                total_tokens += len(text.split())

            # Get actual dimension from first embedding
            actual_dimensions = len(embeddings[0]) if embeddings else self.dimensions

            return EmbeddingResponse(
                embeddings=embeddings,
                model=self.model,
                dimensions=actual_dimensions,
                usage={"total_tokens": total_tokens},
            )
        except Exception as e:
            raise RuntimeError(f"Google embedding failed: {str(e)}")

    def get_model_info(self) -> Dict[str, Any]:
        """
        Return information about the configured model.

        Returns:
            Dictionary with model metadata (name, dimensions, etc.)
        """
        return {
            "model": self.model,
            "dimensions": self.dimensions,
            "provider": "google",
            "api_type": "generativeai",
        }
