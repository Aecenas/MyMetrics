#!/usr/bin/env python3
import argparse
import json


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit a valid digest payload for MyMetrics.")
    parser.add_argument("--count", type=int, default=3, help="Digest item count")
    parser.add_argument("--prefix", default="Headline", help="Digest title prefix")
    parser.add_argument(
        "--body-template",
        default="Summary paragraph for item {index}.",
        help="Body template (supports {index})",
    )
    args = parser.parse_args()

    count = max(1, args.count)
    items = []
    for index in range(1, count + 1):
        items.append(
            {
                "title": f"{args.prefix} {index}",
                "body": args.body_template.format(index=index),
            }
        )

    payload = {
        "type": "digest",
        "data": {
            "items": items,
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
