"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Trash, Pencil, Info, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResizableTextarea from "@/components/ui/resizeTextarea";
import Image from "next/image";

const LS_NOTE_KEY = "mydiary:note";
const LS_NOTES_KEY = "mydiary:notes";
const LS_NOTE_ORDER_KEY = "mydiary:notesOrder";
const MAX_BYTES = 5 * 1024 * 1024;
const AVG_BYTES_WORD = 12;

function NoteDate({ iso }) {
  const date = useMemo(
    () =>
      new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    [iso]
  );
  return <p className="text-center underline text-gray-500 mb-5">{date}</p>;
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

  const spaceCalculate = useCallback(() => {
    let totalBytesUsed = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      totalBytesUsed += (k.length + (v ? v.length : 0)) * 2;
    }
    const bytesRemaining = MAX_BYTES - totalBytesUsed;
    const mbRemaining = bytesRemaining / (1024 * 1024);
    const wordsRemaining = Math.floor(bytesRemaining / AVG_BYTES_WORD);

    return {
      fmtMB: mbRemaining.toFixed(2),
      fmtWords: new Intl.NumberFormat("en", { notation: "compact" }).format(wordsRemaining),
    };
  }, []);

  useEffect(() => {
    let ls_note = localStorage.getItem(LS_NOTE_KEY);
    let ls_notes = localStorage.getItem(LS_NOTES_KEY);
    let ls_order = localStorage.getItem(LS_NOTE_ORDER_KEY);
    let notesArr = ls_notes ? JSON.parse(ls_notes) : [];
    let orderArr = ls_order ? JSON.parse(ls_order) : null;

    if (!orderArr || orderArr.length !== notesArr.length) {
      orderArr = [...notesArr].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ).map(n => n.id);
      localStorage.setItem(LS_NOTE_ORDER_KEY, JSON.stringify(orderArr));
    }

    if (ls_note) setNote(JSON.parse(ls_note).value);
    setNotes(notesArr);
    setNoteOrder(orderArr);
    setSpace(spaceCalculate());
  }, [spaceCalculate]);

  useEffect(() => {
    localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
    setSpace(spaceCalculate());
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(LS_NOTE_ORDER_KEY, JSON.stringify(noteOrder));
    setSpace(spaceCalculate());
  }, [noteOrder]);

  useEffect(() => {
    localStorage.setItem(LS_NOTE_KEY, JSON.stringify({ value: note }));
    setSpace(spaceCalculate());
  }, [note]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const newNote = note.trim();
      if (!newNote) {
        setEmptyWarning(true);
        return;
      }
      const newId = crypto.randomUUID();
      setNotes((prev) => [
        { id: newId, text: newNote, date: new Date().toISOString() },
        ...prev,
      ]);
      setNoteOrder((prev) => [newId, ...prev]);
      setNote("");
    },
    [note]
  );

  const handleDelete = useCallback(
    (id) => {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setNoteOrder((prev) => prev.filter((nid) => nid !== id));
    },
    []
  );

  const moveNoteUp = (id) => {
    setNoteOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx > 0) {
        const newOrder = [...prev];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        return newOrder;
      }
      return prev;
    });
  };

  const moveNoteDown = (id) => {
    setNoteOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < prev.length - 1) {
        const newOrder = [...prev];
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        return newOrder;
      }
      return prev;
    });
  };

  const orderedNotes = useMemo(() => {
    if (noteOrder.length === notes.length && noteOrder.length > 0) {
      const noteMap = Object.fromEntries(notes.map((n) => [n.id, n]));
      return noteOrder.map((id) => noteMap[id]).filter(Boolean);
    }
    return [...notes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [notes, noteOrder]);

  const handleEdit = useCallback(
    (id) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, text: editNoteValue } : note
      )
    );
    setEditNoteId(null);
    setEditNoteValue("");
  },
  [editNoteValue]
);

  const handleEditNote = useCallback((id, value) => {
    if (editNoteId === id) setEditNoteValue(value);
  }, [editNoteId]);

  const setEditNoteIdAndValue = useCallback((id, text) => {
    setEditNoteId(id);
    setEditNoteValue(text);
  }, []);

  return (
    <div className="h-screen relative flex flex-col md:flex-row md:items-start">
      <Image
        src="/page.jpg"
        fill
        quality={100}
        alt=""
        className="opacity-5 absolute"
      />
      <div className="w-full md:w-[50%] px-10 md:border-r-[1px] md:border-gray-300 flex flex-col py-5 h-full">
        <div className="fixed left-5 top-2 flex items-center gap-2 group z-10">
          <Info color="grey" className="text-gray-400" size={15} />
          <span
            className={cn(
              "text-gray-400 pointer-events-none opacity-0 -translate-x-2 transition-all duration-300 ease-out",
              "group-hover:opacity-100 group-hover:translate-x-0",
              "md:pointer-events-none md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0",
              "block md:inline",
              "opacity-100 translate-x-0 md:opacity-0 md:-translate-x-2"
            )}
          >
            {space.fmtMB} &nbsp;MB&nbsp;left&nbsp;(~{space.fmtWords}&nbsp;words)
          </span>
        </div>
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
            onChange={(e) => {
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
            orderedNotes.map(({ id, text, date }, idx) => (
              <div
                key={id}
                className="p-2 relative border-b-2"
                onMouseOver={() => setEditNoteHover(id)}
                onMouseLeave={() => setEditNoteHover(null)}
              >
                {editNoteId === id ? (
                  <input
                    type="text"
                    value={(() => {
                      const heading = editNoteValue.split('\n')[0];
                      return heading;
                    })()}
                    onChange={e => {
                      const oldVal = editNoteValue;
                      const oldLines = oldVal.split('\n');
                      const newHeading = e.target.value;
                      setEditNoteValue(
                        newHeading + (oldLines.length > 1 ? '\n' + oldLines.slice(1).join('\n') : '')
                      );
                    }}
                    onBlur={() => {if (editNoteId === id) handleEdit(id);}}
                    className="text-md text-gray-600 mb-0 break-words leading-tight capitalize w-full bg-transparent border-none focus:outline-none p-0"
                    placeholder="(No Title)"
                    spellCheck={false}
                  />
                ) : (
                  <div className="text-md text-gray-600 mb-0 break-words leading-tight capitalize">
                    {(() => {
                      const heading = text.split('\n')[0];
                      if (!heading) return <span className="italic text-gray-400">(No Title)</span>;
                      return heading.replace(/\b\w/g, c => c.toUpperCase());
                    })()}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-2 mt-0 pl-1">
                  {new Date(date).toLocaleString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                  })}
                </div>
                <ResizableTextarea
                  value={(() => {
                    const val = editNoteId === id ? editNoteValue : text;
                    const lines = val.split('\n');
                    return lines.length > 1 ? lines.slice(1).join('\n') : '';
                  })()}
                  disabled={editNoteId !== id}
                  onChange={(e) => {
                    if (editNoteId === id) {
                      const oldVal = editNoteValue;
                      const oldLines = oldVal.split('\n');
                      const newBody = e.target.value;
                      setEditNoteValue(
                        (oldLines[0] || '') + (newBody ? '\n' + newBody : '')
                      );
                    }
                  }}
                  onBlur={() => {if (editNoteId === id) handleEdit(id);}}
                  spellCheck={false}
                  className={cn(
                    "w-full resize-none italic text-gray-600 text-[14px] scrollbar",
                    editNoteId === id && "outline outline-offset-4"
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
                      onClick={() => {setEditNoteIdAndValue(id, text)}}
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
