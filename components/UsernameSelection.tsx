"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@shadcn-ui/button";
import { Input } from "@shadcn-ui/input";
import { Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { Id } from "../convex/_generated/dataModel";

export function UsernameSelection({
    user
}: {
    user: { _id: Id<"users">; name: string; username?: string }
}) {
    const [username, setUsernameInput] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const setUsernameMutation = useMutation(api.users.setUsername);

    useEffect(() => {
        // Generate suggestions based on name
        const baseName = user.name ? user.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : "user";

        const generated = [
            `${baseName}${Math.floor(100 + Math.random() * 900)}`,
            `${baseName}_${Math.floor(10 + Math.random() * 90)}`,
            `${baseName}${new Date().getFullYear().toString().slice(-2)}`,
        ];

        setSuggestions(generated);
        setUsernameInput(generated[0]);
    }, [user.name]);

    const handleSave = async () => {
        if (!username || username.trim().length < 3) {
            setError("Username must be at least 3 characters long");
            return;
        }

        const validRegex = /^[a-zA-Z0-9_]+$/;
        if (!validRegex.test(username)) {
            setError("Username can only contain letters, numbers, and underscores");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await setUsernameMutation({ username: username.toLowerCase() });
            // It will trigger a re-render in the parent because currentUser will naturally update via Convex reactivity
        } catch (err: any) {
            setError(err.message || "Failed to set username. It might be taken.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 w-full min-h-screen bg-[var(--wa-bg)]">
            <div className="w-full max-w-md bg-[var(--wa-sidebar-bg)] p-8 rounded-2xl border border-[var(--wa-border)] shadow-xl animate-fade-in-up">
                <div className="w-16 h-16 rounded-full bg-[var(--wa-green)]/10 flex items-center justify-center mb-6 mx-auto animate-float">
                    <Sparkles className="w-8 h-8 text-[var(--wa-green)]" />
                </div>

                <h2 className="text-2xl font-bold text-[var(--wa-text-primary)] mb-2">
                    Choose your username
                </h2>
                <p className="text-sm text-[var(--wa-text-secondary)] mb-8">
                    This is how people will find and connect with you on CipherChat.
                </p>

                <div className="space-y-4 text-left">
                    <div>
                        <label className="text-xs font-semibold text-[var(--wa-text-light)] uppercase tracking-wider mb-2 block">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--wa-text-light)] font-medium">@</span>
                            <Input
                                value={username}
                                onChange={(e) => {
                                    setUsernameInput(e.target.value);
                                    setError("");
                                }}
                                className="w-full h-12 pl-8 pr-4 bg-[var(--wa-input-bg)] border-[var(--wa-border)] text-[var(--wa-text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--wa-green)] focus-visible:border-[var(--wa-green)] rounded-xl"
                                placeholder="Enter a username..."
                                disabled={isLoading}
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs font-medium">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-[var(--wa-text-light)] uppercase tracking-wider mb-2 block">
                            Suggestions
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setUsernameInput(suggestion);
                                        setError("");
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${username === suggestion
                                        ? "bg-[var(--wa-green)]/10 text-[var(--wa-green)] border-[var(--wa-green)]/30"
                                        : "bg-[var(--wa-input-bg)] text-[var(--wa-text-primary)] border-[var(--wa-border)]/50 hover:bg-[var(--wa-hover)]"
                                        }`}
                                >
                                    @{suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full mt-8 h-12 bg-gradient-to-r from-[#00A884] to-[#25D366] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A884]/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Confirm Username <Check className="w-4 h-4" />
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
