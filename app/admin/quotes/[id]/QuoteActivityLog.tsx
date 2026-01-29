'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Clock, ArrowRight, MessageSquare, Phone, Mail, UserPlus, FileText, Plus } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  details: Record<string, any>;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
  };
}

interface QuoteActivityLogProps {
  quoteId: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  status_change: <ArrowRight className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
  assignment: <UserPlus className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
  call_logged: <Phone className="h-4 w-4" />,
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
};

export function QuoteActivityLog({ quoteId }: QuoteActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [quoteId]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/activities`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'note',
          details: { content: newNote.trim() },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities([data.activity, ...activities]);
        setNewNote('');
        setShowNoteForm(false);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogCall = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'call_logged',
          details: { timestamp: new Date().toISOString() },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities([data.activity, ...activities]);
      }
    } catch (error) {
      console.error('Failed to log call:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityDescription = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'status_change':
        return (
          <span>
            Changed status from{' '}
            <span className="font-medium">{statusLabels[activity.details.from] || activity.details.from}</span>
            {' '}to{' '}
            <span className="font-medium">{statusLabels[activity.details.to] || activity.details.to}</span>
          </span>
        );
      case 'note':
        return (
          <span>
            Added a note: <span className="text-slate-600">"{activity.details.content}"</span>
          </span>
        );
      case 'assignment':
        return activity.details.to_rep_id 
          ? 'Assigned a sales rep'
          : 'Removed sales rep assignment';
      case 'email_sent':
        return 'Sent an email to customer';
      case 'call_logged':
        return 'Logged a call';
      default:
        return activity.activity_type;
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-800">Activity</h2>
        <div className="flex gap-2">
          <button
            onClick={handleLogCall}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-50 disabled:opacity-50"
          >
            <Phone className="h-3.5 w-3.5" />
            Log Call
          </button>
          <button
            onClick={() => setShowNoteForm(!showNoteForm)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </button>
        </div>
      </div>

      {/* Add Note Form */}
      {showNoteForm && (
        <div className="mb-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this quote..."
            rows={3}
            className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowNoteForm(false);
                setNewNote('');
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || isSubmitting}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-slate-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              {/* Icon */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-500">
                {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">{activity.user?.full_name || 'System'}</span>
                  {' '}
                  {getActivityDescription(activity)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
