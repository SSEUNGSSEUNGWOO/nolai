// ComfyUI(로컬 :8188)로 그림을 뽑는다. Qwen-Image-Edit-2511 GGUF + Lightning 8step.
// 실행: node tools/art/gen.js <이름> "<프롬프트>" [참조이미지경로] [seed] [가로x세로]
// 참조 이미지를 주면 편집 모드(그 그림을 바탕으로), 없으면 생성 모드다.
// 결과는 tools/art/out/<이름>-<seed>.png 에 떨어진다.
const fs = require("fs");
const path = require("path");

const HOST = "http://127.0.0.1:8188";
const [name, prompt, ref, seedArg, sizeArg] = process.argv.slice(2);
if (!name || !prompt) { console.error("사용법: gen.js <이름> <프롬프트> [참조] [seed] [WxH]"); process.exit(1); }
const seed = Number(seedArg ?? 1);
const [W, H] = (sizeArg ?? "1024x1024").split("x").map(Number);

// 앱 UI가 이미 가진 언어를 그림에도 그대로 쓴다. 모든 프롬프트 앞에 붙는다.
const STYLE = "flat vector sticker illustration for a children's app, thick dark navy outline (#1f2430), bold simple rounded shapes, candy colors (coral red #ff6b6b, mint teal #4ecdc4, sunny yellow #ffd93d), soft cream background (#fff3d6), centered, clean, no text, no watermark";

async function upload(file) {
  const form = new FormData();
  form.append("image", new Blob([fs.readFileSync(file)]), path.basename(file));
  form.append("overwrite", "true");
  const r = await fetch(`${HOST}/upload/image`, { method: "POST", body: form });
  return (await r.json()).name;
}

async function main() {
  const g = {
    unet: { class_type: "UnetLoaderGGUF", inputs: { unet_name: "qwen-image-edit-2511-Q4_K_M.gguf" } },
    lora: { class_type: "LoraLoaderModelOnly", inputs: { model: ["unet", 0], lora_name: "Qwen-Image-Edit-2511-Lightning-8steps-V1.0-bf16.safetensors", strength_model: 1.0 } },
    shift: { class_type: "ModelSamplingAuraFlow", inputs: { model: ["lora", 0], shift: 3.0 } },
    clip: { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image", device: "default" } },
    vae: { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
    pos: { class_type: "TextEncodeQwenImageEditPlus", inputs: { clip: ["clip", 0], vae: ["vae", 0], prompt: `${STYLE}. ${prompt}` } },
    neg: { class_type: "TextEncodeQwenImageEditPlus", inputs: { clip: ["clip", 0], vae: ["vae", 0], prompt: "blurry, photo, realistic, 3d render, gradient shading, text, letters, watermark, extra limbs, deformed" } },
    latent: { class_type: "EmptySD3LatentImage", inputs: { width: W, height: H, batch_size: 1 } },
    sample: { class_type: "KSampler", inputs: { model: ["shift", 0], positive: ["pos", 0], negative: ["neg", 0], latent_image: ["latent", 0], seed, steps: 8, cfg: 1.0, sampler_name: "euler", scheduler: "simple", denoise: 1.0 } },
    decode: { class_type: "VAEDecode", inputs: { samples: ["sample", 0], vae: ["vae", 0] } },
    save: { class_type: "SaveImage", inputs: { images: ["decode", 0], filename_prefix: `nolai/${name}` } },
  };
  if (ref) {
    const uploaded = await upload(ref);
    g.load = { class_type: "LoadImage", inputs: { image: uploaded } };
    g.pos.inputs.image1 = ["load", 0];
    g.neg.inputs.image1 = ["load", 0];
    // 편집은 빈 latent가 아니라 참조 그림에서 출발한다. 빈 latent로 시작하면 캐릭터는 따라가도 배경이 노이즈로 깨진다.
    g.latent = { class_type: "VAEEncode", inputs: { pixels: ["load", 0], vae: ["vae", 0] } };
  }

  const t0 = Date.now();
  const r = await fetch(`${HOST}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: g }) });
  const { prompt_id, error, node_errors } = await r.json();
  if (error) { console.error(error, JSON.stringify(node_errors)); process.exit(1); }

  for (;;) {
    await new Promise((res) => setTimeout(res, 1500));
    const h = await (await fetch(`${HOST}/history/${prompt_id}`)).json();
    const done = h[prompt_id];
    if (!done) continue;
    if (done.status?.status_str === "error") { console.error(JSON.stringify(done.status.messages)); process.exit(1); }
    const img = done.outputs.save.images[0];
    const bin = await (await fetch(`${HOST}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder)}&type=output`)).arrayBuffer();
    const out = path.join(__dirname, "out", `${name}-${seed}.png`);
    fs.writeFileSync(out, Buffer.from(bin));
    console.log(`${out}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    return;
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
