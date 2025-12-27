import type { Note } from "@/types/note"
import type { Notebook } from "@/types/notebook"

export const mockNotebooks: Notebook[] = [
    {
        id: "notebook-1",
        name: "Personal",
        parentId: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
    },
    {
        id: "notebook-2",
        name: "Work",
        parentId: null,
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
    },
    {
        id: "notebook-3",
        name: "Projects",
        parentId: "notebook-2",
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
    },
    {
        id: "notebook-4",
        name: "Meeting Notes",
        parentId: "notebook-2",
        createdAt: new Date("2024-01-04"),
        updatedAt: new Date("2024-01-04"),
    },
    {
        id: "notebook-5",
        name: "Ideas",
        parentId: "notebook-1",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
    },
]

export const mockNotes: Note[] = [
    {
        id: "note-1",
        title: "Daily Journal",
        content: `# Daily Journal

## Today's Goals
- Complete the AI notebook app
- Review project requirements
- Plan next sprint

## Thoughts
Today was productive. The new notebook app is coming along well. The hierarchical structure makes it easy to organize thoughts and projects.

## Tomorrow
- Add more AI features
- Improve the search functionality
- Test with real data`,
        notebookId: "notebook-1",
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
    },
    {
        id: "note-2",
        title: "Project Planning",
        content: `# Project Planning

## Overview
This project aims to create a modern AI-powered notebook application with the following features:

- Hierarchical notebook organization
- Markdown editing with live preview
- Semantic search capabilities
- AI chat integration
- Clean, minimalist design

## Technical Stack
- React with TypeScript
- Tailwind CSS for styling
- AI SDK for AI features
- Markdown rendering

## Next Steps
1. Implement core functionality
2. Add AI features
3. Polish the UI/UX
4. Testing and optimization`,
        notebookId: "notebook-3",
        createdAt: new Date("2024-01-11"),
        updatedAt: new Date("2024-01-11"),
    },
    {
        id: "note-3",
        title: "Team Meeting - Jan 12",
        content: `# Team Meeting - January 12, 2024

## Attendees
- John Smith (PM)
- Sarah Johnson (Designer)
- Mike Chen (Developer)
- Lisa Wang (QA)

## Agenda
1. Sprint review
2. Upcoming deadlines
3. Resource allocation
4. Blockers and concerns

## Action Items
- [ ] Update project timeline
- [ ] Schedule design review
- [ ] Prepare demo for stakeholders
- [ ] Address performance issues

## Notes
The team is making good progress on the current sprint. We need to focus on the AI integration features next week.`,
        notebookId: "notebook-4",
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
    },
    {
        id: "note-4",
        title: "App Ideas",
        content: `# App Ideas

## AI-Powered Tools
- Smart note-taking app ✅ (in progress)
- Code review assistant
- Meeting summarizer
- Personal knowledge base

## Productivity Apps
- Time tracking with insights
- Habit tracker with AI coaching
- Smart calendar assistant
- Focus timer with ambient sounds

## Creative Tools
- Story writing assistant
- Music composition helper
- Art inspiration generator
- Photography workflow manager

## Notes
The AI notebook app is our current focus. Once completed, we can explore other ideas on this list.`,
        notebookId: "notebook-5",
        createdAt: new Date("2024-01-13"),
        updatedAt: new Date("2024-01-13"),
    },
]
