#!/usr/bin/env python3
"""
publish_stats.py — bot ke saath usi phone/PC par chalao. Yeh data/stats.json banata hai (sirf SACHI values).

Kya likhta hai:  updated, online, uptime_seconds, servers, tracked_users, commands
Kahan se laata hai:
  servers        -> Discord API (GET /users/@me/guilds?with_counts=true), token SIRF env var SK_BOT_TOKEN se
  tracked_users  -> bot ke SQLite DB se sirf COUNT (read-only), koi naam/ID bahar nahi jaati
  online/uptime  -> check karta hai ki "main.py" process chal raha hai ya nahi
  commands       -> data/commands.json (bot ke code se bana)
Token kabhi file mein nahi likha jaata aur output mein print nahi hota.

Chalane ke tareeke:
  python3 tools/publish_stats.py                 # ek baar stats.json banao
  python3 tools/publish_stats.py --push          # banao + git push (GitHub Pages update)
  python3 tools/publish_stats.py --push --every 10   # har 10 minute repeat
Options: --db PATH  --process main.py  --out data/stats.json
"""
import argparse
import json
import os
import sqlite3
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def discord_guilds(token):
    """-> (server_count, approx_members) or (None, None) on any problem. Never prints the token."""
    if not token:
        return None, None
    after, total, members = None, 0, 0
    for _ in range(50):
        url = "https://discord.com/api/v10/users/@me/guilds?with_counts=true&limit=200" + (f"&after={after}" if after else "")
        req = urllib.request.Request(url, headers={"Authorization": "Bot " + token, "User-Agent": "SK1-site-stats (static site)"})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                page = json.load(r)
        except (urllib.error.URLError, OSError, ValueError) as e:
            print("  ! Discord API error:", type(e).__name__)
            return None, None
        total += len(page)
        members += sum(int(g.get("approximate_member_count") or 0) for g in page)
        if len(page) < 200:
            return total, members
        after = page[-1]["id"]
    return total, members


def tracked_users(db_path):
    if not db_path or not os.path.exists(db_path):
        return None
    try:
        con = sqlite3.connect("file:" + db_path + "?mode=ro", uri=True, timeout=5)
        try:
            return int(con.execute("SELECT COUNT(DISTINCT user_id) FROM users").fetchone()[0])
        finally:
            con.close()
    except sqlite3.Error as e:
        print("  ! DB read error:", type(e).__name__)
        return None


def bot_process(pattern):
    """-> (online, uptime_seconds or None)"""
    try:
        out = subprocess.run(["pgrep", "-f", pattern], capture_output=True, text=True, timeout=10).stdout.split()
    except (OSError, subprocess.SubprocessError):
        return None, None  # cannot tell
    pids = [p for p in out if p != str(os.getpid())]
    if not pids:
        return False, None
    best = None
    for p in pids:
        try:
            s = subprocess.run(["ps", "-o", "etimes=", "-p", p], capture_output=True, text=True, timeout=10).stdout.strip()
            if s.isdigit():
                best = max(best or 0, int(s))
        except (OSError, subprocess.SubprocessError):
            pass
    return True, best


def commands_total():
    try:
        return int(json.load(open(os.path.join(ROOT, "data", "commands.json"), encoding="utf-8"))["total"])
    except (OSError, ValueError, KeyError):
        return None


def build(args):
    online, uptime = bot_process(args.process)
    servers, _members = discord_guilds(os.environ.get("SK_BOT_TOKEN", ""))
    data = {"updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "online": online, "uptime_seconds": uptime,
            "servers": servers, "tracked_users": tracked_users(args.db), "commands": commands_total()}
    return {k: v for k, v in data.items() if v is not None}


def write(data, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    tmp = out + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=1)
    os.replace(tmp, out)


def git_push(out):
    def run(*a):
        return subprocess.run(["git", *a], cwd=ROOT, capture_output=True, text=True, timeout=120)
    run("add", os.path.relpath(out, ROOT))
    if run("diff", "--cached", "--quiet").returncode == 0:
        return print("  (no change to push)")
    c = run("commit", "-m", "stats update")
    p = run("push")
    if p.returncode == 0:
        print("  pushed")
    else:
        err = (p.stderr or c.stderr or "").strip().splitlines()
        print("  ! git push failed:", err[-1] if err else "unknown error")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--db", default=os.environ.get("SK_BOT_DB_PATH", ""))
    ap.add_argument("--process", default="main.py")
    ap.add_argument("--out", default=os.path.join(ROOT, "data", "stats.json"))
    ap.add_argument("--push", action="store_true")
    ap.add_argument("--every", type=int, default=0, help="minutes; 0 = run once")
    args = ap.parse_args()
    if not os.environ.get("SK_BOT_TOKEN"):
        print("Note: SK_BOT_TOKEN not set -> server count will be left out (shown as Unavailable).")
    while True:
        d = build(args)
        write(d, args.out)
        print(time.strftime("%H:%M:%S"), "wrote", os.path.relpath(args.out, ROOT), "->", json.dumps(d))
        if args.push:
            git_push(args.out)
        if args.every <= 0:
            break
        time.sleep(max(1, args.every) * 60)


if __name__ == "__main__":
    sys.exit(main())
