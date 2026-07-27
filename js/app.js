/**
 * TempMail Pro Application Logic - Streamlined Version with Rich Animations
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const emailDisplayEl = document.getElementById('emailAddressDisplay');
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const newRandomBtn = document.getElementById('newRandomBtn');
  const refreshInboxBtn = document.getElementById('refreshInboxBtn');
  
  const timerBadgeEl = document.getElementById('timerBadge');
  const durationChips = document.querySelectorAll('.duration-chip');
  
  const inboxCountBadge = document.getElementById('inboxCountBadge');
  const messagesListEl = document.getElementById('messagesList');
  const emptyInboxEl = document.getElementById('emptyInbox');
  
  const noMsgSelectedEl = document.getElementById('noMessageSelected');
  const msgDetailContainerEl = document.getElementById('msgDetailContainer');
  
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const toastContainer = document.getElementById('toastContainer');

  // Application State
  let currentAccount = null;
  let messages = [];
  let selectedMessage = null;
  let timerInterval = null;
  let pollingInterval = null;
  let availableDomains = ['web-library.net'];
  let knownMessageIds = new Set();
  let renderedMessageIds = new Set(); // الرسائل المرسومة فعلاً في DOM
  let selectedDurationKey = '2h'; // المدة المُختارة مسبقاً (لا تُطبَّق إلا عند إنشاء إيميل جديد)

  // Duration mapping in seconds (Max 7 Days = 604800s)
  const DURATION_PRESETS = {
    '1h': 3600,
    '2h': 7200,
    '12h': 43200,
    '1d': 86400,
    '3d': 259200,
    '7d': 604800
  };

  /* -------------------------------------------------------------
     1. INITIALIZATION & SESSION RESTORE
     ------------------------------------------------------------- */
  async function initApp() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 700,
        once: true,
        disable: window.innerWidth <= 768
      });
    }

    setupEventListeners();
    await loadDomains();

    // Check if session exists in localStorage
    const savedSession = localStorage.getItem('tempmail_pro_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          currentAccount = parsed;
          selectedDurationKey = currentAccount.durationKey || '2h';
          updateEmailDisplay(currentAccount.address);
          setActiveDurationChip(selectedDurationKey);
          startTimer();
          startPolling();
          await fetchInboxMessages();
          showToast('تم استعادة الجلسة الحالية بنجاح', 'info');
          return;
        }
      } catch (err) {
        console.error('Failed to parse saved session:', err);
      }
    }

    // Generate fresh email if no valid session exists
    await generateNewAccount(selectedDurationKey);
  }

  async function loadDomains() {
    try {
      const domains = await window.mailTmAPI.getDomains();
      if (domains && domains.length > 0) {
        availableDomains = domains;
      }
    } catch (e) {
      console.warn('Using fallback domain:', availableDomains[0]);
    }
  }

  /* -------------------------------------------------------------
     2. ACCOUNT GENERATION & DURATION CONTROL
     ------------------------------------------------------------- */
  async function generateNewAccount(durationKey = '2h') {
    stopPolling();
    stopTimer();

    const randomUser = 'user_' + Math.random().toString(36).substring(2, 10);
    const domain = availableDomains[Math.floor(Math.random() * availableDomains.length)];
    const address = `${randomUser}@${domain}`;
    const password = 'Pass_' + Math.random().toString(36).substring(2, 10) + '!';
    const durationSeconds = DURATION_PRESETS[durationKey] || DURATION_PRESETS['2h'];
    const expiresAt = Date.now() + (durationSeconds * 1000);

    emailDisplayEl.textContent = 'جاري إنشاء البريد...';

    try {
      const acc = await window.mailTmAPI.createAccount(address, password);
      const token = await window.mailTmAPI.getToken(address, password);

      currentAccount = {
        id: acc.id,
        address: address,
        password: password,
        token: token,
        createdTime: Date.now(),
        durationSeconds: durationSeconds,
        durationKey: durationKey,
        expiresAt: expiresAt
      };

      saveSession();

      messages = [];
      knownMessageIds.clear();
      renderedMessageIds.clear();
      selectedMessage = null;
      renderInboxList();
      renderMessageDetail(null);

      updateEmailDisplay(address);
      setActiveDurationChip(durationKey);
      startTimer();
      startPolling();

      showToast('تم إنشاء عنوان بريد مؤقت جديد!', 'success');
    } catch (err) {
      console.error('Error generating account:', err);
      showToast(`خطأ أثناء إنشاء البريد: ${err.message}`, 'warning');
      emailDisplayEl.textContent = 'خطأ في التوليد - حاول مجدداً';
    }
  }

  function saveSession() {
    if (currentAccount) {
      localStorage.setItem('tempmail_pro_session', JSON.stringify(currentAccount));
    }
  }

  function clearSession() {
    localStorage.removeItem('tempmail_pro_session');
  }

  function updateEmailDisplay(emailStr) {
    emailDisplayEl.textContent = emailStr;
    emailDisplayEl.classList.add('animate__animated', 'animate__headShake');
    setTimeout(() => emailDisplayEl.classList.remove('animate__animated', 'animate__headShake'), 800);
  }

  /* -------------------------------------------------------------
     3. COUNTDOWN TIMER
     ------------------------------------------------------------- */
  function startTimer() {
    stopTimer();
    updateTimerUI();
    timerInterval = setInterval(updateTimerUI, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
  }

  function updateTimerUI() {
    if (!currentAccount || !currentAccount.expiresAt) return;

    const remainingMs = currentAccount.expiresAt - Date.now();

    if (remainingMs <= 0) {
      stopTimer();
      stopPolling();
      timerBadgeEl.className = 'timer-box expired';
      timerBadgeEl.innerHTML = `<i class="fa-solid fa-clock"></i> <span>منتهي الصلاحية</span>`;
      showToast('انتهت مدة صلاحية البريد المؤقت!', 'warning');
      clearSession();
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    let timeFormatted = '';
    if (days > 0) {
      timeFormatted = `${days} يوم و ${hours}:${padZero(mins)}:${padZero(secs)}`;
    } else {
      timeFormatted = `${padZero(hours)}:${padZero(mins)}:${padZero(secs)}`;
    }

    if (totalSeconds < 600) {
      timerBadgeEl.className = 'timer-box warning';
    } else {
      timerBadgeEl.className = 'timer-box';
    }

    timerBadgeEl.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> <span>متبقي: ${timeFormatted}</span>`;
  }

  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  function setActiveDurationChip(durationKey) {
    durationChips.forEach(chip => {
      if (chip.getAttribute('data-duration') === durationKey) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    const modalOpts = document.querySelectorAll('.duration-modal-opt');
    modalOpts.forEach(opt => {
      if (opt.getAttribute('data-duration') === durationKey) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  function changeDuration(newKey) {
    // فقط نحفظ المدة المختارة - لا نُعيد تعيين العداد
    // العداد يُحدَّث فقط عند إنشاء إيميل جديد فعلياً
    selectedDurationKey = newKey;
    setActiveDurationChip(newKey);
    showToast(`سيتم تطبيق مدة ${getDurationTitle(newKey)} عند إنشاء البريد التالي`, 'info');
  }

  function getDurationTitle(key) {
    switch (key) {
      case '1h': return 'ساعة واحدة';
      case '2h': return 'ساعتان';
      case '12h': return '12 ساعة';
      case '1d': return 'يوم واحد';
      case '3d': return '3 أيام';
      case '7d': return '7 أيام (الأقصى)';
      default: return 'ساعتان';
    }
  }

  /* -------------------------------------------------------------
     4. SILENT AUTO-POLLING ENGINE (EVERY 3 SECONDS)
     ------------------------------------------------------------- */
  function startPolling() {
    stopPolling();
    pollingInterval = setInterval(fetchInboxMessages, 3000);
  }

  function stopPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
  }

  async function fetchInboxMessages() {
    if (!currentAccount || !currentAccount.token) return;

    try {
      refreshInboxBtn.classList.add('spinning');
      const rawMessages = await window.mailTmAPI.getMessages(currentAccount.token);
      
      let newArrival = false;
      rawMessages.forEach(msg => {
        if (!knownMessageIds.has(msg.id)) {
          newArrival = true;
          knownMessageIds.add(msg.id);
        }
      });

      messages = rawMessages;
      inboxCountBadge.textContent = messages.length;

      renderInboxList();

      if (newArrival && messages.length > 0) {
        triggerConfetti();
        showToast('وصل بريد إلكتروني جديد!', 'success');
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        stopPolling();
        showToast('انتهت جلسة البريد، يرجى التوليد مجدداً', 'warning');
      }
    } finally {
      setTimeout(() => refreshInboxBtn.classList.remove('spinning'), 400);
    }
  }

  /* -------------------------------------------------------------
     5. INBOX LIST RENDERING WITH ANIMATIONS
     ------------------------------------------------------------- */
  function buildMessageElement(msg, isNew) {
    const itemEl = document.createElement('div');
    // الـ animation فقط للرسائل الجديدة فعلاً
    const animClass = isNew ? 'animate__animated animate__fadeInUp' : '';
    itemEl.className = `message-item ${animClass} ${msg.seen ? '' : 'unread'} ${selectedMessage && selectedMessage.id === msg.id ? 'active' : ''}`;
    itemEl.setAttribute('data-msg-id', msg.id);

    const senderName = msg.from ? (msg.from.name || msg.from.address) : 'مرسل مجهول';
    const subject = msg.subject || '(بدون عنوان)';
    const dateStr = new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const parsedOTP = OTPParser.extract({ subject: msg.subject, intro: msg.intro });

    let remoteCopyHTML = '';
    if (parsedOTP.primaryCode) {
      remoteCopyHTML = `
        <div class="remote-otp-card">
          <div class="remote-otp-info">
            <span class="remote-otp-label"><i class="fa-solid fa-key"></i> الرمز:</span>
            <strong class="remote-otp-code">${parsedOTP.primaryCode}</strong>
          </div>
          <button class="btn-remote-copy" data-otp="${parsedOTP.primaryCode}">
            <i class="fa-regular fa-copy"></i> نسخ الرمز
          </button>
        </div>
      `;
    }

    itemEl.innerHTML = `
      <div class="msg-sender">${escapeHTML(senderName)}</div>
      <div class="msg-subject">${escapeHTML(subject)}</div>
      ${remoteCopyHTML}
      <div class="msg-footer-row">
        <span class="msg-time"><i class="fa-regular fa-clock"></i> ${dateStr}</span>
        <span class="msg-tap-hint">اضغط لفتح الرسالة <i class="fa-solid fa-chevron-left"></i></span>
      </div>
    `;

    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remote-copy')) return;
      openMessage(msg.id);
    });

    const remoteCopyBtn = itemEl.querySelector('.btn-remote-copy');
    if (remoteCopyBtn) {
      remoteCopyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const codeToCopy = remoteCopyBtn.getAttribute('data-otp');
        triggerConfetti();
        copyToClipboard(codeToCopy, `تم نسخ رمز التحقق (${codeToCopy}) من بعيد بنجاح!`);
      });
    }

    return itemEl;
  }

  function renderInboxList() {
    if (!messages || messages.length === 0) {
      emptyInboxEl.style.display = 'flex';
      messagesListEl.style.display = 'none';
      renderedMessageIds.clear();
      return;
    }

    emptyInboxEl.style.display = 'none';
    messagesListEl.style.display = 'flex';

    messages.forEach(msg => {
      const existingEl = messagesListEl.querySelector(`[data-msg-id="${msg.id}"]`);

      if (existingEl) {
        // الرسالة موجودة مسبقاً → فقط حدّث الحالة (مقروءة / محددة) بدون animation
        existingEl.classList.toggle('unread', !msg.seen);
        existingEl.classList.toggle('active', !!(selectedMessage && selectedMessage.id === msg.id));
        // أزل أي animation متبقية
        existingEl.classList.remove('animate__animated', 'animate__fadeInUp');
      } else {
        // رسالة جديدة → ابنِها مع animation وأضفها للقائمة
        const newEl = buildMessageElement(msg, true);
        messagesListEl.prepend(newEl);
        renderedMessageIds.add(msg.id);
      }
    });
  }

  async function openMessage(messageId) {
    if (!currentAccount || !currentAccount.token) return;

    try {
      showToast('جاري تحميل تفاصيل الرسالة...', 'info');
      const detail = await window.mailTmAPI.getMessageDetail(currentAccount.token, messageId);
      selectedMessage = detail;
      
      const localMsg = messages.find(m => m.id === messageId);
      if (localMsg) localMsg.seen = true;
      
      renderInboxList();
      renderMessageDetail(detail);

      if (window.innerWidth <= 768) {
        const msgPanel = document.querySelector('.message-view-panel');
        if (msgPanel) {
          msgPanel.classList.add('mobile-active');
          window.scrollTo({ top: msgPanel.offsetTop - 10, behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Error fetching message detail:', err);
      showToast('تعذر فتح الرسالة', 'warning');
    }
  }

  function renderMessageDetail(msg) {
    if (!msg) {
      noMsgSelectedEl.style.display = 'flex';
      msgDetailContainerEl.style.display = 'none';
      return;
    }

    noMsgSelectedEl.style.display = 'none';
    msgDetailContainerEl.style.display = 'flex';

    const otpResult = OTPParser.extract(msg);

    // --- عرض الأرقام ورمز OTP فقط ---
    let detailHTML = `
      <div class="msg-detail-header animate__animated animate__fadeIn">
        <div class="msg-title-bar">
          <button class="mobile-back-btn" id="mobileBackBtn">
            <i class="fa-solid fa-arrow-right"></i> القائمة
          </button>
          <div class="msg-actions-toolbar">
            <button class="icon-btn" id="btnDeleteMsg" title="حذف الرسالة"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `;

    if (otpResult.primaryCode) {
      detailHTML += `
        <div class="otp-hero-card animate__animated animate__tada">
          <div class="otp-content">
            <div class="otp-title"><i class="fa-solid fa-shield-halved"></i> رمز التحقق:</div>
            <div class="otp-code-value" id="primaryOtpValue">${otpResult.primaryCode}</div>
          </div>
          <button class="btn-copy-code" id="btnCopyOtpCode">
            <i class="fa-regular fa-copy"></i> نسخ الرمز
          </button>
        </div>
      `;
    }

    if (otpResult.allNumbers && otpResult.allNumbers.length > 0) {
      detailHTML += `
        <div class="extracted-numbers-bar">
          <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-list-ol"></i> الأرقام المكتشفة للنسخ:</span>
          <div class="numbers-chips-wrapper">
            ${otpResult.allNumbers.map(n => `
              <button class="duration-chip copy-num-chip" data-num="${n}">
                <i class="fa-regular fa-copy"></i> ${n}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (!otpResult.primaryCode && (!otpResult.allNumbers || otpResult.allNumbers.length === 0)) {
      detailHTML += `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem; padding:2.5rem 1rem; color:var(--text-muted); text-align:center;">
          <i class="fa-solid fa-magnifying-glass" style="font-size:2rem; opacity:0.4;"></i>
          <span style="font-size:0.9rem;">لم يُعثر على أرقام أو رموز في هذه الرسالة</span>
        </div>
      `;
    }

    msgDetailContainerEl.innerHTML = detailHTML;

    const mobileBackBtn = document.getElementById('mobileBackBtn');
    if (mobileBackBtn) {
      mobileBackBtn.addEventListener('click', () => {
        const msgPanel = document.querySelector('.message-view-panel');
        if (msgPanel) msgPanel.classList.remove('mobile-active');
      });
    }

    const copyOtpBtn = document.getElementById('btnCopyOtpCode');
    if (copyOtpBtn) {
      copyOtpBtn.addEventListener('click', () => {
        triggerConfetti();
        copyToClipboard(otpResult.primaryCode, 'تم نسخ رمز التحقق بنجاح!');
      });
    }

    const deleteMsgBtn = document.getElementById('btnDeleteMsg');
    if (deleteMsgBtn) {
      deleteMsgBtn.addEventListener('click', async () => {
        if (confirm('هل أنت تأكد من رغبتك في حذف هذه الرسالة؟')) {
          await window.mailTmAPI.deleteMessage(currentAccount.token, msg.id);
          showToast('تم حذف الرسالة بنجاح', 'info');
          messages = messages.filter(m => m.id !== msg.id);
          selectedMessage = null;
          renderInboxList();
          renderMessageDetail(null);
          const msgPanel = document.querySelector('.message-view-panel');
          if (msgPanel) msgPanel.classList.remove('mobile-active');
        }
      });
    }

    document.querySelectorAll('.copy-num-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const num = chip.getAttribute('data-num');
        triggerConfetti();
        copyToClipboard(num, `تم نسخ الرقم ${num}`);
      });
    });
  }

  /* -------------------------------------------------------------
     6. VISUAL CONFETTI ANIMATION ON COPY / EVENT
     ------------------------------------------------------------- */
  function triggerConfetti() {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  /* -------------------------------------------------------------
     7. UTILITIES: COPY & TOAST
     ------------------------------------------------------------- */
  function copyToClipboard(text, successMsg) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg, 'success');
    });
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHTML(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* -------------------------------------------------------------
     8. EVENT LISTENERS SETUP
     ------------------------------------------------------------- */
  function setupEventListeners() {
    const mobileDurationModal = document.getElementById('mobileDurationModal');
    const closeDurationModalBtn = document.getElementById('closeDurationModalBtn');
    const cancelDurationModalBtn = document.getElementById('cancelDurationModalBtn');
    const modalDurationOpts = document.querySelectorAll('.duration-modal-opt');

    function openMobileDurationModal() {
      if (!mobileDurationModal) return;
      setActiveDurationChip(selectedDurationKey);
      mobileDurationModal.classList.add('active');
      mobileDurationModal.setAttribute('aria-hidden', 'false');
    }

    function closeMobileDurationModal() {
      if (!mobileDurationModal) return;
      mobileDurationModal.classList.remove('active');
      mobileDurationModal.setAttribute('aria-hidden', 'true');
    }

    copyEmailBtn.addEventListener('click', () => {
      if (currentAccount && currentAccount.address) {
        triggerConfetti();
        copyToClipboard(currentAccount.address, 'تم نسخ عنوان البريد بنجاح!');
      }
    });

    newRandomBtn.addEventListener('click', () => {
      // في شاشة الهاتف (العرض <= 768px)، نفتح نافذة خيارات مدة البريد الجديد
      if (window.innerWidth <= 768) {
        openMobileDurationModal();
      } else {
        // في أجهزة الكمبيوتر، نولد مباشرة بالمدة المحددة حالياً
        generateNewAccount(selectedDurationKey);
      }
    });

    if (closeDurationModalBtn) {
      closeDurationModalBtn.addEventListener('click', closeMobileDurationModal);
    }
    if (cancelDurationModalBtn) {
      cancelDurationModalBtn.addEventListener('click', closeMobileDurationModal);
    }
    if (mobileDurationModal) {
      mobileDurationModal.addEventListener('click', (e) => {
        if (e.target === mobileDurationModal) {
          closeMobileDurationModal();
        }
      });
    }

    modalDurationOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        const key = opt.getAttribute('data-duration');
        selectedDurationKey = key;
        setActiveDurationChip(key);
        closeMobileDurationModal();
        generateNewAccount(selectedDurationKey);
      });
    });

    refreshInboxBtn.addEventListener('click', () => {
      fetchInboxMessages();
    });

    durationChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-duration');
        changeDuration(key);
      });
    });

    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      themeToggleBtn.innerHTML = isLight ? '<i class="fa-regular fa-moon"></i>' : '<i class="fa-regular fa-sun"></i>';
      showToast(isLight ? 'تم تفعيل الوضع الفاتح' : 'تم تفعيل الوضع الداكن', 'info');
    });
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return map[match];
    });
  }

  function escapeHTMLAttribute(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;');
  }

  initApp();
});
