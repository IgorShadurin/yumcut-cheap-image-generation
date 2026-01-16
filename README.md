# YumCut Cheap Image Generator.

[YumCut](https://yumcut.com) is an AI-powered short video generation service available on the web and via the iOS mobile app.  
This tool is part of [YumCut](https://yumcut.com) and is used to speed up low-level image generation tasks inside the larger pipeline.

Includes optional OpenRouter prompt improvement to make prompts more detailed before rendering.
If you want to generate an image easily from the web, use [yumcut.com](https://yumcut.com).

---

Generate **two images in one Runware call** by rendering a single dual-panel image and splitting it into left/right halves. This makes image generation **~2x cheaper** (two outputs for roughly the cost of one request) when the split layout is acceptable.

This script sends a single Runware request that includes a **template image** (red/blue split marker) to guide the left/right layout, then splits the response into two files.
Prompts are capped at 1900 characters to satisfy Runware limits.

## Setup

```bash
npm install
```

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required env vars:
- `RUNWARE_API_KEY`
- `OPENROUTER_API_KEY` (only if you use `--improve`)

## Scripts

- `npm run image:runware:dual` - generate a 2-up image and split into two images
- `npm run image:runware:single` - prompt enhancement (OpenRouter) -> Runware single image
- `npm run prompt:improve` - improve a prompt via OpenRouter

You can also run directly with `tsx`.

## Usage

### 1) Dual image generation (cheaper 2x)

```bash
npm run image:runware:dual -- \
  --left="Spider-Man" \
  --right="Batman" \
  --size=1024x1024 \
  --out-dir=./output/demo
```

Outputs:
- `dual.jpg` (the combined image)
- `left.jpg` and `right.jpg` (split halves)
- `metadata.json` (prompts and settings)

By default it uses `assets/templates/red_blue_split-2-images.png`. You can override:

```bash
npm run image:runware:dual -- \
  --left="A tiny astronaut watering plants" \
  --right="A serene desert sunrise" \
  --template-image=./my-template.png \
  --out-dir=./output/custom-template
```

### 2) Single image generation with prompt improvement (OpenRouter -> Runware)

This pipeline improves your prompt via OpenRouter, saves the improved text, then renders one image via Runware.
It also saves intermediate files so you can verify the exact prompt and request payload used.

```bash
npm run image:runware:single -- \
  --prompt="Spider-Man swinging between skyscrapers at sunset" \
  --size=1024x1024 \
  --out-dir=./output/single-demo
```

Saved files in the output folder:
- `prompt.txt`
- `prompt-improved.txt` (if improvement is enabled)
- `runware-request.json`
- `runware-response.json`
- `image.jpg`

If you provide a reference image, the tool will use Qwen Image Edit (`runware:108@20`):

```bash
npm run image:runware:single -- \
  --prompt="A cinematic portrait with soft rim light" \
  --reference-image=./input/character.png \
  --size=1024x1024 \
  --out-dir=./output/single-edit
```

### 3) Dual image generation with prompt improvement

```bash
npm run image:runware:dual -- \
  --left="A tiny astronaut watering plants" \
  --right="A serene desert sunrise" \
  --improve \
  --out-dir=./output/improved
```

### 4) Prompt improvement only

```bash
npm run prompt:improve -- \
  --prompt="A futuristic city skyline at dusk" \
  --output=./output/improved-prompt.txt
```

## Notes

- The \"2x cheaper\" claim comes from **one Runware call producing two usable images** (left/right halves).
- Prompt improvement calls OpenRouter and costs extra; use `--no-improve` (default) if you want cheapest rendering.
- All core helpers are exported under `src/` for reuse.
