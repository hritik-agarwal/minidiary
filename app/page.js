"use client";

import { useState } from "react";
import { Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
    if (newNote.trim().length > 1000) {
      alert("Max lenght of note should be less than 1000 characters");
      return;
    }
    setNotes((notes) => {
      return [
        { id: crypto.randomUUID(), text: newNote, date: newDate },
        ...notes,
      ];
    });
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

  function hnadleEditNote(e) {
    setEditNoteValue(e.target.value);
    // handleResize(e);
  }

  return (
    <div className="h-screen">
      <div className="max-w-[800px] px-10 border border-black h-full m-auto">
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
            onChange={(e) => setNote(e.target.value)}
          />
          <Button className="w-fit cursor-pointer">Add Note</Button>
        </form>

        <div className="mt-10">
          {notes
            .sort((a, b) => b.date - a.date)
            .map(({ id, text, date }) => (
              <div
                key={id}
                className="border p-2 relative"
                onMouseOver={() => setEditNoteHover(id)}
                onMouseLeave={() => setEditNoteHover(null)}
              >
                <p className="text-gray-400">{date.toISOString()}</p>
                <textarea
                  value={editNoteId === id ? editNoteValue : text}
                  disabled={editNoteId !== id}
                  autofocus={true}
                  onChange={hnadleEditNote}
                  className={cn(
                    "w-full resize-none p-2",
                    editNoteId === id && "border",
                    editNoteHover === id && "h-[200px]"
                  )}
                  onBlur={() => handleEdit(id)}
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
