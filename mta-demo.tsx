import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Ти AI-асистент інтернет-магазину MTA.UA — одного з найбільших магазинів техніки в Україні.

Твоя задача — допомагати клієнтам знаходити товари, відповідати на питання про наявність, ціни, характеристики, доставку та гарантію.

Коли клієнт питає про конкретний товар — використай web search щоб знайти актуальну інформацію на сайті mta.ua.
Шукай так: назва товару site:mta.ua

Відповідай українською мовою, дружньо і по суті. Якщо знайшов товар — дай посилання на нього.
Якщо товару немає — запропонуй альтернативу.

Загальна інформація про MTA:
- Безкоштовна доставка від 1000 грн
- Гарантія до 12 місяців
- Є розстрочка та кредит
- Trade-in (обмін старого на нове)
- Кешбек 1-20% на кожну покупку
- 250 000+ товарів, 700+ брендів`;

const SUGGESTIONS = [
  "Які iPhone зараз є в наявності?",
  "Скільки коштує MacBook Air M3?",
  "Є безкоштовна доставка?",
  "Як працює trade-in?",
];

export default function MTAChat() {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Привіт! Я AI-асистент MTA 👋\nДопоможу знайти техніку, перевірити ціни та наявність. Що вас цікавить?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const fullText = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      setMessages([...newMessages, { role: "assistant", content: fullText || "Не вдалося отримати відповідь 🙏" }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "Вибачте, сталася помилка. Спробуйте ще раз 🙏" }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // API Key screen
  if (!apiKey) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Manrope', sans-serif", padding: "24px",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <div style={{
          width: "100%", maxWidth: "400px",
          background: "#111", borderRadius: "24px", padding: "32px",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "26px", marginBottom: "24px",
            boxShadow: "0 4px 20px rgba(255,140,0,0.3)",
          }}>🛒</div>

          <div style={{ fontWeight: 800, fontSize: "22px", color: "#fff", marginBottom: "8px" }}>
            MTA Асистент
          </div>
          <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "28px", lineHeight: "1.6" }}>
            Введіть Anthropic API ключ щоб запустити демо. Ключ зберігається тільки в браузері.
          </div>

          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", fontWeight: 600 }}>
            API КЛЮЧ
          </div>
          <input
            type="password"
            value={apiKeyInput}
            onChange={e => setApiKeyInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && apiKeyInput.startsWith("sk-") && setApiKey(apiKeyInput)}
            placeholder="sk-ant-..."
            style={{
              width: "100%", padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", color: "#fff",
              fontSize: "14px", fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
              marginBottom: "16px",
            }}
          />
          <button
            onClick={() => apiKeyInput.startsWith("sk-") && setApiKey(apiKeyInput)}
            style={{
              width: "100%", padding: "14px",
              background: apiKeyInput.startsWith("sk-")
                ? "linear-gradient(135deg, #ff8c00, #ff6b00)"
                : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: "12px",
              color: "#fff", fontSize: "15px", fontWeight: 700,
              cursor: apiKeyInput.startsWith("sk-") ? "pointer" : "default",
              fontFamily: "inherit",
              boxShadow: apiKeyInput.startsWith("sk-") ? "0 4px 16px rgba(255,140,0,0.3)" : "none",
            }}
          >
            Запустити демо →
          </button>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "16px", textAlign: "center" }}>
            console.anthropic.com → API Keys
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Manrope', sans-serif", padding: "16px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{
        width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column",
        height: "90vh", maxHeight: "700px", background: "#111", borderRadius: "24px",
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,140,0,0.1)",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px", background: "linear-gradient(135deg, #1a1a1a, #222)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: "14px",
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "14px",
            background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", boxShadow: "0 4px 16px rgba(255,140,0,0.3)",
          }}>🛒</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#fff", letterSpacing: "-0.3px" }}>
              MTA Асистент
            </div>
            <div style={{ fontSize: "12px", color: "#4ade80", fontWeight: 500, display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              Онлайн • відповідає миттєво
            </div>
          </div>
          <button onClick={() => setApiKey("")} style={{
            marginLeft: "auto", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
            color: "rgba(255,255,255,0.4)", fontSize: "11px", padding: "4px 10px",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            🔑 ключ
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px 16px",
          display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "none",
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "8px", alignItems: "flex-end",
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width: "28px", height: "28px", borderRadius: "10px",
                  background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", flexShrink: 0,
                }}>🛒</div>
              )}
              <div style={{
                maxWidth: "80%", padding: "12px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "linear-gradient(135deg, #ff8c00, #ff6b00)" : "rgba(255,255,255,0.06)",
                color: "#fff", fontSize: "14px", lineHeight: "1.6", fontWeight: 400,
                border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "10px",
                background: "linear-gradient(135deg, #ff8c00, #ff6b00)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
              }}>🛒</div>
              <div style={{
                padding: "14px 18px", borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", gap: "5px", alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: "7px", height: "7px", borderRadius: "50%", background: "#ff8c00",
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`, display: "inline-block",
                  }} />
                ))}
              </div>
            </div>
          )}

          {messages.length === 1 && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", paddingLeft: "4px" }}>
                Популярні питання
              </div>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.2)",
                  borderRadius: "12px", padding: "10px 14px", color: "#ff8c00",
                  fontSize: "13px", fontWeight: 500, cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "#111", display: "flex", gap: "10px", alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напишіть питання..."
            rows={1}
            style={{
              flex: 1, background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px",
              padding: "12px 16px", color: "#fff", fontSize: "14px",
              fontFamily: "inherit", resize: "none", outline: "none",
              lineHeight: "1.5", maxHeight: "100px", overflowY: "auto",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: input.trim() && !loading ? "linear-gradient(135deg, #ff8c00, #ff6b00)" : "rgba(255,255,255,0.06)",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", flexShrink: 0,
            }}
          >➤</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
