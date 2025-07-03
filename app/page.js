"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Trash, Pencil, Info, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResizableTextarea from "@/components/ui/resizeTextarea";

const LS_NOTE_KEY = "mydiary:note";
const LS_NOTES_KEY = "mydiary:notes";
const LS_NOTE_ORDER_KEY = "mydiary:notesOrder";
const LS_MAX_BYTES_KEY = "mydiary:maxBytes";
const AVG_BYTES_WORD = 12;

function estimateLocalStorageLimit() {
  const testKey = '__test__';
  const backup = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k !== testKey) backup[k] = localStorage.getItem(k);
  }
  let data = '1';
  let total = 0;
  try {
    while (true) {
      localStorage.setItem(testKey, data);
      data += data;
    }
  } catch {
    let left = data.length / 2, right = data.length;
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2);
      try {
        localStorage.setItem(testKey, '1'.repeat(mid));
        left = mid;
      } catch {
        right = mid;
      }
    }
    total = left;
  }
  localStorage.removeItem(testKey);
  Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v));
  const maxspace = total * 2;
  localStorage.setItem(LS_MAX_BYTES_KEY, String(maxspace));
  return maxspace;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Home() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [editNoteId, setEditNoteId] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [editNoteHover, setEditNoteHover] = useState(null);
  const [emptyWarning, setEmptyWarning] = useState(false);
  const [space, setSpace] = useState({});
  const [noteOrder, setNoteOrder] = useState([]);
  const [maxBytes, setMaxBytes] = useState(5 * 1024 * 1024);

  const spaceCalculate = useCallback(() => {
    let totalBytesUsed = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      totalBytesUsed += (k.length + (v ? v.length : 0)) * 2;
    }
    const bytesRemaining = maxBytes - totalBytesUsed;
    const mbRemaining = bytesRemaining / (1024 * 1024);
    const wordsRemaining = Math.floor(bytesRemaining / AVG_BYTES_WORD);

    return {
      fmtMB: mbRemaining.toFixed(2),
      fmtWords: new Intl.NumberFormat("en", { notation: "compact" }).format(wordsRemaining),
    };
  }, [maxBytes]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      let limit = localStorage.getItem(LS_MAX_BYTES_KEY);
      if (limit) {
        setMaxBytes(parseInt(limit, 10));
      } else {
        setMaxBytes(estimateLocalStorageLimit());
      }
    }

    const ls_note = localStorage.getItem(LS_NOTE_KEY);
    const ls_notes = localStorage.getItem(LS_NOTES_KEY);
    const ls_order = localStorage.getItem(LS_NOTE_ORDER_KEY);
    const notesArr = ls_notes ? JSON.parse(ls_notes) : [];
    let orderArr = ls_order ? JSON.parse(ls_order) : null;

    if (!orderArr || orderArr.length !== notesArr.length) {
      orderArr = [...notesArr]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(n => n.id);
      localStorage.setItem(LS_NOTE_ORDER_KEY, JSON.stringify(orderArr));
    }

    if (ls_note) setNote(JSON.parse(ls_note).value);
    setNotes(notesArr);
    setNoteOrder(orderArr);
    setSpace(spaceCalculate());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
    setSpace(spaceCalculate());
  }, [notes, spaceCalculate]);

  useEffect(() => {
    localStorage.setItem(LS_NOTE_ORDER_KEY, JSON.stringify(noteOrder));
    setSpace(spaceCalculate());
  }, [noteOrder, spaceCalculate]);

  useEffect(() => {
    localStorage.setItem(LS_NOTE_KEY, JSON.stringify({ value: note }));
    setSpace(spaceCalculate());
  }, [note, spaceCalculate]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const newNote = note.trim();
      if (!newNote) {
        setEmptyWarning(true);
        return;
      }
      const newId = crypto.randomUUID();
      setNotes(prev => [
        { id: newId, text: newNote, date: new Date().toISOString() },
        ...prev,
      ]);
      setNoteOrder(prev => [newId, ...prev]);
      setNote("");
    },
    [note]
  );

  const handleDelete = useCallback(
    (id) => {
      setNotes(prev => prev.filter(note => note.id !== id));
      setNoteOrder(prev => prev.filter(nid => nid !== id));
    },
    []
  );

  const moveNoteUp = useCallback((id) => {
    setNoteOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx > 0) {
        const newOrder = [...prev];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        return newOrder;
      }
      return prev;
    });
  }, []);

  const moveNoteDown = useCallback((id) => {
    setNoteOrder(prev => {
      const idx = prev.indexOf(id);
      if (idx < prev.length - 1) {
        const newOrder = [...prev];
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        return newOrder;
      }
      return prev;
    });
  }, []);

  const orderedNotes = useMemo(() => {
    if (noteOrder.length === notes.length && noteOrder.length > 0) {
      const noteMap = Object.fromEntries(notes.map(n => [n.id, n]));
      return noteOrder.map(id => noteMap[id]).filter(Boolean);
    }
    return [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [notes, noteOrder]);

  const handleEdit = useCallback(
    (id) => {
      setNotes(prev =>
        prev.map(note =>
          note.id === id ? { ...note, text: editNoteValue } : note
        )
      );
      setEditNoteId(null);
      setEditNoteValue("");
    },
    [editNoteValue]
  );

  const setEditNoteIdAndValue = useCallback((id, text) => {
    setEditNoteId(id);
    setEditNoteValue(text);
  }, []);

  return (
    <div className="h-screen relative flex flex-col md:flex-row md:items-start">
      <div className="w-full md:w-[50%] px-10 md:border-r-[1px] md:border-gray-300 flex flex-col py-5 h-full">
        <span
          className={cn(
            "fixed z-10 left-1 top-2 text-gray-400 text-xs font-medium flex flex-col items-center gap-0.5 bg-transparent md:rotate-0 md:left-5 md:top-2 md:text-sm md:bg-transparent md:flex-row md:items-center md:gap-1",
          )}
          style={{ maxWidth: '90vw', whiteSpace: 'nowrap' }}
        >
          <span className="[writing-mode:vertical-rl] [text-orientation:sideways] md:[writing-mode:unset] rotate-180 md:rotate-0 md:ml-1 flex flex-row items-center md:flex-row md:items-center">
            <Info color="grey" className="inline align-text-bottom mb-1 md:mb-0 md:mr-1 rotate-90 md:rotate-0" size={13} />
            <span>
              {space.fmtMB} MB left (~{space.fmtWords} words)
            </span>
          </span>
        </span>
        <p className="text-6xl text-center py-4 italic font-indie-flower font-thin text-gray-500">
          My Diary
        </p>
        <form
          className="flex text-right mt-5 flex-col gap-5 items-end relative"
          onSubmit={handleSubmit}
        >
          <ResizableTextarea
            name="note"
            className="w-full resize-none scrollbar p-2 border min-h-[200px] max-h-[70vh] text-gray-600 italic border-gray-300"
            spellCheck={false}
            value={note}
            placeholder="minimalistic space to just write..."
            onChange={e => {
              setNote(e.target.value);
              setEmptyWarning(false);
            }}
          />
          {emptyWarning && (
            <p className="text-xs italic text-orange-500 text-left absolute bottom-9 left-0">
              Empty note! Please fill it before submitting
            </p>
          )}
          <Button
            variant="outline"
            className="w-fit cursor-pointer hover:border"
            type="submit"
          >
            Add Note
          </Button>
        </form>
      </div>
      <div className="w-full md:w-[50%] flex flex-col h-full">
        <div className="md:overflow-scroll scrollbar h-full">
          {orderedNotes.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 italic">
              <p>Your notes will appear here...</p>
            </div>
          ) : (
            orderedNotes.map(({ id, text, date }, idx) => {
              const [heading, ...bodyLines] = text.split('\n');
              const isEditing = editNoteId === id;
              const editHeading = editNoteValue.split('\n')[0];
              const editBody = editNoteValue.split('\n').slice(1).join('\n');
              return (
                <div
                  key={id}
                  className="p-2 relative border-b-2"
                  onMouseOver={() => setEditNoteHover(id)}
                  onMouseLeave={() => setEditNoteHover(null)}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editHeading}
                      onChange={e => {
                        const newHeading = e.target.value;
                        setEditNoteValue(
                          newHeading + (editBody ? '\n' + editBody : '')
                        );
                      }}
                      onBlur={() => handleEdit(id)}
                      className="text-md text-gray-600 mb-0 break-words leading-tight capitalize w-full bg-transparent border-none focus:outline-none p-0"
                      placeholder="(No Title)"
                      spellCheck={false}
                    />
                  ) : (
                    <div className="text-md text-gray-600 mb-0 break-words leading-tight capitalize">
                      {heading
                        ? heading.replace(/\b\w/g, c => c.toUpperCase())
                        : <span className="italic text-gray-400">(No Title)</span>
                      }
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mb-2 mt-0 pl-1">
                    {formatDate(date)}
                  </div>
                  <ResizableTextarea
                    value={isEditing ? editBody : bodyLines.join('\n')}
                    disabled={!isEditing}
                    onChange={e => {
                      if (isEditing) {
                        setEditNoteValue(
                          (editHeading || '') + (e.target.value ? '\n' + e.target.value : '')
                        );
                      }
                    }}
                    onBlur={() => handleEdit(id)}
                    spellCheck={false}
                    className={cn(
                      "w-full resize-none italic text-gray-600 text-[14px] scrollbar",
                      isEditing && "outline outline-offset-4"
                    )}
                    placeholder="Write your note body here..."
                  />
                  {editNoteHover === id && (
                    <div className="absolute top-2 right-2 flex gap-4 items-center">
                      <ArrowUp
                        color={idx === 0 ? "#ccc" : "grey"}
                        className={cn(
                          "cursor-pointer",
                          idx === 0 && "pointer-events-none"
                        )}
                        size={15}
                        onClick={() => moveNoteUp(id)}
                      />
                      <ArrowDown
                        color={idx === orderedNotes.length - 1 ? "#ccc" : "grey"}
                        className={cn(
                          "cursor-pointer",
                          idx === orderedNotes.length - 1 && "pointer-events-none"
                        )}
                        size={15}
                        onClick={() => moveNoteDown(id)}
                      />
                      <Pencil
                        color="grey"
                        className="cursor-pointer"
                        size={15}
                        onClick={() => setEditNoteIdAndValue(id, text)}
                      />
                      <Trash
                        color="grey"
                        className="cursor-pointer"
                        size={15}
                        onClick={() => handleDelete(id)}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
