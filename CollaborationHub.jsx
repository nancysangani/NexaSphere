import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import collaborationService from '../services/collaborationService';
import '../styles/collaboration.css';

export default function CollaborationHub() {
  const { eventId } = useParams();
  const [data, setData] = useState({
    tasks: [],
    budget: [],
    team: [],
    discussions: [],
    docs: [],
    decisions: [],
  });
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    loadHubData();
  }, [eventId]);

  const loadHubData = async () => {
    setLoading(true);
    try {
      const res = await collaborationService.getEventHub(eventId);
      setData(res);
    } catch (err) {
      console.error('Failed to load hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:8080');
    setSocket(newSocket);

    newSocket.emit('join_event_hub', eventId);

    newSocket.on('task_created', (newTask) => {
      setData((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    });

    newSocket.on('new_comment', (newComment) => {
      setData((prev) => ({ ...prev, discussions: [...prev.discussions, newComment] }));
    });

    newSocket.on('doc_uploaded', (newDoc) => {
      setData((prev) => ({ ...prev, docs: [newDoc, ...prev.docs] }));
    });

    return () => newSocket.close();
  }, [eventId]);

  const exportEventPlan = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Event Plan: ${eventId}`, 14, 22);

    doc.setFontSize(12);
    doc.text('Tasks Summary', 14, 32);
    doc.autoTable({
      startY: 35,
      head: [['Title', 'Status', 'Due Date']],
      body: data.tasks.map((t) => [t.title, t.status, new Date(t.due_date).toLocaleDateString()]),
    });

    doc.text('Budget Summary', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Item', 'Budgeted', 'Actual', 'Status']],
      body: data.budget.map((b) => [
        b.item_name,
        `$${b.budgeted_amount}`,
        `$${b.actual_amount}`,
        b.status,
      ]),
    });

    doc.save(`Event_Plan_${eventId}.pdf`);
  };

  if (loading) return <div className="loading-skeleton">Loading Collaboration Hub...</div>;

  return (
    <div className="hub-container">
      <header className="hub-header">
        <div className="header-main">
          <h1>Organizer Collaboration Hub</h1>
          <button className="secondary-btn" onClick={exportEventPlan}>
            Export PDF Plan
          </button>
        </div>
        <div className="hub-tabs">
          <button
            className={activeTab === 'tasks' ? 'active' : ''}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={activeTab === 'docs' ? 'active' : ''}
            onClick={() => setActiveTab('docs')}
          >
            Documents
          </button>
          <button
            className={activeTab === 'budget' ? 'active' : ''}
            onClick={() => setActiveTab('budget')}
          >
            Budget
          </button>
          <button
            className={activeTab === 'discussions' ? 'active' : ''}
            onClick={() => setActiveTab('discussions')}
          >
            Discussions
          </button>
          <button
            className={activeTab === 'decisions' ? 'active' : ''}
            onClick={() => setActiveTab('decisions')}
          >
            Decision Log
          </button>
        </div>
      </header>
      ... (rest of file content omitted for brevity)
      <main className="hub-content">
        {activeTab === 'tasks' && (
          <section className="task-board">
            <div className="board-column">
              <h3>Backlog</h3>
              {data.tasks
                .filter((t) => t.status === 'BACKLOG')
                .map((task) => (
                  <div key={task.id} className="task-card">
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <span className="due-date">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
            {/* Add more columns for In Progress, Done, etc. */}
            <button className="add-btn">+ Create Task</button>
          </section>
        )}

        {activeTab === 'budget' && (
          <section className="budget-view">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Budgeted</th>
                  <th>Actual</th>
                  <th>Person Responsible</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.budget.map((item) => (
                  <tr key={item.id}>
                    <td>{item.item_name}</td>
                    <td>${item.budgeted_amount}</td>
                    <td>${item.actual_amount}</td>
                    <td>{item.responsible_person}</td>
                    <td>
                      <span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="budget-summary">
              <strong>Total Budget: </strong>$
              {data.budget
                .reduce((acc, curr) => acc + parseFloat(curr.budgeted_amount), 0)
                .toFixed(2)}
            </div>
          </section>
        )}

        {activeTab === 'discussions' && (
          <section className="discussion-threads">
            {/* Using the provided Disclosure styles for threads */}
            {data.discussions
              .filter((d) => !d.parent_id)
              .map((thread) => (
                <div key={thread.id} className="disclosure-container">
                  <button className="disclosure-trigger">
                    <span>Topic: {thread.topic}</span>
                    <span className="disclosure-icon">▼</span>
                  </button>
                  <div className="disclosure-content">
                    <div className="comment-body">
                      <strong>{thread.author_name}:</strong> {thread.content}
                    </div>
                    {/* Nested replies loop here */}
                  </div>
                </div>
              ))}
            <div className="post-box">
              <textarea placeholder="Start a new discussion..."></textarea>
              <button className="primary-btn">Post Message</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
