"""Evidence script: samples the base model and the fine-tuned checkpoint
on held-out requests (not in plan_examples.jsonl), scores both with
rule_checker, and reports the pass-rate gap. This is the Tinker number
for the write-up.
"""
import asyncio
import sys

from dotenv import load_dotenv
import tinker
from tinker import types

from prompt_format import extract_first_json, wrap_prompt
from rule_checker import check_plan, score_batch

load_dotenv()

BASE_MODEL = "Qwen/Qwen3-8B"

# Held-out requests: not used in training, each with its own constraint caps
# to check against (max_budget, max_distance_km).
TEST_REQUESTS = [
    {"prompt": "beginner, bad ankle, 1 day, from Shimla, budget 2000 rupees, wants a viewpoint",
     "max_budget": 2000, "max_distance_km": 6},
    {"prompt": "intermediate, no constraints, 2 days, from Boulder, budget 60 dollars, wants a real climb",
     "max_budget": 60, "max_distance_km": 15},
    {"prompt": "beginner, elderly parent, half day, from Chennai, budget 1000 rupees, wants shade and quiet",
     "max_budget": 1000, "max_distance_km": 3},
    {"prompt": "advanced, no constraints, 2 days, from Innsbruck, budget 80 euros, wants alpine terrain",
     "max_budget": 80, "max_distance_km": 20},
    {"prompt": "beginner, asthma, half day, from Hyderabad, budget 1200 rupees, wants fresh air not crowds",
     "max_budget": 1200, "max_distance_km": 4},
    {"prompt": "intermediate, group of 3, 1 day, from Vancouver, budget 40 dollars, wants forest and a lake",
     "max_budget": 40, "max_distance_km": 12},
    {"prompt": "beginner, toddler along, half day, from Jaipur, budget 800 rupees, wants shade",
     "max_budget": 800, "max_distance_km": 2},
    {"prompt": "advanced, no constraints, 3 days, from La Paz, budget 150 dollars, wants a high altitude trek",
     "max_budget": 150, "max_distance_km": 40},
    {"prompt": "beginner, bad back, half day, from Goa, budget 1000 rupees, wants coastal walk not climbing",
     "max_budget": 1000, "max_distance_km": 5},
    {"prompt": "intermediate, no constraints, 2 days, from Banff, budget 90 cad, wants mountain lakes",
     "max_budget": 90, "max_distance_km": 18},
]


async def sample(service_client, tokenizer, label, prompt, **sampling_client_kwargs):
    sampling_client = await service_client.create_sampling_client_async(**sampling_client_kwargs)
    prompt_tokens = tokenizer.encode(wrap_prompt(prompt))
    result = await sampling_client.sample_async(
        prompt=types.ModelInput.from_ints(prompt_tokens),
        num_samples=1,
        sampling_params=types.SamplingParams(max_tokens=400, temperature=0.3),
    )
    raw = tokenizer.decode(result.sequences[0].tokens, skip_special_tokens=True)
    return extract_first_json(raw)


async def main():
    checkpoint_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not checkpoint_path:
        print("Usage: python compare_plans.py <checkpoint-path-from-train_plan_model.py>")
        return

    service_client = tinker.ServiceClient()
    training_client = await service_client.create_lora_training_client_async(
        base_model=BASE_MODEL, rank=16
    )
    tokenizer = training_client.get_tokenizer()

    base_results, tuned_results = [], []
    for req in TEST_REQUESTS:
        base_text = await sample(service_client, tokenizer, "base", req["prompt"], base_model=BASE_MODEL)
        tuned_text = await sample(service_client, tokenizer, "tuned", req["prompt"], model_path=checkpoint_path)

        base_results.append(check_plan(base_text, req["max_budget"], req["max_distance_km"]))
        tuned_results.append(check_plan(tuned_text, req["max_budget"], req["max_distance_km"]))

        print(f"\nPrompt: {req['prompt']}")
        print(f"  base passed={base_results[-1]['passed']}  tuned passed={tuned_results[-1]['passed']}")

    print("\n=== RESULTS ===")
    print("Base model:   ", score_batch(base_results))
    print("Fine-tuned:   ", score_batch(tuned_results))


if __name__ == "__main__":
    asyncio.run(main())
