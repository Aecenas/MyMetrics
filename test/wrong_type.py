#!/usr/bin/env python3
import argparse
import json


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit payload with configurable type for mismatch testing.")
    parser.add_argument(
        "--actual-type",
        default="status",
        choices=["scalar", "series", "status"],
        help="Payload type to emit",
    )
    args = parser.parse_args()

    if args.actual_type == "scalar":
        payload = {"type": "scalar", "data": {"value": 123}}
    elif args.actual_type == "series":
        payload = {
            "type": "series",
            "data": {"x_axis": ["A", "B"], "series": [{"name": "demo", "values": [1, 2]}]},
        }
    else:
        payload = {"type": "status", "data": {"label": "service-a", "state": "ok"}}

    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
