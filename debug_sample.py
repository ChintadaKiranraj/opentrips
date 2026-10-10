"""Quick look at what the tuned checkpoint actually outputs, to diagnose
whether it's garbage, near-miss JSON, or just undertrained."""
import asyncio
import sys

from dotenv import load_dotenv
import tinker
from tinker import types

load_dotenv()
BASE_MODEL = "Qwen/Qwen3-8B"


async def main():
    checkpoint_path = sys.argv[1]
    service_client = tinker.ServiceClient()
    training_client = await service_client.create_lora_training_client_async(base_model=BASE_MODEL, rank=16)
    tokenizer = training_client.get_tokenizer()
    sampling_client = await service_client.create_sampling_client_async(model_path=checkpoint_path)

    prompt = "beginner, bad ankle, 1 day, from Shimla, budget 2000 rupees, wants a viewpoint"
    prompt_tokens = tokenizer.encode(prompt)
    result = await sampling_client.sample_async(
        prompt=types.ModelInput.from_ints(prompt_tokens),
        num_samples=1,
        sampling_params=types.SamplingParams(max_tokens=400, temperature=0.3),
    )
    text = tokenizer.decode(result.sequences[0].tokens, skip_special_tokens=True)
    print("RAW OUTPUT:")
    print(repr(text))


if __name__ == "__main__":
    asyncio.run(main())
