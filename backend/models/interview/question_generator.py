"""
Interview Question Generator (GPT-2 based) + Answer Evaluator (BERT similarity).
"""
import logging
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger("levelup")

# ── Role-Specific Question Bank (Demo + Fallback) ─────────────────────────────

QUESTION_BANK: Dict[str, Dict[str, List[str]]] = {
    "Software Engineer": {
        "easy": [
            "What is the difference between a stack and a queue?",
            "Explain the concept of recursion with an example.",
            "What is time complexity and why does it matter?",
            "What is the difference between == and === in JavaScript?",
            "Can you explain what REST API is?",
        ],
        "medium": [
            "Explain the SOLID principles in software design.",
            "What is the difference between SQL and NoSQL databases? When would you use each?",
            "Describe how you would design a URL shortening service like bit.ly.",
            "Explain how garbage collection works in Python.",
            "What is a deadlock and how can it be prevented?",
        ],
        "hard": [
            "Design a distributed cache system that handles 1 million requests per second.",
            "How would you architect a real-time collaborative editing system like Google Docs?",
            "Explain the CAP theorem and how it applies to distributed systems design.",
            "Design a recommendation engine for an e-commerce platform.",
            "How would you implement a rate limiter at scale?",
        ],
    },
    "Data Scientist": {
        "easy": [
            "What is the difference between supervised and unsupervised learning?",
            "Explain overfitting and how you prevent it.",
            "What is a confusion matrix?",
            "What is the difference between mean, median, and mode?",
            "Explain cross-validation.",
        ],
        "medium": [
            "How does gradient boosting work? How is it different from random forests?",
            "Explain the bias-variance tradeoff.",
            "What is the curse of dimensionality?",
            "How would you handle imbalanced datasets?",
            "Explain regularization techniques (L1 vs L2).",
        ],
        "hard": [
            "Build a fraud detection system for a FinTech company. Walk me through your approach.",
            "Explain the math behind backpropagation in neural networks.",
            "How would you design an A/B testing framework from scratch?",
            "Explain transformer attention mechanisms in detail.",
            "How does BERT differ from GPT architecturally, and when would you choose each?",
        ],
    },
    "ML Engineer": {
        "easy": [
            "What is the difference between training and inference?",
            "What is a neural network?",
            "Explain what a hyperparameter is.",
            "What is batch normalization?",
            "How does dropout regularization work?",
        ],
        "medium": [
            "How would you deploy a PyTorch model to production?",
            "Explain the components of an MLOps pipeline.",
            "What is model drift and how do you monitor for it?",
            "How would you reduce inference latency for a large language model?",
            "Explain transfer learning and when you'd use it.",
        ],
        "hard": [
            "Design an end-to-end ML platform for a large-scale NLP application.",
            "How would you train a large model across 100 GPUs efficiently?",
            "Explain RLHF and how it's used to align language models.",
            "Design a feature store for a recommendation system.",
            "How would you handle catastrophic forgetting in continual learning?",
        ],
    },
    "Machine Learning Engineer": {
        "easy": ["What is a neural network?", "Explain hyperparameter tuning.", "What is batch normalization?"],
        "medium": ["Deploy a PyTorch model to production.", "Explain MLOps.", "What is model drift?"],
        "hard": ["Design an end-to-end ML platform.", "Train a large model across GPUs.", "Explain RLHF."]
    },
    "Frontend Developer": {
        "easy": [
            "What is the Virtual DOM in React?",
            "Explain the difference between let, const, and var.",
            "How does CSS Flexbox differ from CSS Grid?",
            "What are React hooks? Name three commonly used ones.",
            "What is event delegation in JavaScript?",
        ],
        "medium": [
            "Explain Server-Side Rendering (SSR) vs Static Site Generation (SSG) in Next.js.",
            "How do you handle state management in a large React application?",
            "Describe how you would optimize the performance of a slow React app.",
            "Explain the concept of closures in JavaScript with a practical example.",
            "How does the browser rendering engine work from HTML parsing to painting?",
        ],
        "hard": [
            "Design the frontend architecture for a real-time chat application like Slack.",
            "How would you implement a virtualized list to render 100,000 items without lag?",
            "Explain the reconciliation algorithm in React deep under the hood.",
            "Design a robust, accessible, and highly reusable design system component library.",
            "How do you handle memory leaks in a single-page application?",
        ],
    },
    "Backend Engineer": {
        "easy": [
            "What is the difference between a GET and POST request?",
            "Explain the concept of middleware in web frameworks.",
            "What is an ORM and why use it?",
            "Describe the difference between SQL and NoSQL databases.",
            "What is a RESTful API?",
        ],
        "medium": [
            "How does connection pooling work in a database?",
            "Explain the differences between processes and threads.",
            "How do you handle concurrency issues in a high-traffic backend?",
            "Describe the CAP theorem and its implications.",
            "How do you secure a REST API from common attacks?",
        ],
        "hard": [
            "Design a scalable rate-limiting service for millions of users.",
            "How would you implement distributed transactions across microservices?",
            "Design the database schema and backend architecture for Twitter.",
            "Explain the Paxos or Raft consensus algorithms.",
            "How do you troubleshoot a sudden 500% spike in database latency?",
        ],
    },
    "Full Stack Developer": {
        "easy": [
            "What does a typical web request lifecycle look like?",
            "Explain CORS and how to fix CORS errors.",
            "What is JWT and how is it used?",
            "How do you connect a React frontend to a Node.js backend?",
            "What is MVC architecture?",
        ],
        "medium": [
            "How do you manage authentication and authorization in a full-stack app?",
            "Explain how WebSockets work and when to use them over HTTP.",
            "How would you structure a monorepo for a Next.js frontend and FastAPI backend?",
            "Describe your strategy for E2E (End-to-End) testing.",
            "How do you handle database migrations safely in production?",
        ],
        "hard": [
            "Design a scalable real-time notification system across web and mobile.",
            "How would you architect an e-commerce platform that handles Black Friday traffic?",
            "Explain the trade-offs of Micro-frontends in a large organization.",
            "Design a secure, distributed caching strategy for a full-stack app.",
            "How do you achieve zero-downtime deployments for both frontend and backend?",
        ],
    },
    "DevOps Engineer": {
        "easy": [
            "What is the difference between continuous integration and continuous deployment?",
            "Explain what a Docker container is compared to a VM.",
            "What is Infrastructure as Code (IaC)?",
            "What is the purpose of Kubernetes?",
            "How do you manage environment variables safely?",
        ],
        "medium": [
            "Describe a blue/green deployment strategy.",
            "How does a load balancer work and what algorithms does it use?",
            "Explain how you would secure a Kubernetes cluster.",
            "How do you design a robust CI/CD pipeline using GitHub Actions?",
            "What is service mesh and why is it useful?",
        ],
        "hard": [
            "Design a multi-region disaster recovery strategy on AWS.",
            "How do you troubleshoot a pod in Kubernetes that is stuck in CrashLoopBackOff?",
            "Architect a scalable monitoring and alerting stack using Prometheus and Grafana.",
            "How would you migrate a legacy monolithic application to a containerized microservices architecture with zero downtime?",
            "Explain your strategy for secret management at enterprise scale.",
        ],
    },
    "Database Admin": {
        "easy": ["What is normalization?", "Explain ACID properties.", "What is an index?"],
        "medium": ["Explain database replication.", "How do you optimize a slow query?", "What is a deadlock?"],
        "hard": ["Design a sharding strategy for 10TB of data.", "How do you recover a dropped table in production?", "Explain multi-version concurrency control (MVCC)."]
    },
    "Systems Architect": {
        "easy": ["What is microservices architecture?", "Explain horizontal vs vertical scaling.", "What is a load balancer?"],
        "medium": ["Explain the CAP theorem.", "How do you handle event-driven architecture?", "What are the trade-offs of gRPC vs REST?"],
        "hard": ["Design a global CDN.", "Architect a video streaming service like Netflix.", "Design a distributed locking mechanism."]
    }
}

DEFAULT_QUESTIONS = {
    "easy": ["Tell me about yourself and your background.", "What are your key technical skills?", "Describe a challenging project you worked on."],
    "medium": ["How do you approach debugging a complex issue?", "Describe your experience with system design.", "Tell me about a time you optimized a slow system."],
    "hard": ["Design a scalable distributed system for this use case.", "How would you architect a microservices system?", "Discuss trade-offs in your most complex technical decision."],
}

IDEAL_ANSWERS: Dict[str, str] = {
    "What is the difference between a stack and a queue?":
        "A stack is LIFO (Last In First Out) - like a stack of plates. A queue is FIFO (First In First Out) - like a line of people. Stacks use push/pop operations, queues use enqueue/dequeue.",
    "Explain the concept of recursion with an example.":
        "Recursion is when a function calls itself with a smaller subproblem until a base case is reached. Example: factorial(n) = n * factorial(n-1), base case factorial(0) = 1.",
}


def generate_questions(role: str, difficulty: str, count: int = 5) -> List[str]:
    """Generate interview questions for a given role and difficulty."""
    if settings.demo_mode:
        bank = QUESTION_BANK.get(role, QUESTION_BANK.get("Software Engineer", {}))
        questions = bank.get(difficulty, bank.get("medium", DEFAULT_QUESTIONS["medium"]))
        return questions[:count]

    if settings.groq_api_key:
        try:
            return _groq_generate(role, difficulty, count)
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            
    # Last resort fallback if Groq fails or is not configured
    bank = QUESTION_BANK.get(role, QUESTION_BANK.get("Software Engineer", {}))
    return bank.get(difficulty, DEFAULT_QUESTIONS.get(difficulty, []))[:count]


def _groq_generate(role: str, difficulty: str, count: int) -> List[str]:
    """Groq API (LLaMA-3) based dynamic question generation."""
    from groq import Groq
    import json
    
    client = Groq(api_key=settings.groq_api_key)
    
    prompt = (
        f"You are an expert technical interviewer for the role of {role}. "
        f"Generate exactly {count} {difficulty}-level technical interview questions for this role. "
        f"Return ONLY a JSON array of strings containing the questions. No other text."
    )
    
    completion = client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=500,
    )
    
    response = completion.choices[0].message.content.strip()
    
    # Try to parse JSON array from response
    try:
        # Sometimes LLMs wrap json in markdown code blocks
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
            
        questions = json.loads(response)
        if isinstance(questions, list) and len(questions) > 0:
            return questions[:count]
    except Exception as e:
        logger.error(f"Failed to parse Groq response: {response}. Error: {e}")
        
    raise ValueError("Invalid response format from Groq")
