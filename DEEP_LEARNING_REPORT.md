# LevelUp Deep Learning Architecture Report

This report outlines the architecture for the multi-model PyTorch pipeline powering LevelUp.

## 1. Resume Parser (NER)
- **Model:** `distilbert-base-uncased` fine-tuned on token classification (Resume parsing data).
- **Architecture:** Transformer Encoder taking tokenized PDF text, passing through a linear classification head predicting BIO tags (Begin-Inside-Outside) for `SKILL`, `JOB_TITLE`, `EDUCATION`, `CERT`.

## 2. Skill Gap Predictor
- **Model:** Feedforward Deep Neural Network (DNN).
- **Architecture:** 
  - Input: Multi-hot encoded vector representing user skills `[1, 0, 0, 1... N]`.
  - Layers: `Linear(256) -> BatchNorm -> ReLU -> Dropout(0.3) -> Linear(128) -> ReLU -> Linear(num_skills)`.
  - Output: Sigmoid probabilities of required skills.

## 3. Mock Interview Evaluator
- **Generator:** `GPT-2 Small` prompted with role and difficulty context.
- **Evaluator:** Sentence-BERT (`all-MiniLM-L6-v2`).
- **Architecture:** User answers and Ideal answers are encoded into 384-dimensional embeddings. Cosine similarity is computed. If > 0.84, answer is marked excellent.

## 4. Career Trajectory
- **Model:** Long Short-Term Memory (LSTM).
- **Architecture:**
  - Sequential input of past roles (one-hot encoded + duration).
  - LSTM hidden state output passed through fully connected layers to predict logits for `N` possible next roles.

*Note: Models require high GPU VRAM for active real-time generation, hence the demo fallback mode provided in the inference classes.*
