"""
Groq API Course Generator — Step 1 of the Roadmap DL Pipeline.

Uses Groq's LLaMA-3 (llama3-8b-8192) to dynamically generate role-specific
learning courses based on the user's missing skills and target role.

Syllabus Topic: Generative AI / Large Language Model API Integration
Architecture: REST API call → JSON parsing with retry logic

Input:  missing_skills: List[str], target_role: str
Output: List[Dict] — each dict contains course_title, platform, url,
        skill_covered, difficulty, estimated_hours, why_important
"""
import logging
import json
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger("levelup")

# ── Demo Fallback Courses ──────────────────────────────────────────────────────

DEMO_COURSES: Dict[str, List[Dict]] = {
    "default": [
        {"course_title": "Python for Everybody", "platform": "Coursera", "url": "https://coursera.org/specializations/python", "skill_covered": "Python", "difficulty": "Beginner", "estimated_hours": 30, "why_important": "Python is the foundational language for most tech roles and essential for automation."},
        {"course_title": "Docker & Kubernetes: The Complete Guide", "platform": "Udemy", "url": "https://udemy.com/course/docker-kubernetes", "skill_covered": "Docker", "difficulty": "Intermediate", "estimated_hours": 22, "why_important": "Containerization is critical for modern deployment pipelines."},
        {"course_title": "AWS Certified Developer", "platform": "AWS", "url": "https://aws.amazon.com/certification/certified-developer", "skill_covered": "AWS", "difficulty": "Intermediate", "estimated_hours": 60, "why_important": "Cloud computing skills are required by 90% of enterprise job postings."},
        {"course_title": "System Design Interview", "platform": "Educative", "url": "https://educative.io/courses/grokking-modern-system-design", "skill_covered": "System Design", "difficulty": "Advanced", "estimated_hours": 25, "why_important": "System design is the most weighted factor in senior engineering interviews."},
        {"course_title": "TypeScript Deep Dive", "platform": "GitBook", "url": "https://basarat.gitbook.io/typescript", "skill_covered": "TypeScript", "difficulty": "Intermediate", "estimated_hours": 15, "why_important": "TypeScript adds type safety to JavaScript and is required in modern frontend stacks."},
    ]
}


def generate_courses(missing_skills: List[str], target_role: str, difficulty_level: str = "Beginner", exclude_titles: List[str] = None) -> List[Dict]:
    """
    Generate learning courses using Groq API (LLaMA-3).
    Falls back to demo courses if Groq is unavailable or in demo mode.
    """
    if exclude_titles is None:
        exclude_titles = []

    if settings.demo_mode or not settings.groq_api_key:
        return _demo_courses(missing_skills, target_role, difficulty_level, exclude_titles)

    try:
        return _groq_generate(missing_skills, target_role, difficulty_level, exclude_titles)
    except Exception as e:
        logger.error(f"Groq course generation failed: {e}")
        return _demo_courses(missing_skills, target_role, difficulty_level, exclude_titles)


def _groq_generate(missing_skills: List[str], target_role: str, difficulty_level: str = "Beginner", exclude_titles: List[str] = None, retries: int = 2) -> List[Dict]:
    """Call Groq API with retry logic for malformed JSON responses."""
    from groq import Groq
    if exclude_titles is None:
        exclude_titles = []

    client = Groq(api_key=settings.groq_api_key)
    skills_str = ", ".join(missing_skills)
    exclude_str = ", ".join(exclude_titles[:10]) # Limit to 10 for prompt length

    prompt = (
        f"You are an expert career mentor AI specializing in {target_role} career paths. "
        f"The user has already completed basic learning and is now at an {difficulty_level} level. "
        f"Given these missing skills: [{skills_str}], generate a structured {difficulty_level} level roadmap. "
        f"For each skill, return a course that is specifically {difficulty_level} level. "
        f"Do NOT include any of these previously completed courses: [{exclude_str}].\n\n"
        f"For each course return:\n"
        f"- course_title (real course name)\n"
        f"- platform (Udemy/Coursera/YouTube/Official Docs/fast.ai etc.)\n"
        f"- url (real, working course URL)\n"
        f"- skill_covered\n"
        f"- difficulty ({difficulty_level})\n"
        f"- estimated_hours (realistic number)\n"
        f"- why_important (1 sentence explaining why this {difficulty_level} content is next)\n\n"
        f"Return ONLY a valid JSON array of objects. No markdown, no explanation, just the JSON array."
    )

    last_error = None
    for attempt in range(retries + 1):
        try:
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=2000,
            )

            response = completion.choices[0].message.content.strip()
            courses = _parse_json_response(response)

            if courses and len(courses) > 0:
                logger.info(f"Groq generated {len(courses)} courses for {target_role} (attempt {attempt + 1})")
                return courses

        except Exception as e:
            last_error = e
            logger.warning(f"Groq attempt {attempt + 1} failed: {e}")

    raise ValueError(f"Groq generation failed after {retries + 1} attempts: {last_error}")


def _parse_json_response(response: str) -> List[Dict]:
    """Parse JSON from Groq response, handling markdown code blocks."""
    # Strip markdown code fences
    if "```json" in response:
        response = response.split("```json")[1].split("```")[0].strip()
    elif "```" in response:
        parts = response.split("```")
        if len(parts) >= 3:
            response = parts[1].strip()

    # Try direct parse
    try:
        data = json.loads(response)
        if isinstance(data, list):
            return _validate_courses(data)
    except json.JSONDecodeError:
        pass

    # Try to find JSON array in response
    start = response.find("[")
    end = response.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            data = json.loads(response[start:end + 1])
            if isinstance(data, list):
                return _validate_courses(data)
        except json.JSONDecodeError:
            pass

    return []


def _validate_courses(courses: List[Dict]) -> List[Dict]:
    """Validate and normalize course objects from Groq."""
    validated = []
    for c in courses:
        validated.append({
            "course_title": c.get("course_title", c.get("title", "Untitled Course")),
            "platform": c.get("platform", "Online"),
            "url": c.get("url", "#"),
            "skill_covered": c.get("skill_covered", "General"),
            "difficulty": c.get("difficulty", "Intermediate"),
            "estimated_hours": int(c.get("estimated_hours", c.get("duration_hours", 10))),
            "why_important": c.get("why_important", "Essential for this role."),
        })
    return validated


def _demo_courses(missing_skills: List[str], target_role: str, difficulty_level: str = "Beginner", exclude_titles: List[str] = None) -> List[Dict]:
    """Generate realistic demo courses based on missing skills and difficulty."""
    if exclude_titles is None:
        exclude_titles = []
    
    courses = []
    # Filter out missing skills that might have been "completed" already 
    # (Simplified for demo)
    
    for skill in missing_skills[:8]:
        title = f"{skill} — {difficulty_level} Mastery Course"
        if title in exclude_titles:
            title = f"{skill} — Advanced Practical Applications"
            
        courses.append({
            "course_title": title,
            "platform": "Coursera",
            "url": f"https://coursera.org/learn/{skill.lower().replace(' ', '-')}",
            "skill_covered": skill,
            "difficulty": difficulty_level,
            "estimated_hours": 20 if difficulty_level == "Beginner" else 35,
            "why_important": f"This {difficulty_level} course on {skill} is essential for {target_role} advancement.",
        })
    return courses
