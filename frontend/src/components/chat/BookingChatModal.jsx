import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FiSend,
  FiX,
  FiUser,
  FiClock,
  FiMapPin,
  FiCheck,
  FiMessageCircle,
} from "react-icons/fi";
import { FaMountain, FaPaperPlane } from "react-icons/fa";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const QUICK_PROMPTS = [
  "What are the road/weather conditions today?",
  "Where is the parking spot relative to the plot?",
  "Is firewood and campfire ready?",
  "We are arriving in ~45 minutes!",
];

export default function BookingChatModal({
  isOpen,
  onClose,
  booking,
  recipientName = "Host",
  recipientRole = "host",
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const bookingId = booking?._id || booking?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await API.get(`/messages/booking/${bookingId}`);
      setMessages(res.data || []);
      setError("");
    } catch (err) {
      console.warn("Error fetching chat messages:", err.message);
      // Fallback sample conversation if backend is quiet
      if (messages.length === 0) {
        setMessages([
          {
            _id: "m-welcome",
            sender: { _id: "host-1", name: recipientName, role: recipientRole },
            content: `Namaste! Welcome to your upcoming mountain stay at ${booking?.spot?.title || "our Himalayan plot"}. Let me know if you need any directions or campfire setup!`,
            createdAt: booking?.createdAt || new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId, recipientName, recipientRole]);

  useEffect(() => {
    if (isOpen && bookingId) {
      setLoading(true);
      fetchMessages();
      const interval = setInterval(fetchMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, bookingId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textToSend = null) => {
    const text = typeof textToSend === "string" ? textToSend : newMessage;
    if (!text || !text.trim()) return;

    try {
      setSending(true);
      setError("");
      const res = await API.post("/messages", {
        bookingId,
        content: text.trim(),
      });

      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message. Please retry.");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg h-[640px] max-h-[92vh] flex flex-col shadow-2xl border border-mist overflow-hidden relative">
        {/* Header */}
        <div className="bg-navy p-4 sm:p-5 text-white flex items-center justify-between border-b-2 border-saffron">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-saffron/20 border border-saffron/40 flex items-center justify-center text-saffron font-bold">
              <FaMountain className="w-5 h-5 text-saffron" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-snow leading-none">
                  {recipientName}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-saffron text-navy px-2 py-0.5 rounded-full">
                  {recipientRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                {booking?.spot?.title || "Himalayan Plot Reservation"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Spot Context Bar */}
        <div className="bg-snow/90 px-4 py-2 border-b border-mist/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <FiClock className="text-saffron-text w-3.5 h-3.5" />
            <span>
              {booking?.date ? new Date(booking.date).toLocaleDateString() : "Upcoming Stay"}{" "}
              ({booking?.startTime || "Slot"} - {booking?.endTime || "Slot"})
            </span>
          </div>
          <span className="text-[11px] font-bold text-pine bg-pine-mist px-2 py-0.5 rounded-full">
            Direct Host Thread
          </span>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F0]/40">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading mountain thread...
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const isMe =
                  m.sender?._id === user?._id ||
                  m.sender?._id === user?.id ||
                  m.sender === user?._id;

                return (
                  <div
                    key={m._id || Math.random()}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-navy text-white rounded-tr-xs border border-navy-deep"
                          : "bg-white text-navy rounded-tl-xs border border-mist shadow-xs"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[10px] font-bold text-saffron-text mb-0.5">
                          {m.sender?.name || recipientName}
                        </div>
                      )}
                      <div>{m.content}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMe && <FiCheck className="text-emerald-500 w-3 h-3" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-mist/70 overflow-x-auto flex gap-1.5 scrollbar-none">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={sending}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-snow text-slate-600 hover:text-navy hover:bg-saffron/20 border border-mist text-[11px] font-medium transition cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Error notification */}
        {error && (
          <div className="px-4 py-1.5 bg-danger-mist text-danger text-[11px] font-semibold border-t border-danger/20">
            {error}
          </div>
        )}

        {/* Send Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-mist flex items-center gap-2"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to host..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-mist text-xs focus:border-navy focus:outline-none bg-snow/50"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="w-10 h-10 rounded-2xl bg-saffron hover:bg-saffron-hover text-navy flex items-center justify-center transition shadow-md disabled:opacity-50 cursor-pointer shrink-0"
          >
            <FiSend className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
