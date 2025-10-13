// src/components/rich-text-viewer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { ListItem } from "@tiptap/extension-list-item";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";

interface RichTextViewerProps {
    content: string;
    className?: string;
}

/**
 * RichTextViewer Component
 * 
 * Renders rich HTML content (from Tiptap editor) in a read-only format.
 * Uses Tiptap's editor with editable=false to ensure consistent rendering
 * with the same CSS and formatting as the editor.
 */
const RichTextViewer: React.FC<RichTextViewerProps> = ({
    content,
    className = "",
}) => {
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component only renders on client side
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const editor = useEditor({
        immediatelyRender: false, // SSR-safe
        extensions: [
            StarterKit.configure({
                bulletList: {
                    HTMLAttributes: {
                        class: "list-disc ml-4",
                    },
                },
                orderedList: {
                    HTMLAttributes: {
                        class: "list-decimal ml-4",
                    },
                },
                listItem: {
                    HTMLAttributes: {
                        class: "mb-1",
                    },
                },
            }),
            Link.configure({
                openOnClick: true, // Allow clicking links in read-only mode
                HTMLAttributes: {
                    class: "text-blue-600 hover:text-blue-800 underline",
                    target: "_blank",
                    rel: "noopener noreferrer nofollow",
                },
            }),
            Color,
            TextStyle,
            ListItem,
            BulletList.configure({
                HTMLAttributes: {
                    class: "list-disc ml-4",
                },
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: "list-decimal ml-4",
                },
            }),
        ],
        content,
        editable: false, // Read-only mode
        editorProps: {
            attributes: {
                class: "focus:outline-none", // Remove focus outline
            },
        },
    });

    // Update content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [editor, content]);

    // Don't render until mounted on client
    if (!isMounted) {
        return (
            <div className={`min-h-[100px] w-full ${className}`}>
                <div className="text-gray-500 animate-pulse">Loading content...</div>
            </div>
        );
    }

    if (!editor) {
        return (
            <div className={`min-h-[100px] w-full ${className}`}>
                <div className="text-gray-500">Loading content...</div>
            </div>
        );
    }

    return (
        <div className={`prose prose-sm max-w-none ${className}`}>
            <EditorContent editor={editor} />
        </div>
    );
};

export default RichTextViewer;