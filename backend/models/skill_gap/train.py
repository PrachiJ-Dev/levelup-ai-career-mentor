"""
Skill Gap DNN Training Script.

Usage:
    python train.py --epochs 30 --output checkpoints/skill_gap_dnn.pt
"""
import argparse
import json
import torch
from torch.utils.data import Dataset, DataLoader, random_split
from models.skill_gap.model import SkillGapDNN, SkillGapTrainer
from utils.skill_taxonomy import ALL_SKILLS, SKILL_TO_IDX, JOB_ROLE_SKILLS
import logging

logger = logging.getLogger(__name__)


def generate_synthetic_dataset(n_samples=10000):
    """
    Generate synthetic (input_skills, required_skills) pairs from taxonomy.
    In practice, replace with real labeled resume data.
    """
    import random
    n = len(ALL_SKILLS)
    all_required = list(JOB_ROLE_SKILLS.values())
    data = []

    for _ in range(n_samples):
        required = random.choice(all_required)
        # User has 40-80% of required skills, possibly some extras
        n_have = random.randint(int(len(required) * 0.4), len(required))
        have = random.sample(required, n_have)
        have += random.sample(ALL_SKILLS, random.randint(0, 10))  # extra skills

        x = torch.zeros(n)
        for s in have:
            if s in SKILL_TO_IDX:
                x[SKILL_TO_IDX[s]] = 1.0

        y = torch.zeros(n)
        for s in required:
            if s in SKILL_TO_IDX:
                y[SKILL_TO_IDX[s]] = 1.0

        data.append((x, y))

    return data


class SkillDataset(Dataset):
    def __init__(self, data): self.data = data
    def __len__(self): return len(self.data)
    def __getitem__(self, i): return self.data[i]


def train(args):
    logging.basicConfig(level=logging.INFO)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on {device} | Skills: {len(ALL_SKILLS)}")

    # Dataset
    all_data = generate_synthetic_dataset(args.n_samples)
    n_val = int(len(all_data) * 0.1)
    train_data, val_data = random_split(all_data, [len(all_data) - n_val, n_val])
    train_loader = DataLoader(SkillDataset(train_data), batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(SkillDataset(val_data), batch_size=args.batch_size)

    n = len(ALL_SKILLS)
    model = SkillGapDNN(input_size=n, output_size=n).to(device)
    trainer = SkillGapTrainer(model, lr=args.lr)

    best = float("inf")
    for epoch in range(args.epochs):
        train_loss = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            trainer.optimizer.zero_grad()
            out = model(x)
            loss = trainer.criterion(out, y)
            loss.backward()
            trainer.optimizer.step()
            train_loss += loss.item()
        
        val_loss = trainer.validate(val_loader)
        avg_train = train_loss / len(train_loader)
        logger.info(f"Epoch {epoch+1}/{args.epochs} | Train: {avg_train:.4f} | Val: {val_loss:.4f}")

        if val_loss < best:
            best = val_loss
            torch.save(model.state_dict(), args.output)
            logger.info(f"Best model saved → {args.output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch_size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--n_samples", type=int, default=10000)
    parser.add_argument("--output", default="ml_training/checkpoints/skill_gap_dnn.pt")
    train(parser.parse_args())
