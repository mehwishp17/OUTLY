"use client";

import { useEffect } from "react";
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
  const { createPost } = useSocialStore();
  const { getGroupById, loadGroup } = useGroupStore();
  const group = groupId ? getGroupById(groupId) : undefined;
  const backHref = group ? `/groups/${group.id}` : "/feed";

  useEffect(() => {
    if (groupId) void loadGroup(groupId);
  }, [groupId, loadGroup]);

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
        onCancel={() => router.push(backHref)}
        onSubmit={async (values) => {
          const { post, error } = await createPost({ ...values, groupId: group?.id });
          if (error || !post) return error;
          router.push(group ? `/groups/${group.id}` : `/feed/${post.id}`);
          return undefined;
        }}
      />
    </div>
  );
}
