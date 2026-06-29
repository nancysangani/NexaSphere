# TODO - #1754 Real-Time Collaborative Whiteboard

- [ ] Create a minimal viable whiteboard component (canvas-based) with: pen/highlighter/eraser, shapes (rect/circle/triangle/line/arrow), text boxes, sticky notes, undo/redo per user.
- [ ] Implement event-linked whiteboard room routing + persistence (load/save state, autosave every 30s).
- [ ] Add real-time collaboration layer using existing socket infrastructure (Pusher/SocketProvider) and CRDT/operation log approach.
- [ ] Add presence indicators (colored cursors with names), pointer/laser tool, follow mode (presenter).
- [ ] Add templates (Kanban, mindmap, flowchart, SWOT, lean canvas) pre-populating initial state.
- [ ] Implement sticky note voting (each participant has 3 votes), reveal mode, grouping, summary generation.
- [ ] Implement export service: PNG, SVG, PDF.
- [ ] Add performance optimizations: pan/zoom smooth, lazy loading for large boards, ensure 1000+ elements handling.
- [ ] Mobile/touch drawing support.
- [ ] Add QA/concurrency test plan + minimal automated tests where possible.
