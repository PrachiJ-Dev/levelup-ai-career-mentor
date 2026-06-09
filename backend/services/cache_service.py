"""
Optional Redis cache service.
Gracefully no-ops if Redis is unavailable (always true in demo/dev).
"""
import json
import logging
from typing import Any, Optional

logger = logging.getLogger("levelup")
_redis = None


async def init_redis(url: str):
    global _redis
    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(url, decode_responses=True)
        await _redis.ping()
        logger.info("Redis connected")
    except Exception as e:
        logger.warning(f"Redis unavailable, caching disabled: {e}")
        _redis = None


async def get_cache(key: str) -> Optional[Any]:
    if _redis is None:
        return None
    try:
        value = await _redis.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


async def set_cache(key: str, value: Any, ttl: int = 300):
    if _redis is None:
        return
    try:
        await _redis.setex(key, ttl, json.dumps(value))
    except Exception:
        pass


async def delete_cache(key: str):
    if _redis is None:
        return
    try:
        await _redis.delete(key)
    except Exception:
        pass
