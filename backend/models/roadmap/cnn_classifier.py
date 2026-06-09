"""
CNN Text Classifier for Learning Path Recommendation.

Architecture:
    Embedding → Conv1D(filters=[100,100,100], kernels=[2,3,4])
    → MaxPool → Concat → Dropout → Linear → Softmax

Purpose: Classify a skill/description into a course category.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F


class CNNTextClassifier(nn.Module):
    """
    Multi-kernel CNN for text classification.
    Inspired by Kim (2014) "Convolutional Neural Networks for Sentence Classification".

    Input:  token indices [batch, seq_len]
    Output: category logits [batch, num_classes]
    """

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int = 128,
        num_filters: int = 100,
        kernel_sizes: list = None,
        num_classes: int = 20,
        dropout: float = 0.3,
        pad_idx: int = 0,
    ):
        super().__init__()
        if kernel_sizes is None:
            kernel_sizes = [2, 3, 4]

        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=pad_idx)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, num_filters, k) for k in kernel_sizes
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(num_filters * len(kernel_sizes), num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: token indices [batch, seq_len]
        Returns:
            logits [batch, num_classes]
        """
        # [batch, seq_len, embed_dim] → [batch, embed_dim, seq_len]
        embedded = self.embedding(x).permute(0, 2, 1)

        # Apply each conv + maxpool
        pooled = []
        for conv in self.convs:
            activated = F.relu(conv(embedded))   # [batch, num_filters, L]
            pooled_out = F.max_pool1d(activated, activated.size(2)).squeeze(2)
            pooled.append(pooled_out)

        # Concat all kernels → [batch, num_filters * num_kernels]
        cat = torch.cat(pooled, dim=1)
        out = self.dropout(cat)
        return self.fc(out)
