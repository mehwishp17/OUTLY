"use client";

import { useRouter } from "next/navigation";
import { PostComposer } from "@/components/feed/post-composer";
import { useGroupStore } from "@/context/group-store-context";
import { useSocialStore } from "@/context/social-store-context";

type CreatePostViewProps = {
  /** When set, the new post is created inside this group's Group Feed
   * instead of the main Home Feed — see `Post.groupId`. */
  groupId?: string;
};

export function CreatePostView({ groupId }: CreatePostViewProps) {
  const router = useRouter();
  const { createPost, createBackendPost } = useSocialStore();
  const { getGroupById } = useGroupStore();
  const group = groupId ? getGroupById(groupId) : undefined;
  const backHref = group ? `/groups/${group.id}` : "/feed";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <PostComposer
        title={group ? `Post in ${group.name}` : "Create a post"}
        description={
          group
            ? "Share an update with this group."
            : "Share what's happening with the OUTLY community."
        }
        submitLabel="Post"
        captionOnly={!group}
        onCancel={() => router.push(backHref)}
        onSubmit={async (values) => {
          if (group) {
            // Group posts are not backed by the API yet (no group endpoints).
            createPost({ ...values, groupId: group.id });
            router.push(`/groups/${group.id}`);
            return undefined;
          }
          const { post, error } = await createBackendPost(values.content);
          if (error || !post) return error;
          router.push(`/feed/${post.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
