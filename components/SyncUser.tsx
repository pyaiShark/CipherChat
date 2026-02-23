"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";

export function SyncUser() {
    const { user, isLoaded } = useUser();
    const upsertUser = useMutation(api.users.upsertUser);
    const heartbeat = useMutation(api.users.heartbeat);
    const setOffline = useMutation(api.users.setOffline);

    useEffect(() => {
        if (isLoaded && user) {
            upsertUser({
                name: user.fullName || user.firstName || "Unknown User",
                email: user.primaryEmailAddress?.emailAddress || "",
                avatar: user.imageUrl,
                clerkId: user.id,
            }).catch(console.error);

            // Heartbeat
            const interval = setInterval(() => {
                heartbeat().catch(console.error);
            }, 10000);

            // Handle tab close/hide
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    setOffline().catch(console.error);
                } else {
                    heartbeat().catch(console.error);
                }
            };

            const handleBeforeUnload = () => {
                setOffline().catch(console.error);
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                clearInterval(interval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('beforeunload', handleBeforeUnload);
                setOffline().catch(console.error);
            };
        }
    }, [user, isLoaded, upsertUser, heartbeat, setOffline]);

    return null;
}
