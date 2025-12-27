"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"
import { Eye, Edit, Save } from "lucide-react"
import type { Note } from "../types/note"
import { formatUpdatedAt } from "../lib/date"

interface NoteEditorProps {
    note: Note
    onUpdate: (noteId: string, updates: Partial<Note>) => void
}

export function NoteEditor({ note, onUpdate }: NoteEditorProps) {
    const [isPreview, setIsPreview] = useState(false)
    const [content, setContent] = useState(note.content)
    const [title, setTitle] = useState(note.title)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        setContent(note.content)
        setTitle(note.title)
        setHasChanges(false)
    }, [note.id, note.content, note.title])

    useEffect(() => {
        setHasChanges(content !== note.content || title !== note.title)
    }, [content, title, note.content, note.title])

    const handleSave = () => {
        onUpdate(note.id, { content, title })
        setHasChanges(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault()
            handleSave()
        }
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                        placeholder="Note title..."
                    />
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <Button variant="outline" size="sm" onClick={handleSave} className="h-8 bg-transparent">
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setIsPreview(!isPreview)} className="h-8">
                            {isPreview ? (
                                <>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    {formatUpdatedAt(note.updatedAt)}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {isPreview ? (
                    <div className="h-full overflow-auto p-6 bg-white">
                        <div className="max-w-4xl mx-auto prose prose-gray">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="h-full p-6 bg-white">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Start writing your note..."
                            className="w-full h-full resize-none border-none p-0 focus-visible:ring-0 font-mono text-sm"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
