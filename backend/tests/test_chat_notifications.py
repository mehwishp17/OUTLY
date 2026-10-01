import pytest
from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator

from apps.messaging.views import WS_SALT
from tests.conftest import body, data

pytestmark = pytest.mark.django_db


def direct(c, other):
    r = c.post("/api/v1/chats/direct/", {"user_id": other.id}, format="json")
    assert r.status_code in (200, 201), r.content
    return data(r)


def send(c, cid, text="hello"):
    return c.post(f"/api/v1/chats/conversations/{cid}/messages/", {"content": text}, format="json")


def test_direct_conversation_is_unique_per_pair(alice, bob, client_for):
    a = direct(client_for(alice), bob)
    again = client_for(bob).post("/api/v1/chats/direct/", {"user_id": alice.id}, format="json")
    assert again.status_code == 200 and data(again)["id"] == a["id"]  # same chat from either side
    assert a["type"] == "DIRECT" and [p["user_id"] for p in a["participants"]] == [bob.id]
    assert client_for(alice).post("/api/v1/chats/direct/", {"user_id": alice.id}, format="json").status_code == 400
    assert client_for(alice).post("/api/v1/chats/direct/", {"user_id": 99999}, format="json").status_code == 404


def test_messages_persist_paginate_and_expose_shape(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    r = send(client_for(alice), cid, "first")
    assert r.status_code == 201
    m = data(r)
    for key in ("id", "conversation", "sender_id", "sender_name", "content", "created_at", "is_deleted", "is_mine"):
        assert key in m
    assert m["sender_id"] == alice.id and m["is_mine"] is True and m["conversation"] == cid
    for i in range(4):
        send(client_for(bob), cid, f"reply {i}")
    page = body(client_for(alice).get(f"/api/v1/chats/conversations/{cid}/messages/?limit=3"))
    assert [x["content"] for x in page["data"]] == ["reply 3", "reply 2", "reply 1"]  # newest first
    older = body(client_for(alice).get(f"/api/v1/chats/conversations/{cid}/messages/?limit=3&cursor={page['meta']['next_cursor']}"))
    assert [x["content"] for x in older["data"]] == ["reply 0", "first"]
    assert older["data"][1]["is_mine"] is True and older["data"][0]["is_mine"] is False


def test_message_validation(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    assert send(client_for(alice), cid, "   ").status_code == 400
    assert send(client_for(alice), cid, "x" * 2001).status_code == 400


def test_non_members_cannot_read_send_or_mark_read(alice, bob, carol, client_for):
    cid = direct(client_for(alice), bob)["id"]
    send(client_for(alice), cid, "private")
    stranger = client_for(carol)
    assert stranger.get(f"/api/v1/chats/conversations/{cid}/messages/").status_code == 404
    assert send(stranger, cid).status_code == 404
    assert stranger.post(f"/api/v1/chats/conversations/{cid}/read/").status_code == 404
    assert data(stranger.get("/api/v1/chats/conversations/")) == []


def test_unread_counts_and_mark_read(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    for i in range(3):
        send(client_for(alice), cid, f"m{i}")
    convo = data(client_for(bob).get("/api/v1/chats/conversations/"))[0]
    assert convo["unread_count"] == 3 and convo["last_message"] == "m2" and convo["participants"][0]["user_id"] == alice.id
    assert data(client_for(alice).get("/api/v1/chats/conversations/"))[0]["unread_count"] == 0  # own messages never unread
    assert client_for(bob).post(f"/api/v1/chats/conversations/{cid}/read/").status_code == 200
    assert data(client_for(bob).get("/api/v1/chats/conversations/"))[0]["unread_count"] == 0
    send(client_for(alice), cid, "after read")
    assert data(client_for(bob).get("/api/v1/chats/conversations/"))[0]["unread_count"] == 1


def test_blocking_stops_messaging_and_hides_conversation(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    send(client_for(alice), cid, "hi")
    client_for(bob).post(f"/api/v1/users/{alice.id}/block/")
    assert send(client_for(alice), cid, "still there?").status_code == 403
    assert send(client_for(bob), cid, "nope").status_code == 403
    assert client_for(alice).post("/api/v1/chats/direct/", {"user_id": bob.id}, format="json").status_code == 403
    assert data(client_for(alice).get("/api/v1/chats/conversations/")) == []
    assert data(client_for(bob).get("/api/v1/chats/conversations/")) == []


def test_edit_and_delete_own_messages_only(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    mid = data(send(client_for(alice), cid, "typo"))["id"]
    assert client_for(bob).patch(f"/api/v1/chats/messages/{mid}/", {"content": "forged"}, format="json").status_code == 403
    edited = data(client_for(alice).patch(f"/api/v1/chats/messages/{mid}/", {"content": "fixed"}, format="json"))
    assert edited["content"] == "fixed" and edited["edited_at"]
    assert client_for(bob).delete(f"/api/v1/chats/messages/{mid}/").status_code == 403
    assert client_for(alice).delete(f"/api/v1/chats/messages/{mid}/").status_code == 204
    msgs = data(client_for(bob).get(f"/api/v1/chats/conversations/{cid}/messages/"))
    assert msgs[0]["is_deleted"] is True and msgs[0]["content"] == ""  # content never served after deletion


def test_message_notification_collapses_until_read(alice, bob, client_for):
    cid = direct(client_for(alice), bob)["id"]
    for i in range(5):
        send(client_for(alice), cid, f"m{i}")
    notes = [n for n in data(client_for(bob).get("/api/v1/notifications/")) if n["notification_type"] == "MESSAGE"]
    assert len(notes) == 1 and notes[0]["href"] == f"/chat/{cid}"
    client_for(bob).post(f"/api/v1/chats/conversations/{cid}/read/")
    assert data(client_for(bob).get("/api/v1/notifications/?is_read=false")) == []  # marking the chat read clears it


def test_conversation_list_query_count_flat(alice, make_user, client_for, django_assert_max_num_queries):
    for _ in range(8):
        other = make_user()
        send(client_for(alice), direct(client_for(alice), other)["id"], "hey")
    with django_assert_max_num_queries(7):
        r = client_for(alice).get("/api/v1/chats/conversations/")
    assert len(data(r)) == 8


# ---------------- notifications ----------------
def test_notification_list_shape_read_unread_and_permissions(alice, bob, carol, client_for, make_post):
    pid = make_post(alice)["id"]
    client_for(bob).post(f"/api/v1/posts/{pid}/like/")
    client_for(carol).post(f"/api/v1/users/{alice.id}/follow/")
    r = client_for(alice).get("/api/v1/notifications/")
    notes = data(r)
    assert body(r)["meta"]["unread_count"] == 2 and len(notes) == 2
    n = notes[0]
    for key in ("id", "actor_id", "actor_name", "notification_type", "title", "body", "target_type", "target_id", "is_read", "created_at", "href"):
        assert key in n
    like = next(x for x in notes if x["notification_type"] == "LIKE")
    assert like["actor_id"] == bob.id and like["href"] == f"/feed/{pid}" and "Bob" in like["title"]
    assert data(client_for(alice).get("/api/v1/notifications/unread-count/"))["unread_count"] == 2
    # nobody else can read or mark them
    assert client_for(bob).post(f"/api/v1/notifications/{like['id']}/read/").status_code == 404
    assert client_for(bob).delete(f"/api/v1/notifications/{like['id']}/").status_code == 404
    assert data(client_for(alice).post(f"/api/v1/notifications/{like['id']}/read/"))["is_read"] is True
    assert [x["notification_type"] for x in data(client_for(alice).get("/api/v1/notifications/?is_read=false"))] == ["FOLLOW"]
    assert data(client_for(alice).post("/api/v1/notifications/read-all/"))["updated"] == 1
    assert data(client_for(alice).get("/api/v1/notifications/unread-count/"))["unread_count"] == 0
    assert client_for(alice).delete(f"/api/v1/notifications/{like['id']}/").status_code == 204


def test_no_self_or_blocked_notifications(alice, bob, client_for, make_post):
    pid = make_post(alice)["id"]
    client_for(alice).post(f"/api/v1/posts/{pid}/like/")  # liking your own post
    assert data(client_for(alice).get("/api/v1/notifications/")) == []
    client_for(alice).post(f"/api/v1/users/{bob.id}/block/")
    assert client_for(bob).post(f"/api/v1/posts/{pid}/like/").status_code == 404


def test_notification_pagination(alice, make_user, client_for):
    for _ in range(5):
        client_for(make_user()).post(f"/api/v1/users/{alice.id}/follow/")
    page = body(client_for(alice).get("/api/v1/notifications/?limit=2"))
    assert len(page["data"]) == 2 and page["meta"]["next_cursor"]


# ---------------- websocket ----------------
def _ticket(user):
    from django.core import signing

    return signing.dumps({"uid": user.pk}, salt=WS_SALT)


@pytest.mark.django_db(transaction=True)
def test_websocket_requires_auth_and_delivers_messages_in_real_time(alice, bob, client_for):
    from config.asgi import application

    cid = direct(client_for(alice), bob)["id"]

    ticket_bob, ticket_alice = _ticket(bob), _ticket(alice)

    async def scenario():
        anon = WebsocketCommunicator(application, "/ws/chat/")
        connected, code = await anon.connect()
        assert connected is False  # no ticket -> rejected

        bad = WebsocketCommunicator(application, "/ws/chat/?ticket=forged")
        assert (await bad.connect())[0] is False

        ws_bob = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket_bob}")
        assert (await ws_bob.connect())[0] is True
        assert (await ws_bob.receive_json_from())["type"] == "ready"
        ws_alice = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket_alice}")
        await ws_alice.connect()
        await ws_alice.receive_json_from()

        # alice sends through the socket: persisted, acked, and pushed to bob
        await ws_alice.send_json_to({"action": "send", "conversation_id": cid, "content": "live!", "client_id": "c1"})
        ack = await ws_alice.receive_json_from()
        assert ack["type"] == "ack" and ack["client_id"] == "c1" and ack["message"]["content"] == "live!"
        # the sender's own sockets get the broadcast too (keeps other tabs in sync)
        assert (await ws_alice.receive_json_from())["type"] == "message.created"
        got = {}
        for _ in range(2):  # bob receives the message and its notification, in either order
            event = await ws_bob.receive_json_from()
            got[event["type"]] = event
        assert got["message.created"]["message"]["content"] == "live!"
        assert got["notification.created"]["notification"]["notification_type"] == "MESSAGE"

        # authorization is not bypassed over the socket
        await ws_alice.send_json_to({"action": "send", "conversation_id": 999999, "content": "x"})
        assert (await ws_alice.receive_json_from())["type"] == "error"
        await ws_alice.send_json_to({"action": "send", "conversation_id": cid, "content": "  "})
        assert (await ws_alice.receive_json_from())["type"] == "error"
        await ws_alice.send_json_to({"action": "explode"})
        assert (await ws_alice.receive_json_from())["type"] == "error"
        await ws_alice.disconnect()
        await ws_bob.disconnect()

    async_to_sync(scenario)()
    assert [m["content"] for m in data(client_for(bob).get(f"/api/v1/chats/conversations/{cid}/messages/"))] == ["live!"]


@pytest.mark.django_db(transaction=True)
def test_websocket_stranger_cannot_inject_into_foreign_conversation(alice, bob, carol, client_for):
    from config.asgi import application

    cid = direct(client_for(alice), bob)["id"]
    ticket = _ticket(carol)

    async def scenario():
        ws = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket}")
        await ws.connect()
        await ws.receive_json_from()
        await ws.send_json_to({"action": "send", "conversation_id": cid, "content": "intruder"})
        reply = await ws.receive_json_from()
        assert reply["type"] == "error"
        await ws.disconnect()

    async_to_sync(scenario)()
    assert data(client_for(alice).get(f"/api/v1/chats/conversations/{cid}/messages/")) == []


@pytest.mark.django_db(transaction=True)
def test_rest_message_and_notification_are_pushed_over_websocket(alice, bob, client_for):
    from config.asgi import application

    alice_client = client_for(alice)  # build DB-backed fixtures outside the async scope
    cid = direct(alice_client, bob)["id"]
    ticket = _ticket(bob)

    async def scenario():
        ws = WebsocketCommunicator(application, f"/ws/chat/?ticket={ticket}")
        await ws.connect()
        await ws.receive_json_from()
        await sync_to_async(send)(alice_client, cid, "via REST")
        events = {}
        for _ in range(2):  # message + notification (order not guaranteed)
            payload = await ws.receive_json_from(timeout=5)
            events[payload["type"]] = payload
        assert events["message.created"]["message"]["content"] == "via REST"
        assert events["notification.created"]["unread_count"] >= 1
        await ws.disconnect()

    async_to_sync(scenario)()


def test_ws_ticket_endpoint(alice, client_for):
    r = client_for(alice).post("/api/v1/chats/ws-ticket/")
    assert r.status_code == 200 and data(r)["ticket"] and data(r)["expires_in"] == 60
    from rest_framework.test import APIClient

    assert APIClient().post("/api/v1/chats/ws-ticket/").status_code == 401
