"""
DistilBERT NER Training Script.

Usage:
    python train.py --data_path datasets/ner_data.json --epochs 5 --output_dir checkpoints/

Requirements:
    pip install torch transformers datasets seqeval
"""
import argparse
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import DistilBertTokenizerFast, get_linear_schedule_with_warmup
from models.resume_ner.model import ResumeNERModel, LABEL_TO_IDX, NUM_LABELS
import logging

logger = logging.getLogger(__name__)


class NERDataset(Dataset):
    """
    Dataset format: list of {"tokens": [...], "labels": [...]} dicts.
    Labels are BIO tags: O, B-SKILL, I-SKILL, B-JOB_TITLE, etc.
    """
    def __init__(self, data, tokenizer, max_length=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        tokens = item["tokens"]
        labels = item["labels"]

        encoding = self.tokenizer(
            tokens,
            is_split_into_words=True,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        # Align labels with subword tokens
        word_ids = encoding.word_ids()
        aligned_labels = []
        prev_word_id = None
        for word_id in word_ids:
            if word_id is None:
                aligned_labels.append(-100)
            elif word_id != prev_word_id:
                aligned_labels.append(LABEL_TO_IDX.get(labels[word_id], 0))
            else:
                aligned_labels.append(-100)  # Ignore subword continuations
            prev_word_id = word_id

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(aligned_labels, dtype=torch.long),
        }


def train(args):
    import json

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Training on: {device}")

    # Load data
    with open(args.data_path) as f:
        data = json.load(f)

    split = int(0.9 * len(data))
    train_data, val_data = data[:split], data[split:]

    tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")
    train_ds = NERDataset(train_data, tokenizer)
    val_ds = NERDataset(val_data, tokenizer)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size)

    # Model
    from transformers import DistilBertConfig
    config = DistilBertConfig.from_pretrained("distilbert-base-uncased", num_labels=NUM_LABELS)
    model = ResumeNERModel.from_pretrained("distilbert-base-uncased", config=config)
    model.to(device)

    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=total_steps // 10, num_training_steps=total_steps)

    best_val_loss = float("inf")
    for epoch in range(args.epochs):
        # Train
        model.train()
        total_loss = 0
        for batch in train_loader:
            batch = {k: v.to(device) for k, v in batch.items()}
            optimizer.zero_grad()
            loss, _ = model(**batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()
            total_loss += loss.item()

        avg_train = total_loss / len(train_loader)

        # Validate
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch in val_loader:
                batch = {k: v.to(device) for k, v in batch.items()}
                loss, _ = model(**batch)
                val_loss += loss.item()
        avg_val = val_loss / len(val_loader)

        logger.info(f"Epoch {epoch+1}/{args.epochs} | Train Loss: {avg_train:.4f} | Val Loss: {avg_val:.4f}")

        if avg_val < best_val_loss:
            best_val_loss = avg_val
            model.save_pretrained(args.output_dir)
            tokenizer.save_pretrained(args.output_dir)
            logger.info(f"Checkpoint saved to {args.output_dir}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Train DistilBERT NER for resume entities")
    parser.add_argument("--data_path", default="ml_training/datasets/ner_training_data.json")
    parser.add_argument("--output_dir", default="ml_training/checkpoints/ner_model/")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=8)
    parser.add_argument("--lr", type=float, default=2e-5)
    args = parser.parse_args()
    train(args)
