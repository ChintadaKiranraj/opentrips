"""Single source of truth for how a trip request is wrapped before going to
the plan model. Used by training, eval, and the live API, so there's never
a mismatch between what the model was trained on and what it's asked at
inference time.
"""

INSTRUCTION = (
    "Output ONLY a JSON trip plan for this request, no explanation, "
    "no reasoning, no markdown fences. Request: "
)


def wrap_prompt(request_text: str) -> str:
    return f"{INSTRUCTION}{request_text}"
