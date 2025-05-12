import yaml
from itertools import product

# Define the possible values for each type
models = ["gpt-4o-mini", "gpt-4.1-mini", "gpt-4.1-nano"]
embeddings = ["text-embedding-3-small", "text-embedding-3-large"]
rag_methods = ["simple", "rerank"]

# Generate all combinations
configurations = list(product(models, embeddings, rag_methods))

# Create a config file for each combination
for model, embedding, rag in configurations:
    # Create the config ID following the convention
    config_id = f"{model}-{embedding}-{rag}"
    
    # Create the config dictionary
    config = {
        "id": config_id,
        "model": model,
        "prompt": "system-prompt-1.txt",  # Using the same prompt file as seen in examples
        "embedding": embedding,
        "rag": rag
    }
    
    # Write to YAML file
    filename = f"configs/{config_id}.yaml"
    with open(filename, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    print(f"Created {filename}")

print(f"\nGenerated {len(configurations)} configuration files")
