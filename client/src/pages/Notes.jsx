import { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

export default function Notes() {
  /* ─── State ─── */
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Page creation
  const [newPageTitle, setNewPageTitle] = useState("");
  const [creatingPage, setCreatingPage] = useState(false);
  const [showNewPageInput, setShowNewPageInput] = useState(false);

  // Page rename
  const [renamingPageId, setRenamingPageId] = useState(null);
  const [renameTitle, setRenameTitle] = useState("");

  // Entry creation
  const [newEntrySubheading, setNewEntrySubheading] = useState("");
  const [newEntryContent, setNewEntryContent] = useState("");
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);

  // Entry editing
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editSubheading, setEditSubheading] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'page'|'entry', id, entryId? }

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  /* ─── Fetch ─── */
  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/notes");
      setPages(data);

      // If an active page was selected, refresh it
      if (activePage) {
        const refreshed = data.find((p) => p._id === activePage._id);
        setActivePage(refreshed || null);
      }
    } catch {
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [activePage]);

  useEffect(() => {
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Page CRUD ─── */
  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;

    try {
      setCreatingPage(true);
      const { data } = await API.post("/notes", {
        title: newPageTitle.trim(),
      });
      setPages((prev) => [data, ...prev]);
      setActivePage(data);
      setNewPageTitle("");
      setShowNewPageInput(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create page");
    } finally {
      setCreatingPage(false);
    }
  };

  const handleRenamePage = async (pageId) => {
    if (!renameTitle.trim()) return;

    try {
      const { data } = await API.put(`/notes/${pageId}`, {
        title: renameTitle.trim(),
      });
      setPages((prev) => prev.map((p) => (p._id === pageId ? data : p)));
      if (activePage?._id === pageId) setActivePage(data);
      setRenamingPageId(null);
      setRenameTitle("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rename page");
    }
  };

  const handleDeletePage = async (pageId) => {
    try {
      await API.delete(`/notes/${pageId}`);
      setPages((prev) => prev.filter((p) => p._id !== pageId));
      if (activePage?._id === pageId) setActivePage(null);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete page");
    }
  };

  /* ─── Entry CRUD ─── */
  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntrySubheading.trim() || !activePage) return;

    try {
      setCreatingEntry(true);
      const { data } = await API.post(`/notes/${activePage._id}/entries`, {
        subheading: newEntrySubheading.trim(),
        content: newEntryContent,
      });

      const updated = {
        ...activePage,
        notes: [...activePage.notes, data],
      };
      setActivePage(updated);
      setPages((prev) =>
        prev.map((p) => (p._id === activePage._id ? updated : p))
      );
      setNewEntrySubheading("");
      setNewEntryContent("");
      setShowNewEntryForm(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add entry");
    } finally {
      setCreatingEntry(false);
    }
  };

  const handleUpdateEntry = async (entryId) => {
    if (!editSubheading.trim() || !activePage) return;

    try {
      setSavingEntry(true);
      const { data } = await API.put(
        `/notes/${activePage._id}/entries/${entryId}`,
        {
          subheading: editSubheading.trim(),
          content: editContent,
        }
      );

      const updated = {
        ...activePage,
        notes: activePage.notes.map((n) => (n._id === entryId ? data : n)),
      };
      setActivePage(updated);
      setPages((prev) =>
        prev.map((p) => (p._id === activePage._id ? updated : p))
      );
      setEditingEntryId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update entry");
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!activePage) return;

    try {
      await API.delete(`/notes/${activePage._id}/entries/${entryId}`);

      const updated = {
        ...activePage,
        notes: activePage.notes.filter((n) => n._id !== entryId),
      };
      setActivePage(updated);
      setPages((prev) =>
        prev.map((p) => (p._id === activePage._id ? updated : p))
      );
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete entry");
    }
  };

  /* ─── Helpers ─── */
  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  /* ─── Render ─── */
  return (
    <div className="app-page">
      <Navbar />

      <div className="mx-auto max-w-6xl p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <span className="bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
                Custom Notes
              </span>
            </h1>
            <p className="app-muted mt-1 text-sm">
              Your personal notebook — create pages and organize with subheadings
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowNewPageInput(true);
              setNewPageTitle("");
            }}
            className="btn-primary-red shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              New Page
            </span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-300">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto text-rose-400 hover:text-rose-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500/30 border-t-rose-500" />
            <p className="app-muted mt-4 text-sm">Loading your notes…</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            {/* ─── Sidebar: Page List ─── */}
            <div className="w-full shrink-0 lg:w-72 xl:w-80">
              <div className="app-panel rounded-2xl border border-slate-200 dark:border-white/5 p-4 shadow-xl">
                {/* Search */}
                <div className="relative mb-3">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 app-muted pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search pages…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl app-input border border-slate-300 dark:border-white/10 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                  />
                </div>

                {/* New page input */}
                {showNewPageInput && (
                  <form
                    onSubmit={handleCreatePage}
                    className="mb-3 flex gap-2"
                  >
                    <input
                      type="text"
                      autoFocus
                      maxLength={100}
                      placeholder="Page title…"
                      value={newPageTitle}
                      onChange={(e) => setNewPageTitle(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg app-input border border-slate-300 dark:border-white/10 px-3 py-2 text-sm outline-none focus:border-rose-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={creatingPage || !newPageTitle.trim()}
                      className="btn-primary-red shrink-0 rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-40"
                    >
                      {creatingPage ? "…" : "Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPageInput(false)}
                      className="btn-secondary shrink-0 rounded-lg px-2 py-2 text-xs"
                    >
                      ✕
                    </button>
                  </form>
                )}

                {/* Page list */}
                <div className="max-h-[55vh] overflow-y-auto space-y-1 scrollbar-hide">
                  {filteredPages.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/10 to-indigo-500/10 border border-rose-500/20">
                        <svg
                          className="h-7 w-7 text-rose-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold">No pages yet</p>
                      <p className="app-muted mt-1 text-xs">
                        Create your first note page above
                      </p>
                    </div>
                  ) : (
                    filteredPages.map((page) => (
                      <div key={page._id}>
                        {renamingPageId === page._id ? (
                          <div className="flex gap-1.5 rounded-xl app-soft-surface p-2">
                            <input
                              type="text"
                              autoFocus
                              maxLength={100}
                              value={renameTitle}
                              onChange={(e) =>
                                setRenameTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenamePage(page._id);
                                if (e.key === "Escape") setRenamingPageId(null);
                              }}
                              className="min-w-0 flex-1 rounded-lg app-input border border-slate-300 dark:border-white/10 px-2 py-1 text-sm outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRenamePage(page._id)}
                              className="text-emerald-500 hover:text-emerald-400 text-xs font-bold px-1"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setRenamingPageId(null)}
                              className="text-rose-400 hover:text-rose-300 text-xs font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage(page);
                              setEditingEntryId(null);
                              setShowNewEntryForm(false);
                            }}
                            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 ${
                              activePage?._id === page._id
                                ? "bg-gradient-to-r from-rose-500/15 to-indigo-500/10 border border-rose-500/25 shadow-sm"
                                : "app-hover border border-transparent"
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                                activePage?._id === page._id
                                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                                  : "app-soft-surface"
                              }`}
                            >
                              {page.title.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">
                                {page.title}
                              </p>
                              <p className="app-muted text-[11px]">
                                {page.notes.length}{" "}
                                {page.notes.length === 1
                                  ? "entry"
                                  : "entries"}{" "}
                                · {formatDate(page.updatedAt)}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingPageId(page._id);
                                  setRenameTitle(page.title);
                                }}
                                className="rounded-md p-1 app-hover"
                                title="Rename"
                              >
                                <svg
                                  className="h-3.5 w-3.5 app-muted"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm({
                                    type: "page",
                                    id: page._id,
                                  });
                                }}
                                className="rounded-md p-1 app-hover"
                                title="Delete"
                              >
                                <svg
                                  className="h-3.5 w-3.5 text-rose-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </div>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── Main: Note Entries ─── */}
            <div className="flex-1 min-w-0">
              {activePage ? (
                <div className="app-panel rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden">
                  {/* Page header */}
                  <div className="border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-rose-500/5 to-indigo-500/5 px-5 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                          {activePage.title}
                        </h2>
                        <p className="app-muted mt-0.5 text-xs">
                          {activePage.notes.length}{" "}
                          {activePage.notes.length === 1
                            ? "subheading"
                            : "subheadings"}{" "}
                          · Updated {formatDate(activePage.updatedAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowNewEntryForm(true);
                          setNewEntrySubheading("");
                          setNewEntryContent("");
                        }}
                        className="btn-primary-blue shrink-0 rounded-xl px-4 py-2 text-sm font-bold"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 4.5v15m7.5-7.5h-15"
                            />
                          </svg>
                          Add Note
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* New entry form */}
                  {showNewEntryForm && (
                    <form
                      onSubmit={handleAddEntry}
                      className="border-b border-slate-200 dark:border-white/5 p-5 sm:p-6 bg-gradient-to-b from-indigo-500/3 to-transparent"
                    >
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider app-muted">
                        New Subheading Note
                      </h3>

                      <input
                        type="text"
                        autoFocus
                        maxLength={150}
                        placeholder="Subheading title…"
                        value={newEntrySubheading}
                        onChange={(e) =>
                          setNewEntrySubheading(e.target.value)
                        }
                        className="mb-3 w-full rounded-xl app-input border border-slate-300 dark:border-white/10 px-4 py-2.5 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />

                      <div className="relative">
                        <textarea
                          maxLength={1000}
                          rows={4}
                          placeholder="Write your note content here (max 1000 characters)…"
                          value={newEntryContent}
                          onChange={(e) =>
                            setNewEntryContent(e.target.value)
                          }
                          className="w-full resize-none rounded-xl app-input border border-slate-300 dark:border-white/10 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                        <span
                          className={`absolute bottom-3 right-3 text-[11px] font-mono ${
                            newEntryContent.length > 950
                              ? "text-rose-400"
                              : "app-muted"
                          }`}
                        >
                          {newEntryContent.length}/1000
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewEntryForm(false)}
                          className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            creatingEntry || !newEntrySubheading.trim()
                          }
                          className="btn-primary-blue rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-40"
                        >
                          {creatingEntry ? "Saving…" : "Save Note"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Entries list */}
                  <div className="divide-y divide-slate-200 dark:divide-white/5">
                    {activePage.notes.length === 0 && !showNewEntryForm ? (
                      <div className="flex flex-col items-center py-16 text-center px-4">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-rose-500/10 border border-indigo-500/20">
                          <svg
                            className="h-8 w-8 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold">
                          No notes in this page yet
                        </p>
                        <p className="app-muted mt-1 text-xs max-w-xs">
                          Click &ldquo;Add Note&rdquo; above to create your
                          first subheading note
                        </p>
                      </div>
                    ) : (
                      activePage.notes.map((entry, idx) => (
                        <div
                          key={entry._id}
                          className="group relative px-5 py-4 sm:px-6 transition-colors hover:bg-gradient-to-r hover:from-rose-500/3 hover:to-transparent"
                        >
                          {editingEntryId === entry._id ? (
                            /* ── Editing mode ── */
                            <div>
                              <input
                                type="text"
                                autoFocus
                                maxLength={150}
                                value={editSubheading}
                                onChange={(e) =>
                                  setEditSubheading(e.target.value)
                                }
                                className="mb-3 w-full rounded-xl app-input border border-slate-300 dark:border-white/10 px-4 py-2.5 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                              />
                              <div className="relative">
                                <textarea
                                  maxLength={1000}
                                  rows={4}
                                  value={editContent}
                                  onChange={(e) =>
                                    setEditContent(e.target.value)
                                  }
                                  className="w-full resize-none rounded-xl app-input border border-slate-300 dark:border-white/10 px-4 py-3 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
                                />
                                <span
                                  className={`absolute bottom-3 right-3 text-[11px] font-mono ${
                                    editContent.length > 950
                                      ? "text-rose-400"
                                      : "app-muted"
                                  }`}
                                >
                                  {editContent.length}/1000
                                </span>
                              </div>
                              <div className="mt-3 flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingEntryId(null)}
                                  className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    savingEntry ||
                                    !editSubheading.trim()
                                  }
                                  onClick={() =>
                                    handleUpdateEntry(entry._id)
                                  }
                                  className="btn-primary-red rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-40"
                                >
                                  {savingEntry ? "Saving…" : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* ── View mode ── */
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500/15 to-indigo-500/15 text-[11px] font-bold app-muted">
                                    {idx + 1}
                                  </span>
                                  <h3 className="text-base font-bold tracking-tight">
                                    {entry.subheading}
                                  </h3>
                                </div>

                                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEntryId(entry._id);
                                      setEditSubheading(
                                        entry.subheading
                                      );
                                      setEditContent(
                                        entry.content || ""
                                      );
                                    }}
                                    className="rounded-md p-1.5 app-hover"
                                    title="Edit"
                                  >
                                    <svg
                                      className="h-3.5 w-3.5 app-muted"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth="2"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: "entry",
                                        id: activePage._id,
                                        entryId: entry._id,
                                      })
                                    }
                                    className="rounded-md p-1.5 app-hover"
                                    title="Delete"
                                  >
                                    <svg
                                      className="h-3.5 w-3.5 text-rose-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      strokeWidth="2"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              {entry.content && (
                                <p className="mt-2 ml-10 text-sm leading-relaxed app-muted whitespace-pre-wrap">
                                  {entry.content}
                                </p>
                              )}

                              <p className="mt-2 ml-10 text-[10px] app-muted opacity-60">
                                {formatDate(entry.createdAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* ─── No page selected ─── */
                <div className="app-panel rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl flex flex-col items-center justify-center py-24 px-6 text-center">
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500/10 to-indigo-500/10 border border-rose-500/15">
                    <svg
                      className="h-10 w-10 text-rose-400/70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold">
                    Select a page to get started
                  </h2>
                  <p className="app-muted mt-2 max-w-sm text-sm">
                    Choose a note page from the sidebar or create a new one
                    to start writing
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl app-panel border border-slate-200 dark:border-white/10 p-6 shadow-2xl animate-scale-in">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 mx-auto">
              <svg
                className="h-6 w-6 text-rose-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                />
              </svg>
            </div>
            <h3 className="text-center text-lg font-bold mb-2">
              Delete{" "}
              {deleteConfirm.type === "page" ? "Page" : "Note Entry"}?
            </h3>
            <p className="text-center app-muted text-sm mb-5">
              {deleteConfirm.type === "page"
                ? "This will permanently delete the page and all its subheading notes."
                : "This subheading note will be permanently removed."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary rounded-xl py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "page") {
                    handleDeletePage(deleteConfirm.id);
                  } else {
                    handleDeleteEntry(deleteConfirm.entryId);
                  }
                }}
                className="flex-1 btn-primary-red rounded-xl py-2.5 text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
