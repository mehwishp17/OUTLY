import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionScope } from "@/components/layout/session-scope";
import { SocialStoreProvider } from "@/context/social-store-context";
import { ActivityStoreProvider } from "@/context/activity-store-context";
import { EventStoreProvider } from "@/context/event-store-context";
import { GroupStoreProvider } from "@/context/group-store-context";
import { PartnerStoreProvider } from "@/context/partner-store-context";
import { FollowStoreProvider } from "@/context/follow-store-context";
import { ChatStoreProvider } from "@/context/chat-store-context";
import { NotificationStoreProvider } from "@/context/notification-store-context";
import { AdminStoreProvider } from "@/context/admin-store-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OUTLY — Explore, Connect, Belong",
  description:
    "Discover trails, connect with like-minded explorers, and find where you belong with OUTLY.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SocialStoreProvider>
          <SessionScope>
          <ActivityStoreProvider>
            <EventStoreProvider>
              <GroupStoreProvider>
                <PartnerStoreProvider>
                  <FollowStoreProvider>
                    <ChatStoreProvider>
                      <NotificationStoreProvider>
                      <AdminStoreProvider>{children}</AdminStoreProvider>
                    </NotificationStoreProvider>
                    </ChatStoreProvider>
                  </FollowStoreProvider>
                </PartnerStoreProvider>
              </GroupStoreProvider>
            </EventStoreProvider>
          </ActivityStoreProvider>
          </SessionScope>
        </SocialStoreProvider>
      </body>
    </html>
  );
}
