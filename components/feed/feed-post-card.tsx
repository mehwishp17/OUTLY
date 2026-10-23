"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { PostMedia } from "@/components/feed/post-media";
import {
  AvatarRing,
  PostActionBar,
  PostDialogs,
  PostHeader,
  PostNotices,
  usePostActions,
} from "@/components/feed/post-parts";
import { useSocialStore } from "@/context/social-store-context";
import type { Post } from "@/types/post";

/**
 * A post in the Home Feed: author row, photos edge to edge, then the actions, caption, a comment preview
 * and a link to add a comment. It reads and changes post state through the same store calls as the
 * original `PostCard`; it only presents them differently (and is used by the Feed only).
 */
export function FeedPostCard({ post }: { post: Post }) {
  const { currentUser } = useSocialStore();
  const actions = usePostActions(post);
  const detailHref = `/feed/${post.id}`;
  const latestComment = post.comments[post.comments.length - 1];
  const images = post.images ?? [];
  const hasPhotos = images.length > 0;
  const mediaAlt = `Photo shared by ${post.authorName}${post.location ? ` at ${post.location}` : ""}`;

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-white/10 bg-[#17121f] shadow-[var(--shadow-soft)] transition-colors duration-200 hover:border-white/20 motion-reduce:transition-none">
      <div className="px-4 pb-3 pt-4 sm:px-5">
        <PostHeader post={post} actions={actions} />
      </div>

      {hasPhotos ? <PostMedia images={images} alt={mediaAlt} href={detailHref} /> : null}

      <div className="px-4 pb-4 pt-3 sm:px-5">
        <PostActionBar post={post} detailHref={detailHref} actions={actions} />

        {post.content ? (
          <Link
            href={detailHref}
            className="mt-1 block rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <p
              className={
                hasPhotos
                  ? "line-clamp-4 whitespace-pre-wrap text-[15px] leading-relaxed text-white/90"
                  : "whitespace-pre-wrap text-lg leading-relaxed text-white"
              }
            >
              {hasPhotos ? <span className="mr-1.5 font-semibold text-white">{post.authorName}</span> : null}
              {post.content}
            </p>
          </Link>
        ) : null}

        <PostNotices actions={actions} />

        {latestComment ? (
          <div className="mt-3 space-y-1 text-sm">
            {post.comments.length > 1 ? (
              <Link
                href={detailHref}
                className="inline-block text-[var(--outly-muted)] transition-colors hover:text-[var(--outly-pink)]"
              >
                View all {post.comments.length} comments
              </Link>
            ) : null}
            <p className="line-clamp-2 text-white/90">
              <Link
                href={`/people/${latestComment.authorId}`}
                className="mr-1.5 font-semibold text-white hover:text-[var(--outly-pink)]"
              >
                {latestComment.authorName}
              </Link>
              {latestComment.content}
            </p>
          </div>
        ) : null}

        <Link
          href={detailHref}
          className="mt-3 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-sm text-[var(--outly-muted)] transition-colors hover:border-[var(--outly-pink)]/50 hover:text-white"
        >
          <AvatarRing name={currentUser.name} avatarUrl={currentUser.avatarUrl} size="sm" />
          <span className="flex-1">Add a comment…</span>
          <Icon name="send" className="h-4 w-4" />
        </Link>
      </div>

      <PostDialogs actions={actions} />
    </article>
  );
}
