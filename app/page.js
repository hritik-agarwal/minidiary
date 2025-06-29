"use client";

import { useEffect, useState } from "react";
import { Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ResizableTextarea from "@/components/ui/resizeTextarea";

const LS_KEY = "mydiary:notes";

export default function Home() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const [editNoteId, setEditNoteId] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [editNoteHover, setEditNoteHover] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    let newDate = new Date();
    const newNote = note.trim();
    if (newNote.trim().length === 0) {
      alert("Empty note! Please fill it before submitting");
      return;
    }
    setNotes([
      { id: crypto.randomUUID(), text: newNote, date: newDate },
      ...notes,
    ]);
    setNote("");
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
    });

    return <p className="text-gray-500">{date}</p>;
  }

  useEffect(() => {
    let data = localStorage.getItem(LS_KEY);
    if (data) {
      data = JSON.parse(data);
      setNotes(data);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
  }, [notes]);

  return (
    <div className="h-screen">
      <div className="max-w-[800px] px-10 border border-black h-full m-auto flex flex-col py-5">
        <p className="text-6xl text-center py-4 italic font-bold font-indie-flower">
          Mini Diary
        </p>

        <form
          className="flex text-right mt-5 flex-col gap-5 items-end"
          onSubmit={handleSubmit}
        >
          <Textarea
            name="note"
            className="w-full h-40 resize-none"
            spellCheck="false"
            value={note}
            placeholder="What's on your mind..."
            onChange={(e) => setNote(e.target.value)}
          />
          <Button className="w-fit cursor-pointer">Add Note</Button>
        </form>

        <div className="mt-10 overflow-scroll scrollbar">
          {notes
            .sort((a, b) => b.date - a.date)
            .map(({ id, text, date }) => (
              <div
                key={id}
                className="border p-2 relative"
                onMouseOver={() => setEditNoteHover(id)}
                onMouseLeave={() => setEditNoteHover(null)}
              >
                <NoteDate iso={date} />
                <ResizableTextarea
                  value={editNoteId === id ? editNoteValue : text}
                  disabled={editNoteId !== id}
                  onChange={handleEditNote}
                  onBlur={() => handleEdit(id)}
                  className={cn(
                    "w-full resize-none p-2 italic text-gray-800 text-[14px]",
                    editNoteId === id && "border"
                  )}
                />
                {editNoteHover === id && (
                  <>
                    <Pencil
                      color="grey"
                      className="absolute top-2 right-2 cursor-pointer"
                      size={"15"}
                      onClick={() => {
                        setEditNoteId(id);
                        setEditNoteValue(text);
                      }}
                    />
                    <Trash
                      color="red"
                      className="absolute top-8 right-2 cursor-pointer"
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
