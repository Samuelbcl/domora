"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function AdvisorChat({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadOffered, setLeadOffered] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          sessionId: sessionId ?? undefined,
          message: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setSessionId(data.sessionId);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (data.leadForm) setLeadOffered(true);
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-black shadow-lg transition hover:bg-white/90"
        >
          <MessageCircle className="size-4" />
          Conseiller
        </button>
      )}

      {open && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex h-[70dvh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[32rem] sm:w-96 sm:rounded-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Conseiller en aménagement</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Bonjour ! Dites-moi ce qui vous amène, ou posez-moi une question
                pour imaginer ce bien aménagé.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-muted max-w-[85%] rounded-lg px-3 py-2 text-sm text-muted-foreground">
                …
              </div>
            )}
            {leadOffered && (
              <p className="rounded-lg border border-dashed p-2 text-xs text-muted-foreground">
                Le conseiller propose d&apos;envoyer votre projet à l&apos;agence.
                (Formulaire de contact à venir — étape 9.)
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t p-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Votre message…"
              disabled={loading}
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
