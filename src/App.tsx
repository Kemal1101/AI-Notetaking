"use client"

import { useState } from "react"
import { Sidebar } from "./components/sidebar"
import { NoteEditor } from "./components/note-editor"
import { SearchDialog } from "./components/search-dialog"
import { AIChatDialog } from "./components/ai-chat-dialog"
import { Button } from "./components/ui/button"
import { Search, MessageSquare, Plus, FolderPlus, XCircle } from "lucide-react" // Import XCircle for clear button
import type { Note } from "./types/note"
import type { Notebook } from "./types/notebook"
import { mockNotebooks, mockNotes } from "./lib/mock-data"
import "./App.css"

export default function App() {
  const [notebooks, setNotebooks] = useState<Notebook[]>(mockNotebooks)
  const [notes, setNotes] = useState<Note[]>(mockNotes)
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(new Set())
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [isProcessingMove, setIsProcessingMove] = useState(false) // State for move operations
  const [isDeletingNotebook, setIsDeletingNotebook] = useState<string | null>(null) // State for deleting notebook
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null) // State for deleting note

  const currentNote = notes.find((note) => note.id === selectedNote)

  const handleNoteUpdate = (noteId: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((note) => (note.id === noteId ? { ...note, ...updates, updatedAt: new Date() } : note)))
  }

  const handleNotebookUpdate = (notebookId: string, updates: Partial<Notebook>) => {
    setNotebooks((prev) =>
      prev.map((notebook) =>
        notebook.id === notebookId ? { ...notebook, ...updates, updatedAt: new Date() } : notebook,
      ),
    )
  }

  const handleDeleteNotebook = async (notebookId: string) => {
    if (isDeletingNotebook === notebookId) return // Prevent double deletion

    setIsDeletingNotebook(notebookId) // Set loading for this specific notebook

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Delete all notes in this notebook and its children
    const notebookIdsToDelete = getAllChildNotebooks(notebookId)
    setNotes((prev) => prev.filter((note) => !notebookIdsToDelete.includes(note.notebookId)))

    // Delete the notebook and its children
    setNotebooks((prev) => prev.filter((notebook) => !notebookIdsToDelete.includes(notebook.id)))

    // Clear selection if deleted
    if (selectedNotebook === notebookId || notebookIdsToDelete.includes(selectedNotebook || "")) {
      setSelectedNotebook(null)
      setSelectedNote(null)
    }

    setIsDeletingNotebook(null) // Clear loading
  }

  const handleDeleteNote = async (noteId: string) => {
    if (isDeletingNote === noteId) return // Prevent double deletion

    setIsDeletingNote(noteId) // Set loading for this specific note

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    setNotes((prev) => prev.filter((note) => note.id !== noteId))

    // Clear selection if deleted
    if (selectedNote === noteId) {
      setSelectedNote(null)
    }

    setIsDeletingNote(null) // Clear loading
  }

  const getAllChildNotebooks = (parentId: string): string[] => {
    const children = notebooks.filter((nb) => nb.parentId === parentId)
    const allIds = [parentId]

    children.forEach((child) => {
      allIds.push(...getAllChildNotebooks(child.id))
    })

    return allIds
  }

  const handleMoveNote = async (noteId: string, targetNotebookId: string) => {
    setIsProcessingMove(true) // Start global loading for move
    await new Promise((resolve) => setTimeout(resolve, 800)) // Dummy delay

    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId ? { ...note, notebookId: targetNotebookId, updatedAt: new Date() } : note,
      ),
    )

    // Auto-expand target notebook
    setExpandedNotebooks((prev) => new Set([...prev, targetNotebookId]))
    setIsProcessingMove(false) // End global loading
  }

  const handleMoveNotebook = async (notebookId: string, targetParentId: string | null) => {
    // Prevent moving a notebook into itself or its children
    const childIds = getAllChildNotebooks(notebookId)
    if (targetParentId && childIds.includes(targetParentId)) {
      return
    }

    setIsProcessingMove(true) // Start global loading for move
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Dummy delay

    setNotebooks((prev) =>
      prev.map((notebook) =>
        notebook.id === notebookId ? { ...notebook, parentId: targetParentId, updatedAt: new Date() } : notebook,
      ),
    )

    // Auto-expand target parent if it exists
    if (targetParentId) {
      setExpandedNotebooks((prev) => new Set([...prev, targetParentId]))
    }
    setIsProcessingMove(false) // End global loading
  }

  const handleCreateNote = async () => {
    if (!selectedNotebook || isCreatingNote) return

    setIsCreatingNote(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart writing...",
      notebookId: selectedNotebook,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotes((prev) => [...prev, newNote])
    setSelectedNote(newNote.id)

    // Auto-expand the notebook when adding a note
    setExpandedNotebooks((prev) => new Set([...prev, selectedNotebook]))

    setIsCreatingNote(false)
  }

  const handleCreateNotebook = async () => {
    if (isCreatingNotebook) return

    setIsCreatingNotebook(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name: "New Notebook",
      parentId: selectedNotebook || null, // This correctly uses null if selectedNotebook is null
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotebooks((prev) => [...prev, newNotebook])

    // Auto-expand parent notebook when adding a child notebook
    if (selectedNotebook) {
      setExpandedNotebooks((prev) => new Set([...prev, selectedNotebook]))
    }

    setIsCreatingNotebook(false)
  }

  const handleClearSelection = () => {
    setSelectedNotebook(null)
    setSelectedNote(null)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Notetaking
            </h1>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNotebook}
              disabled={isCreatingNotebook}
              className="flex-1 bg-transparent"
            >
              {isCreatingNotebook ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Notebook
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNote}
              disabled={!selectedNotebook || isCreatingNote}
              className="flex-1 bg-transparent"
            >
              {isCreatingNote ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </>
              )}
            </Button>
          </div>
          {(selectedNotebook || selectedNote) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="w-full justify-center text-gray-600 hover:bg-gray-100"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Selection
            </Button>
          )}
        </div>

        <Sidebar
          notebooks={notebooks}
          notes={notes}
          selectedNotebook={selectedNotebook}
          selectedNote={selectedNote}
          onNotebookSelect={setSelectedNotebook}
          onNoteSelect={setSelectedNote}
          onNotebookUpdate={handleNotebookUpdate}
          onDeleteNotebook={handleDeleteNotebook}
          onDeleteNote={handleDeleteNote}
          onMoveNote={handleMoveNote}
          onMoveNotebook={handleMoveNotebook}
          expandedNotebooks={expandedNotebooks}
          setExpandedNotebooks={setExpandedNotebooks}
          isProcessingMove={isProcessingMove}
          isDeletingNotebook={isDeletingNotebook}
          isDeletingNote={isDeletingNote}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white overflow-x-hidden">
        {currentNote ? (
          <NoteEditor note={currentNote} onUpdate={handleNoteUpdate} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-medium mb-2">Select a note to start editing</h2>
              <p className="text-sm">Choose a note from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        notes={notes}
        onNoteSelect={(noteId) => {
          setSelectedNote(noteId)
          const note = notes.find((n) => n.id === noteId)
          if (note) {
            setSelectedNotebook(note.notebookId)
          }
          setSearchOpen(false)
        }}
      />

      <AIChatDialog open={chatOpen} onOpenChange={setChatOpen} notes={notes} />
    </div>
  )
}
