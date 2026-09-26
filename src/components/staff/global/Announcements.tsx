"use client";

import React, { useState } from "react";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  active: boolean;
}

function loadAnnouncements(): AnnouncementItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("staffAnnouncements");
    return stored ? (JSON.parse(stored) as AnnouncementItem[]) : [];
  } catch {
    return [];
  }
}

export function Announcements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(loadAnnouncements);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveAnnouncements = (updated: AnnouncementItem[]) => {
    setAnnouncements(updated);
    try {
      localStorage.setItem("staffAnnouncements", JSON.stringify(updated));
      localStorage.setItem("customerAnnouncements", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save announcements", e);
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    const newAnnouncement: AnnouncementItem = {
      id: `ANN-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
      active: true,
    };

    const updated = [newAnnouncement, ...announcements];
    saveAnnouncements(updated);

    setTitle("");
    setMessage("");
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    saveAnnouncements(updated);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#F3EEF5] text-slate-800 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Offers &amp; greetings{" "}
            <span className="font-normal text-slate-500 text-base sm:text-lg">
              ({announcements.length})
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Post a message and every customer will see it on their portal home the next time they log in.
          </p>
        </div>

        {/* Post Announcement Card */}
        <div className="w-full max-w-[500px] bg-white rounded-lg border border-gray-200/90 shadow-xs p-5 sm:p-6 mb-16">
          <form onSubmit={handlePost}>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Diwali Service Special"
                required
                className="w-full bg-[#FAF9FB] border border-slate-200/90 rounded-md px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Get 15% off all battery orders this week!"
                required
                className="w-full bg-[#FAF9FB] border border-slate-200/90 rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-y"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500 font-normal">
                Visible to every customer
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#E8A33D] hover:bg-[#d9942f] text-white font-medium text-xs sm:text-sm rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Announcements List or Empty State */}
        {announcements.length === 0 ? (
          /* Empty State exactly matching the screenshot */
          <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-24 text-center select-none">
            {/* Hexagonal Exclamation Icon */}
            <div className="w-12 h-12 text-slate-400 mb-3 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-9 h-9"
              >
                <path d="M12 2l8 4.6v9.2L12 20.4l-8-4.6V6.6L12 2z" />
                <line x1="12" y1="8" x2="12" y2="12.5" strokeWidth="1.6" />
                <circle cx="12" cy="15.5" r="0.75" fill="currentColor" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              No announcements yet
            </h3>

            {/* Subtitle */}
            <p className="text-xs text-gray-500 max-w-md leading-relaxed">
              Offers and festival greetings you post will appear here and on every customer home screen.
            </p>
          </div>
        ) : (
          /* List of Posted Announcements */
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Published Announcements ({announcements.length})
            </h2>
            <div className="space-y-3">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200/90 p-4 sm:p-5 shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Live on portal
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Posted on{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded border border-rose-200/80 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Announcements;
