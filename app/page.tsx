"use client"

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Sidebar } from "../components/Sidebar";
import { ChatArea } from "../components/ChatArea";
import { UsernameSelection } from "../components/UsernameSelection";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Button } from "@shadcn-ui/button";
import {
  MessageCircle,
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  Send,
  Sparkles,
  Globe,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null);
  const getOrCreateConversation = useMutation(
    api.conversations.getOrCreateConversation
  );

  const currentUser = useQuery(api.users.getCurrentUser);

  const handleSelectUser = async (userId: string) => {
    try {
      const convId = await getOrCreateConversation({
        otherUserId: userId as Id<"users">,
      });
      setActiveConversationId(convId);
    } catch (error) {
      console.error("Error creating conversation", error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[var(--wa-bg)] overflow-hidden">
      <SignedOut>
        {/* ═══ LANDING PAGE ═══ */}
        <div className="min-h-screen flex flex-col relative bg-[#111B21]">
          {/* Animated background gradient */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#111B21] via-[#0a2e24] to-[#111B21] animate-gradient" />
            {/* Floating orbs */}
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#00A884]/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-[#25D366]/8 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#128C7E]/5 rounded-full blur-3xl" />
          </div>

          {/* Nav */}
          <header className="relative z-10 flex items-center justify-between px-6 md:px-10 h-16 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#00A884] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                ChatSync
              </span>
            </div>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-sm font-medium text-[#8696A0] hover:text-white hover:bg-white/5"
              >
                Sign In
              </Button>
            </SignInButton>
          </header>

          {/* Hero */}
          <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center overflow-y-auto">
            {/* Pill badge */}
            <div className="animate-fade-in-up flex items-center gap-2 bg-[#00A884]/10 border border-[#00A884]/20 text-[#25D366] text-xs font-medium px-4 py-1.5 rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Real-time messaging, redefined
            </div>

            <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight max-w-2xl leading-[1.1]"
              style={{ animationDelay: "0.1s" }}>
              Connect.{" "}
              <span className="gradient-text">Chat.</span>
              <br />
              <span className="text-[#8696A0]">Collaborate.</span>
            </h1>

            <p className="animate-fade-in-up mt-5 text-[#8696A0] text-base md:text-lg max-w-lg leading-relaxed"
              style={{ animationDelay: "0.2s" }}>
              Seamless conversations with your team and friends.
              Lightning-fast, beautifully simple, and always in sync.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3 mt-10"
              style={{ animationDelay: "0.3s" }}>
              <SignInButton mode="modal">
                <Button className="group bg-gradient-to-r from-[#00A884] to-[#25D366] text-white text-sm font-semibold px-7 py-3.5 h-auto rounded-xl hover:shadow-lg hover:shadow-[#00A884]/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </SignInButton>
              <Button
                variant="outline"
                className="text-[#8696A0] text-sm font-medium px-6 py-3.5 h-auto rounded-xl border-[#313D45] hover:border-[#8696A0]/50 hover:text-white bg-transparent hover:bg-transparent"
              >
                <Globe className="w-4 h-4" />
                Learn More
              </Button>
            </div>

            {/* Feature cards */}
            <div className="animate-fade-in-up mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full"
              style={{ animationDelay: "0.4s" }}>
              {[
                {
                  icon: <Zap className="w-4 h-4" />,
                  label: "Instant Delivery",
                  color: "text-amber-400",
                  bg: "bg-amber-400/10",
                },
                {
                  icon: <Users className="w-4 h-4" />,
                  label: "Live Presence",
                  color: "text-[#25D366]",
                  bg: "bg-[#25D366]/10",
                },
                {
                  icon: <ShieldCheck className="w-4 h-4" />,
                  label: "End-to-End Secure",
                  color: "text-sky-400",
                  bg: "bg-sky-400/10",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-[#313D45]/60 bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#8696A0]/30 transition-all duration-300 cursor-default"
                >
                  <div className={`${f.bg} ${f.color} p-2 rounded-lg shrink-0`}>
                    {f.icon}
                  </div>
                  <span className="text-sm font-medium text-[#E9EDEF]">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Glassmorphism preview card */}
            <div className="animate-fade-in-up mt-12 glass rounded-2xl p-5 max-w-sm w-full"
              style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#00A884]/20 flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-[#00A884]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-[#E9EDEF]">Preview</p>
                  <p className="text-[10px] text-[#8696A0]">This is how fast your messages arrive</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl rounded-bl-sm text-xs text-[#E9EDEF]">
                    Hey! How&apos;s the project going? 🚀
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#00A884]/20 px-3 py-1.5 rounded-xl rounded-br-sm text-xs text-[#E9EDEF]">
                    Almost done! Deploying now ⚡
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="relative z-10 text-center text-xs text-[#8696A0]/60 py-5 shrink-0">
            Built with Next.js, Convex &amp; Clerk
          </footer>
        </div>
      </SignedOut>

      <SignedIn>
        {currentUser === undefined || currentUser === null ? (
          <div className="flex-1 flex items-center justify-center bg-[var(--wa-bg)]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--wa-green)]" />
          </div>
        ) : !currentUser.username ? (
          <UsernameSelection user={currentUser as any} />
        ) : (
          <div className="flex-1 flex overflow-hidden w-full h-full">
            {/* Sidebar */}
            <div
              className={`${activeConversationId ? "hidden md:flex" : "flex"
                } w-full md:w-[420px] lg:w-[440px] h-full shrink-0 flex-col`}
            >
              <Sidebar
                onSelectUser={handleSelectUser}
                activeConversationId={activeConversationId}
              />
            </div>

            {/* Chat area */}
            <div
              className={`${!activeConversationId ? "hidden md:flex" : "flex"
                } flex-1 flex-col h-full min-w-0`}
            >
              {activeConversationId ? (
                <ChatArea
                  conversationId={activeConversationId}
                  onBack={() => setActiveConversationId(null)}
                />
              ) : (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-[var(--wa-bg)]">
                  <div className="w-24 h-24 mb-5 animate-float transform hover:scale-105 transition-transform">
                    <img src="/logo.svg" alt="CipherChat Logo" className="w-full h-full shadow-lg rounded-3xl" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--wa-text-primary)]">
                    CipherChat Web
                  </h2>
                  <p className="mt-2 text-sm text-[var(--wa-text-secondary)] max-w-sm leading-relaxed">
                    Send and receive messages in real-time. Select a conversation from the sidebar to get started.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-[var(--wa-text-light)]/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    End-to-end encrypted
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SignedIn>
    </div>
  );
}
