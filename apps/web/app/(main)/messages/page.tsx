"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Send, Search, Plus, Loader2, MessageSquare, ArrowLeft, Users, MoreHorizontal, Trash2,
} from "lucide-react";
import apiClient from "../../../lib/api-client";
import { useAuthStore } from "../../../store/use-auth-store";
import { getSocket } from "../../../hooks/use-socket";
import { cn } from "../../../lib/utils";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showList, setShowList] = useState(true);
  const qc = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await apiClient.get("/conversations");
      return data.data;
    },
    refetchInterval: 10000,
  });

  // Nếu có ?user= param, tạo/mở direct conversation
  useEffect(() => {
    const targetUser = searchParams.get("user");
    if (targetUser && conversations) {
      const existing = conversations.find((c: any) =>
        c.type === "DIRECT" && c.otherUser?.username === targetUser
      );
      if (existing) {
        setActiveConvId(existing._id);
        setShowList(false);
      }
    }
  }, [searchParams, conversations]);

  const activeConv = conversations?.find((c: any) => c._id === activeConvId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-[calc(100vh-7rem)]">
      <div className="flex h-full">
        {/* Conversation list */}
        <div className={cn(
          "w-full sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col",
          !showList && "hidden sm:flex"
        )}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Tin nhắn</h2>
              <NewConversationButton onCreated={(id) => { setActiveConvId(id); setShowList(false); }} />
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Tìm kiếm..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
            ) : conversations?.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Chưa có tin nhắn nào</p>
              </div>
            ) : (
              conversations?.map((conv: any) => (
                <ConversationItem
                  key={conv._id}
                  conv={conv}
                  currentUserId={user?.id}
                  isActive={conv._id === activeConvId}
                  onClick={() => { setActiveConvId(conv._id); setShowList(false); }}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className={cn("flex-1 flex flex-col", showList && "hidden sm:flex")}>
          {activeConvId && activeConv ? (
            <ChatWindow
              conv={activeConv}
              currentUser={user}
              onBack={() => setShowList(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conv, currentUserId, isActive, onClick }: any) {
  const other = conv.otherUser;
  const name = conv.type === "DIRECT"
    ? (other?.profile?.displayName || other?.username || "Unknown")
    : conv.name;
  const avatar = conv.type === "DIRECT" ? other?.profile?.avatarUrl : conv.avatarUrl;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left",
        isActive && "bg-pink-50 dark:bg-pink-950/20"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
        {avatar ? (
          <img src={avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-sm font-bold">{name[0]?.toUpperCase()}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{name}</p>
        {conv.lastMessage && (
          <p className="text-xs text-slate-500 truncate">
            {conv.lastMessage.senderId === currentUserId ? "Bạn: " : ""}
            {conv.lastMessage.content}
          </p>
        )}
      </div>
      {conv.lastMessage?.timestamp && (
        <span className="text-xs text-slate-400 shrink-0">
          {formatDistanceToNow(new Date(conv.lastMessage.timestamp), { locale: vi })}
        </span>
      )}
    </button>
  );
}

function ChatWindow({ conv, currentUser, onBack }: any) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout>();
  const qc = useQueryClient();

  const other = conv.otherUser;
  const name = conv.type === "DIRECT"
    ? (other?.profile?.displayName || other?.username)
    : conv.name;

  const { isLoading } = useQuery({
    queryKey: ["messages", conv._id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/conversations/${conv._id}/messages`);
      setMessages(data.data?.messages || []);
      return data.data;
    },
  });

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("chat:join", conv._id);

    socket.on("chat:receive", (msg: any) => {
      if (msg.conversationId === conv._id || String(msg.conversationId) === conv._id) {
        setMessages((prev) => [...prev, msg]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    });

    socket.on("chat:typing", ({ userId }: any) => {
      if (userId !== currentUser?.id) setIsTyping(true);
    });

    socket.on("chat:stop-typing", ({ userId }: any) => {
      if (userId !== currentUser?.id) setIsTyping(false);
    });

    socket.on("chat:delete", ({ messageId }: any) => {
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isDeleted: true, content: "Tin nhắn đã bị xóa" } : m));
    });

    return () => {
      socket.emit("chat:leave", conv._id);
      socket.off("chat:receive");
      socket.off("chat:typing");
      socket.off("chat:stop-typing");
      socket.off("chat:delete");
    };
  }, [conv._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const socket = getSocket();
      if (socket) {
        socket.emit("chat:send", { conversationId: conv._id, message: { content, type: "TEXT" } });
      }
      const { data } = await apiClient.post(`/conversations/${conv._id}/messages`, { content, type: "TEXT" });
      return data.data;
    },
    onSuccess: (msg) => {
      setMessages((prev) => {
        // Tránh duplicate nếu socket đã add
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
    setInput("");
  };

  const handleTyping = () => {
    const socket = getSocket();
    socket?.emit("chat:typing", conv._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit("chat:stop-typing", conv._id), 2000);
  };

  const deleteMutation = useMutation({
    mutationFn: (msgId: string) => apiClient.delete(`/conversations/${conv._id}/messages/${msgId}`),
    onSuccess: (_, msgId) => {
      setMessages((prev) => prev.map((m) => m._id === msgId ? { ...m, isDeleted: true, content: "Tin nhắn đã bị xóa" } : m));
    },
  });

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <button onClick={onBack} className="sm:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
          {other?.profile?.avatarUrl ? (
            <img src={other.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-sm font-bold">{name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900 dark:text-white">{name}</p>
          {isTyping && <p className="text-xs text-pink-500">đang gõ...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-pink-600" size={20} /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Bắt đầu cuộc trò chuyện nào!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg._id} className={cn("flex items-end gap-2 group", isMe && "flex-row-reverse")}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
                    {msg.sender?.profile?.avatarUrl ? (
                      <img src={msg.sender.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{(msg.sender?.username || "?")[0].toUpperCase()}</span>
                    )}
                  </div>
                )}
                <div className={cn("max-w-[70%] relative", isMe && "items-end flex flex-col")}>
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm",
                    isMe
                      ? "bg-pink-600 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm",
                    msg.isDeleted && "opacity-60 italic"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 px-1">
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                {isMe && !msg.isDeleted && (
                  <button
                    onClick={() => deleteMutation.mutate(msg._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value); handleTyping(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="p-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white rounded-xl transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

function NewConversationButton({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const searchUsers = async (q: string) => {
    if (!q.trim()) return setResults([]);
    const { data } = await apiClient.get(`/users/search?q=${q}`);
    setResults(data.data || []);
  };

  const startChat = async (userId: string) => {
    const { data } = await apiClient.post(`/conversations/direct/${userId}`);
    onCreated(data.data._id);
    setOpen(false);
    setSearch("");
    setResults([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors"
      >
        <Plus size={18} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-20 p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">Nhắn tin mới</p>
          <input
            autoFocus
            value={search}
            onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
            placeholder="Tìm người dùng..."
            className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          {results.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startChat(u.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden flex items-center justify-center shrink-0">
                    {u.profile?.avatarUrl ? (
                      <img src={u.profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{(u.profile?.displayName || u.username)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{u.profile?.displayName || u.username}</p>
                    <p className="text-xs text-slate-500">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
