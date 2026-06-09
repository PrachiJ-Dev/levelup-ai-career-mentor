"""
Career LSTM Training Script.

Usage:
    python train.py --epochs 20 --output checkpoints/career_lstm.pt
"""
import argparse
import random
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from models.career.lstm_model import CareerLSTM
from models.career.inference import ALL_ROLES, ROLE_TO_IDX, PROGRESSIONS
from utils.skill_taxonomy import ALL_SKILLS, SKILL_TO_IDX
import logging

logger = logging.getLogger(__name__)


def encode_step(role: str, skills: list) -> torch.Tensor:
    role_vec = torch.zeros(len(ALL_ROLES))
    role_vec[ROLE_TO_IDX.get(role, 0)] = 1.0
    skill_vec = torch.zeros(len(ALL_SKILLS))
    for s in skills:
        if s in SKILL_TO_IDX:
            skill_vec[SKILL_TO_IDX[s]] = 1.0
    return torch.cat([role_vec, skill_vec])


def generate_career_sequences(n=5000, seq_len=5):
    """Generate synthetic career progression sequences."""
    from utils.skill_taxonomy import JOB_ROLE_SKILLS
    data = []
    all_roles = ALL_ROLES

    for _ in range(n):
        start_role = random.choice(all_roles)
        sequence = [start_role]
        for _ in range(seq_len - 1):
            progressions = PROGRESSIONS.get(sequence[-1], all_roles)
            next_role = random.choice(progressions)
            sequence.append(next_role)

        # Input: first seq_len-1 steps, Target: last step
        input_roles = sequence[:-1]
        target_role = sequence[-1]
        target_idx = ROLE_TO_IDX.get(target_role, 0)

        # Encode each step
        steps = []
        for role in input_roles:
            skills = JOB_ROLE_SKILLS.get(role, [])
            # Randomly drop some skills to simulate incomplete profiles
            skills = random.sample(skills, k=max(1, int(len(skills) * 0.7)))
            steps.append(encode_step(role, skills))

        x = torch.stack(steps)  # [seq_len-1, input_size]
        data.append((x, target_idx))

    return data


class CareerDataset(Dataset):
    def __init__(self, data): self.data = data
    def __len__(self): return len(self.data)
    def __getitem__(self, i): x, y = self.data[i]; return x, torch.tensor(y, dtype=torch.long)


def train(args):
    logging.basicConfig(level=logging.INFO)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    input_size = len(ALL_SKILLS) + len(ALL_ROLES)
    model = CareerLSTM(input_size=input_size, num_roles=len(ALL_ROLES)).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    criterion = nn.CrossEntropyLoss()

    all_data = generate_career_sequences(n=args.n_samples, seq_len=args.seq_len)
    n_val = max(1, int(0.1 * len(all_data)))
    train_data, val_data = random_split(all_data, [len(all_data) - n_val, n_val])
    train_loader = DataLoader(CareerDataset(train_data), batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(CareerDataset(val_data), batch_size=args.batch_size)

    best = float("inf")
    for epoch in range(args.epochs):
        model.train()
        t_loss = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            logits, _ = model(x)
            loss = criterion(logits, y)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            t_loss += loss.item()

        model.eval()
        v_loss, correct = 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits, _ = model(x)
                v_loss += criterion(logits, y).item()
                correct += (logits.argmax(1) == y).sum().item()

        acc = correct / len(val_data)
        avg_v = v_loss / len(val_loader)
        logger.info(f"Epoch {epoch+1}/{args.epochs} | Val Loss {avg_v:.4f} | Val Acc {acc:.2%}")

        if avg_v < best:
            best = avg_v
            torch.save(model.state_dict(), args.output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--n_samples", type=int, default=5000)
    parser.add_argument("--seq_len", type=int, default=5)
    parser.add_argument("--output", default="ml_training/checkpoints/career_lstm.pt")
    train(parser.parse_args())
