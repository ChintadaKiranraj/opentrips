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


def extract_first_json(text: str) -> str:
    """The plan model sometimes doesn't emit a stop token and repeats its
    answer until hitting the token limit. Returns just the first balanced
    {...} object instead of the whole repeated stream.
    """
    start = text.find("{")
    if start == -1:
        return text
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]
    return text[start:]
