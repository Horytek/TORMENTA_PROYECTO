import React, { useState, useEffect } from 'react';

const users = [
  { id: 1, name: 'Ana', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
  { id: 2, name: 'Luis', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
  { id: 3, name: 'Carlos', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' }
];

function Messenger({ embedded = false }) {
  const [selectedUser, setSelectedUser] = useState(users[1]);
  const [messages, setMessages] = useState([
    { id: 1, senderId: 1, receiverId: 2, content: 'Hola Luis!', timestamp: Date.now() },
    { id: 2, senderId: 2, receiverId: 1, content: 'Hola Ana, ¿cómo estás?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const currentUser = users[0];

  // Evita el scroll de la página mientras se usa el Messenger
  useEffect(() => {
    if (embedded) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [embedded]);

  const chatMessages = messages.filter(
    m =>
      (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
      (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
  );

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: input,
        timestamp: Date.now()
      }
    ]);
    setInput('');
  };

  return (
    <div
      style={{
        display: 'flex',
        // ⬇️ ancho/alto fluidos (más espacio para el chat)
        width: embedded ? '100%' : 'clamp(1100px, 95vw, 1400px)',
        maxWidth: embedded ? '100%' : '100vw',
        height: embedded ? '100%' : '100vh',
        margin: embedded ? 0 : '0 auto',
        background: '#f7f8fa',
        borderRadius: embedded ? 0 : 18,
        boxShadow: embedded ? 'none' : '0 6px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',            // sin doble scroll
        border: embedded ? 'none' : '1px solid #e3e6ee',
        position: 'relative',
        boxSizing: 'border-box'
      }}
    >
      {/* Lista de usuarios */}
      
       
       

      {/* Columna del chat */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#f7f8fa',
          minWidth: 0 // evita que el contenido “empuje” y cause compresión
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 24px',
            borderBottom: '1px solid #e3e6ee',
            background: '#fff'
          }}
        >
          <img
            src={selectedUser.avatar}
            alt={selectedUser.name}
            style={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid #3182ce'
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 20, color: '#2d3748' }}>
            {selectedUser.name}
          </span>
        </div>

        {/* Mensajes */}
        <div
          style={{
            flex: 1,
            overflowY: embedded ? 'auto' : 'hidden',
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 0,
            background: '#f7f8fa',
            scrollBehavior: 'auto',
            maxHeight: 'none',
            height: 'auto'
          }}
        >
          {chatMessages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 6
                }}
              >
                {!isMe && (
                  <img
                    src={selectedUser.avatar}
                    alt="avatar"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 4
                    }}
                  />
                )}
                <span
                  style={{
                    display: 'inline-block',
                    background: isMe ? '#3182ce' : '#e3e6ee',
                    color: isMe ? '#fff' : '#2d3748',
                    padding: '12px 18px',
                    borderRadius: 22,
                    fontSize: 16,
                    // ⬇️ ancho legible, no “largo hilo” ni demasiado angosto
                    maxWidth: 'min(72ch, 90%)',
                    boxShadow: isMe ? '0 2px 12px #3182ce22' : '0 2px 12px #e3e6ee22',
                    marginLeft: isMe ? 0 : 4,
                    marginRight: isMe ? 4 : 0,
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.content}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 24px',
            borderTop: '1px solid #e3e6ee',
            background: '#fff',
            minHeight: 64,
            boxSizing: 'border-box'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Escribe un mensaje para ${selectedUser.name}`}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 18,
              border: '1px solid #e3e6ee',
              fontSize: 16,
              outline: 'none',
              background: '#f7f8fa',
              marginRight: 12,
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '14px 28px',
              borderRadius: 18,
              background: '#3182ce',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 12px #3182ce22',
              transition: 'background 0.2s'
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messenger;




