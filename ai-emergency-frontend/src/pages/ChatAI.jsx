import React, { useState } from "react";
import { postEmergencyChat } from "../api/http";

export default function ChatAI() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Ask me anything about emergencies, safety, or guidance.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    try {
      const resp = await postEmergencyChat({ text });
      const responseText = resp?.response
        || resp?.result?.response
        || (Array.isArray(resp?.result?.instructions) ? resp.result.instructions.join(" ") : null)
        || resp?.raw
        || "No response available.";
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to reach the assistant right now. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-ai">
      <div className="chat-ai__header">
        <h2>Rakshak AI Chat</h2>
        <p>Ask any questions — emergency, medical, safety, or general guidance.</p>
      </div>
      <div className="chat-ai__messages">
        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`chat-ai__message chat-ai__message--${msg.role}`}
          >
            <span>{msg.content}</span>
          </div>
        ))}
      </div>
      <form className="chat-ai__form" onSubmit={handleSubmit}>
        <textarea
          rows={3}
          placeholder="Type your question..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
