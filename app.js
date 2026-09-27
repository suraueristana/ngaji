(() => {
  'use strict';

  const C = window.NGAJI_CONFIG || {};
  const SCHEMA = C.SCHEMA || 'ngaji';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  let supa = null;
  try {
    if (window.supabase && C.SUPABASE_URL && C.SUPABASE_PUBLISHABLE_KEY) {
      supa = window.supabase.createClient(
        C.SUPABASE_URL,
        C.SUPABASE_PUBLISHABLE_KEY,
        { db: { schema: SCHEMA } }
      );
    }
  } catch (error) {
    console.warn('Supabase initialization failed:', error);
  }

  const db = {
    table(name) {
      if (!supa) throw new Error('Supabase client is unavailable.');
      return supa.from(name);
    },
    users: () => db.table('users'),
    students: () => db.table('students'),
    teachers: () => db.table('teachers'),
    studentTeacher: () => db.table('student_teacher'),
    teacherAvailability: () => db.table('teacher_availability'),
    teacherLeave: () => db.table('teacher_leave'),
    attendance: () => db.table('attendance'),
    calendarEvents: () => db.table('calendar_events'),
    announcements: () => db.table('announcements'),
    documents: () => db.table('documents'),
    assessmentWindow: () => db.table('assessment_window'),
    assessmentItems: () => db.table('assessment_items'),
    assessments: () => db.table('assessments'),
    assessmentScores: () => db.table('assessment_scores'),
    settings: () => db.table('settings'),
    auditLog: () => db.table('audit_log')
  };

  window.ngajiSupabase = supa;
  window.ngajiDb = db;

  const state = {
    role: 'guest', user: null, tab: 'utama', slide: 0,
    studentTab: 'profil', teacherTab: 'profil', adminTab: 'ringkasan'
  };

  const demo = {
    student: {
      id: '101010101010', name: 'Aiman Hakim', phone: '012-888 2026',
      dob: '10/10/2010', address: 'Eristana, Kuala Lumpur',
      teachers: ['Ustaz Ahmad Firdaus'], attendance: 88, absent: 3
    },
    teacher: {
      phone: '01234567890', password: '123456', name: 'Ustaz Ahmad Firdaus',
      email: 'ahmad@example.com', capacity: 30, students: 18
    },
    admin: { id: 'ngaji_admin', password: '123456', name: 'Pentadbir Ngaji' },
    results: [
      {
        date: '15 Jun 2026', name: 'Penilaian Pertengahan Tahun', score: 84,
        assessor: 'Ustaz Ahmad Firdaus',
        comment: 'Bacaan semakin lancar. Fokus pada makhraj ض dan ظ.',
        items: { Kehadiran: 27, Tajwid: 12, Makhraj: 9, Kelancaran: 8, 'Adab & Sebutan': 5, 'Hafazan / Sasaran': 7, Penglibatan: 16 }
      },
      {
        date: '18 Dis 2025', name: 'Penilaian Akhir Tahun', score: 78,
        assessor: 'Ustazah Mariam Abdullah',
        comment: 'Kemajuan baik dan perlu latihan waqaf.',
        items: { Kehadiran: 25, Tajwid: 11, Makhraj: 8, Kelancaran: 7, 'Adab & Sebutan': 5, 'Hafazan / Sasaran': 7, Penglibatan: 15 }
      }
    ]
  };

  const publicTabs = ['utama', 'takwim', 'asatizah', 'dokumen', 'maklumbalas'];
  const labels = {
    utama: 'Utama', takwim: 'Takwim', asatizah: 'Asatizah', dokumen: 'Dokumen',
    maklumbalas: 'Maklum Balas', profil: 'Profil', pelajar: 'Pelajar',
    kedatangan: 'Kedatangan', keputusan: 'Keputusan', penilaian: 'Penilaian',
    cuti: 'Cuti', ringkasan: 'Ringkasan', kandungan: 'Kandungan', tetapan: 'Tetapan'
  };

  function escapeHtml(v = '') {
    return String(v).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2300);
  }
  function modal(html) { $('#modalRoot').innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`; }
  function closeModal() { $('#modalRoot').innerHTML = ''; }
  function currentTab() {
    if (state.role === 'student') return state.studentTab;
    if (state.role === 'teacher') return state.teacherTab;
    if (state.role === 'admin') return state.adminTab;
    return state.tab;
  }
  function setTab(tab) {
    if (state.role === 'student') state.studentTab = tab;
    else if (state.role === 'teacher') state.teacherTab = tab;
    else if (state.role === 'admin') state.adminTab = tab;
    else state.tab = tab;
    render();
  }
  function page(title, subtitle, body) {
    return `<section class="page"><div class="page-head"><div><h1>${title}</h1><p>${subtitle || ''}</p></div></div>${body}</section>`;
  }
  function nav() {
    let own = [];
    if (state.role === 'student') own = ['profil', 'kedatangan', 'keputusan'];
    if (state.role === 'teacher') own = ['profil', 'pelajar', 'kedatangan', 'penilaian', 'cuti'];
    if (state.role === 'admin') own = ['ringkasan', 'kandungan', 'pelajar', 'asatizah', 'kedatangan', 'takwim', 'penilaian', 'tetapan'];
    const common = state.role === 'guest' ? [] : publicTabs;
    const tabs = [...own, ...common.filter(x => !own.includes(x))];
    $('#mainNav').innerHTML = tabs.map(x => `<button class="nav-btn ${currentTab() === x ? 'active' : ''}" data-tab="${x}">${labels[x] || x}</button>`).join('') + (state.role !== 'guest' ? '<button class="nav-btn" data-action="logout">Log keluar</button>' : '');
    $('#userBadge').classList.toggle('hidden', state.role === 'guest');
    $('#userBadge').textContent = state.user?.name || '';
  }

  function renderLanding() {
    nav();
    $('#app').innerHTML = `<section class="hero"><div><div class="chip" style="display:inline-block">Pembelajaran Al-Quran · Komuniti Eristana</div><h1>Selamat Datang ke <span>Portal Kelas Ngaji</span> @ Surau Eristana</h1><p>Akses maklumat kelas, kehadiran, penilaian, takwim dan pengurusan peserta dalam satu portal.</p><div class="role-grid">${[
      ['🌐', 'Umum', 'Maklumat, takwim dan dokumen awam'],
      ['🎓', 'Pelajar', 'Profil, kedatangan dan keputusan'],
      ['📖', 'Asatizah', 'Kelas, pelajar dan penilaian'],
      ['⚙️', 'Pentadbir', 'Urus portal dan konfigurasi']
    ].map(x => `<button class="role-card" data-role="${x[1].toLowerCase()}"><i>${x[0]}</i><b>${x[1]}</b><span>${x[2]}</span></button>`).join('')}</div></div><div class="hero-logo"><img src="assets/logo.png" alt="Logo Surau Ar Raudhah Eristana"></div></section>`;
  }

  function homeView() {
    const slides = ['Majlis Ilmu, Membina Ummah', 'Bacaan Bertajwid, Hati Terpimpin', 'Belajar Bersama, Istiqamah Bersama'];
    return page('Utama', 'Maklumat terkini Kelas Ngaji Surau Eristana', `<div class="grid"><div class="span-8"><div class="slider">${slides.map((x, i) => `<div class="slide ${['one', 'two', 'three'][i]} ${state.slide === i ? 'active' : ''}"><h2>${x}</h2><p>Kelas bimbingan Al-Quran untuk komuniti Eristana.</p></div>`).join('')}<div class="slider-controls"><button data-action="prev-slide">‹</button><button data-action="next-slide">›</button></div></div></div><div class="span-4 card"><h2>Pengumuman</h2><div class="announcement"><b>Pendaftaran Kelas Dibuka</b><p>Permohonan baharu boleh dikemukakan melalui pautan pendaftaran.</p></div><div class="announcement"><b>Penilaian Pertengahan Tahun</b><p>Maklumat tarikh akan dikemas kini dalam Takwim.</p></div></div></div>`);
  }
  function calendarView() {
    const days = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
    let cells = days.map(d => `<div class="cal-cell cal-head">${d}</div>`).join('');
    for (let i = 1; i <= 30; i++) {
      const event = i === 6 ? 'Cuti Umum' : i === 14 ? 'Penilaian' : i === 21 ? 'Cuti Sekolah' : '';
      cells += `<div class="cal-cell"><b>${i}</b>${event ? `<span class="event">${event}</span>` : ''}</div>`;
    }
    return page('Takwim', 'Cuti umum, jadual kelas, peperiksaan dan penilaian', `<div class="card"><div class="page-head"><h2>September 2026</h2><button class="btn light">Hari Ini</button></div><div class="calendar">${cells}</div></div>`);
  }
  function teachersView() {
    const teachers = [['AF', 'Ustaz Ahmad Firdaus', 'Tajwid & Tilawah', 'Isnin, Rabu · 8:30 malam', '12 kekosongan'], ['MA', 'Ustazah Mariam Abdullah', 'Iqra & Asas Bacaan', 'Sabtu · 9:00 pagi', '5 kekosongan'], ['HH', 'Ustaz Hafiz Hakim', 'Hafazan & Tarannum', 'Ahad · 9:00 pagi', 'Penuh']];
    return page('Asatizah', 'Profil pengajar dan kekosongan kelas', `<div class="grid">${teachers.map(x => `<div class="card span-4 teacher-card"><div class="avatar">${x[0]}</div><div><h3>${x[1]}</h3><p>${x[2]}</p><div class="chips"><span class="chip">${x[3]}</span><span class="chip">${x[4]}</span></div></div></div>`).join('')}</div>`);
  }
  function documentsView() {
    return page('Dokumen', 'Muat turun bahan pembelajaran dan dokumen kelas', `<div class="card">${[['Borang Pendaftaran Pelajar', 'PDF'], ['Panduan Kelas Ngaji', 'PDF'], ['Jadual Kelas Semasa', 'Pautan'], ['Borang Maklum Balas', 'Pautan']].map(x => `<div class="doc-row"><div><b>${x[0]}</b><div class="muted">${x[1]}</div></div><button class="btn light" data-action="demo">Buka</button></div>`).join('')}</div>`);
  }
  function feedbackView() {
    const form = C.GOOGLE_FORM_EMBED_URL ? `<iframe title="Borang Maklum Balas" src="${escapeHtml(C.GOOGLE_FORM_EMBED_URL)}" width="100%" height="540" frameborder="0"></iframe>` : '<div class="empty">Masukkan Google Form embed URL dalam <b>config.js</b>.</div>';
    const map = C.MAP_EMBED_URL ? `<iframe title="Peta Surau" src="${escapeHtml(C.MAP_EMBED_URL)}" width="100%" height="290" frameborder="0"></iframe>` : '<div class="empty">Masukkan Google Maps embed URL dalam <b>config.js</b>.</div>';
    return page('Maklum Balas', 'Hubungi pentadbir atau hantarkan cadangan', `<div class="grid"><div class="card span-7"><h2>Borang Maklum Balas</h2>${form}</div><div class="span-5"><div class="card"><h2>Hubungi Kami</h2><p><b>Surau Ar Raudhah Eristana</b></p><p class="muted">Telefon dan e-mel boleh dikemas kini oleh pentadbir.</p></div><div class="card" style="margin-top:18px"><h2>Lokasi</h2>${map}</div></div></div>`);
  }
  function publicView(tab) {
    if (tab === 'utama') return homeView();
    if (tab === 'takwim') return calendarView();
    if (tab === 'asatizah') return teachersView();
    if (tab === 'dokumen') return documentsView();
    return feedbackView();
  }

  function attendanceStudent() {
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos'];
    return page('Kedatangan', 'Ringkasan dan rekod kehadiran bulanan', `<div class="grid"><div class="card span-4"><div class="muted">Kehadiran</div><div class="stat">${demo.student.attendance}%</div><div class="progress"><span style="width:${demo.student.attendance}%"></span></div></div><div class="card span-4"><div class="muted">Tidak Hadir</div><div class="stat" style="color:var(--danger)">${demo.student.absent} hari</div></div><div class="card span-4"><div class="muted">Status</div><div class="stat">Baik</div></div><div class="card span-12"><h2>Status Bulanan</h2><table><thead><tr><th>Bulan</th><th>Hadir</th><th>Tidak Hadir</th><th>Peratus</th></tr></thead><tbody>${months.map((m, i) => `<tr><td>${m}</td><td>${3 + i % 2}</td><td>${i % 4 === 0 ? 1 : 0}</td><td><span class="status">${i % 4 === 0 ? 75 : 100}%</span></td></tr>`).join('')}</tbody></table></div></div>`);
  }
  function resultsView() {
    return page('Keputusan', 'Keputusan terkini dipaparkan di bahagian atas', `<div class="grid">${demo.results.map((r, i) => `<div class="card span-6"><span class="status">${r.date}</span><h2>${r.name}</h2><div class="stat">${r.score}/100</div><p class="muted">Dinilai oleh ${r.assessor}</p><button class="btn light" data-result="${i}">Lihat Pecahan</button></div>`).join('')}</div>`);
  }
  function studentView(tab) {
    if (publicTabs.includes(tab)) return publicView(tab);
    if (tab === 'kedatangan') return attendanceStudent();
    if (tab === 'keputusan') return resultsView();
    return page('Profil Pelajar', 'Maklumat peribadi dan penempatan kelas', `<div class="grid"><div class="card span-8"><h2>${demo.student.name}</h2><div class="form-grid">${[['No. Kad Pengenalan', demo.student.id, 'disabled'], ['Telefon', demo.student.phone, ''], ['Tarikh Lahir', demo.student.dob, 'disabled'], ['Alamat', demo.student.address, '']].map(x => `<div class="field"><label>${x[0]}</label><input value="${x[1]}" ${x[2]}></div>`).join('')}</div><div class="modal-actions"><button class="btn" data-action="save">Simpan Perubahan</button></div></div><div class="card span-4"><h3>Asatizah Ditugaskan</h3>${demo.student.teachers.map(x => `<div class="list-row"><b>${x}</b><span class="status">Aktif</span></div>`).join('')}<p class="muted">Pertukaran asatizah hanya tersedia apabila tetingkap pemilihan dibuka.</p></div></div>`);
  }

  function teacherView(tab) {
    if (publicTabs.includes(tab)) return publicView(tab);
    if (tab === 'pelajar') return page('Pelajar', 'Pelajar yang ditugaskan kepada kelas anda', `<div class="card"><div class="page-head"><h2>${demo.teacher.students} / ${demo.teacher.capacity} pelajar</h2><button class="btn" data-action="demo">+ Cari / Tambah Pelajar</button></div><table><thead><tr><th>Nama</th><th>Mula</th><th>Tamat</th><th>Status</th></tr></thead><tbody>${['Aiman Hakim', 'Nur Aisyah', 'Muhammad Adam', 'Siti Hawa'].map(n => `<tr><td>${n}</td><td>01/01/2026</td><td>-</td><td><span class="status">Aktif</span></td></tr>`).join('')}</tbody></table></div>`);
    if (tab === 'kedatangan') return page('Kedatangan Pelajar', 'Tarikh lalai ialah hari ini', `<div class="card"><div class="field" style="max-width:240px;margin-bottom:15px"><label>Tarikh Kelas</label><input type="date"></div><table><thead><tr><th>Pelajar</th><th>Hadir</th><th>Tidak Hadir</th><th>Catatan</th></tr></thead><tbody>${['Aiman Hakim', 'Nur Aisyah', 'Muhammad Adam'].map((n, i) => `<tr><td>${n}</td><td><input type="radio" name="a${i}" checked></td><td><input type="radio" name="a${i}"></td><td><input placeholder="Catatan"></td></tr>`).join('')}</tbody></table><div class="modal-actions"><button class="btn" data-action="save">Simpan Kehadiran</button></div></div>`);
    if (tab === 'penilaian') return page('Penilaian', 'Tetingkap penilaian dikawal oleh pentadbir', `<div class="card"><div class="announcement"><b>Mod Demo</b><p>Data sebenar akan disambungkan dalam Fasa 3.</p></div><table><thead><tr><th>Pelajar</th><th>Status</th><th>Skor</th><th>Tindakan</th></tr></thead><tbody><tr><td>Aiman Hakim</td><td><span class="status">Selesai</span></td><td>84</td><td><button class="btn light" data-action="demo">Semak / Cetak</button></td></tr></tbody></table></div>`);
    if (tab === 'cuti') return page('Cuti Asatizah', 'Tempoh cuti mengatasi semua slot kelas', `<div class="grid"><div class="card span-5"><div class="field"><label>Tarikh Mula</label><input type="date"></div><div class="field"><label>Tarikh Tamat</label><input type="date"></div><div class="field"><label>Catatan</label><textarea></textarea></div><button class="btn" data-action="save">Simpan</button></div><div class="card span-7"><div class="empty">Tiada rekod cuti aktif.</div></div></div>`);
    return page('Profil Asatizah', 'Urus profil dan slot ketersediaan', `<div class="grid"><div class="card span-7"><div class="form-grid"><div class="field"><label>Nama</label><input value="${demo.teacher.name}"></div><div class="field"><label>No. Telefon</label><input value="${demo.teacher.phone}"></div><div class="field full"><label>E-mel</label><input value="${demo.teacher.email}"></div></div><button class="btn" data-action="save">Simpan</button></div><div class="card span-5"><h2>Ketersediaan</h2><div class="list-row"><b>Isnin · 8:30 malam</b><span class="status">Mingguan</span></div><button class="btn light" data-action="demo">+ Tambah Slot</button></div></div>`);
  }

  function adminView(tab) {
    if (publicTabs.includes(tab)) return publicView(tab);
    if (tab === 'ringkasan') return page('Dashboard Pentadbir', 'Ringkasan operasi portal', `<div class="grid">${[['128', 'Pelajar'], ['6', 'Asatizah'], ['88%', 'Kehadiran'], ['Demo', 'Status Integrasi']].map(x => `<div class="card span-4"><div class="stat">${x[0]}</div><div class="muted">${x[1]}</div></div>`).join('')}<div class="card span-12"><h2>Schema Pangkalan Data</h2><p><span class="status">${SCHEMA}</span></p><p class="muted">Semua query data Ngaji disasarkan kepada schema berasingan ini.</p></div></div>`);
    if (tab === 'kandungan') return page('Kandungan Portal', 'Urus pengumuman dan dokumen awam', `<div class="grid"><div class="card span-6"><h2>Pengumuman</h2><div class="field"><label>Tajuk</label><input value="Pendaftaran Kelas Dibuka"></div><div class="field"><label>Kandungan</label><textarea>Pendaftaran pelajar baharu kini dibuka.</textarea></div><button class="btn" data-action="save">Simpan</button></div><div class="card span-6"><h2>Dokumen Awam</h2><div class="field"><label>Nama</label><input></div><div class="field"><label>URL</label><input type="url"></div><button class="btn" data-action="save">Tambah</button></div></div>`);
    if (tab === 'pelajar' || tab === 'asatizah') {
      const teacher = tab === 'asatizah';
      return page(teacher ? 'Pengurusan Asatizah' : 'Pengurusan Pelajar', 'Tambah, import dan sunting rekod', `<div class="card"><div class="page-head"><input placeholder="Cari rekod..."><div><button class="btn light" data-action="demo">Muat Naik CSV</button> <button class="btn" data-action="demo">+ Rekod Baharu</button></div></div><table><thead><tr><th>Nama</th><th>ID / Telefon</th><th>Status</th><th>Tindakan</th></tr></thead><tbody><tr><td>${teacher ? demo.teacher.name : demo.student.name}</td><td>${teacher ? demo.teacher.phone : demo.student.id}</td><td><span class="status">Aktif</span></td><td><button class="btn light" data-action="demo">Sunting</button></td></tr></tbody></table></div>`);
    }
    if (tab === 'kedatangan') return page('Semakan Kedatangan', 'Semak dan override dengan jejak audit', '<div class="card"><div class="empty">Data langsung akan tersedia dalam Fasa 3.</div></div>');
    if (tab === 'takwim') return calendarView();
    if (tab === 'penilaian') return page('Konfigurasi Penilaian', 'Tetapkan tetingkap dan wajaran', `<div class="grid"><div class="card span-5"><h2>Tetingkap</h2><div class="field"><label>Mula</label><input type="datetime-local"></div><div class="field"><label>Tamat</label><input type="datetime-local"></div><button class="btn" data-action="save">Simpan</button></div><div class="card span-7"><h2>Wajaran (%)</h2>${[['Kehadiran', 30], ['Tajwid', 15], ['Makhraj', 12], ['Kelancaran', 10], ['Adab & Sebutan', 5], ['Hafazan / Sasaran', 8], ['Penglibatan', 20]].map(x => `<div class="list-row"><b>${x[0]}</b><input type="number" value="${x[1]}" style="width:80px"></div>`).join('')}</div></div>`);
    return page('Tetapan Sistem', 'Konfigurasi portal dan integrasi', `<div class="grid"><div class="card span-6"><h2>Had Kelas</h2><div class="field"><label>Maksimum pelajar</label><input type="number" value="30"></div><button class="btn" data-action="save">Simpan</button></div><div class="card span-6"><h2>Status</h2><p><span class="status">Schema: ${SCHEMA}</span></p><p class="muted">Kekalkan DEMO_MODE=true sehingga Fasa 3 selesai.</p></div></div>`);
  }

  function render() {
    nav();
    const tab = currentTab();
    $('#app').innerHTML = state.role === 'student' ? studentView(tab) : state.role === 'teacher' ? teacherView(tab) : state.role === 'admin' ? adminView(tab) : publicView(tab);
    $('#app').focus();
  }
  function home() { state.role = 'guest'; state.user = null; state.tab = 'utama'; renderLanding(); }
  function login(kind) {
    if (kind === 'pelajar') modal(`<h2>Log Masuk Pelajar</h2><form id="studentLogin"><div class="field"><label>No. Kad Pengenalan</label><input name="id" required placeholder="101010101010"></div><div class="demo-note">Demo: 101010101010</div><div class="modal-actions"><button type="button" class="btn light" data-action="close-modal">Batal</button><button class="btn">Semak Rekod</button></div></form>`);
    else {
      const teacher = kind === 'asatizah';
      modal(`<h2>Log Masuk ${teacher ? 'Asatizah' : 'Pentadbir'}</h2><form id="${teacher ? 'teacherLogin' : 'adminLogin'}"><div class="field"><label>${teacher ? 'No. Telefon' : 'ID / E-mel'}</label><input name="id" required placeholder="${teacher ? demo.teacher.phone : demo.admin.id}"></div><div class="field"><label>Kata Laluan</label><input type="password" name="password" required></div><div class="demo-note">Demo: ${teacher ? demo.teacher.phone : demo.admin.id} / 123456</div><div class="modal-actions"><button type="button" class="btn light" data-action="close-modal">Batal</button><button class="btn">Log Masuk</button></div></form>`);
    }
  }
  function resultModal(index) {
    const r = demo.results[index];
    modal(`<h2>${r.name}</h2><div class="stat">${r.score}/100</div><p><b>Penilai:</b> ${r.assessor}</p><table>${Object.entries(r.items).map(x => `<tr><td>${x[0]}</td><td><b>${x[1]}</b></td></tr>`).join('')}</table><p><b>Ulasan:</b><br>${r.comment}</p><div class="modal-actions"><button class="btn" data-action="close-modal">Tutup</button></div>`);
  }

  document.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.target);
    if (event.target.id === 'studentLogin') {
      const id = String(form.get('id')).replace(/\D/g, '');
      if (id !== demo.student.id) {
        modal(`<h2>Rekod tidak dijumpai</h2><p>Sila daftar atau hubungi pentadbir.</p><div class="modal-actions"><a class="btn light" href="${C.REGISTRATION_URL || '#'}">Daftar</a><button class="btn" data-action="close-modal">Tutup</button></div>`);
        return;
      }
      state.role = 'student'; state.user = demo.student; state.studentTab = 'profil';
    } else if (event.target.id === 'teacherLogin') {
      if (form.get('id') !== demo.teacher.phone || form.get('password') !== demo.teacher.password) return toast('No. telefon atau kata laluan tidak sah');
      state.role = 'teacher'; state.user = demo.teacher; state.teacherTab = 'profil';
    } else if (event.target.id === 'adminLogin') {
      if (form.get('id') !== demo.admin.id || form.get('password') !== demo.admin.password) return toast('ID atau kata laluan tidak sah');
      state.role = 'admin'; state.user = demo.admin; state.adminTab = 'ringkasan';
    }
    closeModal(); render();
  });

  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action],[data-role],[data-tab],[data-result]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'home') { event.preventDefault(); home(); }
    if (action === 'toggle-menu') $('#mainNav').classList.toggle('open');
    if (action === 'close-modal') closeModal();
    if (action === 'logout') home();
    if (action === 'save') toast('Perubahan disimpan dalam mod demo');
    if (action === 'demo') toast('Fungsi langsung akan diaktifkan dalam Fasa 3');
    if (action === 'next-slide') { state.slide = (state.slide + 1) % 3; render(); }
    if (action === 'prev-slide') { state.slide = (state.slide + 2) % 3; render(); }
    if (el.dataset.role) {
      const role = el.dataset.role;
      if (role === 'umum') { state.role = 'guest'; state.tab = 'utama'; render(); } else login(role);
    }
    if (el.dataset.tab) { setTab(el.dataset.tab); $('#mainNav').classList.remove('open'); }
    if (el.dataset.result !== undefined) resultModal(Number(el.dataset.result));
  });

  $('#year').textContent = new Date().getFullYear();
  renderLanding();
  setInterval(() => {
    if (currentTab() === 'utama' && state.role !== 'admin') {
      state.slide = (state.slide + 1) % 3;
      $$('.slide').forEach((x, i) => x.classList.toggle('active', i === state.slide));
    }
  }, 10000);
})();
