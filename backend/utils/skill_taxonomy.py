"""
Skill taxonomy: 200+ skills mapped to categories and job roles.
Used by the Skill Gap DNN and Learning Path Recommender.
"""

SKILL_CATEGORIES = {
    "programming": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
        "Kotlin", "Swift", "Ruby", "PHP", "Scala", "R", "MATLAB", "Bash",
    ],
    "web_frontend": [
        "React", "Next.js", "Vue.js", "Angular", "HTML", "CSS", "Tailwind CSS",
        "SASS", "Redux", "GraphQL", "REST API", "Webpack", "Vite",
    ],
    "web_backend": [
        "FastAPI", "Django", "Flask", "Node.js", "Express.js", "Spring Boot",
        "ASP.NET", "Laravel", "Ruby on Rails", "NestJS",
    ],
    "ai_ml": [
        "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Keras",
        "scikit-learn", "NLP", "Computer Vision", "Reinforcement Learning",
        "Transformers", "BERT", "GPT", "LLMs", "Hugging Face", "OpenCV",
        "Data Augmentation", "Transfer Learning",
    ],
    "data": [
        "Pandas", "NumPy", "SQL", "NoSQL", "Data Visualization", "Tableau",
        "Power BI", "Matplotlib", "Seaborn", "Spark", "Hadoop", "Kafka",
        "Airflow", "dbt", "ETL",
    ],
    "devops_cloud": [
        "Docker", "Kubernetes", "AWS", "GCP", "Azure", "CI/CD", "GitHub Actions",
        "Jenkins", "Terraform", "Ansible", "Linux", "Nginx", "Redis",
    ],
    "databases": [
        "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch",
        "Cassandra", "DynamoDB", "Firebase", "Supabase",
    ],
    "soft_skills": [
        "Communication", "Leadership", "Problem Solving", "Teamwork",
        "Critical Thinking", "Time Management", "Agile", "Scrum",
    ],
}

# Flatten to a master list with index
ALL_SKILLS = []
for category, skills in SKILL_CATEGORIES.items():
    ALL_SKILLS.extend(skills)
ALL_SKILLS = list(dict.fromkeys(ALL_SKILLS))  # deduplicate preserving order

SKILL_TO_IDX = {skill: i for i, skill in enumerate(ALL_SKILLS)}
IDX_TO_SKILL = {i: skill for skill, i in SKILL_TO_IDX.items()}

# Job role → required skills mapping
JOB_ROLE_SKILLS: dict[str, list[str]] = {
    "Software Engineer": [
        "Python", "JavaScript", "React", "Node.js", "Docker", "Git",
        "REST API", "SQL", "Problem Solving", "Agile",
    ],
    "Data Scientist": [
        "Python", "Machine Learning", "Deep Learning", "Pandas", "NumPy",
        "scikit-learn", "SQL", "Data Visualization", "Statistics",
        "PyTorch", "TensorFlow",
    ],
    "Machine Learning Engineer": [
        "Python", "PyTorch", "TensorFlow", "MLOps", "Docker", "Kubernetes",
        "Deep Learning", "Transformers", "CI/CD", "AWS",
    ],
    "Frontend Developer": [
        "JavaScript", "TypeScript", "React", "Next.js", "CSS", "HTML",
        "Tailwind CSS", "Redux", "GraphQL", "REST API",
    ],
    "Backend Engineer": [
        "Python", "FastAPI", "Node.js", "Docker", "PostgreSQL", "MongoDB",
        "REST API", "Redis", "AWS", "CI/CD",
    ],
    "Full Stack Developer": [
        "JavaScript", "TypeScript", "React", "Node.js", "Python", "FastAPI",
        "MongoDB", "PostgreSQL", "Docker", "REST API", "AWS",
    ],
    "DevOps Engineer": [
        "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux",
        "Python", "GitHub Actions", "Nginx", "Ansible",
    ],
    "Database Admin": [
        "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
        "AWS", "Linux", "Data Visualization",
    ],
    "Systems Architect": [
        "System Design", "AWS", "GCP", "Kubernetes", "Docker",
        "Linux", "CI/CD", "Networking", "Security", "Go",
    ],
    "Data Engineer": [
        "Python", "SQL", "Spark", "Kafka", "Airflow", "ETL", "AWS",
        "PostgreSQL", "dbt", "Linux",
    ],
    "Product Manager": [
        "Agile", "Scrum", "Leadership", "Communication", "Problem Solving",
        "Data Visualization", "SQL", "Figma",
    ],
    "AI Researcher": [
        "Python", "PyTorch", "Deep Learning", "NLP", "Computer Vision",
        "Transformers", "BERT", "Research", "Mathematics", "Statistics",
    ],
    "Mobile Developer": [
        "Swift", "Kotlin", "React Native", "Flutter", "iOS", "Android",
        "REST API", "Firebase", "CI/CD",
    ],
    "Cloud Architect": [
        "AWS", "GCP", "Azure", "Kubernetes", "Terraform", "Docker",
        "Linux", "CI/CD", "Networking", "Security",
    ],
    "Cybersecurity Engineer": [
        "Linux", "Python", "Networking", "Security", "AWS", "Docker",
        "CI/CD", "Bash",
    ],
    "UI/UX Designer": [
        "Figma", "Design", "HTML", "CSS", "User Research", "Prototyping",
        "Communication",
    ],
    "QA Engineer": [
        "Python", "Selenium", "Jest", "Testing", "CI/CD", "Docker",
        "REST API", "Problem Solving",
    ],
}

ALL_ROLES = list(JOB_ROLE_SKILLS.keys())
