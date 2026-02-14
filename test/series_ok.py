#!/usr/bin/env python3
import argparse
import json
import math


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit a valid series payload for MyMetrics.")
    parser.add_argument("--points", type=int, default=12, help="Number of x-axis points")
    parser.add_argument("--step", type=float, default=1.0, help="X-axis interval step")
    parser.add_argument(
        "--series-names",
        default="cpu,mem",
        help="Comma-separated series names",
    )
    args = parser.parse_args()

    points = max(2, args.points)
    names = [name.strip() for name in args.series_names.split(",") if name.strip()]
    if not names:
        names = ["series-1"]

    x_axis = [round(index * args.step, 2) for index in range(points)]
    series = []
    for idx, name in enumerate(names):
        values = [round(50 + 30 * math.sin((i / 2.0) + idx), 2) for i in range(points)]
        series.append({"name": name, "values": values})

    payload = {
        "type": "series",
        "data": {
            "x_axis": x_axis,
            "series": series,
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
