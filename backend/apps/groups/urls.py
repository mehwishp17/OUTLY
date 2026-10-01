from django.urls import path

from . import views

urlpatterns = [
    path("groups/", views.GroupListCreateView.as_view()),
    path("groups/<int:group_id>/", views.GroupDetailView.as_view()),
    path("groups/<int:group_id>/join/", views.GroupJoinView.as_view()),
    path("groups/<int:group_id>/chat/", views.GroupChatView.as_view()),
    path("groups/<int:group_id>/feed/", views.GroupFeedView.as_view()),
    path("groups/<int:group_id>/members/", views.GroupMembersView.as_view()),
    path("groups/<int:group_id>/members/<int:user_id>/", views.GroupMemberDetailView.as_view()),
    path("groups/<int:group_id>/members/<int:user_id>/role/", views.GroupMemberRoleView.as_view()),
    path("groups/<int:group_id>/join-requests/", views.GroupJoinRequestsView.as_view()),
    path("groups/<int:group_id>/join-requests/<int:request_id>/review/", views.GroupJoinRequestReviewView.as_view()),
]
