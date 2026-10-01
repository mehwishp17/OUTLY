"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { PostComposer } from "@/components/feed/post-composer";
import { LoadingState } from "@/components/ui/loading-state";
import { useSocialStore } from "@/context/social-store-context";

type EditPostViewProps = {
  postId: string;
};

export function EditPostView({ postId }: EditPostViewProps) {
  const router = useRouter();
  const { isCurrentUser, getPostById, editPost, editBackendPost, feedStatus, ensureFeedLoaded } =
    useSocialStore();
  const post = getPostById(postId);

  useEffect(() => {
    void ensureFeedLoaded();
  }, [ensureFeedLoaded]);

  if (!post && (feedStatus === "idle" || feedStatus === "loading")) {
    return <LoadingState message="Loading post…" />;
  }

  if (!post || !isCurrentUser(post.authorId)) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-bold text-[var(--outly-ink)]">
          {post ? "You can't edit this post" : "Post not found"}
        </h1>
        <p className="text-sm text-[var(--outly-muted)]">
          {post
            ? "Only the original author can edit a post."
            : "This post may have been deleted, or the link is incorrect."}
        </p>
        <Link
          href="/feed"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--outly-violet)] hover:text-[var(--outly-purple-dark)]"
        >
          <Icon name="chevron-left" className="h-4 w-4" />
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <PostComposer
        title="Edit post"
        submitLabel="Save changes"
        initialContent={post.content}
        initialLocation={post.location}
        initialImages={post.images}
        captionOnly={post.persisted}
        onCancel={() => router.push(`/feed/${post.id}`)}
        onSubmit={async (values) => {
          if (post.persisted) {
            const error = await editBackendPost(post.id, values.content);
            if (error) return error;
          } else {
            editPost(post.id, values);
          }
          router.push(`/feed/${post.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
