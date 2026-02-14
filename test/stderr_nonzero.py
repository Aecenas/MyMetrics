#!/usr/bin/env python3
import argparse
import json
import sys


def main() -> None:
    parser = argparse.ArgumentParser(description="Write stderr and exit with non-zero code.")
    parser.add_argument("--code", type=int, default=2, help="Exit code")
    parser.add_argument("--stderr", default="simulated script failure", help="stderr content")
    parser.add_argument(
        "--emit-json",
        action="store_true",
        help="Emit valid JSON to stdout before failing (used to confirm non-zero still fails)",
    )
    args = parser.parse_args()

    if args.emit_json:
        payload = {"type": "scalar", "data": {"value": 999, "unit": "x"}}
        print(json.dumps(payload, ensure_ascii=False))

    sys.stderr.write(args.stderr + "\n")
    sys.exit(args.code)


if __name__ == "__main__":
    main()
