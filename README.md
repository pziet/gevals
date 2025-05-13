# gevals: Granola eval framework 🚀

Framework designed for comparing different configurations of prompts, embedding functions, and RAG methods.

[<1min demo]()

### Features

* **Configurable Evaluations**: Easily test and compare different prompt-engineering approaches, embedding techniques, and RAG pipelines with respect to cost, latency and LLM critics.
* **Data fly wheel**: Automated creation of conversational audio datasets with optional overlay of indistinct chatter.
* **Efficient Processing**: Utilizes parallel processing through a BullMQ worker queue with Redis for scalability.

### Tech Stack

* **TypeScript Monorepo** for streamlined development and modularity.
* **CLI Tool** for simple interaction and execution.
* **ffmpeg + yt-dlp** to automate `.mp3` data generation.
* **BullMQ + Redis** for efficient job queue management.
* **Docker** for consistent and quick environment setup.

## Quickstart 🚀

<details>
<summary>Setup & Usage Instructions</summary>

### Installation

```bash
git clone https://github.com/yourname/gevals.git
cd gevals
./scripts/bootstrap.sh
pnpm dev
```

### CLI Commands

**Launch Dashboard:**

```bash
gevals display
```

Opens a browser-based leaderboard with interactive plots for evaluation results.

**Run Evaluations:**

```bash
# Run evaluations (ensure worker is running with `pnpm worker:dev`)
gevals run .  # Run all configurations
gevals run configs/{model}-{embedding}-{rag}.yaml  # Run specific configuration
```

**Generate Synthetic Data:**

```bash
gevals data <conversation_url> --chatter <chatter_url> --levels 3
```

Generates `.mp3` conversational audio with indistinct chatter overlays from provided YouTube links.

</details>
