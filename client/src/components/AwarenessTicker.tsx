
const messages = [
  'विशाखा के बाद — अब कोई चुप नहीं रहेगा',
  'शिकायत करना साहस है — कमज़ोरी नहीं',
  'POSH क़ानून जानो, अपना हक़ पहचानो',
  'हर बच्चे का अधिकार — सुरक्षा और सम्मान',
  'आवाज़ उठाओ, सुरक्षित रहो',
  'सही जानकारी, सुरक्षित भविष्य',
  'महिला सशक्तिकरण — हमारा दायित्व, हमारा गर्व',
];

export default function AwarenessTicker() {
  const doubled = [...messages, ...messages];

  return (
    <div className="ticker-wrap" aria-label="Awareness messages" role="marquee">
      <div className="ticker-track" style={{ gap: '0' }}>
        {doubled.map((msg, i) => (
          <span key={i} className="hindi-text" style={{
            padding: '0 32px',
            fontSize: '0.92rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
          }}>
            {msg}
            <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>❋</span>
          </span>
        ))}
      </div>
    </div>
  );
}
