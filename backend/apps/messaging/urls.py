from django.urls import path

from . import views

urlpatterns = [
    path("chats/conversations/", views.ConversationListView.as_view()),
    path("chats/conversations/<int:conversation_id>/messages/", views.MessageListCreateView.as_view()),
    path("chats/conversations/<int:conversation_id>/read/", views.MarkReadView.as_view()),
    path("chats/direct/", views.DirectConversationView.as_view()),
    path("chats/messages/<int:message_id>/", views.MessageDetailView.as_view()),
    path("chats/ws-ticket/", views.WebSocketTicketView.as_view()),
]
