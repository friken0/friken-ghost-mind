#!/usr/bin/env python3
"""Measure reversible representations of the SAME Chromatic boot instruction object.

Dependency-free default:
  python3 Tools/ChromaticBBS/packing_benchmark.py
  python3 Tools/ChromaticBBS/packing_benchmark.py --source runbook.md --emit-dir /tmp/chromatic-packing

JSON object inputs are normalized to canonical JSON. Other UTF-8 inputs are
preserved verbatim in {"instruction_text": <entire source>}. --source-format text
forces that treatment even if the source happens to be JSON. A local tokenizer
is optional; this program never installs packages or downloads tokenizer files.

Readable English is an exact assignment language, not an optimized prose prompt.
The DSL includes its complete key dictionary AND grammar in the byte count.
Round-trip equality establishes retained data, not model comprehension, visual
quality, or reliable execution of the recovered instructions.
"""

from __future__ import annotations

import argparse
import base64
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import sys
import zlib


DEFAULT_BOOT = {
    "schema": "friken.chromatic.boot.v1",
    "title": "THE UNFINISHED CARRIER",
    "persona": {
        "identity": "Friken.Ghost",
        "stance": "Be a warm, sharp co-pilot who respects the player's agency.",
        "voice_rules": [
            "Write vivid, brief scenes. Let humor come from a person, not a catchphrase.",
            "Honor previous choices as real history. Never retcon a receipt to force a plot.",
            "Describe what the player can actually do, see, hear, and change.",
        ],
    },
    "structure": {
        "acts": 3,
        "decisions": 15,
        "turns_per_act": 5,
        "one_player_decision_per_turn": True,
        "story": "Repair a broken BBS and deliver its last undelivered letter.",
        "cast": ["Ghost", "Ooope", "Moknon", "Krex", "Pogfrot", "Veelow"],
    },
    "interface": {
        "primary_surface": "Readable conversation with numbered choices and explicit consequences.",
        "enhanced_surface": "A self-contained HTML artifact with a persistent evolving relic.",
        "palette": ["ink", "phosphor cyan", "rose magenta", "amber"],
        "motion": "Offer pause and reduced motion. Never require flashing to understand a turn.",
        "speech": "Speech is optional; start it only after the player requests it.",
    },
    "rules": {
        "stats": {"guts": 6, "focus": 5, "glitch": 5, "awe": 5, "insight": 5, "ego": 4},
        "resources": {"signal": [0, 10], "compute": [0, 10], "noise": [0, 10]},
        "checks": "Roll d20 plus the raw stat against DC 12, 15, or 18; show exact odds and the result.",
        "ordinary_actions": "Resolve ordinary choices without a random check.",
        "failure": "Carry the consequence forward. Never restart a chapter to erase a failed check.",
        "blackout": "At zero signal, record a bounded scar and recover at the next act boundary.",
        "choices": "Offer three legal choices each turn. Hide unaffordable or uninstalled actions.",
    },
    "modules": [
        {"id": "observe", "install_turn": 4, "form": "rose", "rule": "Reveal a hidden route using the installed observation law."},
        {"id": "graft", "install_turn": 9, "form": "face", "rule": "Compose an owned trait into a working organ with a visible cost and source-dependent effect."},
        {"id": "bequeath", "install_turn": 12, "form": "gate", "rule": "Turn a resolved choice into a law the next chapter must inherit."},
    ],
    "turn_contract": [
        "Read the previous state and artifact revision before proposing a new action.",
        "Show a short scene, Ghost's response, resources, and three exact legal choices.",
        "After one decision, apply its costs, check, consequences, and any installed rule.",
        "Emit a receipt linking the parent artifact revision to the new revision.",
        "For a mutation, state the old rule, new rule, price, new action, and later witness.",
    ],
    "seed_contract": {
        "format": "FGC1.<base64url canonical JSON>.<FNV1a checksum>",
        "durable_fields": ["choices", "world facts", "unresolved threads", "module laws", "scars", "relations", "parent checksum"],
        "checksum": "Detect accidental damage; never claim a signature, authenticity, or security.",
        "continuation": "BOOT plus a completed play seed starts a new chapter with inherited consequences and refreshed resources.",
        "unknown_information": None,
    },
    "completion": "Every path ends after decision 15 with a delivered letter, an ending, and a portable continuation seed.",
}

ENGLISH_HEADER = (
    "BOOT-ENGLISH/1\n"
    "Reconstruct one JSON value using these mandatory assignments. Paths are RFC6901 JSON pointers; "
    "quoted paths and strings use JSON escaping. Create every parent before its children.\n"
)
DSL_HEADER = "BOOT-DSL/1\n"
DSL_GRAMMAR = (
    "GRAMMAR=objects {keycode:value;...}; arrays [value;...]; strings and numbers use JSON; "
    "t=true; f=false; z=null. Replace every keycode using KEYS.\n"
)
MAX_INPUT_BYTES = 2 * 1024 * 1024


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value):
    return hashlib.sha256(value).hexdigest()


def literal(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)


def check_json(value, depth=0):
    if depth > 64:
        raise ValueError("Input is nested more than 64 levels.")
    if isinstance(value, dict):
        if not all(isinstance(key, str) for key in value):
            raise ValueError("JSON object keys must be strings.")
        for child in value.values():
            check_json(child, depth + 1)
    elif isinstance(value, list):
        for child in value:
            check_json(child, depth + 1)
    elif value is not None and not isinstance(value, (str, bool, int, float)):
        raise ValueError("Input includes a non-JSON value.")
    elif isinstance(value, float) and not math.isfinite(value):
        raise ValueError("Non-finite numbers are not supported.")


def pointer_part(key):
    return str(key).replace("~", "~0").replace("/", "~1")


def english_encode(value):
    lines = []

    def visit(item, path):
        prefix = f"At {literal(path)}, "
        if isinstance(item, dict):
            lines.append(prefix + "create an object.")
            for key in sorted(item):
                visit(item[key], path + "/" + pointer_part(key))
        elif isinstance(item, list):
            lines.append(prefix + f"create an array with {len(item)} entries.")
            for index, child in enumerate(item):
                visit(child, path + "/" + str(index))
        elif isinstance(item, str):
            lines.append(prefix + "require the string " + literal(item) + ".")
        elif isinstance(item, bool):
            lines.append(prefix + "require the boolean " + literal(item) + ".")
        elif item is None:
            lines.append(prefix + "require null.")
        else:
            lines.append(prefix + "require the number " + literal(item) + ".")

    visit(value, "")
    return ENGLISH_HEADER + "\n".join(lines) + "\n", {"header_bytes": len(ENGLISH_HEADER.encode())}


def english_decode(encoded):
    if not encoded.startswith(ENGLISH_HEADER):
        raise ValueError("Unknown English-assignment header.")
    missing = object()
    root = missing
    decoder = json.JSONDecoder()
    for line in encoded[len(ENGLISH_HEADER):].splitlines():
        if not line.startswith("At "):
            raise ValueError("Invalid assignment.")
        path, end = decoder.raw_decode(line[3:])
        remainder = line[3 + end:]
        if not isinstance(path, str) or not remainder.startswith(", "):
            raise ValueError("Invalid assignment path.")
        statement = remainder[2:]
        if statement == "create an object.":
            item = {}
        elif match := re.fullmatch(r"create an array with (\d+) entries\.", statement):
            item = [missing] * int(match.group(1))
        elif statement == "require null.":
            item = None
        else:
            match = re.fullmatch(r"require the (string|boolean|number) (.*)\.", statement)
            if not match:
                raise ValueError("Invalid assignment value.")
            item = json.loads(match.group(2))
            kind = match.group(1)
            if ((kind == "string" and not isinstance(item, str))
                or (kind == "boolean" and not isinstance(item, bool))
                or (kind == "number" and (isinstance(item, bool) or not isinstance(item, (int, float))))):
                raise ValueError("Assignment type mismatch.")
        if path == "":
            if root is not missing:
                raise ValueError("Duplicate root.")
            root = item
            continue
        if root is missing or not path.startswith("/"):
            raise ValueError("Missing parent.")
        parts = [part.replace("~1", "/").replace("~0", "~") for part in path[1:].split("/")]
        parent = root
        for part in parts[:-1]:
            parent = parent[int(part)] if isinstance(parent, list) else parent[part]
        key = int(parts[-1]) if isinstance(parent, list) else parts[-1]
        if (isinstance(parent, dict) and key in parent) or (isinstance(parent, list) and parent[key] is not missing):
            raise ValueError("Duplicate assignment.")
        parent[key] = item
    if root is missing:
        raise ValueError("No root.")
    check_json(root)  # Also rejects any unfilled array slot.
    return root


def keycode(index):
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    output = ""
    index += 1
    while index:
        index, remainder = divmod(index - 1, len(alphabet))
        output = alphabet[remainder] + output
    return output


def dsl_encode(value):
    frequencies = Counter()

    def count(item):
        if isinstance(item, dict):
            frequencies.update(item.keys())
            for child in item.values():
                count(child)
        elif isinstance(item, list):
            for child in item:
                count(child)

    count(value)
    ordered = sorted(frequencies, key=lambda key: (-frequencies[key], key))
    codes = {key: keycode(index) for index, key in enumerate(ordered)}
    book = {code: key for key, code in codes.items()}

    def pack(item):
        if isinstance(item, dict):
            return "{" + ";".join(codes[key] + ":" + pack(item[key]) for key in sorted(item)) + "}"
        if isinstance(item, list):
            return "[" + ";".join(pack(child) for child in item) + "]"
        if item is True:
            return "t"
        if item is False:
            return "f"
        if item is None:
            return "z"
        return literal(item)

    book_line = "KEYS=" + canonical(book) + "\n"
    payload = pack(value)
    encoded = DSL_HEADER + book_line + DSL_GRAMMAR + "DATA=" + payload
    return encoded, {
        "codebook_bytes": len(book_line.encode()),
        "grammar_and_header_bytes": len((DSL_HEADER + DSL_GRAMMAR + "DATA=").encode()),
        "body_bytes": len(payload.encode()),
        "distinct_field_names": len(book),
    }


def dsl_decode(encoded):
    lines = encoded.split("\n", 3)
    if len(lines) != 4 or lines[0] != DSL_HEADER.rstrip("\n") or not lines[1].startswith("KEYS=") or lines[2] + "\n" != DSL_GRAMMAR or not lines[3].startswith("DATA="):
        raise ValueError("Unknown DSL grammar.")
    book = json.loads(lines[1][5:])
    body = lines[3][5:]
    pos = 0
    decoder = json.JSONDecoder()

    def read():
        nonlocal pos
        if pos >= len(body):
            raise ValueError("Incomplete DSL value.")
        char = body[pos]
        if char in "{[":
            pos += 1
            is_object = char == "{"
            close = "}" if is_object else "]"
            result = {} if is_object else []
            if pos < len(body) and body[pos] == close:
                pos += 1
                return result
            while True:
                if is_object:
                    start = pos
                    while pos < len(body) and body[pos].isalnum() and body[pos].isascii():
                        pos += 1
                    code = body[start:pos]
                    if code not in book or pos >= len(body) or body[pos] != ":":
                        raise ValueError("Unknown keycode.")
                    key = book[code]
                    if key in result:
                        raise ValueError("Duplicate DSL key.")
                    pos += 1
                    result[key] = read()
                else:
                    result.append(read())
                if pos >= len(body):
                    raise ValueError("Missing closing delimiter.")
                char = body[pos]
                pos += 1
                if char == close:
                    return result
                if char != ";":
                    raise ValueError("Missing separator.")
        if char in "tfz":
            pos += 1
            return {"t": True, "f": False, "z": None}[char]
        result, end = decoder.raw_decode(body, pos)
        pos = end
        if isinstance(result, (dict, list, bool)) or result is None:
            raise ValueError("Use the declared DSL type syntax.")
        return result

    result = read()
    if pos != len(body):
        raise ValueError("Trailing DSL data.")
    check_json(result)
    return result


def zlib_encode(value):
    compressed = zlib.compress(canonical(value).encode(), level=9)
    payload = base64.urlsafe_b64encode(compressed).rstrip(b"=").decode("ascii")
    return "FGZ1." + payload, {"compressed_binary_bytes": len(compressed), "header_bytes": 5}


def zlib_decode(encoded):
    if not encoded.startswith("FGZ1."):
        raise ValueError("Unknown compressed format.")
    payload = encoded[5:]
    return json.loads(zlib.decompress(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4))))


def hex_encode(value):
    return "FGH1." + canonical(value).encode().hex(), {"header_bytes": 5}


def hex_decode(encoded):
    if not encoded.startswith("FGH1."):
        raise ValueError("Unknown hex format.")
    return json.loads(bytes.fromhex(encoded[5:]))


def tokenizer_for(args):
    """Return an optional LOCAL tokenizer. No network access is permitted."""
    if args.tokenizer == "none":
        return None, {"status": "disabled", "name": None}
    if args.tokenizer_file:
        if importlib.util.find_spec("tokenizers") is None:
            return None, {"status": "unavailable", "name": None, "reason": "Local tokenizers package is not installed."}
        from tokenizers import Tokenizer
        tokenizer = Tokenizer.from_file(str(Path(args.tokenizer_file).resolve(strict=True)))
        return lambda text: len(tokenizer.encode(text).ids), {
            "status": "available", "name": "local tokenizer.json", "path": str(Path(args.tokenizer_file).resolve()),
            "note": "This file's tokenizer configuration determines counts; no model comprehension test was performed.",
        }
    if importlib.util.find_spec("tiktoken") is None:
        return None, {"status": "unavailable", "name": None,
                      "reason": "No local tiktoken package. No token counts were estimated from bytes."}
    import tiktoken
    import tiktoken.load
    original_read = tiktoken.load.read_file

    def local_only(path):
        if str(path).startswith(("http://", "https://")):
            raise RuntimeError("Tokenizer assets are not cached; network is disabled.")
        return original_read(path)

    tiktoken.load.read_file = local_only
    try:
        encoding = tiktoken.get_encoding("o200k_base")
    except Exception as exc:
        return None, {"status": "unavailable", "name": "o200k_base", "reason": str(exc)}
    finally:
        tiktoken.load.read_file = original_read
    return lambda text: len(encoding.encode(text, disallowed_special=())), {
        "status": "available", "name": "o200k_base",
        "note": "A tokenizer proxy, not a claim about the active model's tokenizer or comprehension.",
    }


def no_duplicate_keys(pairs):
    output = {}
    for key, value in pairs:
        if key in output:
            raise ValueError(f"Duplicate source JSON key: {key!r}")
        output[key] = value
    return output


def source_object(args):
    if args.source is None:
        return DEFAULT_BOOT, {"kind": "built-in structured boot fixture", "path": None}
    path = Path(args.source).resolve(strict=True)
    if path.stat().st_size > MAX_INPUT_BYTES:
        raise ValueError("Source exceeds the 2 MiB input limit.")
    raw = path.read_bytes()
    text = raw.decode("utf-8")
    metadata = {"path": str(path), "raw_source_utf8_bytes": len(raw), "raw_source_sha256": digest(raw)}
    if args.source_format != "text":
        try:
            parsed = json.loads(text, object_pairs_hook=no_duplicate_keys)
        except json.JSONDecodeError:
            if args.source_format == "json":
                raise
        else:
            if isinstance(parsed, dict):
                return parsed, {**metadata, "kind": "JSON object; canonicalized, not source whitespace-preserving"}
            if args.source_format == "json":
                raise ValueError("--source-format json requires a root object.")
    return {"instruction_text": text}, {**metadata, "kind": "verbatim UTF-8 text wrapped in instruction_text"}


def purge_demo():
    first = {"choice": "open", "omitted_fact": "the recipient consented"}
    second = {"choice": "open", "omitted_fact": "the recipient refused"}
    retained_first = {"choice": first["choice"]}
    retained_second = {"choice": second["choice"]}
    return {
        "original_a_sha256": digest(canonical(first).encode()),
        "original_b_sha256": digest(canonical(second).encode()),
        "retained_projection": retained_first,
        "same_retained_encoding": canonical(retained_first) == canonical(retained_second),
        "conclusion": "The same retained code corresponds to two different omitted facts. No decoder can determine which original fact was purged without another source.",
    }


def benchmark(args):
    source, source_metadata = source_object(args)
    check_json(source)
    base = canonical(source).encode()
    source_hash = digest(base)
    count_tokens, tokenizer_info = tokenizer_for(args)
    if count_tokens and args.source:
        source_metadata["raw_source_tokens"] = count_tokens(Path(args.source).read_text(encoding="utf-8"))
    json_encoded = canonical(source)
    english, english_info = english_encode(source)
    dsl, dsl_info = dsl_encode(source)
    compressed, compressed_info = zlib_encode(source)
    hexadecimal, hex_info = hex_encode(source)
    specs = [
        ("readable_english", english, english_decode, english_info, False),
        ("canonical_json", json_encoded, json.loads, {"header_bytes": 0}, False),
        ("dense_dsl_with_codebook", dsl, dsl_decode, dsl_info, False),
        ("zlib_base64url", compressed, zlib_decode, compressed_info, True),
        ("hex", hexadecimal, hex_decode, hex_info, True),
    ]
    variants = []
    emitted = {}
    if args.emit_dir:
        emit_dir = Path(args.emit_dir).resolve()
        emit_dir.mkdir(parents=True, exist_ok=True)
    for name, encoded, decode, details, requires_decoder in specs:
        decoded = decode(encoded)
        decoded_hash = digest(canonical(decoded).encode())
        equal = decoded == source and decoded_hash == source_hash
        if not equal:
            raise AssertionError(f"Exact round-trip failed: {name}")
        size = len(encoded.encode())
        variants.append({
            "name": name,
            "utf8_bytes": size,
            "unicode_codepoints": len(encoded),
            "byte_ratio_to_canonical_json": round(size / len(base), 6),
            "byte_reduction_from_canonical_json_percent": round(100 * (1 - size / len(base)), 3),
            "tokens": count_tokens(encoded) if count_tokens else None,
            "encoded_sha256": digest(encoded.encode()),
            "decoded_canonical_sha256": decoded_hash,
            "exact_roundtrip": equal,
            "requires_mechanical_decoder_for_readable_instructions": requires_decoder,
            "format_details": details,
        })
        if args.emit_dir:
            target = emit_dir / (name + ".txt")
            target.write_text(encoded, encoding="utf-8")
            emitted[name] = str(target)
    result = {
        "schema": "friken.chromatic.packing-benchmark.v1",
        "measured_at_utc": datetime.now(timezone.utc).isoformat(),
        "python_version": sys.version.split()[0],
        "source": source_metadata,
        "canonical_source_utf8_bytes": len(base),
        "canonical_source_sha256": source_hash,
        "tokenizer": tokenizer_info,
        "variants": variants,
        "emitted_artifacts": emitted,
        "purged_information_demo": purge_demo(),
        "interpretation_limits": [
            "Bytes and tokens are different metrics. Null token counts mean unavailable, not zero.",
            "All variants reconstruct the exact same JSON object and canonical SHA256; English is an exact assignment representation, not an optimized prose prompt.",
            "DSL byte counts include its complete codebook and grammar. A short opaque code without its missing legend does not preserve these instructions.",
            "A one-field prose source has little repeated key structure; the DSL may be larger than canonical JSON after its legend is included.",
            "Zlib and hex preserve bytes mechanically; an LLM reading their opaque payload is not established to recover or follow it without a decoder.",
            "Round-trip verification does not establish model comprehension, compliance, creativity, visual quality, or gameplay quality.",
            "No injective code can map every arbitrary input into a shorter fixed-size output; more inputs than codes forces collisions. Compression cannot recover facts purged before encoding.",
        ],
    }
    if args.output:
        output = Path(args.output).resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    return result


def self_test():
    fixture = {"slash/key": [True, False, None, 0, -3, 0.125, "🌹\nquote\""], "": {"~": []}, "object": {}, "period": "ends."}
    for value in [fixture, DEFAULT_BOOT]:
        for encode, decode in [(english_encode, english_decode), (dsl_encode, dsl_decode), (zlib_encode, zlib_decode), (hex_encode, hex_decode)]:
            encoded, _ = encode(value)
            assert canonical(decode(encoded)) == canonical(value)
    assert purge_demo()["same_retained_encoding"]
    print("Self-test: exact round-trips pass for nested objects, arrays, escaped pointers, Unicode, booleans, null and numbers.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", help="UTF-8 runbook or JSON instruction object; omit for the built-in boot fixture")
    parser.add_argument("--source-format", choices=["auto", "json", "text"], default="auto")
    parser.add_argument("--output", default=str(Path(__file__).with_name("packing-results.json")), help="Results JSON path")
    parser.add_argument("--emit-dir", help="Optional directory for all encoded variants, e.g. /tmp/chromatic-packing")
    parser.add_argument("--tokenizer", choices=["auto", "none"], default="auto", help="Use cached local tiktoken o200k_base only; never download")
    parser.add_argument("--tokenizer-file", help="Explicit local tokenizer.json; requires the optional tokenizers package")
    parser.add_argument("--self-test", action="store_true", help="Exercise exact round-trips before measuring")
    args = parser.parse_args()
    try:
        if args.self_test:
            self_test()
        result = benchmark(args)
    except (ValueError, OSError, AssertionError, KeyError, IndexError) as exc:
        parser.exit(1, f"Packing benchmark failed: {exc}\n")
    print(f"Same-object canonical SHA256: {result['canonical_source_sha256']}")
    print(f"{'Representation':30} {'UTF-8 bytes':>12} {'vs JSON':>10} {'Tokens':>10} {'Round-trip':>12}")
    for variant in result["variants"]:
        token_text = str(variant["tokens"]) if variant["tokens"] is not None else "unknown"
        print(f"{variant['name']:30} {variant['utf8_bytes']:12,d} {variant['byte_ratio_to_canonical_json']:9.3f}x {token_text:>10} {'EXACT':>12}")
    print("Token counts: " + result["tokenizer"]["status"] + "; bytes are not token estimates.")
    print("The DSL includes its dictionary and grammar. Round-trips prove retained data, not model understanding.")
    if args.output:
        print("Results: " + str(Path(args.output).resolve()))


if __name__ == "__main__":
    main()
