import Note from "../models/Note.js";

/* ───────────────────────────────────────────
   NOTE PAGES
   ─────────────────────────────────────────── */

// GET /api/notes — list all note pages for the logged-in user
export const getNotePages = async (req, res) => {
  try {
    const pages = await Note.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    return res.json(pages);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// POST /api/notes — create a new note page
export const createNotePage = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (String(title).trim().length > 100) {
      return res
        .status(400)
        .json({ message: "Title must be 100 characters or fewer" });
    }

    const page = await Note.create({
      user: req.user._id,
      title: String(title).trim(),
      notes: [],
    });

    return res.status(201).json(page);
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMsg = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstMsg || "Validation error" });
    }
    return res.status(500).json({ message: "Failed to create note page" });
  }
};

// PUT /api/notes/:id — rename a note page
export const updateNotePage = async (req, res) => {
  try {
    const page = await Note.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: "Note page not found" });
    }

    if (!page.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (String(title).trim().length > 100) {
      return res
        .status(400)
        .json({ message: "Title must be 100 characters or fewer" });
    }

    page.title = String(title).trim();
    await page.save();

    return res.json(page);
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMsg = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstMsg || "Validation error" });
    }
    return res.status(500).json({ message: "Failed to update note page" });
  }
};

// DELETE /api/notes/:id — delete a note page
export const deleteNotePage = async (req, res) => {
  try {
    const page = await Note.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: "Note page not found" });
    }

    if (!page.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await page.deleteOne();

    return res.json({ message: "Note page deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete note page" });
  }
};

/* ───────────────────────────────────────────
   NOTE ENTRIES (subheadings within a page)
   ─────────────────────────────────────────── */

// POST /api/notes/:id/entries — add a subheading entry
export const addNoteEntry = async (req, res) => {
  try {
    const page = await Note.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: "Note page not found" });
    }

    if (!page.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { subheading, content } = req.body;

    if (!subheading || !String(subheading).trim()) {
      return res.status(400).json({ message: "Subheading is required" });
    }

    if (String(subheading).trim().length > 150) {
      return res
        .status(400)
        .json({ message: "Subheading must be 150 characters or fewer" });
    }

    const safeContent = content ? String(content) : "";
    if (safeContent.length > 1000) {
      return res
        .status(400)
        .json({ message: "Content must be 1000 characters or fewer" });
    }

    page.notes.push({
      subheading: String(subheading).trim(),
      content: safeContent,
    });

    await page.save();

    const newEntry = page.notes[page.notes.length - 1];
    return res.status(201).json(newEntry);
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMsg = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstMsg || "Validation error" });
    }
    return res.status(500).json({ message: "Failed to add note entry" });
  }
};

// PUT /api/notes/:id/entries/:entryId — update a subheading entry
export const updateNoteEntry = async (req, res) => {
  try {
    const page = await Note.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: "Note page not found" });
    }

    if (!page.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const entry = page.notes.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({ message: "Note entry not found" });
    }

    const { subheading, content } = req.body;

    if (subheading !== undefined) {
      if (!String(subheading).trim()) {
        return res.status(400).json({ message: "Subheading cannot be empty" });
      }
      if (String(subheading).trim().length > 150) {
        return res
          .status(400)
          .json({ message: "Subheading must be 150 characters or fewer" });
      }
      entry.subheading = String(subheading).trim();
    }

    if (content !== undefined) {
      const safeContent = String(content);
      if (safeContent.length > 1000) {
        return res
          .status(400)
          .json({ message: "Content must be 1000 characters or fewer" });
      }
      entry.content = safeContent;
    }

    await page.save();

    return res.json(entry);
  } catch (err) {
    if (err.name === "ValidationError") {
      const firstMsg = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstMsg || "Validation error" });
    }
    return res.status(500).json({ message: "Failed to update note entry" });
  }
};

// DELETE /api/notes/:id/entries/:entryId — delete a subheading entry
export const deleteNoteEntry = async (req, res) => {
  try {
    const page = await Note.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: "Note page not found" });
    }

    if (!page.user.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const entry = page.notes.id(req.params.entryId);

    if (!entry) {
      return res.status(404).json({ message: "Note entry not found" });
    }

    entry.deleteOne();
    await page.save();

    return res.json({ message: "Note entry deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete note entry" });
  }
};
