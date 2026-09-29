#!/usr/bin/env python3
"""ATS evaluation for resume.pdf.

Part 1 — parse test: extract text like an ATS front-end (pdftotext) and verify
         contact details, section headers, and dates are recoverable.
Part 2 — keyword match: fetch LIVE junior/full-stack job postings from public
         ATS APIs (Lever + Greenhouse JSON), extract tech keywords per posting,
         and compute coverage of JD keywords found in the resume text.

Usage: python3 Performance/ats_scan.py
"""
import html
import json
import re
import subprocess
import sys
import urllib.request

RESUME_PDF = "resume.pdf"

KEYWORDS = [
    "java", "spring boot", "spring security", "nestjs", "node.js", "react",
    "next.js", "typescript", "javascript", "html", "css", "tailwind",
    "mysql", "postgresql", "postgres", "sql", "redis", "mongodb",
    "rest", "api", "graphql", "jwt", "oauth", "microservices", "websockets",
    "docker", "kubernetes", "aws", "ec2", "rds", "nginx", "linux", "jenkins",
    "ci/cd", "github", "gitlab", "git", "agile", "scrum", "kafka",
    "junit", "mockito", "jest", "jacoco", "unit test", "testing", "jmeter",
    "load test", "query optimization", "indexing", "hibernate", "jpa",
    "oop", "data structures", "algorithms", "design patterns", "python", "c++",
    "system design", "rbac", "bcrypt", "paypal", "observability", "actuator",
]

BOARDS = [
    ("greenhouse", "stripe"), ("greenhouse", "gitlab"), ("greenhouse", "cloudflare"),
    ("greenhouse", "mongodb"), ("greenhouse", "asana"), ("greenhouse", "datadog"),
    ("greenhouse", "reddit"), ("greenhouse", "coinbase"), ("greenhouse", "airtable"),
    ("greenhouse", "okta"),
]

TITLE_RE = re.compile(r"(junior|intern|full[- ]?stack|new grad)", re.I)
ENG_RE = re.compile(r"(engineer|developer|sde|software)", re.I)
NEG_RE = re.compile(r"(manager|lead|principal|director|internship site)", re.I)


def clean_html(raw):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", html.unescape(raw))))


def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "ats-scan"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if i == retries - 1:
                raise


def get_postings():
    jobs = []
    for kind, board in BOARDS:
        board_jobs = 0
        try:
            if kind == "lever":
                data = fetch(f"https://api.lever.co/v0/postings/{board}?mode=json&limit=100")
                for p in data:
                    if board_jobs >= 2:
                        break
                    if TITLE_RE.search(p.get("text", "")) and ENG_RE.search(p.get("text", "")) and not NEG_RE.search(p.get("text", "")):
                        jobs.append((board, p["text"], clean_html(p.get("descriptionPlain", "") or
                                     p.get("description", ""))))
                        board_jobs += 1
            else:
                data = fetch(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs")
                for p in data.get("jobs", []):
                    if board_jobs >= 2:
                        break
                    if TITLE_RE.search(p.get("title", "")) and ENG_RE.search(p.get("title", "")) and not NEG_RE.search(p.get("title", "")):
                        det = fetch(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{p['id']}")
                        jobs.append((board, det.get("title", ""), clean_html(det.get("content", ""))))
                        board_jobs += 1
        except Exception as e:
            print(f"  ! {board}: {e}", file=sys.stderr)
        if len(jobs) >= 8:
            break
    return jobs[:8]


def main():
    txt = subprocess.run(["pdftotext", "-layout", RESUME_PDF, "-"],
                         capture_output=True, text=True, check=True).stdout
    low = txt.lower()

    print("=" * 62)
    print("PART 1 — ATS PARSE TEST (pdftotext extraction)")
    print("=" * 62)
    checks = {
        "Email address": "abdelrahmanessm508@gmail.com" in low,
        "Phone number": bool(re.search(r"\+?\(?\d{2,3}\)?\s?\d{3}\s?\d{4}", txt)),
        "Name in header": "Abdelrahman Essam" in txt,
        "LinkedIn URL": "linkedin.com/in" in low,
        "GitHub URL": "github.com/" in low,
        "Section: Summary": bool(re.search(r"^\s*Summary", txt, re.M)),
        "Section: Education": bool(re.search(r"^\s*Education", txt, re.M)),
        "Section: Technical Skills": bool(re.search(r"^\s*Technical Skills", txt, re.M)),
        "Section: Experience": bool(re.search(r"^\s*Experience", txt, re.M)),
        "Section: Projects": bool(re.search(r"^\s*Projects", txt, re.M)),
        "Section: Achievements": bool(re.search(r"^\s*Achievements", txt, re.M)),
        "Date ranges (m/yyyy style)": len(re.findall(r"(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}", txt)) >= 6,
        "Employer + role lines": "Full-Stack Software Engineering Intern" in txt,
        "No image-only content (text chars)": len(txt) > 3000,
    }
    passed = sum(checks.values())
    for name, ok in checks.items():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print(f"\n  Parse score: {passed}/{len(checks)} = {100*passed//len(checks)}%")

    print()
    print("=" * 62)
    print("PART 2 — KEYWORD MATCH vs LIVE JOB POSTINGS (public ATS APIs)")
    print("=" * 62)
    jobs = get_postings()
    if not jobs:
        print("  Could not fetch live postings (network/board empty). Skipping.")
        return
    def kw_hits(hay):
        return {k for k in KEYWORDS if re.search(r"(?<!\w)" + re.escape(k) + r"(?!\w)", hay)}

    for board, title, desc in jobs:
        jd_kw = sorted(kw_hits(desc.lower()))
        if len(jd_kw) < 5:
            print(f"\n  {title}  ({board})\n    (JD lists <5 tech keywords: {', '.join(jd_kw) or 'none'})")
            continue
        hit = sorted(kw_hits(low) & set(jd_kw))
        miss = sorted(set(jd_kw) - set(hit))
        cov = 100 * len(hit) / len(jd_kw)
        print(f"\n  {title}  ({board})")
        print(f"    JD tech keywords: {len(jd_kw)} | matched: {len(hit)} | coverage: {cov:.0f}%")
        if miss:
            print(f"    Missing: {', '.join(miss)}")

    print("\nMethod: coverage = JD keywords present in extracted resume text.")
    print("Note: real ATS ranking is employer-side per-req; this mirrors the")
    print("keyword stage most systems (Workday/Greenhouse/Taleo) use.")


if __name__ == "__main__":
    main()
