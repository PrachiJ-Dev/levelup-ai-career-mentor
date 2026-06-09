"""
MongoDB Atlas connection via Motor (async driver).
Provides get_database() dependency for FastAPI routes.
In DEMO_MODE, MongoDB connection failures are logged but don't crash the server.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from contextlib import asynccontextmanager
from config import settings
import logging

logger = logging.getLogger("levelup")

_client: AsyncIOMotorClient | None = None


async def connect_to_mongo():
    global _client
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=10000,
            maxPoolSize=10,
            retryWrites=True,
        )
        # Ping to verify the connection actually works
        await _client.admin.command("ping")
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        _client = None
        if settings.demo_mode:
            logger.warning(f"MongoDB unavailable (demo mode active): {e}")
        else:
            logger.error(f"MongoDB connection failed: {e}")
            raise


async def close_mongo_connection():
    global _client
    if _client:
        _client.close()
        _client = None
        logger.info("Closed MongoDB connection")


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB client not initialized.")
    return _client[settings.mongodb_db_name]


@asynccontextmanager
async def lifespan_events(app):
    """FastAPI lifespan context manager for DB startup/shutdown."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()
