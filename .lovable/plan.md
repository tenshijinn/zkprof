

# Server-Side Decryption with Watermarking and Protected Viewing

## Overview
Enhance the `/reveal-zkpfp` API to:
1. Apply viewer-specific watermarks to decrypted images server-side
2. Provide complete component code/metadata for platforms to implement the protected circular reveal viewer
3. Ensure leaked screenshots can be traced back to the responsible viewer

---

## What Will Be Built

### 1. Server-Side Watermarking

The decrypted image will have the viewer's identity burned into it **before** being returned. This ensures that even if the image is leaked, it can be traced.

**Watermark Content:**
- Viewer's wallet address (full or shortened)
- Viewer's name/username (if provided by platform during NDA signing)
- Timestamp of the reveal
- Platform name (to identify which platform the leak came from)

**Watermark Pattern:**
- Repeated diagonally across the entire image at ~15-20% opacity
- Multiple instances to prevent easy cropping/removal
- Semi-transparent to maintain image visibility while being traceable

```text
┌────────────────────────────────────────────┐
│  ╲ 0x7F...3B2 ╲ John Doe ╲ 0x7F...3B2 ╲   │
│   ╲ Arubaito ╲ 2024-01-28 ╲ John Doe  ╲   │
│    ╲ 0x7F...3B2 ╲ John Doe ╲ Arubaito ╲   │
│     ╲ 2024-01-28 ╲ 0x7F...3B2 ╲ John  ╲   │
│      ╲ Arubaito ╲ John Doe ╲ 0x7F...3B ╲  │
│              [ZKPFP IMAGE]                 │
│       ╲ 0x7F...3B2 ╲ John Doe ╲ Aruba ╲   │
│        ╲ 2024-01-28 ╲ 0x7F...3B2 ╲ Jo ╲   │
│         ╲ John Doe ╲ Arubaito ╲ 2024 ╲    │
└────────────────────────────────────────────┘
```

---

### 2. Enhanced API Response

The `/reveal-zkpfp` endpoint will return:

```json
{
  "success": true,
  "blob_id": "abc123",
  
  // Watermarked decrypted image (viewer identity burned in)
  "watermarked_image_base64": "data:image/png;base64,...",
  
  // Viewer identification (for audit trail)
  "viewer_info": {
    "wallet_address": "0x7F...3B2",
    "display_name": "John Doe",
    "platform_name": "Arubaito"
  },
  
  // Protected viewing component configuration
  "protected_viewer_config": {
    "viewing_time_seconds": 30,
    "reveal_radius_px": 80,
    "blur_amount": 40,
    "scanline_animation": true,
    "extend_viewing_enabled": true
  },
  
  // Complete React component code for platforms to embed
  "protected_viewer_component_url": "https://zkprof.lovable.app/embed/protected-viewer.js",
  
  // Verification data
  "zk_proof_verified": true,
  "session_expires_at": "2024-01-28T12:00:00Z",
  
  // NDA audit trail
  "nda_audit": {
    "nda_hash": "sha256...",
    "signing_timestamp": "2024-01-28T11:00:00Z",
    "solana_memo_signature": "..."
  },
  
  "platform_balance_remaining": 49.50
}
```

---

### 3. Database Update: Add Viewer Name

Update `access_sessions` table to store viewer's display name (optional field that platforms can provide):

| Column | Type | Description |
|--------|------|-------------|
| viewer_display_name | text (nullable) | Viewer's name/username from platform |

---

### 4. Protected Viewer Embeddable Component

Create an embeddable JavaScript component that third-party platforms can easily include:

```html
<!-- On third-party platform -->
<div id="zkpfp-viewer"></div>
<script src="https://zkprof.lovable.app/embed/protected-viewer.js"></script>
<script>
  ZkProf.renderProtectedViewer({
    containerId: 'zkpfp-viewer',
    imageBase64: response.watermarked_image_base64,
    viewerWallet: response.viewer_info.wallet_address,
    viewerName: response.viewer_info.display_name,
    config: response.protected_viewer_config
  });
</script>
```

The component includes:
- Circular reveal following mouse/touch
- 40px blur on background with 80px clear circle
- Timer countdown (30 seconds default)
- Screenshot prevention (PrintScreen detection, visibility change handling)
- Scanline effect for security camera aesthetic
- The viewer's watermark visible both on the image AND in the component overlay

---

## Technical Implementation

### Image Watermarking on Server (Deno)

Using Canvas API in Deno to apply watermarks:

```typescript
// In reveal-zkpfp edge function
async function applyWatermark(
  imageBase64: string,
  viewerWallet: string,
  viewerName: string | null,
  platformName: string,
  timestamp: string
): Promise<string> {
  // Use Deno's canvas library to:
  // 1. Load the decrypted image
  // 2. Create repeating diagonal text pattern
  // 3. Apply at 15-20% opacity across entire image
  // 4. Return watermarked image as base64
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Add `viewer_display_name` to `access_sessions` |
| `supabase/functions/reveal-zkpfp/index.ts` | Modify | Add server-side decryption + watermarking |
| `supabase/functions/sign-nda/index.ts` | Modify | Accept optional `viewer_display_name` param |
| `public/embed/protected-viewer.js` | Create | Embeddable protected viewer component |
| `supabase/config.toml` | Modify | Add new function configurations |
| `supabase/functions/get-user-zkpfps/index.ts` | Create | Query user's zkPFPs |
| `supabase/functions/link-zkpfp-to-profile/index.ts` | Create | Link zkPFP to platform profile |

---

## Security Summary

| Feature | Protection Provided |
|---------|---------------------|
| Server-side watermarking | Leaked images traceable to specific viewer |
| Wallet address in watermark | Cryptographic identity of who viewed |
| Viewer name in watermark | Human-readable identification |
| Platform name in watermark | Identifies which integration was compromised |
| Timestamp in watermark | Proves when the leak occurred |
| Circular reveal | Prevents full-image screenshots |
| Timer expiration | Limits viewing window |
| PrintScreen detection | Active screenshot prevention |
| Visibility change detection | Blocks tab-away screenshots |

---

## Pricing (Unchanged)
- Reveal cost remains at **$0.50** per reveal
- Query zkPFPs: Free
- Link to Profile: Free

