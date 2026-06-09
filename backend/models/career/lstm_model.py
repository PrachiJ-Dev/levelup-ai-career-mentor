"""
Career Trajectory LSTM Model — PyTorch implementation.

Architecture:
    Embedding(role+skills) → LSTM(hidden=256, layers=2) → Linear → Softmax
    Predicts next 2-3 career roles from sequence history.

Training:
    Input:  sequence of (role_idx, skill_vec) per year
    Target: next role in sequence
    Loss:   CrossEntropyLoss
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List


class CareerLSTM(nn.Module):
    """
    LSTM-based career trajectory predictor.

    Input:  career history encoded as sequence [batch, seq_len, feature_size]
    Output: role probability distribution [batch, num_roles]
    """

    def __init__(
        self,
        input_size: int,
        hidden_size: int = 256,
        num_layers: int = 2,
        num_roles: int = 15,
        dropout: float = 0.3,
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=False,
        )
        self.layer_norm = nn.LayerNorm(hidden_size)
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden_size, 128)
        self.fc2 = nn.Linear(128, num_roles)

    def forward(
        self,
        x: torch.Tensor,
        hidden: tuple | None = None,
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """
        Args:
            x: [batch, seq_len, input_size]
        Returns:
            logits: [batch, num_roles]
            (h_n, c_n): final hidden state
        """
        lstm_out, (h_n, c_n) = self.lstm(x, hidden)
        # Take output from last time step
        last_out = lstm_out[:, -1, :]
        last_out = self.layer_norm(last_out)
        last_out = self.dropout(last_out)
        out = F.relu(self.fc1(last_out))
        logits = self.fc2(out)
        return logits, (h_n, c_n)

    def predict_top_k(self, x: torch.Tensor, k: int = 3) -> tuple[List[int], List[float]]:
        """Return top-k predicted role indices and confidence percentages."""
        self.eval()
        with torch.no_grad():
            logits, _ = self.forward(x)
            probs = F.softmax(logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, k, dim=-1)
            return top_indices[0].tolist(), top_probs[0].tolist()
