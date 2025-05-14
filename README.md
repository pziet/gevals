# gevals: Granola eval framework 🚀

Framework designed for comparing different configurations of prompts, embedding functions, and RAG methods. Here is a [1min demo](https://youtu.be/VqZRHs8NRJw).

### Approach

* Extract the first 21 minutes from the [*Conversations with Tyler* podcast](https://youtu.be/U1ZMmKMMHgQ?si=PYEgcZBfCfVzW5g7) featuring Jack Clark and overlay it with [indistinct chatter](https://youtu.be/50bYnrmaTfE?si=ldJUkdMrNdgXP5me) at varying audio levels using `ffmpeg`.
* [Transcribe](https://github.com/pziet/gevals/blob/main/packages/core/src/data-pipeline/transcribe.ts) generated `.mp3` files with OpenAI’s Speech-to-Text [model](https://platform.openai.com/docs/guides/speech-to-text).
* Run evaluation configs to measure latency, cost, and accuracy via a critic LLM, comparing generated "Enhanced Notes" to an authored ["Gold Standard"](https://github.com/pziet/gevals/blob/main/data/cwt/gold_standard.txt).

### Features

* **Configurable Evaluations**: Easily test and compare different prompt-engineering approaches, embedding techniques, and RAG pipelines with respect to cost, latency and LLM critics.
* **Data fly wheel**: Automated creation of conversational audio datasets with overlay of indistinct chatter.
* **Efficient Processing**: Utilizes parallel processing through a BullMQ worker queue with Redis for scalability.

### Tech Stack

* **TypeScript Monorepo** for streamlined development and modularity.
* **CLI Tool** for simple interaction and execution.
* **ffmpeg + yt-dlp** to automate `.mp3` data generation.
* **BullMQ + Redis** for efficient job queue management.
* **Docker** for consistent and quick environment setup.

### Post-mortem

* **Data**: Speech-to-text models performed robustly; however, increased data diversity would further enhance reliability. Creating a synthetic data pipeline with varied backgrounds (noise, accents) could improve the robustness of future evaluations.
* **Models**: The `gpt-4.1-nano` model shows remarkable performance across multiple tasks.
* **CI/CD**: Initial setup of GitHub Actions for regression detection was started. Ensuring precise environmental consistency remains challenging and requires careful handling.

## Quickstart 🚀

<details>
<summary>Setup & Usage Instructions</summary>

### Prerequisites

Before you begin, ensure you have Node.js (v18 or higher), pnpm (v9.0.0), Docker, and ffmpeg installed on your system. Docker must be running and your user should have the necessary permissions to execute Docker commands. If you're using Linux, you may need to add your user to the docker group and log out and back in for the changes to take effect.

### Installation

```bash
git clone https://github.com/yourname/gevals.git
cd gevals
chmod +x ./scripts/bootstrap.sh
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
