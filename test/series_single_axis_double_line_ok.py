#!/usr/bin/env python3
import argparse
import json
import math


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Emit a two-line series payload with close ranges (single-axis double-line)."
    )
    parser.add_argument("--points", type=int, default=24, help="Number of x-axis points")
    parser.add_argument("--step", type=float, default=1.0, help="X-axis interval step")
    parser.add_argument("--line-a-name", default="throughput", help="Primary line name")
    parser.add_argument("--line-b-name", default="latency", help="Secondary line name")
    parser.add_argument("--base-a", type=float, default=52.0, help="Primary line base value")
    parser.add_argument("--amp-a", type=float, default=14.0, help="Primary line amplitude")
    parser.add_argument("--base-b", type=float, default=60.0, help="Secondary line base value")
    parser.add_argument("--amp-b", type=float, default=18.0, help="Secondary line amplitude")
    args = parser.parse_args()

    points = max(2, args.points)
    x_axis = [round(index * args.step, 2) for index in range(points)]

    values_a = [round(args.base_a + args.amp_a * math.sin(i / 2.4), 2) for i in range(points)]
    values_b = [round(args.base_b + args.amp_b * math.sin((i / 2.1) + 0.9), 2) for i in range(points)]

    payload = {
        "type": "series",
        "data": {
            "x_axis": x_axis,
            "series": [
                {"name": args.line_a_name, "values": values_a},
                {"name": args.line_b_name, "values": values_b},
            ],
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
