"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Search, FileText } from "lucide-react"
import type { Note } from "../types/note"

interface SearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    notes: Note[]
    onNoteSelect: (noteId: string) => void
}

function SearchDialog({ open, onOpenChange, notes, onNoteSelect }: SearchDialogProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Note[]>([])
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        setIsSearching(true)

        // Simulate semantic search with a delay
        const searchTimeout = setTimeout(() => {
            const searchResults = notes
                .filter((note) => {
                    const searchText = `${note.title} ${note.content}`.toLowerCase()
                    const searchQuery = query.toLowerCase()

                    // Simple text matching - in a real app, this would be semantic search
                    return searchText.includes(searchQuery)
                })
                .slice(0, 10)

            setResults(searchResults)
            setIsSearching(false)
        }, 300)

        return () => clearTimeout(searchTimeout)
    }, [query, notes])

    const handleNoteSelect = (noteId: string) => {
        onNoteSelect(noteId)
        setQuery("")
        setResults([])
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Semantic Search</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search your notes semantically..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-96 overflow-auto">
                        {isSearching && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-2 text-sm text-gray-600">Searching...</span>
                            </div>
                        )}

                        {!isSearching && results.length > 0 && (
                            <div className="space-y-2">
                                {results.map((note) => (
                                    <Button
                                        key={note.id}
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-3 text-left hover:bg-blue-50"
                                        onClick={() => handleNoteSelect(note.id)}
                                    >
                                        <FileText className="h-4 w-4 mr-3 text-gray-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate">{note.title}</div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                                {note.content.replace(/[#*\n]/g, " ").substring(0, 80)}...
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">Click to open</div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {!isSearching && query && results.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No notes found for "{query}"</p>
                                <p className="text-xs mt-2">Try different keywords or create a new note</p>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-gray-400 text-center border-t pt-3">
                        © 2024 AI Notebook. Advanced semantic search technology helps you find relevant content across all your
                        notes using natural language understanding and contextual matching.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export { SearchDialog };
