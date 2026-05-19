from __future__ import annotations

from dataclasses import dataclass
from typing import Any

DOCUMENT_UPLOAD_FALLBACK = "[Document uploaded by user]"

_DIRECT_ATTACHMENT_KEYS = {
    "_has_native_files",
    "attached_file",
    "attached_filename",
    "attached_url",
    "attachment",
    "attachments",
    "document",
    "document_metadata",
    "documents",
    "file",
    "file_metadata",
    "file_name",
    "file_url",
    "filename",
    "files",
    "native_files",
    "uploaded_filename",
    "uploaded_files",
    "uploaded_url",
}

_METADATA_ATTACHMENT_KEYS = {
    "active_file_id",
    "last_uploaded_content",
    "last_uploaded_filename",
    "last_uploaded_type",
    "last_uploaded_url",
    "uploaded_file",
    "uploaded_files",
}


@dataclass(frozen=True)
class MessageNormalizationStats:
    input_count: int
    output_count: int
    trimmed_count: int = 0
    fallback_count: int = 0
    dropped_empty_count: int = 0


def normalize_ai_messages(
    messages: list[dict[str, Any]] | None,
) -> tuple[list[dict[str, Any]], MessageNormalizationStats]:
    """Return provider-safe chat messages without leaking backend-only metadata."""
    normalized: list[dict[str, Any]] = []
    trimmed_count = 0
    fallback_count = 0
    dropped_empty_count = 0

    for message in messages or []:
        role = str(message.get("role") or "").strip()
        if not role:
            dropped_empty_count += 1
            continue

        content, was_trimmed = _normalize_content(message.get("content"))
        if content is not None:
            normalized.append({"role": role, "content": content})
            if was_trimmed:
                trimmed_count += 1
            continue

        if _has_attachment_metadata(message):
            normalized.append({"role": role, "content": DOCUMENT_UPLOAD_FALLBACK})
            fallback_count += 1
            continue

        dropped_empty_count += 1

    stats = MessageNormalizationStats(
        input_count=len(messages or []),
        output_count=len(normalized),
        trimmed_count=trimmed_count,
        fallback_count=fallback_count,
        dropped_empty_count=dropped_empty_count,
    )
    return normalized, stats


def count_empty_ai_message_contents(messages: list[dict[str, Any]]) -> int:
    return sum(1 for message in messages if _is_empty_content(message.get("content")))


def _normalize_content(content: Any) -> tuple[str | list[dict[str, Any]] | None, bool]:
    if isinstance(content, str):
        trimmed = content.strip()
        return (trimmed, trimmed != content) if trimmed else (None, content != "")

    if isinstance(content, list):
        blocks: list[dict[str, Any]] = []
        was_trimmed = False
        for block in content:
            if isinstance(block, str):
                text = block.strip()
                if text:
                    blocks.append({"type": "text", "text": text})
                    was_trimmed = was_trimmed or text != block
                else:
                    was_trimmed = was_trimmed or block != ""
                continue

            if not isinstance(block, dict):
                continue

            block_type = block.get("type")
            if block_type == "text":
                text_value = block.get("text")
                text = text_value.strip() if isinstance(text_value, str) else ""
                if text:
                    blocks.append({**block, "text": text})
                    was_trimmed = was_trimmed or text != text_value
                else:
                    was_trimmed = was_trimmed or text_value != ""
                continue

            if block:
                blocks.append(block)

        return (blocks, was_trimmed) if blocks else (None, was_trimmed)

    return None, False


def _has_attachment_metadata(message: dict[str, Any]) -> bool:
    for key in _DIRECT_ATTACHMENT_KEYS:
        if _is_present(message.get(key)):
            return True

    for metadata_key in ("metadata", "metadata_"):
        metadata = message.get(metadata_key)
        if not isinstance(metadata, dict):
            continue
        for key in _METADATA_ATTACHMENT_KEYS:
            if _is_present(metadata.get(key)):
                return True

    return False


def _is_present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, dict | list | tuple | set):
        return bool(value)
    return bool(value)


def _is_empty_content(content: Any) -> bool:
    if isinstance(content, str):
        return not content.strip()
    if isinstance(content, list):
        if not content:
            return True
        for block in content:
            if (
                isinstance(block, dict)
                and block.get("type") == "text"
                and not str(block.get("text") or "").strip()
            ):
                return True
        return False
    return content is None
