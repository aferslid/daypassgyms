"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

type Message = {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

type Profile = {
  id: string;
  username: string | null;
};

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const otherUserId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMutualFriend, setIsMutualFriend] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const conversationMessages = useMemo(() => {
    return [...messages].sort(
        (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", otherUserId)
        .single();

      if (profileError) {
        console.error("Error loading other profile:", profileError);
        setLoading(false);
        return;
      }

      setOtherProfile(profileData as Profile);

      const { data: sentFriend } = await supabase
        .from("friends")
        .select("requester_id, addressee_id")
        .eq("requester_id", user.id)
        .eq("addressee_id", otherUserId)
        .maybeSingle();

      const { data: reverseFriend } = await supabase
        .from("friends")
        .select("requester_id, addressee_id")
        .eq("requester_id", otherUserId)
        .eq("addressee_id", user.id)
        .maybeSingle();

      const mutual = !!sentFriend && !!reverseFriend;
      setIsMutualFriend(mutual);

      if (!mutual) {
        setLoading(false);
        return;
      }

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error loading messages:", messagesError);
        setLoading(false);
        return;
      }

      setMessages((messagesData as Message[]) || []);
      setLoading(false);
    };

    init();
  }, [otherUserId, router]);

  useEffect(() => {
    if (!currentUserId || !otherUserId || !isMutualFriend) return;

    const channel = supabase
    .channel(`messages-${currentUserId}-${otherUserId}`)
    .on(
        "postgres_changes",
        {
        event: "INSERT",
        schema: "public",
        table: "messages",
        },
        (payload) => {
        console.log("Realtime payload received:", payload);

        const newRow = payload.new as Message;

        const isInConversation =
            (newRow.sender_id === currentUserId &&
            newRow.receiver_id === otherUserId) ||
            (newRow.sender_id === otherUserId &&
            newRow.receiver_id === currentUserId);

        if (!isInConversation) return;

        setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === newRow.id);
            if (exists) return prev;
            return [...prev, newRow];
        });
        }
    )
    .subscribe((status) => {
        console.log("Realtime subscription status:", status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, isMutualFriend]);

  const handleSendMessage = async () => {
    if (!currentUserId || !newMessage.trim() || !isMutualFriend) return;

    setSending(true);

    const messageContent = newMessage.trim();

    const { data, error } = await supabase
    .from("messages")
    .insert({
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: messageContent,
    })
    .select()
    .single();

    setSending(false);

    if (error) {
    console.error("Error sending message:", error);
    alert(error.message);
    return;
    }

    if (data) {
    setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data as Message];
    });
    }

    setNewMessage("");
  };

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="bg-white text-black rounded-2xl shadow p-4 border border-gray-200">
          Loading conversation...
        </div>
      </div>
    );
  }

  if (!isMutualFriend) {
    return (
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => router.push("/profile")}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            ← Back to profile
          </button>

          <button
            onClick={() => router.push(`/user/${otherUserId}`)}
            className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
          >
            ← Back to traveler
          </button>
        </div>

        <div className="bg-white text-black rounded-2xl shadow p-4 border border-gray-200">
          Messaging is available only when both users added each other.
        </div>
      </div>
    );
  }

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="p-4 max-w-2xl mx-auto w-full">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => router.push("/profile")}
          className="bg-black text-white px-4 py-2 rounded-xl"
        >
          ← Back to profile
        </button>

        <button
          onClick={() => router.push(`/user/${otherUserId}`)}
          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl"
        >
          ← Back to traveler
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-black">
        Chat with {otherProfile?.username || "traveler"}
      </h1>

      <div className="bg-white text-black rounded-2xl shadow border border-gray-200 flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {conversationMessages.length === 0 ? (
            <p className="text-sm text-gray-500">
              No messages yet. Start the conversation.
            </p>
          ) : (
            conversationMessages.map((message) => {
              const isMine = message.sender_id === currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      isMine
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        isMine ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 p-4 flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 border rounded-xl px-4 py-3 min-h-[56px] max-h-32 text-black placeholder-gray-400"
          />

          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-3 rounded-xl disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}