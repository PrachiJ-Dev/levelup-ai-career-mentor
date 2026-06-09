"""
Skill Gap Detection DNN — PyTorch implementation.

Architecture:
    Input(skill_vector) → Linear(256) → BatchNorm → ReLU → Dropout(0.3)
    → Linear(128) → ReLU → Dropout(0.3) → Linear(num_skills) → Sigmoid

Loss:     BCEWithLogitsLoss
Optimizer: Adam (lr=1e-3)
"""
import torch
import torch.nn as nn


class SkillGapDNN(nn.Module):
    """
    Feedforward DNN for skill gap detection.

    Input:  binary skill presence vector [batch, num_input_skills]
    Output: predicted required skill scores [batch, num_output_skills]
    """

    def __init__(self, input_size: int, output_size: int, dropout: float = 0.3):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 256),
            nn.BatchNorm1d(256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, output_size),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)  # raw logits; apply sigmoid for inference


class SkillGapTrainer:
    """Handles training loop, validation, and checkpoint saving."""

    def __init__(self, model: SkillGapDNN, lr: float = 1e-3):
        self.model = model
        self.criterion = nn.BCEWithLogitsLoss()
        self.optimizer = torch.optim.Adam(model.parameters(), lr=lr)
        self.scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, patience=3, factor=0.5
        )

    def train_epoch(self, dataloader) -> float:
        self.model.train()
        total_loss = 0.0
        for inputs, targets in dataloader:
            self.optimizer.zero_grad()
            outputs = self.model(inputs)
            loss = self.criterion(outputs, targets)
            loss.backward()
            self.optimizer.step()
            total_loss += loss.item()
        return total_loss / len(dataloader)

    def validate(self, dataloader) -> float:
        self.model.eval()
        total_loss = 0.0
        with torch.no_grad():
            for inputs, targets in dataloader:
                outputs = self.model(inputs)
                loss = self.criterion(outputs, targets)
                total_loss += loss.item()
        avg_loss = total_loss / len(dataloader)
        self.scheduler.step(avg_loss)
        return avg_loss
