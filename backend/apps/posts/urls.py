from django.urls import path

from . import views

urlpatterns = [
    path("feed/", views.FeedAliasView.as_view()),
    path("media/", views.MediaUploadView.as_view()),
    path("posts/", views.PostListCreateView.as_view()),
    path("posts/saved/", views.SavedPostsView.as_view()),
    path("posts/<int:post_id>/", views.PostDetailView.as_view()),
    path("posts/<int:post_id>/comments/", views.CommentListCreateView.as_view()),
    path("posts/<int:post_id>/like/", views.LikeView.as_view()),
    path("posts/<int:post_id>/save/", views.SaveView.as_view()),
    path("posts/<int:post_id>/share/", views.ShareView.as_view()),
    path("comments/<int:comment_id>/", views.CommentDetailView.as_view()),
]
