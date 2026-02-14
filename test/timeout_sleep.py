#!/usr/bin/env python3
import argparse
import json
import time


def main() -> None:
    parser = argparse.ArgumentParser(description="Sleep then emit scalar payload (for timeout test).")
    parser.add_argument("--sleep", type=float, default=15.0, help="Seconds to sleep before output")
    args = parser.parse_args()

    time.sleep(max(0.0, args.sleep))

    payload = {
        "type": "scalar",
        "data": {
            "value": 1,
            "unit": "s",
            "trend": "flat",
            "color": "neutral",
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
