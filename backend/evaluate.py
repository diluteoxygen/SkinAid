import time
import os
import sys
from clip_infer import analyze_image
import numpy as np

def run_evaluation(image_path="test.jpg", num_runs=5):
    print(f"Running evaluation on {image_path} over {num_runs} runs...")
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return
        
    latencies = []
    memories = []
    
    print("Warmup run...")
    analyze_image(image_path)
    
    for i in range(num_runs):
        print(f"Run {i+1}/{num_runs}...")
        results, metrics = analyze_image(image_path)
        latencies.append(metrics["latency_ms"])
        memories.append(metrics["memory_mb"])
        
    avg_latency = np.mean(latencies)
    std_latency = np.std(latencies)
    avg_memory = np.mean(memories)
    
    print("\n--- Evaluation Results ---")
    print(f"Average Latency: {avg_latency:.2f} ms (+/- {std_latency:.2f} ms)")
    if avg_memory > 0:
        print(f"Average Memory (CUDA): {avg_memory:.2f} MB")
    else:
        print(f"Average Memory (CUDA): N/A (Using CPU)")
    
    print("\nCosine Similarity Stability:")
    for res in results[:3]:
        print(f"- {res['label']}: {res['score']:.4f}")
        
if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "test.jpg")
    run_evaluation(target)
