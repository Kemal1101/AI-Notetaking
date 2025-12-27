"use client"

import type React from "react"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { cn } from "../lib/utils"
import type { Note } from "../types/note"
import type { Notebook } from "../types/notebook"

interface SidebarProps {
    notebooks: Notebook[]
    notes: Note[]
    selectedNotebook: string | null
    selectedNote: string | null
    onNotebookSelect: (notebookId: string) => void
    onNoteSelect: (noteId: string) => void
    onNotebookUpdate: (notebookId: string, updates: Partial<Notebook>) => void
    onDeleteNotebook: (notebookId: string) => void
    onDeleteNote: (noteId: string) => void
    onMoveNote: (noteId: string, targetNotebookId: string) => void
    onMoveNotebook: (notebookId: string, targetParentId: string | null) => void
    expandedNotebooks: Set<string>
    setExpandedNotebooks: (expanded: Set<string>) => void
    isProcessingMove: boolean
    isDeletingNotebook: string | null // New prop
    isDeletingNote: string | null // New prop
}

export function Sidebar({
    notebooks,
    notes,
    selectedNotebook,
    selectedNote,
    onNotebookSelect,
    onNoteSelect,
    onNotebookUpdate,
    onDeleteNotebook,
    onDeleteNote,
    onMoveNote,
    onMoveNotebook,
    expandedNotebooks,
    setExpandedNotebooks,
    isProcessingMove,
    isDeletingNotebook, // Destructure new prop
    isDeletingNote, // Destructure new prop
}: SidebarProps) {
    const [editingNotebook, setEditingNotebook] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")
    const [draggedItem, setDraggedItem] = useState<{ type: "notebook" | "note"; id: string } | null>(null)
    const [dragOverItem, setDragOverItem] = useState<{ type: "notebook" | "note"; id: string } | null>(null)
    const [isSavingNotebookName, setIsSavingNotebookName] = useState(false)

    const toggleNotebook = (notebookId: string) => {
        const newExpanded = new Set(expandedNotebooks)
        if (newExpanded.has(notebookId)) {
            newExpanded.delete(notebookId)
        } else {
            newExpanded.add(notebookId)
        }
        setExpandedNotebooks(newExpanded)
    }

    const buildNotebookTree = (parentId: string | null = null): Notebook[] => {
        return notebooks.filter((notebook) => notebook.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name))
    }

    const getNotebookNotes = (notebookId: string): Note[] => {
        return notes.filter((note) => note.notebookId === notebookId).sort((a, b) => a.title.localeCompare(b.title))
    }

    const startEditingNotebook = (notebook: Notebook) => {
        setEditingNotebook(notebook.id)
        setEditingName(notebook.name)
    }

    const saveNotebookName = async () => {
        if (editingNotebook && editingName.trim()) {
            setIsSavingNotebookName(true) // Start loading
            await new Promise((resolve) => setTimeout(resolve, 500)) // Dummy delay
            onNotebookUpdate(editingNotebook, { name: editingName.trim() })
            setIsSavingNotebookName(false) // End loading
        }
        setEditingNotebook(null)
        setEditingName("")
    }

    const cancelEditingNotebook = () => {
        setEditingNotebook(null)
        setEditingName("")
    }

    const handleDragStart = (e: React.DragEvent, type: "notebook" | "note", id: string) => {
        if (isProcessingMove || isDeletingNotebook || isDeletingNote) {
            e.preventDefault() // Prevent dragging if another operation is in progress
            return
        }
        e.stopPropagation()
        setDraggedItem({ type, id })
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setData("text/plain", `${type}:${id}`) // Set data for cross-browser compatibility
    }

    const handleDragOver = (e: React.DragEvent, type: "notebook" | "note", id: string) => {
        if (isProcessingMove || isDeletingNotebook || isDeletingNote) {
            e.preventDefault() // Prevent drag over if another operation is in progress
            return
        }
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = "move"
        setDragOverItem({ type, id })
    }

    const handleDragLeave = () => {
        setDragOverItem(null)
    }

    const handleDrop = (e: React.DragEvent, targetType: "notebook" | "note", targetId: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (isProcessingMove || isDeletingNotebook || isDeletingNote) return // Prevent drop if another operation is in progress

        const data = e.dataTransfer.getData("text/plain")
        if (!data) return

        const [draggedType, draggedId] = data.split(":") as ["notebook" | "note", string]

        if (draggedType === "note" && targetType === "notebook") {
            onMoveNote(draggedId, targetId)
        } else if (draggedType === "notebook" && targetType === "notebook") {
            if (draggedId !== targetId) {
                onMoveNotebook(draggedId, targetId)
            }
        }

        setDraggedItem(null)
        setDragOverItem(null)
    }

    const handleDropOnRoot = (e: React.DragEvent) => {
        e.preventDefault()

        if (isProcessingMove || isDeletingNotebook || isDeletingNote) return // Prevent drop if another operation is in progress

        const data = e.dataTransfer.getData("text/plain")
        if (!data) return

        const [draggedType, draggedId] = data.split(":") as ["notebook" | "note", string]

        if (draggedType === "notebook") {
            onMoveNotebook(draggedId, null)
        }

        setDraggedItem(null)
        setDragOverItem(null)
    }

    const renderNotebook = (notebook: Notebook, level = 0) => {
        const children = buildNotebookTree(notebook.id)
        const notebookNotes = getNotebookNotes(notebook.id)
        const isExpanded = expandedNotebooks.has(notebook.id)
        const isSelected = selectedNotebook === notebook.id
        const hasChildren = children.length > 0 || notebookNotes.length > 0
        const isEditing = editingNotebook === notebook.id
        const isDragOver = dragOverItem?.type === "notebook" && dragOverItem.id === notebook.id
        const isThisNotebookDeleting = isDeletingNotebook === notebook.id

        return (
            <div key={notebook.id}>
                <div
                    className={cn(
                        "flex items-center group",
                        isDragOver && "bg-blue-100 border-2 border-blue-300 border-dashed rounded",
                    )}
                    draggable={!isEditing && !isProcessingMove && !isThisNotebookDeleting} // Disable drag if editing, move, or deleting
                    onDragStart={(e) => handleDragStart(e, "notebook", notebook.id)}
                    onDragOver={(e) => handleDragOver(e, "notebook", notebook.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "notebook", notebook.id)}
                >
                    <Button
                        variant="ghost"
                        className={cn(
                            "flex-1 justify-start h-9 px-2 font-normal transition-all duration-200",
                            isSelected &&
                            "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm border-l-2 border-blue-500",
                            !isSelected && "hover:bg-gray-50 hover:shadow-sm",
                            level > 0 && "bg-gray-25",
                        )}
                        style={{ paddingLeft: `${level * 16 + 8}px` }}
                        onClick={() => {
                            if (!isEditing && !isProcessingMove && !isThisNotebookDeleting) {
                                onNotebookSelect(notebook.id)
                                if (hasChildren) {
                                    toggleNotebook(notebook.id)
                                }
                            }
                        }}
                        disabled={isProcessingMove || isThisNotebookDeleting} // Disable button if move or delete is processing
                    >
                        <div className="w-4 flex justify-center mr-1">
                            {hasChildren &&
                                (isExpanded ? (
                                    <ChevronDown className="h-3 w-3 text-gray-600" />
                                ) : (
                                    <ChevronRight className="h-3 w-3 text-gray-600" />
                                ))}
                        </div>
                        {isExpanded ? (
                            <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
                        ) : (
                            <Folder className="h-4 w-4 mr-2 text-blue-600" />
                        )}
                        {isEditing ? (
                            <div className="flex items-center flex-1">
                                <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={saveNotebookName}
                                    onKeyDown={(e) => {
                                        e.stopPropagation() // Prevent button click from firing
                                        if (e.key === "Enter") {
                                            saveNotebookName()
                                        } else if (e.key === "Escape") {
                                            cancelEditingNotebook()
                                        }
                                    }}
                                    className="h-6 text-sm border-none p-0 focus-visible:ring-1 focus-visible:ring-blue-500 flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()} // Prevent button click from firing
                                    disabled={isSavingNotebookName} // Disable input while saving
                                />
                                {isSavingNotebookName && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
                                )}
                            </div>
                        ) : (
                            <span className="truncate flex-1 text-left">{notebook.name}</span>
                        )}
                    </Button>

                    {!isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()} // Prevent button click from firing
                                    disabled={isProcessingMove || isSavingNotebookName || isThisNotebookDeleting} // Disable dropdown if any operation is processing
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        startEditingNotebook(notebook)
                                    }}
                                    disabled={isSavingNotebookName || isProcessingMove || isThisNotebookDeleting} // Disable if already saving or other operations
                                >
                                    <Edit2 className="h-3 w-3 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteNotebook(notebook.id)
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                    disabled={isProcessingMove || isThisNotebookDeleting} // Disable if move or delete is processing
                                >
                                    {isThisNotebookDeleting ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                                            Deleting...
                                        </div>
                                    ) : (
                                        <>
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {isExpanded && (
                    <div className="bg-gradient-to-r from-gray-25 to-transparent">
                        {/* Render notes first */}
                        {notebookNotes.map((note) => {
                            const isDragOverNote = dragOverItem?.type === "note" && dragOverItem.id === note.id
                            const isThisNoteDeleting = isDeletingNote === note.id

                            return (
                                <div
                                    key={note.id}
                                    className={cn(
                                        "flex items-center group",
                                        isDragOverNote && "bg-blue-100 border-2 border-blue-300 border-dashed rounded",
                                    )}
                                    draggable={!isProcessingMove && !isThisNoteDeleting} // Disable drag if move or deleting
                                    onDragStart={(e) => handleDragStart(e, "note", note.id)}
                                    onDragOver={(e) => handleDragOver(e, "note", note.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, "note", note.id)}
                                >
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "flex-1 justify-start h-8 px-2 font-normal transition-all duration-200",
                                            selectedNote === note.id &&
                                            "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm border-l-2 border-blue-400",
                                            selectedNote !== note.id && "hover:bg-gray-50 text-gray-700",
                                        )}
                                        style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                                        onClick={() => {
                                            if (!isProcessingMove && !isThisNoteDeleting) {
                                                onNoteSelect(note.id)
                                                onNotebookSelect(notebook.id)
                                            }
                                        }}
                                        disabled={isProcessingMove || isThisNoteDeleting} // Disable button if move or delete is processing
                                    >
                                        <div className="w-4 mr-1"></div>
                                        <FileText className="h-3.5 w-3.5 mr-2 text-gray-500" />
                                        <span className="truncate text-sm flex-1 text-left">{note.title}</span>
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()} // Prevent button click from firing
                                                disabled={isProcessingMove || isThisNoteDeleting} // Disable dropdown if any operation is processing
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteNote(note.id)
                                                }}
                                                className="text-red-600 focus:text-red-600"
                                                disabled={isProcessingMove || isThisNoteDeleting} // Disable if move or delete is processing
                                            >
                                                {isThisNoteDeleting ? (
                                                    <div className="flex items-center">
                                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                                                        Deleting...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                        Delete
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )
                        })}

                        {/* Then render child notebooks */}
                        {children.map((child) => renderNotebook(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    const rootNotebooks = buildNotebookTree()

    return (
        <div
            className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white"
            onDragOver={(e) => {
                if (isProcessingMove || isDeletingNotebook || isDeletingNote) return // Prevent drag over if another operation is in progress
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
            }}
            onDrop={(e) => {
                if (isProcessingMove || isDeletingNotebook || isDeletingNote) return // Prevent drop if another operation is in progress
                handleDropOnRoot(e)
            }}
        >
            <div className="p-2">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 px-2 py-1 bg-gray-100 rounded-md">Notebooks & Notes</h3>
                <div className="space-y-1">{rootNotebooks.map((notebook) => renderNotebook(notebook))}</div>
            </div>
        </div>
    )
}
