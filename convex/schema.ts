import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        username: v.optional(v.string()),
        avatar: v.optional(v.string()),
        clerkId: v.string(),
        isOnline: v.boolean(),
        lastSeen: v.number(),
    }).index("by_clerkId", ["clerkId"]),

    conversations: defineTable({
        participantIds: v.array(v.id("users")),
        lastMessageId: v.optional(v.id("messages")),
        updatedAt: v.number(),
        isGroup: v.optional(v.boolean()),
        groupName: v.optional(v.string()),
        groupAvatar: v.optional(v.string()),
        adminId: v.optional(v.id("users")),
    }),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        isDeleted: v.optional(v.boolean()),
        reactions: v.optional(
            v.array(
                v.object({
                    emoji: v.string(),
                    users: v.array(v.id("users")),
                })
            )
        ),
    }).index("by_conversationId", ["conversationId"]),

    typingIndicators: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        expiresAt: v.number(),
    }).index("by_conversationId", ["conversationId"]),

    unreadCounts: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        count: v.number(),
    }).index("by_user_conversation", ["userId", "conversationId"]),
});
