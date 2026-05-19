from app.agents.message_normalizer import (
    DOCUMENT_UPLOAD_FALLBACK,
    count_empty_ai_message_contents,
    normalize_ai_messages,
)


def test_normalize_ai_messages_trims_text_and_removes_empty_messages():
    normalized, stats = normalize_ai_messages(
        [
            {"role": "user", "content": "  hello  "},
            {"role": "assistant", "content": ""},
            {"role": "user", "content": "   "},
        ]
    )

    assert normalized == [{"role": "user", "content": "hello"}]
    assert stats.trimmed_count == 1
    assert stats.dropped_empty_count == 2
    assert count_empty_ai_message_contents(normalized) == 0


def test_normalize_ai_messages_uses_backend_only_fallback_for_file_messages():
    normalized, stats = normalize_ai_messages(
        [
            {"role": "user", "content": "", "attached_filename": "protocol.pdf"},
            {"role": "assistant", "content": "ok", "attached_filename": "must-not-leak.pdf"},
        ]
    )

    assert normalized == [
        {"role": "user", "content": DOCUMENT_UPLOAD_FALLBACK},
        {"role": "assistant", "content": "ok"},
    ]
    assert stats.fallback_count == 1
    assert count_empty_ai_message_contents(normalized) == 0
    assert "attached_filename" not in normalized[0]


def test_normalize_ai_messages_detects_document_metadata():
    normalized, stats = normalize_ai_messages(
        [
            {
                "role": "user",
                "content": " ",
                "metadata": {"uploaded_files": [{"filename": "briefing.docx"}]},
            }
        ]
    )

    assert normalized == [{"role": "user", "content": DOCUMENT_UPLOAD_FALLBACK}]
    assert stats.fallback_count == 1
    assert count_empty_ai_message_contents(normalized) == 0


def test_normalize_ai_messages_treats_native_files_as_attachment_metadata():
    normalized, stats = normalize_ai_messages(
        [{"role": "user", "content": "", "_has_native_files": True}]
    )

    assert normalized == [{"role": "user", "content": DOCUMENT_UPLOAD_FALLBACK}]
    assert stats.fallback_count == 1
    assert count_empty_ai_message_contents(normalized) == 0


def test_normalize_ai_messages_cleans_content_blocks():
    normalized, stats = normalize_ai_messages(
        [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "   "},
                    {"type": "document", "source": {"type": "base64", "data": "abc"}},
                ],
            }
        ]
    )

    assert normalized == [
        {
            "role": "user",
            "content": [{"type": "document", "source": {"type": "base64", "data": "abc"}}],
        }
    ]
    assert stats.dropped_empty_count == 0
    assert count_empty_ai_message_contents(normalized) == 0
