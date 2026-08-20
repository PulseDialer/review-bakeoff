import React, { useState } from 'react';
import { sanitiseDocumentHtml } from '../lib/sanitise';

// Public e-signature page. The document HTML comes from a merge-field template
// that a CRM user authored, so it is UNTRUSTED input rendered into this origin.
export default function SignPage({ documentHtml, token }: { documentHtml: string; token: string }) {
  const [name, setName] = useState('');

  async function submit(signatureDataUrl: string) {
    // Relative URL on purpose -- it must resolve against THIS origin.
    await fetch('/api/sign/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, signature: signatureDataUrl, consent: true }),
    });
  }

  return (
    <div>
      {/* nosemgrep: document-html-sink-unsanitised -- passed through the allowlist sanitiser */}
      <div dangerouslySetInnerHTML={{ __html: sanitiseDocumentHtml(documentHtml) }} />
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
      <button onClick={() => submit('data:image/png;base64,AAAA')}>Sign</button>
    </div>
  );
}
