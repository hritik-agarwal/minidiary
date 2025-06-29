"use client";

import { useEffect, useState } from "react";
import { Trash, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ResizableTextarea from "@/components/ui/resizeTextarea";
import Image from "next/image";

const LS_KEY = "mydiary:notes";

export default function Home() {
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const [editNoteId, setEditNoteId] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState("");
  const [editNoteHover, setEditNoteHover] = useState(null);

  const [emptyWarning, setEmptyWarning] = useState(false);

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

    return <p className="text-gray-800">{date}</p>;
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
    <div className="h-screen relative flex flex-col md:flex-row md:items-start">
      <Image
        src="/page.jpg"
        layout="fill"
        quality={100}
        alt=""
        className="opacity-5 absolute"
      />
      <div className="w-full md:w-[50%] px-10 md:border-r-[1px] md:border-gray-300 flex flex-col py-5 note-container h-full">
        <p className="text-6xl text-center py-4 italic font-bold font-indie-flower">
          Mini Diary
        </p>
        <p className="italic text-xs text-gray-400 text-center mt-[-20px] mr-20 tracking-widest relative">
          Notes that only live in your browser,
        </p>
        <p className="italic text-xs text-gray-400 text-center mr-20 tracking-widest relative">
          clearing site data will remove them.
        </p>
        <form
          className="flex text-right mt-5 flex-col gap-5 items-end relative"
          onSubmit={handleSubmit}
        >
          <ResizableTextarea
            name="note"
            className="w-full resize-none scrollbar p-2 border min-h-[70vh] max-h-[70vh] text-gray-600 italic border-gray-300"
            spellCheck="false"
            value={note}
            placeholder="What's on your mind..."
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
        <p className="text-4xl text-center py-4 italic font-indie-flower text-gray-500">
          History
        </p>
        <div className="md:overflow-scroll scrollbar h-full">
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
                  className={cn(
                    "w-full resize-none p-2 italic text-gray-600 text-[14px] scrollbar",
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
