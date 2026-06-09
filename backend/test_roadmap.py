import asyncio
import json
import os
from pprint import pprint
import sys

# Add backend directory to sys.path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pipelines.roadmap_pipeline import generate_roadmap

async def test_pipeline():
    print("Testing Roadmap Pipeline...")
    try:
        # Pass a dummy skill gap ID and user ID
        # The pipeline should fallback to demo data and run the 4 models
        doc = await generate_roadmap(
            skill_gap_id="000000000000000000000000",
            user_id="000000000000000000000000"
        )
        print("\n✅ Pipeline completed successfully!\n")
        print("Metadata:")
        pprint(doc.get("pipeline_metadata"))
        print("\nFirst Course:")
        pprint(doc.get("recommended_courses")[0])
    except Exception as e:
        print(f"❌ Pipeline failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_pipeline())
