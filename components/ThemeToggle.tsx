"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@shadcn-ui/button";

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const root = document.documentElement;
        setIsDark(root.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        const newDark = !isDark;
        if (newDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        setIsDark(newDark);
        localStorage.setItem("theme", newDark ? "dark" : "light");
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg text-[var(--wa-text-light)] hover:bg-[var(--wa-hover)] transition-colors"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
        </Button>
    );
}
