"""
BERT NER Model for Resume Entity Extraction.
Architecture: DistilBERT fine-tuned for token classification.
Labels: SKILL, JOB_TITLE, CERTIFICATION, EDUCATION, O
"""
import torch
import torch.nn as nn
from transformers import DistilBertPreTrainedModel, DistilBertModel


LABEL_TO_IDX = {
    "O": 0,
    "B-SKILL": 1,
    "I-SKILL": 2,
    "B-JOB_TITLE": 3,
    "I-JOB_TITLE": 4,
    "B-CERTIFICATION": 5,
    "I-CERTIFICATION": 6,
    "B-EDUCATION": 7,
    "I-EDUCATION": 8,
}

IDX_TO_LABEL = {v: k for k, v in LABEL_TO_IDX.items()}
NUM_LABELS = len(LABEL_TO_IDX)


class ResumeNERModel(DistilBertPreTrainedModel):
    """
    DistilBERT with a token classification head for NER.

    Architecture:
        DistilBERT encoder → Dropout → Linear(hidden, num_labels)

    Input:  tokenized resume text (input_ids, attention_mask)
    Output: per-token label logits [batch, seq_len, num_labels]
    """

    def __init__(self, config):
        super().__init__(config)
        self.num_labels = NUM_LABELS
        self.distilbert = DistilBertModel(config)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(config.hidden_size, NUM_LABELS)
        self.post_init()

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor | None = None,
        labels: torch.Tensor | None = None,
    ):
        outputs = self.distilbert(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )
        sequence_output = self.dropout(outputs.last_hidden_state)
        logits = self.classifier(sequence_output)

        loss = None
        if labels is not None:
            loss_fn = nn.CrossEntropyLoss(ignore_index=-100)
            loss = loss_fn(logits.view(-1, self.num_labels), labels.view(-1))

        return (loss, logits) if loss is not None else logits
