#!/usr/bin/env python3
"""
gen_site_data.py — builds the website's command list FROM THE REAL BOT SOURCE CODE.

It only READS the bot's cogs/*.py files (it never imports or changes them). For every command it records the
name, aliases, description, usage, permissions and whether it is also a slash command. Owner-only commands are
left out of the public list on purpose (only their count is published).

Usage:   python3 tools/gen_site_data.py /path/to/sk_bot            (writes data/commands.js and data/commands.json)
"""
import ast
import json
import os
import sys
import time

# cog class name -> public category (cogs that are not listed here, e.g. Owner*, are NOT published)
CATEGORY = {
    "Moderation": "Moderation", "AutoMod": "AutoMod", "AntiSpam": "AutoMod", "AntiLink": "AutoMod", "ModPlus": "AutoMod",
    "AntiNuke": "Security", "GuardPlus": "Security", "Verification": "Verification",
    "Welcome": "Welcome & Logs", "Logs": "Welcome & Logs",
    "Economy": "Economy & Shop", "Shop": "Economy & Shop", "Trading": "Economy & Shop",
    "Games": "Games & Fun", "Fun": "Games & Fun", "Animals": "Games & Fun", "Social": "Games & Fun",
    "Leveling": "XP, Levels & Missions", "Progress": "XP, Levels & Missions",
    "Roles": "Roles", "Tickets": "Tickets & Applications", "Applications": "Tickets & Applications",
    "Giveaways": "Giveaways", "Community": "Community & Events", "Events": "Community & Events",
    "Invites": "Invite Tracker", "UserInfo": "Info & Utility", "HelpCog": "Info & Utility",
    "Settings": "Server Settings", "Core": "Server Settings", "Dashboard": "Server Settings", "TestMessages": "Server Settings",
}
CATEGORY_ORDER = ["Moderation", "AutoMod", "Security", "Verification", "Welcome & Logs", "Economy & Shop", "Games & Fun",
                  "XP, Levels & Missions", "Roles", "Tickets & Applications", "Giveaways", "Community & Events",
                  "Invite Tracker", "Info & Utility", "Server Settings"]
CATEGORY_OVERRIDE = {"verify": "Verification", "verification": "Verification", "setverifiedrole": "Verification",
                     "setunverifiedrole": "Verification", "verifypanel": "Verification"}
OWNER_CHECKS = {"is_bot_owner", "is_owner"}
PERM_NAMES = {"administrator": "Administrator", "manage_guild": "Manage Server", "manage_messages": "Manage Messages",
              "manage_roles": "Manage Roles", "manage_channels": "Manage Channels", "kick_members": "Kick Members",
              "ban_members": "Ban Members", "moderate_members": "Timeout Members", "manage_events": "Manage Events",
              "manage_nicknames": "Manage Nicknames", "view_audit_log": "View Audit Log", "manage_webhooks": "Manage Webhooks"}
TYPE_WORDS = {"Member": "@user", "User": "@user", "TextChannel": "#channel", "Role": "@role", "int": "number", "float": "number",
              "str": "text", "bool": "on/off", "Message": "message", "Guild": "server"}
SAMPLE = {"@user": "@someone", "#channel": "#general", "@role": "@role", "number": "10", "text": "your text", "on/off": "on", "message": "message", "server": "server"}


def const(node):
    return node.value if isinstance(node, ast.Constant) else None


def deco_info(dec):
    """-> (kind, parent_var, kwargs) if this decorator declares a command, else None."""
    if not isinstance(dec, ast.Call) or not isinstance(dec.func, ast.Attribute):
        return None
    attr = dec.func.attr
    if attr not in ("command", "group", "hybrid_command", "hybrid_group"):
        return None
    base = dec.func.value
    parent = None
    if isinstance(base, ast.Name) and base.id != "commands":
        parent = base.id
    kw = {k.arg: k.value for k in dec.keywords if k.arg}
    return attr, parent, kw


def perms_of(decs):
    perms, owner_only = [], False
    for d in decs:
        name = d.func.attr if isinstance(d, ast.Call) and isinstance(d.func, ast.Attribute) else (
            d.func.id if isinstance(d, ast.Call) and isinstance(d.func, ast.Name) else (d.id if isinstance(d, ast.Name) else ""))
        if name in OWNER_CHECKS:
            owner_only = True
        elif name == "has_permissions" and isinstance(d, ast.Call):
            perms += [PERM_NAMES.get(k.arg, k.arg.replace("_", " ").title()) for k in d.keywords if const(k.value) is True]
        elif name == "is_admin_or_owner":
            perms.append("Administrator")
        elif name == "invite_admin":
            perms.append("Manage Server")
    return perms, owner_only


def params_of(fn):
    a = fn.args
    pos = [x for x in a.args][2:]                                   # drop self, ctx
    defaults = [None] * (len(pos) - len(a.defaults)) + list(a.defaults)
    items = [(x, d is not None, False) for x, d in zip(pos, defaults)]
    items += [(x, d is not None, True) for x, d in zip(a.kwonlyargs, a.kw_defaults)]
    out = []
    for x, optional, rest in items:
        ann = ast.unparse(x.annotation) if x.annotation is not None else "str"
        last = ann.split(".")[-1].split("[")[0].strip("'\"")
        out.append({"name": x.arg, "type": TYPE_WORDS.get(last, "text"), "optional": optional, "rest": rest})
    return out


def usage_for(qualified, params, prefix="!"):
    parts = [prefix + qualified]
    example = [prefix + qualified]
    for p in params:
        label = p["name"].replace("_", " ")
        parts.append(f"[{label}]" if p["optional"] else f"<{label}>")
        if not p["optional"]:
            example.append("spamming" if p["name"] in ("reason", "text", "message") else SAMPLE.get(p["type"], "value"))
    return " ".join(parts), " ".join(example)


def scan(cogs_dir):
    raw = []
    for fname in sorted(os.listdir(cogs_dir)):
        if not fname.endswith(".py") or fname.startswith("_"):
            continue
        tree = ast.parse(open(os.path.join(cogs_dir, fname), encoding="utf-8").read())
        for cls in [n for n in tree.body if isinstance(n, ast.ClassDef)]:
            if not any("Cog" in ast.unparse(b) for b in cls.bases):
                continue
            hidden_cog = any(k.arg == "command_attrs" for k in getattr(cls, "keywords", []))
            for fn in cls.body:
                if not isinstance(fn, (ast.AsyncFunctionDef, ast.FunctionDef)):
                    continue
                for dec in fn.decorator_list:
                    info = deco_info(dec)
                    if not info:
                        continue
                    kind, parent_var, kw = info
                    name = const(kw.get("name")) or fn.name
                    aliases = [const(e) for e in kw["aliases"].elts] if isinstance(kw.get("aliases"), ast.List) else []
                    desc = const(kw.get("description")) or (ast.get_docstring(fn) or "").strip().split("\n")[0]
                    perms, owner_only = perms_of(fn.decorator_list)
                    raw.append({"file": fname, "cog": cls.name, "func": fn.name, "name": name, "aliases": aliases, "desc": desc,
                                "kind": kind, "parent_var": parent_var, "perms": perms, "owner_only": owner_only or hidden_cog or const(kw.get("hidden")) is True,
                                "hybrid": kind.startswith("hybrid"), "params": params_of(fn), "is_group": kind.endswith("group")})
    # resolve groups (function name -> qualified name) in file order
    qual = {}
    by_func = {(r["file"], r["func"]): r for r in raw}
    for r in raw:
        r["qualified"] = r["name"]
    changed = True
    while changed:
        changed = False
        for r in raw:
            if r["parent_var"]:
                parent = by_func.get((r["file"], r["parent_var"]))
                if parent is not None:
                    q = parent["qualified"] + " " + r["name"]
                    if q != r["qualified"]:
                        r["qualified"] = q
                        changed = True
    for r in raw:                                                   # subcommands inherit the group's permissions / owner-only flag
        p = by_func.get((r["file"], r["parent_var"])) if r["parent_var"] else None
        hops = 0
        while p is not None and hops < 5:
            r["perms"] = sorted(set(r["perms"]) | set(p["perms"]))
            r["owner_only"] = r["owner_only"] or p["owner_only"]
            p = by_func.get((p["file"], p["parent_var"])) if p["parent_var"] else None
            hops += 1
    return raw


def build(bot_dir):
    raw = scan(os.path.join(bot_dir, "cogs"))
    public, owner_n = [], 0
    seen = set()
    for r in raw:
        if r["owner_only"]:
            owner_n += 1
            continue
        cat = CATEGORY_OVERRIDE.get(r["qualified"]) or CATEGORY.get(r["cog"])
        if cat is None or r["qualified"] in seen:
            continue
        seen.add(r["qualified"])
        usage, example = usage_for(r["qualified"], r["params"])
        if r["is_group"] and not r["params"]:
            usage = "!" + r["qualified"]
        desc = r["desc"] or ((f"Sub-command of !{r['qualified'].rsplit(' ', 1)[0]}." if " " in r["qualified"] else "—"))
        public.append({"name": r["qualified"], "category": cat, "description": desc, "aliases": r["aliases"],
                       "usage": usage, "example": example, "permissions": r["perms"] or ["Everyone"], "slash": r["hybrid"],
                       "group": r["is_group"]})
    public.sort(key=lambda c: (CATEGORY_ORDER.index(c["category"]), c["name"]))
    cats = [{"name": n, "count": sum(1 for c in public if c["category"] == n)} for n in CATEGORY_ORDER]
    return {"generated": time.strftime("%Y-%m-%d", time.gmtime()), "default_prefix": "!", "name_prefix": "sk ",
            "total": len(public), "slash_total": sum(1 for c in public if c["slash"]), "owner_only_hidden": owner_n,
            "categories": [c for c in cats if c["count"]], "commands": public}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    data = build(sys.argv[1])
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
    os.makedirs(out, exist_ok=True)
    json.dump(data, open(os.path.join(out, "commands.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(os.path.join(out, "commands.js"), "w", encoding="utf-8") as f:
        f.write("/* AUTO-GENERATED by tools/gen_site_data.py from the bot's source code. Do not edit by hand. */\n")
        f.write("window.SK_COMMANDS = " + json.dumps(data, ensure_ascii=False) + ";\n")
    print(f"commands: {data['total']} public ({data['slash_total']} also slash), {data['owner_only_hidden']} owner-only hidden")
    for c in data["categories"]:
        print(f"  {c['name']}: {c['count']}")
