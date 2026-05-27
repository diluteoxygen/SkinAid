import torch
import open_clip

from PIL import Image
from safetensors.torch import load_file
from prompt_bank import PROMPT_BANK
import os
import time

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    "ViT-B-16",
    pretrained=None
)

model_path = os.path.join(os.path.dirname(__file__), "..", "models", "open_clip_model_fp16.safetensors")
state_dict = load_file(model_path)

model.load_state_dict(state_dict)

model = model.to(DEVICE).eval()
if DEVICE == "cuda":
    model = model.half()

def analyze_image(image_path):
    start_time = time.time()
    if DEVICE == "cuda":
        torch.cuda.reset_peak_memory_stats()

    image = preprocess(
        Image.open(image_path).convert("RGB")
    ).unsqueeze(0).to(DEVICE)
    if DEVICE == "cuda":
        image = image.half()

    text_tokens = open_clip.tokenize(PROMPT_BANK).to(DEVICE)

    with torch.no_grad():

        image_features = model.encode_image(image)
        image_features /= image_features.norm(dim=-1, keepdim=True)

        text_features = model.encode_text(text_tokens)
        text_features /= text_features.norm(dim=-1, keepdim=True)

        # Scale by CLIP's learned logit scale parameter before softmax
        # This increases the confidence spread (temperature scaling)
        logit_scale = model.logit_scale.exp()
        similarity = (logit_scale * image_features @ text_features.T).softmax(dim=-1)

    probs = similarity[0].cpu().numpy()

    results = []

    for label, score in zip(PROMPT_BANK, probs):
        results.append({
            "label": label,
            "score": float(score)
        })

    results = sorted(
        results,
        key=lambda x: x["score"],
        reverse=True
    )
    
    end_time = time.time()
    latency_ms = (end_time - start_time) * 1000
    
    memory_mb = 0.0
    if DEVICE == "cuda":
        memory_mb = torch.cuda.max_memory_allocated() / (1024 * 1024)

    return results[:3], {"latency_ms": latency_ms, "memory_mb": memory_mb}
