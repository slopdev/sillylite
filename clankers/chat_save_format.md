# CHSL Format Specification

**Version:** 0.1
**File extensions:** `.chsl` (main), `.json` (optional auxiliary data)

---

## Overview

CHSL is a format for storing partitioned blocks of plaintext with optional auxiliary metadata. A document is divided into named **segments**, each identified by a short alphanumeric **block code**. The format is designed to be human-readable and editable in any text editor, trivially grep-able, and unambiguous to parse mechanically.

Primary use case is LLM chat logs, but the format is general-purpose.

---

## File Pair

A CHSL document consists of up to two files sharing the same base name:

| File | Required | Purpose |
|------|----------|---------|
| `<name>.chsl` | Yes | Plaintext segments |
| `<name>.json` | No | Auxiliary key-value metadata |

---

## Main File (`.chsl`)

### Structure

A `.chsl` file is a sequence of **segments**. Each segment has a **header line** followed by one or more **indented body lines**.

```
@000000
Section A:
    All this text belongs to Section A.
    It can span multiple lines.
    Anything is allowed in indented blocks.

@000001
Section B:
    This text belongs to B now.

@4aN58G
Section C:
    And so on...
```

Blank lines between segments are allowed and ignored.

### Grammar

```ebnf
root      ::= segment*
segment   ::= code_line? header_line body
code_line ::= '@' CODE NEWLINE
header_line ::= LINE NEWLINE
body      ::= (INDENT LINE NEWLINE)+

CODE      ::= [a-zA-Z0-9]{6}
LINE      ::= [^\n]+
NEWLINE   ::= '\n'
INDENT    ::= '\t'          (* one hard tab — unambiguous, not spaces *)
```

> **Indentation:** Body lines are indented with a single hard tab (`\t`). Tabs are required (not spaces) for unambiguous parsing.

### Header Line

The header line is a free-form label for the segment. It may be any non-empty string. Convention is a descriptive name followed by a colon, but this is not enforced.

### Block Code

Each segment may be preceded by a `@<CODE>` line. The code is a 6-character alphanumeric string (`[a-zA-Z0-9]{6}`).

- Codes are **case-sensitive**.
- Codes must be **unique** within a file.
- When generating new codes automatically, they should follow **lexicographic order** based on the previous code (i.e. each new code is the lexicographic successor of the last).
- Default starting code: `000000`.
- A segment without a `@<CODE>` line has no code and cannot be referenced by the data file.
- If a `.json` data file is present, codes in both files must use the same format and be consistent.

**Code succession example:**

```
@000000  →  @000001  →  @000002  →  ...  →  @00000z  →  @000010  →  ...
```

---

## Data File (`.json`)

The optional data file is a flat JSON object associating key-value metadata with the file as a whole or with individual segments.

### Format

```json
{
  "__globals__": {
    "title": "My Document",
    "author": "Alice",
    "created": "2025-01-01"
  },
  "000000": {
    "role": "system",
    "timestamp": "2025-01-01T00:00:00Z"
  },
  "000001": {
    "role": "user"
  },
  "4aN58G": {
    "role": "assistant",
    "model": "claude-opus-4-6"
  }
}
```

### Rules

- The reserved key `"__globals__"` holds metadata for the entire file. Its value is a JSON object of arbitrary key-value pairs.
- All other top-level keys are block codes. Each maps to a JSON object of key-value pairs associated with that segment.
- Keys that do not correspond to any block code in the `.chsl` file are ignored (but should be avoided).
- Block codes in the `.json` file must match the format used in the `.chsl` file exactly (case-sensitive).
- Values may be any valid JSON type (string, number, boolean, null, object, array).

---

## Parsing Notes

1. Read the file line by line.
2. A line matching `^@[a-zA-Z0-9]{6}$` is a code line — begin a new segment and record the code.
3. A non-empty line that does not start with `\t` and is not a code line is a header line — associate it with the current segment.
4. A line starting with `\t` is a body line — strip the leading tab and append to the current segment's body.
5. Empty lines are ignored.
6. A segment is complete when the next code line or header line is encountered, or at EOF.

---

## Constraints and Recommendations

- A file with no segments is valid (empty file).
- A segment with no body lines is **invalid**.
- A segment with no code line is valid but cannot be referenced from the data file.
- Implementations should preserve unknown keys in the `.json` file when round-tripping.
- Codes should be treated as opaque identifiers; do not encode semantic meaning in them.

