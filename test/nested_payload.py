#!/usr/bin/env python3
import json


payload = {
    "type": "scalar",
    "data": {
        "metrics": {
            "cpu": {
                "value": 67.8,
                "unit": "%",
                "trend": "up",
                "color": "warning",
            }
        },
        "meta": {
            "host": "local-dev",
            "region": "home-lab",
        },
    },
}

print(json.dumps(payload, ensure_ascii=False))
