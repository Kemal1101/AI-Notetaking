"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { ScrollArea } from "./ui/scroll-area"
import { Send, Bot, User, Plus, Trash2 } from "lucide-react"
import type { Note } from "../types/note"
import type { ChatSession, Message } from "@/types/ai-chat"

interface AIChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    notes: Note[]
}

export function AIChatDialog({ open, onOpenChange, notes }: AIChatDialogProps) {
    const [input, setInput] = useState("")
    const [sessions, setSessions] = useState<ChatSession[]>([
        {
            id: "session-1",
            name: "New Chat",
            messages: [
                {
                    id: "1",
                    role: "assistant",
                    content:
                        "Hello! I can help you find information from your notes or answer questions based on your knowledge base. What would you like to know?",
                    timestamp: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ])
    const [activeSessionId, setActiveSessionId] = useState("session-1")
    const [isLoading, setIsLoading] = useState(false)

    const activeSession = sessions.find((s) => s.id === activeSessionId)
    const messages = activeSession?.messages || []

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            name: "New Chat",
            messages: [
                {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "Hello! I'm ready to help you with your notes. What would you like to discuss?",
                    timestamp: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        }

        setSessions((prev) => [...prev, newSession])
        setActiveSessionId(newSession.id)
    }

    const deleteSession = (sessionId: string) => {
        if (sessions.length <= 1) return

        setSessions((prev) => prev.filter((s) => s.id !== sessionId))

        if (activeSessionId === sessionId) {
            const remainingSessions = sessions.filter((s) => s.id !== sessionId)
            setActiveSessionId(remainingSessions[0]?.id || "")
        }
    }

    const handleSend = async () => {
        if (!input.trim() || isLoading || !activeSession) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        }

        setSessions((prev) =>
            prev.map((s) => {
                if (s.id === activeSessionId) {
                    const updatedMessages = [...s.messages, userMessage]
                    let updatedName = s.name

                    const hasOnlyInitialAssistantMessage = s.messages.length === 1 && s.messages[0].role === "assistant"

                    if (hasOnlyInitialAssistantMessage) {
                        updatedName = userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? "..." : "")
                    }

                    return { ...s, name: updatedName, messages: updatedMessages, updatedAt: new Date() }
                }
                return s
            }),
        )

        setInput("")
        setIsLoading(true)

        setTimeout(() => {
            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: generateAIResponse(input, notes),
                timestamp: new Date(),
            }

            setSessions((prev) =>
                prev.map((s) =>
                    s.id === activeSessionId ? { ...s, messages: [...s.messages, aiResponse], updatedAt: new Date() } : s,
                ),
            )

            setIsLoading(false)
        }, 1000)
    }

    const generateAIResponse = (query: string, notes: Note[]): string => {
        const relevantNotes = notes.filter(
            (note) =>
                note.content.toLowerCase().includes(query.toLowerCase()) ||
                note.title.toLowerCase().includes(query.toLowerCase()),
        )

        if (relevantNotes.length > 0) {
            return `Based on your notes, I found ${relevantNotes.length} relevant note(s). Here's what I can tell you:\n\n${relevantNotes
                .slice(0, 2)
                .map((note) => `**${note.title}**: ${note.content.substring(0, 200)}...`)
                .join("\n\n")}\n\nWould you like me to elaborate on any specific aspect?`
        }

        return `I couldn't find specific information about "${query}" in your notes. However, I can help you with general questions or suggest creating a new note about this topic. What would you like to do?`
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[700px] flex flex-col bg-gradient-to-br from-white to-gray-50">
                <DialogHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 pb-4">
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Ask AI
                        </DialogTitle>
                        <Button variant="outline" size="sm" onClick={createNewSession} className="bg-transparent hover:bg-blue-50">
                            <Plus className="h-4 w-4 mr-2" />
                            New Chat
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex flex-1 gap-4 min-h-0">
                    {/* Session Sidebar */}
                    <div className="w-48 border-r border-gray-200 pr-4 bg-gradient-to-b from-gray-50 to-white flex flex-col">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 px-2 py-1 bg-gray-100 rounded-md flex-shrink-0">
                            Chat Sessions
                        </h4>
                        <ScrollArea className="flex-1">
                            <div className="space-y-1 pr-2">
                                {sessions.map((session) => (
                                    <div key={session.id} className="flex items-center gap-1">
                                        <Button
                                            variant={activeSessionId === session.id ? "secondary" : "ghost"}
                                            size="sm"
                                            className={`flex-1 justify-start h-auto py-2 px-2 text-left flex-col items-start transition-all duration-200 ${activeSessionId === session.id
                                                ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 shadow-sm border-l-2 border-blue-500"
                                                : "hover:bg-gray-50 hover:shadow-sm"
                                                }`}
                                            onClick={() => setActiveSessionId(session.id)}
                                        >
                                            <span className="truncate w-full text-xs font-medium">{session.name}</span>
                                            <span className="text-[10px] text-gray-500 w-full mt-0.5">
                                                {session.createdAt.toLocaleDateString()}
                                            </span>
                                        </Button>
                                        {sessions.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-red-50 flex-shrink-0"
                                                onClick={() => deleteSession(session.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-white to-gray-50">
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-4 p-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                                        >
                                            <div className="flex-shrink-0">
                                                {message.role === "user" ? (
                                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                                        <User className="h-4 w-4 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                                        <Bot className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={`rounded-lg p-3 shadow-sm ${message.role === "user"
                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                                    : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200"
                                                    }`}
                                            >
                                                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                                <div className={`text-xs mt-1 ${message.role === "user" ? "opacity-70" : "opacity-60"}`}>
                                                    {message.timestamp.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                                <span className="text-sm text-gray-600">AI is thinking...</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        <div className="flex gap-2 pt-4 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 px-4 pb-4">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything about your notes..."
                                className="flex-1 min-h-[40px] max-h-[120px] bg-white border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="self-end bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
