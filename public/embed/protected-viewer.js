/**
 * zkProf Protected Viewer - Embeddable Component
 * 
 * This component provides a secure way to display zkPFP images with:
 * - Circular reveal effect (mouse/touch following)
 * - Blur protection outside reveal area
 * - Timer countdown with viewing limits
 * - Screenshot prevention mechanisms
 * - Viewer identity watermark overlay
 * 
 * Usage:
 * <div id="zkpfp-viewer"></div>
 * <script src="https://zkprof.lovable.app/embed/protected-viewer.js"></script>
 * <script>
 *   ZkProf.renderProtectedViewer({
 *     containerId: 'zkpfp-viewer',
 *     imageBase64: response.watermarked_image_base64,
 *     viewerWallet: response.viewer_info.wallet_address,
 *     viewerName: response.viewer_info.display_name,
 *     config: response.protected_viewer_config
 *   });
 * </script>
 */

(function(global) {
  'use strict';

  const ZkProf = {
    version: '1.0.0',
    
    /**
     * Render the protected viewer component
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - ID of the container element
     * @param {string} options.imageBase64 - Base64 encoded image data URL
     * @param {string} options.viewerWallet - Viewer's wallet address
     * @param {string|null} options.viewerName - Viewer's display name (optional)
     * @param {Object} options.config - Viewer configuration
     */
    renderProtectedViewer: function(options) {
      const {
        containerId,
        imageBase64,
        viewerWallet,
        viewerName,
        config = {}
      } = options;

      const container = document.getElementById(containerId);
      if (!container) {
        console.error('ZkProf: Container element not found:', containerId);
        return null;
      }

      // Default configuration
      const viewingTime = config.viewing_time_seconds || 30;
      const revealRadius = config.reveal_radius_px || 80;
      const blurAmount = config.blur_amount || 40;
      const scanlineAnimation = config.scanline_animation !== false;
      const extendViewingEnabled = config.extend_viewing_enabled !== false;

      // Create viewer instance
      const viewer = new ProtectedViewer({
        container,
        imageBase64,
        viewerWallet,
        viewerName,
        viewingTime,
        revealRadius,
        blurAmount,
        scanlineAnimation,
        extendViewingEnabled
      });

      viewer.init();
      return viewer;
    }
  };

  /**
   * ProtectedViewer Class
   */
  class ProtectedViewer {
    constructor(options) {
      this.container = options.container;
      this.imageBase64 = options.imageBase64;
      this.viewerWallet = options.viewerWallet;
      this.viewerName = options.viewerName;
      this.viewingTime = options.viewingTime;
      this.revealRadius = options.revealRadius;
      this.blurAmount = options.blurAmount;
      this.scanlineAnimation = options.scanlineAnimation;
      this.extendViewingEnabled = options.extendViewingEnabled;
      
      this.timeRemaining = this.viewingTime;
      this.isActive = true;
      this.mouseX = 0;
      this.mouseY = 0;
      this.timerInterval = null;
    }

    init() {
      this.createStyles();
      this.createDOM();
      this.bindEvents();
      this.startTimer();
      this.setupScreenshotPrevention();
    }

    createStyles() {
      const styleId = 'zkprof-protected-viewer-styles';
      if (document.getElementById(styleId)) return;

      const styles = document.createElement('style');
      styles.id = styleId;
      styles.textContent = `
        .zkprof-viewer {
          position: relative;
          width: 100%;
          max-width: 400px;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 12px;
          background: #1a1a2e;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        
        .zkprof-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .zkprof-blurred-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        
        .zkprof-reveal-mask {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        
        .zkprof-revealed-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          clip-path: circle(0px at 50% 50%);
          pointer-events: none;
        }
        
        .zkprof-scanlines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 255, 0, 0.03) 0px,
            rgba(0, 255, 0, 0.03) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
          animation: zkprof-scanline-move 8s linear infinite;
        }
        
        @keyframes zkprof-scanline-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 100px; }
        }
        
        .zkprof-watermark-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }
        
        .zkprof-watermark-text {
          position: absolute;
          white-space: nowrap;
          font-family: monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.15);
          transform: rotate(-30deg);
          pointer-events: none;
        }
        
        .zkprof-timer {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.7);
          color: #00ff88;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
          z-index: 10;
        }
        
        .zkprof-timer.warning {
          color: #ffaa00;
        }
        
        .zkprof-timer.critical {
          color: #ff4444;
          animation: zkprof-pulse 0.5s infinite;
        }
        
        @keyframes zkprof-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .zkprof-instructions {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: #ffffff;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: system-ui, sans-serif;
          font-size: 12px;
          text-align: center;
          z-index: 10;
        }
        
        .zkprof-expired-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }
        
        .zkprof-expired-text {
          color: #ffffff;
          font-family: system-ui, sans-serif;
          font-size: 16px;
          margin-bottom: 16px;
        }
        
        .zkprof-extend-button {
          background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
          color: #000000;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .zkprof-extend-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        }
      `;
      document.head.appendChild(styles);
    }

    createDOM() {
      this.container.innerHTML = '';
      this.container.className = 'zkprof-viewer';

      // Image container
      const imageContainer = document.createElement('div');
      imageContainer.className = 'zkprof-image-container';

      // Blurred background image
      const blurredImg = document.createElement('img');
      blurredImg.className = 'zkprof-blurred-image';
      blurredImg.src = this.imageBase64;
      blurredImg.style.filter = `blur(${this.blurAmount}px)`;
      blurredImg.draggable = false;
      imageContainer.appendChild(blurredImg);

      // Reveal mask with clear image
      const revealMask = document.createElement('div');
      revealMask.className = 'zkprof-reveal-mask';
      
      const revealedImg = document.createElement('img');
      revealedImg.className = 'zkprof-revealed-image';
      revealedImg.src = this.imageBase64;
      revealedImg.draggable = false;
      this.revealedImg = revealedImg;
      revealMask.appendChild(revealedImg);
      imageContainer.appendChild(revealMask);

      // Scanlines overlay
      if (this.scanlineAnimation) {
        const scanlines = document.createElement('div');
        scanlines.className = 'zkprof-scanlines';
        imageContainer.appendChild(scanlines);
      }

      // Watermark overlay
      const watermarkOverlay = document.createElement('div');
      watermarkOverlay.className = 'zkprof-watermark-overlay';
      this.createWatermarks(watermarkOverlay);
      imageContainer.appendChild(watermarkOverlay);

      // Timer
      const timer = document.createElement('div');
      timer.className = 'zkprof-timer';
      timer.textContent = this.formatTime(this.timeRemaining);
      this.timerElement = timer;
      imageContainer.appendChild(timer);

      // Instructions
      const instructions = document.createElement('div');
      instructions.className = 'zkprof-instructions';
      instructions.textContent = 'Move cursor to reveal image';
      imageContainer.appendChild(instructions);

      this.container.appendChild(imageContainer);
      this.imageContainer = imageContainer;
    }

    createWatermarks(overlay) {
      const shortWallet = `${this.viewerWallet.slice(0, 6)}...${this.viewerWallet.slice(-4)}`;
      const displayName = this.viewerName || 'Anonymous';
      const watermarkText = `${shortWallet} | ${displayName}`;

      // Create a grid of watermarks
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
          const watermark = document.createElement('div');
          watermark.className = 'zkprof-watermark-text';
          watermark.textContent = watermarkText;
          watermark.style.left = `${col * 120 - 50 + (row % 2) * 60}px`;
          watermark.style.top = `${row * 60 - 20}px`;
          overlay.appendChild(watermark);
        }
      }
    }

    bindEvents() {
      // Mouse move for reveal effect
      this.container.addEventListener('mousemove', (e) => {
        if (!this.isActive) return;
        const rect = this.container.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.updateReveal();
      });

      // Touch move for mobile
      this.container.addEventListener('touchmove', (e) => {
        if (!this.isActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.container.getBoundingClientRect();
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
        this.updateReveal();
      });

      // Hide reveal when mouse leaves
      this.container.addEventListener('mouseleave', () => {
        if (this.revealedImg) {
          this.revealedImg.style.clipPath = `circle(0px at ${this.mouseX}px ${this.mouseY}px)`;
        }
      });

      // Prevent right-click
      this.container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
    }

    updateReveal() {
      if (!this.revealedImg || !this.isActive) return;
      this.revealedImg.style.clipPath = `circle(${this.revealRadius}px at ${this.mouseX}px ${this.mouseY}px)`;
    }

    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timeRemaining--;
        this.updateTimerDisplay();

        if (this.timeRemaining <= 0) {
          this.stopTimer();
          this.showExpired();
        }
      }, 1000);
    }

    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    updateTimerDisplay() {
      if (!this.timerElement) return;
      
      this.timerElement.textContent = this.formatTime(this.timeRemaining);
      
      if (this.timeRemaining <= 5) {
        this.timerElement.className = 'zkprof-timer critical';
      } else if (this.timeRemaining <= 10) {
        this.timerElement.className = 'zkprof-timer warning';
      }
    }

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showExpired() {
      this.isActive = false;
      
      // Hide the revealed image
      if (this.revealedImg) {
        this.revealedImg.style.clipPath = 'circle(0px at 50% 50%)';
      }

      // Show expired overlay
      const expiredOverlay = document.createElement('div');
      expiredOverlay.className = 'zkprof-expired-overlay';
      
      const expiredText = document.createElement('div');
      expiredText.className = 'zkprof-expired-text';
      expiredText.textContent = 'Viewing time expired';
      expiredOverlay.appendChild(expiredText);

      if (this.extendViewingEnabled) {
        const extendButton = document.createElement('button');
        extendButton.className = 'zkprof-extend-button';
        extendButton.textContent = 'Extend Viewing (+30s)';
        extendButton.addEventListener('click', () => this.extendViewing());
        expiredOverlay.appendChild(extendButton);
      }

      this.container.appendChild(expiredOverlay);
      this.expiredOverlay = expiredOverlay;
    }

    extendViewing() {
      if (this.expiredOverlay) {
        this.expiredOverlay.remove();
        this.expiredOverlay = null;
      }
      
      this.isActive = true;
      this.timeRemaining = this.viewingTime;
      this.timerElement.className = 'zkprof-timer';
      this.updateTimerDisplay();
      this.startTimer();
    }

    setupScreenshotPrevention() {
      // Detect PrintScreen key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'PrintScreen') {
          this.hideContent();
          setTimeout(() => this.showContent(), 500);
        }
      });

      // Detect visibility change (tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.hideContent();
        } else {
          this.showContent();
        }
      });

      // Detect window blur
      window.addEventListener('blur', () => {
        this.hideContent();
      });

      window.addEventListener('focus', () => {
        this.showContent();
      });
    }

    hideContent() {
      if (this.imageContainer) {
        this.imageContainer.style.filter = 'blur(100px)';
      }
    }

    showContent() {
      if (this.imageContainer && this.isActive) {
        this.imageContainer.style.filter = 'none';
      }
    }

    destroy() {
      this.stopTimer();
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  // Expose to global scope
  global.ZkProf = ZkProf;

})(typeof window !== 'undefined' ? window : this);
