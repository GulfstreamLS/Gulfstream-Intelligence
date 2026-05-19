from app.schemas.chat import ConversationCreate


def test_new_conversations_are_saved_by_default():
    assert ConversationCreate().is_temporary is False
