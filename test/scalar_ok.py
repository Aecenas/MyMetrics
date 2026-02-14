#!/usr/bin/env python3
import argparse
import json
import random


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit a valid scalar payload for MyMetrics.")
    parser.add_argument("--value", type=float, default=42.0, help="Base metric value")
    parser.add_argument("--unit", default="%", help="Metric unit")
    parser.add_argument("--trend", default="up", choices=["up", "down", "flat"], help="Trend field")
    parser.add_argument(
        "--color",
        default="success",
        choices=["success", "warning", "danger", "neutral"],
        help="Color field",
    )
    parser.add_argument("--jitter", type=float, default=0.0, help="Random +/- jitter for value")
    parser.add_argument("--seed", type=int, default=None, help="Optional random seed")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    value = args.value
    if args.jitter > 0:
        value += random.uniform(-args.jitter, args.jitter)

    payload = {
        "type": "scalar",
        "data": {
            "value": round(value, 2),
            "unit": args.unit,
            "trend": args.trend,
            "color": args.color,
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
