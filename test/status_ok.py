#!/usr/bin/env python3
import argparse
import json


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit a valid status payload for MyMetrics.")
    parser.add_argument("--label", default="db-primary", help="Status label")
    parser.add_argument(
        "--state",
        default="ok",
        choices=["ok", "warning", "error", "unknown", "critical", "healthy", "success"],
        help="Status state value (aliases are normalized by frontend)",
    )
    parser.add_argument("--message", default="All checks passed", help="Optional status message")
    args = parser.parse_args()

    payload = {
        "type": "status",
        "data": {
            "label": args.label,
            "state": args.state,
            "message": args.message,
        },
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
