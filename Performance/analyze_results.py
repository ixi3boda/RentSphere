#!/usr/bin/env python3
"""Summarize JMeter .jtl results: overall + per-endpoint avg/p90/p95/max, throughput, errors."""
import csv, sys
from collections import defaultdict

def pct(values, p):
    if not values:
        return 0.0
    s = sorted(values)
    k = min(len(s) - 1, int(round((p / 100.0) * (len(s) - 1))))
    return s[k]

def summarize(path):
    per = defaultdict(lambda: {"lat": [], "err": 0, "bytes": 0})
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            try:
                lat = float(row["elapsed"]); ok = row["success"] == "true"
            except (KeyError, ValueError):
                continue
            label = row["label"]
            per[label]["lat"].append(lat)
            per[label]["bytes"] += int(row.get("bytes", 0) or 0)
            if not ok:
                per[label]["err"] += 1
            per["__ALL__"]["lat"].append(lat)
            per["__ALL__"]["err"] += 0 if ok else 1
    ts = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            try:
                ts.append(int(row["timeStamp"]))
            except (KeyError, ValueError):
                pass
    span = (max(ts) - min(ts)) / 1000.0 if len(ts) > 1 else 1.0
    print(f"--- {path} (window {span:.0f}s) ---")
    print(f"{'label':38} {'n':>6} {'avg':>8} {'p90':>8} {'p95':>8} {'max':>9} {'err%':>6} {'req/s':>7}")
    for label in sorted(per):
        d = per[label]
        n = len(d["lat"])
        print(f"{label:38} {n:6d} {sum(d['lat'])/n:8.0f} {pct(d['lat'],90):8.0f} "
              f"{pct(d['lat'],95):8.0f} {max(d['lat']):9.0f} {100.0*d['err']/n:6.2f} {n/span:7.1f}")
    print()

for p in sys.argv[1:]:
    summarize(p)
