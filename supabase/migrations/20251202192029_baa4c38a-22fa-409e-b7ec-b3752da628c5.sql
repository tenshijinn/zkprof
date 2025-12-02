-- Add ESIGN compliance columns to access_sessions
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS signer_ip TEXT;
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS signer_user_agent TEXT;
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS nda_hash TEXT;
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS signing_timestamp TIMESTAMPTZ;
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS solana_memo_signature TEXT;
ALTER TABLE access_sessions ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;

-- Create platform_credit_topups table for tracking credit purchases
CREATE TABLE IF NOT EXISTS public.platform_credit_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID NOT NULL,
  amount_usd NUMERIC NOT NULL,
  solana_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on platform_credit_topups
ALTER TABLE public.platform_credit_topups ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_credit_topups
CREATE POLICY "Anyone can create topups" ON public.platform_credit_topups
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view topups" ON public.platform_credit_topups
FOR SELECT USING (true);

-- Update NDA template with ESIGN/UETA/eIDAS compliant language
UPDATE public.nda_templates
SET template_content = '# Non-Disclosure Agreement for zkPFP Viewing

## ELECTRONIC SIGNATURE DISCLOSURE AND CONSENT

**IMPORTANT: Please read this disclosure carefully before signing.**

By signing this Agreement electronically, you acknowledge and agree that:

1. You consent to conduct this transaction electronically pursuant to the Electronic Signatures in Global and National Commerce Act (ESIGN), the Uniform Electronic Transactions Act (UETA), and the European Union Electronic Identification and Trust Services Regulation (eIDAS).

2. You understand that your electronic signature has the same legal effect as a handwritten signature.

3. You have the ability to access, download, and print this document for your records.

4. You may withdraw your consent to electronic signatures at any time by not completing this signing process.

---

## AGREEMENT TERMS

**Effective Date:** {{timestamp}}

**Parties:**
- **Disclosing Party (zkPFP Owner):** Wallet Address: {{owner_wallet}}
- **Receiving Party (Viewer):** Wallet Address: {{viewer_wallet}}
- **Facilitating Platform:** {{platform_name}}

### 1. DEFINITIONS

"Confidential Information" means the decrypted profile photo (zkPFP) and any visual information contained therein, including but not limited to facial features, identifying characteristics, and any other personal data visible in the image.

"Access Session" means the time-limited viewing period of 60 minutes from the signing of this Agreement.

### 2. CONFIDENTIALITY OBLIGATIONS

The Receiving Party agrees to:

a) Hold the Confidential Information in strict confidence;

b) Not copy, screenshot, record, photograph, or otherwise reproduce the Confidential Information;

c) Not disclose, share, transmit, or otherwise make available the Confidential Information to any third party;

d) Not use the Confidential Information for any purpose other than the specific viewing session authorized herein;

e) Not attempt to identify, contact, or locate the Disclosing Party using the Confidential Information unless explicitly authorized.

### 3. ACCESS LIMITATIONS

a) Access to the Confidential Information is limited to a single 60-minute session.

b) The viewing interface includes technical measures designed to prevent unauthorized reproduction.

c) Any attempt to circumvent these protective measures constitutes a material breach of this Agreement.

### 4. REPRESENTATIONS AND WARRANTIES

The Receiving Party represents and warrants that:

a) They have legal capacity to enter into this Agreement;

b) They are signing this Agreement voluntarily and with full understanding of its terms;

c) The information provided for identification purposes is accurate and complete.

### 5. BREACH AND REMEDIES

Any breach of this Agreement may result in:

a) Immediate termination of access;

b) Legal action for damages, including but not limited to actual damages, consequential damages, and attorney fees;

c) Injunctive relief to prevent further disclosure.

### 6. AUDIT TRAIL AND RECORD RETENTION

This Agreement and all signing data will be retained for a minimum of 7 years. The following information is recorded as part of the signing audit trail:

- Timestamp of signature
- Wallet address of signer
- IP address at time of signing
- User agent/browser information
- Cryptographic hash of this document
- Solana blockchain memo transaction signature

### 7. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with applicable laws regarding electronic signatures and data protection.

### 8. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof.

---

## ELECTRONIC SIGNATURE

By signing below, I acknowledge that:

☑ I have read and understand this Agreement
☑ I consent to sign this Agreement electronically
☑ I agree to be bound by all terms and conditions
☑ I understand my signature will be recorded on the Solana blockchain

**Document Hash:** {{nda_hash}}

**Signature:** [Cryptographic wallet signature required]

---

*This document is compliant with ESIGN Act (USA), UETA (USA), and eIDAS Regulation (EU).*',
updated_at = now()
WHERE is_default = true;