-- Create platform_registrations table
CREATE TABLE public.platform_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL,
  platform_domain TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE,
  credit_balance_usd DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create access_grants table
CREATE TABLE public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blob_id TEXT NOT NULL,
  platform_id UUID REFERENCES public.platform_registrations(id) ON DELETE CASCADE NOT NULL,
  owner_wallet TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(blob_id, platform_id)
);

-- Create access_sessions table
CREATE TABLE public.access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blob_id TEXT NOT NULL,
  platform_id UUID REFERENCES public.platform_registrations(id) ON DELETE CASCADE NOT NULL,
  viewer_wallet TEXT NOT NULL,
  nda_signature TEXT NOT NULL,
  nda_message TEXT NOT NULL,
  payment_amount_usd DECIMAL(10,2) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create platform_credit_transactions table
CREATE TABLE public.platform_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id UUID REFERENCES public.platform_registrations(id) ON DELETE CASCADE NOT NULL,
  amount_usd DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  transaction_signature TEXT,
  description TEXT,
  balance_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create nda_templates table
CREATE TABLE public.nda_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.platform_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nda_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_registrations
CREATE POLICY "Platforms can view all registrations"
  ON public.platform_registrations
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can register a platform"
  ON public.platform_registrations
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for access_grants
CREATE POLICY "Anyone can view access grants"
  ON public.access_grants
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create access grants"
  ON public.access_grants
  FOR INSERT
  WITH CHECK (owner_wallet IS NOT NULL AND length(owner_wallet) > 0);

CREATE POLICY "Anyone can update grants"
  ON public.access_grants
  FOR UPDATE
  USING (true);

-- RLS Policies for access_sessions
CREATE POLICY "Anyone can view sessions"
  ON public.access_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON public.access_sessions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for platform_credit_transactions
CREATE POLICY "Anyone can view transactions"
  ON public.platform_credit_transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create transactions"
  ON public.platform_credit_transactions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for nda_templates
CREATE POLICY "Anyone can view NDA templates"
  ON public.nda_templates
  FOR SELECT
  USING (true);

-- Insert default NDA template
INSERT INTO public.nda_templates (template_name, template_content, is_default)
VALUES (
  'default_zkprof_nda',
  '# Non-Disclosure Agreement for zkPFP Access

**Date**: {{timestamp}}
**Platform**: {{platform_name}}

This Non-Disclosure Agreement ("Agreement") is entered into between:

**Disclosing Party (Profile Owner)**: Wallet Address `{{owner_wallet}}`
**Receiving Party (Viewer)**: Wallet Address `{{viewer_wallet}}`

## Agreement Terms

1. **Purpose**: The Receiving Party requests access to view the Disclosing Party''s encrypted profile photo (zkPFP) on {{platform_name}}.

2. **Confidentiality Obligation**: The Receiving Party agrees to:
   - Maintain the confidentiality of the disclosed zkPFP
   - Not screenshot, record, or redistribute the image
   - Use the image solely for identity verification purposes
   - Delete all copies after the 60-minute access period expires

3. **Access Period**: Access is granted for **60 minutes** from the time of signature.

4. **Zero-Knowledge Proof**: The zkPFP is protected by cryptographic zero-knowledge proofs, ensuring authenticity without revealing the underlying encryption keys.

5. **Breach**: Unauthorized disclosure or misuse may result in access revocation and potential legal action.

By signing this agreement with your Solana wallet, you cryptographically attest to understanding and accepting these terms.

---

**Signature Required**: Solana wallet signature of hash `{{nda_hash}}`',
  true
);

-- Create indexes for performance
CREATE INDEX idx_access_grants_blob_id ON public.access_grants(blob_id);
CREATE INDEX idx_access_grants_platform_id ON public.access_grants(platform_id);
CREATE INDEX idx_access_grants_owner_wallet ON public.access_grants(owner_wallet);
CREATE INDEX idx_access_sessions_blob_id ON public.access_sessions(blob_id);
CREATE INDEX idx_access_sessions_expires_at ON public.access_sessions(expires_at);
CREATE INDEX idx_platform_credit_transactions_platform_id ON public.platform_credit_transactions(platform_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_registrations_updated_at
  BEFORE UPDATE ON public.platform_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nda_templates_updated_at
  BEFORE UPDATE ON public.nda_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();