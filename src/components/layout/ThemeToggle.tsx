"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const toggleTheme = () => {
        // If it's light (or system resolving to light), switch to dark
        // Otherwise switch to light
        const currentTheme = theme === "system" ? resolvedTheme : theme;
        setTheme(currentTheme === "dark" ? "light" : "dark");
    };

    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl text-muted-foreground dark:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-accent hover:text-foreground dark:hover:bg-slate-800 dark:hover:text-foreground transition-colors"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">تبديل السمة</span>
        </Button>
    );
}
