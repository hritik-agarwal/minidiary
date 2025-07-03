"use client";

import { useEffect, useState } from "react";
import { Trash, Pencil, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResizableTextarea from "@/components/ui/resizeTextarea";
import Image from "next/image";

const LS_NOTE_KEY = "mydiary:note";
const LS_NOTES_KEY = "mydiary:notes";

export default function Home() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const [editNoteId, setEditNoteId] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [editNoteHover, setEditNoteHover] = useState(null);

  const [emptyWarning, setEmptyWarning] = useState(false);
  const [space, setSpace] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    let newDate = new Date();
    const newNote = note.trim();
    if (newNote.trim().length === 0) {
      setEmptyWarning(true);
      return;
    }
    setNotes([
      { id: crypto.randomUUID(), text: newNote, date: newDate },
      ...notes,
    ]);
    setNote("");
  }

  function spaceCalculate() {
    const MAX_BYTES = 5 * 1024 * 1024;
    const AVG_BYTES_WORD = 12;

    let totalBytesUsed = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k);
      totalBytesUsed += (k.length + v.length) * 2;
    }

    const bytesRemaining = MAX_BYTES - totalBytesUsed;
    const mbRemaining = bytesRemaining / (1024 * 1024);
    const wordsRemaining = Math.floor(bytesRemaining / AVG_BYTES_WORD);

    const fmtMB = mbRemaining.toFixed(2);
    const fmtWords = new Intl.NumberFormat("en", {
      notation: "compact",
    }).format(wordsRemaining);

    return { fmtMB, fmtWords };
  }

  function handleDelete(id) {
    setNotes(notes.filter((note) => note.id !== id));
  }

  function handleEdit(id) {
    setNotes(
      notes.map((note) => {
        if (note.id !== id) {
          return note;
        } else {
          return { ...note, text: editNoteValue };
        }
      })
    );
    setEditNoteId(null);
    setEditNoteValue("");
  }

  function handleResize(e) {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }

  function handleEditNote(e) {
    setEditNoteValue(e.target.value);
  }

  function NoteDate({ iso }) {
    const date = new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return <p className="text-center underline text-gray-500 mb-5">{date}</p>;
  }

  useEffect(() => {
    let ls_note = localStorage.getItem(LS_NOTE_KEY);
    let ls_notes = localStorage.getItem(LS_NOTES_KEY);
    if (ls_note) {
      ls_note = JSON.parse(ls_note);
      setNote(ls_note["value"]);
    }
    if (ls_notes) {
      ls_notes = JSON.parse(ls_notes);
      setNotes(ls_notes);
    }
    setSpace(spaceCalculate());
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
    setSpace(spaceCalculate());
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(LS_NOTE_KEY, JSON.stringify({ value: note }));
  }, [note]);

  return (
    <div className="h-screen relative flex flex-col md:flex-row md:items-start">
      <Image
        src="/page.jpg"
        layout="fill"
        quality={100}
        alt=""
        className="opacity-5 absolute"
      />
      <div className="w-full md:w-[50%] px-10 md:border-r-[1px] md:border-gray-300 flex flex-col py-5 h-full">
        <div className="fixed left-5 top-2 flex items-center gap-2 group">
          <Info color="grey" className="text-gray-400" size={"15"} />
          <span className="text-gray-400 pointer-events-none opacity-0 -translate-x-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
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
            spellCheck="false"
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
            variant={"outline"}
            className="w-fit cursor-pointer hover:border"
          >
            Add Note
          </Button>
        </form>
      </div>
      <div className="w-full md:w-[50%] flex flex-col h-full">
        <div className="md:overflow-scroll scrollbar h-full">
          {notes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-gray-500 italic">
              <p>Your notes will appear here...</p>
            </div>
          )}
          {notes
            .sort((a, b) => b.date - a.date)
            .map(({ id, text, date }) => (
              <div
                key={id}
                className="p-2 relative border-b-2"
                onMouseOver={() => setEditNoteHover(id)}
                onMouseLeave={() => setEditNoteHover(null)}
              >
                <NoteDate iso={date} />
                <ResizableTextarea
                  value={editNoteId === id ? editNoteValue : text}
                  disabled={editNoteId !== id}
                  onChange={handleEditNote}
                  onBlur={() => handleEdit(id)}
                  spellCheck="false"
                  className={cn(
                    "w-full resize-none italic text-gray-600 text-[14px] scrollbar",
                    editNoteId === id && "outline outline-offset-4"
                  )}
                />
                {editNoteHover === id && (
                  <>
                    <Pencil
                      color="grey"
                      className="absolute top-2 right-6 cursor-pointer"
                      size={"15"}
                      onClick={() => {
                        setEditNoteId(id);
                        setEditNoteValue(text);
                      }}
                    />
                    <Trash
                      color="grey"
                      className="absolute top-2 right-2 cursor-pointer"
                      size={"15"}
                      onClick={() => handleDelete(id)}
                    />
                  </>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
