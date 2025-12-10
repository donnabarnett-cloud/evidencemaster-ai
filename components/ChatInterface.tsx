
import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { ChatMessage } from '../types';
import { sendChatMessageStream } from '../services/geminiService';
import { SearchIcon, LoaderIcon } from './Icons';
import { Chat } from '@google/genai'; // Import Chat type from genai SDK

interface ChatInterfaceProps {
  contextSummary: string; // Aggregate context from documents
  apiKey?: string;
  chatHistory: ChatMessage[]; // Passed from App.tsx for persistence
  setChatHistory: Dispatch<SetStateAction<ChatMessage[]>>; // Update history in App.tsx
  chatInstance: Chat | null; // The actual chat object from @google/genai
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  contextSummary, 
  apiKey, 
  chatHistory, 
  setChatHistory,
  chatInstance
}) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialMessages: ChatMessage[] = chatHistory.length > 0 ? chatHistory : [
    {
      id: 'welcome',
      role: 'model',
      content: 'I am EvidenceMaster (Gold Tier), your dedicated AI Legal Counsel. I operate with the precision of Harvey/CoCounsel, specializing in UK Employment Law.\n\nI can analyze your evidence, perform live case law research, and answer strategic questions.\n\nHow can I assist you with your case today?',
      timestamp: Date.now()
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]); // Scroll when history or typing status changes

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!query.trim() || !apiKey || !chatInstance) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setQuery('');
    setIsTyping(true);

    let fullModelResponse = '';
    const modelMsgId = (Date.now() + 1).toString();

    try {
      const stream = await sendChatMessageStream(chatInstance, userMsg.content, contextSummary, updatedHistory);
      
      for await (const chunk of stream) {
        fullModelResponse += chunk;
        // Update history with partial response for streaming effect
        setChatHistory(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.id === modelMsgId) {
            return prev.map(msg => msg.id === modelMsgId ? { ...msg, content: fullModelResponse } : msg);
          } else {
            // This is the first chunk, add the new message
            return [...prev, { id: modelMsgId, role: 'model', content: fullModelResponse, timestamp: Date.now() }];
          }
        });
      }
    } catch (error) {
      console.error("Chat streaming error:", error);
      fullModelResponse = "I apologize, but I encountered an error. Please try again or rephrase your question.";
      setChatHistory(prev => [...prev, { id: modelMsgId, role: 'model', content: fullModelResponse, timestamp: Date.now() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const prebuiltQueries = [
    "Assess the strength of the Claimant's case.",
    "Find relevant case law precedents for my situation.",
    "Draft a cross-examination question for the HR Manager.",
    "Identify key inconsistencies in the employer's statements.",
    "Summarize the main procedural breaches."
  ];

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <LoaderIcon className="mb-4 text-blue-500 animate-pulse" />
        <p className="mb-2 text-slate-500">Please provide your API Key to use the CoCounsel Chat.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {initialMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {/* Prebuilt pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {prebuiltQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(q);
              }}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium rounded-full transition-colors border border-slate-200"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask questions about your evidence bundle..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm text-slate-900 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!query.trim() || isTyping || !chatInstance}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
          >
            <SearchIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
