"""Fine-tunes Qwen3-8B on Tinker to turn a messy trip request into a strict
JSON plan + packing list. Same LoRA SFT pattern used for mentor-me:
tokenize prompt+completion, zero loss weight on the prompt tokens, train,
save a sampler checkpoint.
"""
import asyncio
import json
import random

from dotenv import load_dotenv
import tinker
from tinker import types

from prompt_format import wrap_prompt

load_dotenv()

BASE_MODEL = "Qwen/Qwen3-8B"
DATA_PATH = "plan_examples.jsonl"
CHECKPOINT_NAME = "opentrips-plan-v1"
N_EPOCHS = 20
LEARNING_RATE = 1e-4


def load_examples(path):
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def build_datum(tokenizer, prompt: str, completion: str) -> types.Datum:
    prompt_tokens = tokenizer.encode(wrap_prompt(prompt))
    completion_tokens = tokenizer.encode(completion)
    full_sequence = prompt_tokens + completion_tokens
    n_prefix = len(prompt_tokens) - 1
    return types.Datum(
        model_input=types.ModelInput.from_ints(full_sequence[:-1]),
        loss_fn_inputs={
            "weights": tinker.TensorData(
                data=[0.0] * n_prefix + [1.0] * len(completion_tokens),
                dtype="float32",
            ),
            "target_tokens": tinker.TensorData(data=full_sequence[1:], dtype="int64"),
        },
    )


async def unwrap(value):
    """save_weights_for_sampler_async (and similar) resolve to another
    awaitable future rather than the final result directly."""
    if hasattr(value, "result_async"):
        return await value
    return value


async def main():
    service_client = tinker.ServiceClient()
    training_client = await service_client.create_lora_training_client_async(
        base_model=BASE_MODEL, rank=16
    )
    tokenizer = training_client.get_tokenizer()

    examples = load_examples(DATA_PATH)
    print(f"Training on {len(examples)} trip-plan examples for {N_EPOCHS} epochs...")

    for epoch in range(N_EPOCHS):
        shuffled = examples[:]
        random.shuffle(shuffled)
        data = [build_datum(tokenizer, ex["prompt"], ex["completion"]) for ex in shuffled]

        fb_result = await training_client.forward_backward_async(data=data, loss_fn="cross_entropy")
        fb_result = await unwrap(fb_result)
        await training_client.optim_step_async(types.AdamParams(learning_rate=LEARNING_RATE))

        loss = getattr(fb_result, "loss", None)
        print(f"  epoch {epoch + 1}/{N_EPOCHS}" + (f"  loss={loss:.4f}" if loss is not None else ""))

    checkpoint = await training_client.save_weights_for_sampler_async(name=CHECKPOINT_NAME)
    checkpoint = await unwrap(checkpoint)
    print(f"Saved fine-tuned checkpoint: {checkpoint.path}")
    print("Paste this path into main.py's sampling_client line, and into compare_plans.py")


if __name__ == "__main__":
    asyncio.run(main())
