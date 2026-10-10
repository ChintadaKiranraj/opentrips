"""Scores a generated plan against the constraints it was asked for.
This produces the pass-rate number: base model vs the Tinker fine-tune.
"""
import json


def check_plan(plan_json: str, max_budget: float, max_distance_km: float) -> dict:
    try:
        plan = json.loads(plan_json)
    except json.JSONDecodeError:
        return {"valid_json": False, "passed": False}

    days = plan.get("days", [])
    over_distance = any(d.get("distance_km", 0) > max_distance_km for d in days)
    over_budget = plan.get("budget_estimate", 0) > max_budget
    has_packing = len(plan.get("packing", [])) > 0
    has_days = len(days) > 0

    return {
        "valid_json": True,
        "passed": not over_distance and not over_budget and has_packing and has_days,
        "over_distance": over_distance,
        "over_budget": over_budget,
        "has_packing": has_packing,
        "has_days": has_days,
    }


def score_batch(results: list[dict]) -> dict:
    n = len(results)
    if n == 0:
        return {"pass_rate": 0.0, "n": 0}
    passed = sum(1 for r in results if r.get("passed"))
    return {"pass_rate": passed / n, "n": n, "passed": passed}
