
import React, { useState, useMemo } from 'react';
import { TimelineEvent } from '../types';
import { FilterIcon, EditIcon, TrashIcon, SaveIcon, XIcon, CheckIcon, AlertIcon, TimelineIcon } from './Icons';

interface TimelineViewProps {
  events: TimelineEvent[];
  onEdit: (index: number, updatedEvent: TimelineEvent) => void;
  onDelete: (index: number) => void;
  onAdd?: (event: TimelineEvent) => void; // New Prop
}

const TimelineView: React.FC<TimelineViewProps> = ({ events, onEdit, onDelete, onAdd }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  
  // Editing State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<TimelineEvent | null>(null);

  // Manual Add State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState<TimelineEvent>({
      date: '',
      event: '',
      category: 'General',
      severity: 'Medium',
      sourceDoc: 'Manual Entry',
      quote: ''
  });

  // Derive Categories from events
  const categories = useMemo(() => {
    const cats = new Set(events.map(e => e.category || 'General'));
    return Array.from(cats);
  }, [events]);

  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date(NaN);
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;
    
    const ukDateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
    const ukMatch = dateStr.match(ukDateRegex);
    if (ukMatch) {
      const [_, day, month, year] = ukMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    const naturalTimestamp = Date.parse(dateStr);
    if (!isNaN(naturalTimestamp)) return new Date(naturalTimestamp);

    return new Date(NaN);
  };

  const filteredEvents = events
    .map((e, index) => ({ ...e, originalIndex: index })) // Keep track of original index for editing
    .filter(e => {
      // Safe filtering with fallback strings to prevent toLowerCase() on undefined
      if (filterSeverity !== 'all' && (e.severity || '').toLowerCase() !== filterSeverity.toLowerCase()) return false;
      if (filterCategory !== 'all' && (e.category || '') !== filterCategory) return false;
      if (filterTag !== 'all' && e.relevanceTag !== filterTag) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = parseDate(a.date).getTime();
      const dateB = parseDate(b.date).getTime();
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    });

  const getSeverityColor = (severity: string) => {
    if (!severity) return 'bg-blue-400';
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-400';
    }
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
        case 'Support': return 'bg-yellow-100 border-yellow-300 shadow-yellow-100';
        case 'Contradiction': return 'bg-pink-100 border-pink-300 shadow-pink-100';
        case 'Timeline': return 'bg-blue-100 border-blue-300 shadow-blue-100';
        default: return 'bg-white border-slate-200 shadow-sm';
    }
  };

  const startEditing = (index: number, event: TimelineEvent) => {
    setEditingIndex(index);
    setEditForm({ ...event });
  };

  const saveEditing = (originalIndex: number) => {
    if (editForm) {
      onEdit(originalIndex, editForm);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const toggleTag = (originalIndex: number, event: TimelineEvent, tag: 'Support' | 'Contradiction' | 'Timeline') => {
      const newTag = event.relevanceTag === tag ? undefined : tag; // Toggle off if same
      onEdit(originalIndex, { ...event, relevanceTag: newTag });
  };

  const handleAddSubmit = () => {
      if (!newEvent.date || !newEvent.event) return;
      if (onAdd) {
          onAdd(newEvent);
          setShowAddForm(false);
          setNewEvent({
            date: '',
            event: '',
            category: 'General',
            severity: 'Medium',
            sourceDoc: 'Manual Entry',
            quote: ''
          });
      }
  };

  // Helper to calculate date diff
  const getDaysDiff = (date1: string, date2: string) => {
      const d1 = parseDate(date1).getTime();
      const d2 = parseDate(date2).getTime();
      if (isNaN(d1) || isNaN(d2)) return 0;
      return Math.round(Math.abs((d1 - d2) / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg mb-6 shadow-sm sticky top-0 z-20 overflow-x-auto">
        <div className="text-slate-400"><FilterIcon /></div>
        <select 
          value={filterSeverity} 
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select 
          value={filterCategory} 
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={filterTag} 
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
        >
          <option value="all">All Tags</option>
          <option value="Support">🟡 Supporting</option>
          <option value="Contradiction">🔴 Contradiction</option>
          <option value="Timeline">🔵 Timeline Link</option>
        </select>
        
        <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
        >
            {showAddForm ? <XIcon /> : <TimelineIcon />} {showAddForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {showAddForm && (
          <div className="mb-6 bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm animate-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-blue-800 uppercase mb-4">Add Manual Timeline Entry</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <input 
                      type="date" 
                      className="p-2 border rounded text-sm"
                      value={newEvent.date}
                      onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                  />
                  <select 
                      className="p-2 border rounded text-sm"
                      value={newEvent.severity}
                      onChange={e => setNewEvent({...newEvent, severity: e.target.value as any})}
                  >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                  </select>
                  <input 
                      type="text" 
                      placeholder="Category (e.g. CSP, Grievance)"
                      className="p-2 border rounded text-sm"
                      value={newEvent.category}
                      onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                  />
                  <select
                      className="p-2 border rounded text-sm"
                      value={newEvent.relevanceTag || ''}
                      onChange={e => setNewEvent({...newEvent, relevanceTag: e.target.value as any})}
                  >
                      <option value="">No Tag</option>
                      <option value="Support">Support (Yellow)</option>
                      <option value="Contradiction">Contradiction (Pink)</option>
                      <option value="Timeline">Timeline Link (Blue)</option>
                  </select>
              </div>
              <textarea 
                  className="w-full p-3 border rounded text-sm mb-4 h-20"
                  placeholder="Event description..."
                  value={newEvent.event}
                  onChange={e => setNewEvent({...newEvent, event: e.target.value})}
              />
              <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-500 text-sm">Cancel</button>
                  <button onClick={handleAddSubmit} className="px-6 py-2 bg-blue-600 text-white rounded font-bold text-sm">Save Event</button>
              </div>
          </div>
      )}

      <div className="relative pb-10 flex-1">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
        
        <div className="space-y-8">
          {filteredEvents.length === 0 && !showAddForm && (
             <div className="text-center py-10 text-slate-400">No events found. Add one manually or upload documents.</div>
          )}

          {filteredEvents.map((eventWrapper, idx) => {
            const { originalIndex, ...event } = eventWrapper;
            const isEditing = editingIndex === originalIndex;
            
            // Gap Detection
            const prevEvent = idx > 0 ? filteredEvents[idx - 1] : null;
            const daysDiff = prevEvent ? getDaysDiff(event.date, prevEvent.date) : 0;
            const isLongGap = daysDiff > 90; // 3 months

            return (
              <React.Fragment key={originalIndex}>
                  {/* Visual Gap Warning */}
                  {isLongGap && (
                      <div className="relative pl-24 my-4 group cursor-help">
                          <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-100 border-2 border-red-500 rounded-full z-10 flex items-center justify-center text-[8px] text-red-600 font-bold">!</div>
                          <div className="border-l-2 border-dashed border-red-300 ml-4 pl-4 py-2 bg-red-50 rounded text-xs text-red-700 font-bold flex items-center gap-2">
                              <AlertIcon className="w-3 h-3" /> Warning: {daysDiff} Day Gap - Potential Time Bar Risk
                          </div>
                      </div>
                  )}

                  <div className="relative pl-24 group">
                    {/* Date Marker */}
                    <div className="absolute left-0 top-1 text-xs font-bold text-slate-500 w-20 text-right truncate" title={event.date}>
                    {isEditing ? (
                        <input 
                        type="text" 
                        value={editForm?.date} 
                        onChange={(e) => setEditForm(prev => prev ? {...prev, date: e.target.value} : null)}
                        className="w-full text-right border rounded px-1 text-xs"
                        />
                    ) : (
                        event.date || 'Unknown Date'
                    )}
                    </div>
                    
                    {/* Timeline Dot */}
                    <div className={`absolute left-8 top-2 w-4 h-4 rounded-full border-4 border-white shadow-sm -translate-x-1/2 z-10 ${getSeverityColor(event.severity || 'Low')}`}></div>

                    {/* Content Card */}
                    <div className={`p-5 rounded-lg border transition-all relative ${getTagColor(event.relevanceTag)} ${isEditing ? 'border-blue-500 ring-2 ring-blue-100' : 'hover:shadow-md'}`}>
                    
                    {/* Tagging Buttons (Traffic Light System) */}
                    {!isEditing && (
                        <div className="absolute -top-3 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full border shadow-sm">
                            <button 
                                onClick={() => toggleTag(originalIndex, event, 'Support')}
                                className={`w-4 h-4 rounded-full bg-yellow-400 hover:scale-110 border border-yellow-500 transition-transform ${event.relevanceTag === 'Support' ? 'ring-2 ring-yellow-200' : ''}`}
                                title="Mark as Supporting My Claim (Yellow)"
                            />
                            <button 
                                onClick={() => toggleTag(originalIndex, event, 'Contradiction')}
                                className={`w-4 h-4 rounded-full bg-pink-500 hover:scale-110 border border-pink-600 transition-transform ${event.relevanceTag === 'Contradiction' ? 'ring-2 ring-pink-200' : ''}`}
                                title="Mark as Contradiction (Pink)"
                            />
                            <button 
                                onClick={() => toggleTag(originalIndex, event, 'Timeline')}
                                className={`w-4 h-4 rounded-full bg-blue-400 hover:scale-110 border border-blue-500 transition-transform ${event.relevanceTag === 'Timeline' ? 'ring-2 ring-blue-200' : ''}`}
                                title="Mark as Timeline/Continuing Act (Blue)"
                            />
                        </div>
                    )}

                    {/* Edit Controls */}
                    <div className={`absolute right-4 top-4 flex gap-2 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                        {isEditing ? (
                        <>
                            <button onClick={() => saveEditing(originalIndex)} className="text-green-600 hover:bg-green-50 p-1 rounded"><SaveIcon /></button>
                            <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><XIcon /></button>
                        </>
                        ) : (
                        <>
                            <button onClick={() => startEditing(originalIndex, event)} className="text-blue-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded" title="Edit Event"><EditIcon /></button>
                            <button onClick={() => { if(window.confirm('Delete this event?')) onDelete(originalIndex) }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded" title="Delete Event"><TrashIcon /></button>
                        </>
                        )}
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-16">
                        {isEditing ? (
                        <div className="flex gap-2">
                            <select 
                                value={editForm?.severity} 
                                onChange={(e) => setEditForm(prev => prev ? {...prev, severity: e.target.value as any} : null)}
                                className="text-xs border rounded p-1"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                            <input 
                            value={editForm?.category}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, category: e.target.value} : null)}
                            className="text-xs border rounded p-1 w-32"
                            />
                        </div>
                        ) : (
                        <div className="flex gap-2 items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white ${getSeverityColor(event.severity || 'Low')}`}>
                            {event.severity || 'INFO'}
                            </span>
                            <span className="text-xs text-slate-400">{event.category}</span>
                            {event.relevanceTag && (
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    event.relevanceTag === 'Support' ? 'bg-yellow-200 text-yellow-800' :
                                    event.relevanceTag === 'Contradiction' ? 'bg-pink-200 text-pink-800' : 'bg-blue-200 text-blue-800'
                                }`}>
                                    {event.relevanceTag}
                                </span>
                            )}
                        </div>
                        )}
                    </div>
                    
                    {isEditing ? (
                        <textarea 
                        value={editForm?.event}
                        onChange={(e) => setEditForm(prev => prev ? {...prev, event: e.target.value} : null)}
                        className="w-full border rounded p-2 text-sm font-semibold text-slate-800 mb-2"
                        rows={2}
                        />
                    ) : (
                        <h4 className="text-md font-semibold text-slate-800 mb-2">{event.event}</h4>
                    )}
                    
                    {(event.quote || isEditing) && (
                        <div className="bg-white/50 p-3 rounded-md border-l-4 border-slate-300 mb-3">
                        {isEditing ? (
                            <textarea 
                            value={editForm?.quote}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, quote: e.target.value} : null)}
                            className="w-full bg-transparent border-none text-sm text-slate-600 italic focus:ring-0"
                            placeholder="Paste supporting quote..."
                            />
                        ) : (
                            <p className="text-sm text-slate-600 italic">"{event.quote}"</p>
                        )}
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>Ref: {event.sourceDoc}</span>
                        {event.page ? <span>(Pg {event.page})</span> : null}
                    </div>
                    </div>
                  </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineView;
