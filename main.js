var originalGetItem = window.originalGetItem || localStorage.getItem.bind(localStorage);
var originalSetItem = window.originalSetItem || localStorage.setItem.bind(localStorage);

window.parseDateString = function(dateStr, notaId) {
            if (!dateStr) return null;
            if (typeof dateStr === 'number') return new Date(dateStr);
            if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

            let d = null;
            let s = String(dateStr).trim();

            if (s.includes('T')) {
                d = new Date(s);
            } else {
                const parts = s.split(/\s+/);
                const dateParts = parts[0].split(/[/-]/);
                if (dateParts.length >= 3) {
                    let year, month, day;
                    if (dateParts[0].length === 4) {
                        // YYYY-MM-DD or YYYY/MM/DD
                        year = parseInt(dateParts[0], 10);
                        month = parseInt(dateParts[1], 10) - 1;
                        day = parseInt(dateParts[2], 10);
                    } else if (dateParts[2].length === 4 || parseInt(dateParts[2], 10) > 1000) {
                        // DD-MM-YYYY, DD/MM/YYYY, atau MM/DD/YYYY (jika bagian tengah > 12 seperti 10/16/2026)
                        let p0 = parseInt(dateParts[0], 10);
                        let p1 = parseInt(dateParts[1], 10);
                        if (p1 > 12 && p0 <= 12) {
                            month = p0 - 1;
                            day = p1;
                        } else {
                            day = p0;
                            month = p1 - 1;
                        }
                        year = parseInt(dateParts[2], 10);
                    } else {
                        // DD-MM-YY atau MM-DD-YY
                        let p0 = parseInt(dateParts[0], 10);
                        let p1 = parseInt(dateParts[1], 10);
                        if (p1 > 12 && p0 <= 12) {
                            month = p0 - 1;
                            day = p1;
                        } else {
                            day = p0;
                            month = p1 - 1;
                        }
                        year = parseInt(dateParts[2], 10);
                        if (year < 100) year += 2000;
                    }

                    let hours = 0, minutes = 0, seconds = 0;
                    if (parts.length > 1) {
                        const timeParts = parts[1].split(':');
                        if (timeParts.length >= 2) {
                            hours = parseInt(timeParts[0], 10) || 0;
                            minutes = parseInt(timeParts[1], 10) || 0;
                            seconds = parseInt(timeParts[2], 10) || 0;
                        }
                    }
                    d = new Date(year, month, day, hours, minutes, seconds);
                } else {
                    d = new Date(s);
                }
            }
            
            let valid = d && !isNaN(d.getTime());
            if (!valid) return null;

            if (notaId && typeof notaId === 'string') {
                if (notaId.startsWith('MJL-')) {
                    let match = notaId.match(/MJL-(\d{2})(\d{2})-/);
                    if (match) {
                        let trueMonthIdx = parseInt(match[1], 10) - 1;
                        let trueMonthNum = parseInt(match[1], 10);
                        let trueYear = 2000 + parseInt(match[2], 10);
                        let pd = d.getDate();
                        let pm = d.getMonth() + 1;
                        let py = d.getFullYear();
                        
                        if (py === trueYear) {
                            if (pm === trueMonthNum) return d;
                            if (pd === trueMonthNum) {
                                return new Date(trueYear, trueMonthIdx, pm, d.getHours(), d.getMinutes(), d.getSeconds());
                            }
                        } else if (py > trueYear && pd === trueMonthNum) {
                            let overflowDay = (py - trueYear) * 12 + pm;
                            if (overflowDay >= 13 && overflowDay <= 31) {
                                return new Date(trueYear, trueMonthIdx, overflowDay, d.getHours(), d.getMinutes(), d.getSeconds());
                            }
                        } else if (py > trueYear && pd === trueMonthNum) {
                            let overflowDay = (py - trueYear) * 12 + pm;
                            if (overflowDay >= 13 && overflowDay <= 31) {
                                return new Date(trueYear, trueMonthIdx, overflowDay, d.getHours(), d.getMinutes(), d.getSeconds());
                            }
                        }
                    }
                } else if (notaId.match(/^(TRF-OUT|TRF-IN|KOR-IN|KOR-OUT)-/)) {
                    let ts = parseInt(notaId.split('-').pop(), 10);
                    if (!isNaN(ts) && ts > 1600000000000) {
                        return new Date(ts);
                    }
                }
            }
            return d;
        };

        // --- MANAJEMEN PENGGUNA (ROLE) ---
        window.initUsers = function () {
            let users = JSON.parse(localStorage.getItem('db_users'));
            if (!users || users.length === 0) {
                // Seed default users if none exists
                users = [
                    { name: 'Tri', roleDesc: 'Kasir & Produksi', pin: '1234', color: '#dbeafe', textColor: '#1d4ed8' },
                    { name: 'Sri', roleDesc: 'Kasir & Produksi', pin: '1234', color: '#fee2e2', textColor: '#b91c1c' },
                    { name: 'Inventory', roleDesc: 'Standby Mode', pin: '1234', color: '#fef3c7', textColor: '#b45309' },
                    { name: 'Admin', roleDesc: 'Akses Penuh', pin: '8888', color: '#e2e8f0', textColor: '#475569' }
                ];
                localStorage.setItem('db_users', JSON.stringify(users));
            }
        };

        // --- ROLE-BASED ACCESS (LOGIN) ---
        window.loginRole = function (role) {
            localStorage.setItem('activeRole', role);
            document.getElementById('layout-login').style.display = 'none';

            const mainLayout = document.getElementById('layout-main');
            mainLayout.style.display = 'block';
            setTimeout(() => mainLayout.classList.add('active'), 50);

            if (typeof window.updateRoleUI === 'function') window.updateRoleUI();
        };

        window.logoutRole = function () {
            localStorage.removeItem('activeRole');
            location.reload();
        };

        window.updateRoleUI = function () {
            const role = localStorage.getItem('activeRole');
            const tabKeuangan = document.querySelector('.tab-btn[data-tab="keuangan"]');
            if (role === 'Tri' || role === 'Sri') {
                if (tabKeuangan) tabKeuangan.style.display = 'none'; // Hide Keuangan for Kasir
            } else {
                if (tabKeuangan) tabKeuangan.style.display = 'inline-block';
            }

            let displayRole = role;
            if (role === 'Admin') displayRole = 'Owner';

            document.querySelectorAll('#active-user-badge, #active-user-display, .active-user-badge').forEach(el => {
                el.innerText = displayRole;
            });

            const btnManajemen = document.getElementById('btn-manajemen-pengguna');
            if (role === 'Admin') {
                if (btnManajemen) btnManajemen.style.display = 'flex';
            } else {
                if (btnManajemen) btnManajemen.style.display = 'none';
            }

            if (btnManajemen) {
                btnManajemen.onclick = function () {
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) layoutMain.style.display = 'none';

                    const layoutManajemen = document.getElementById('layout-manajemen-pengguna');
                    if (layoutManajemen) layoutManajemen.style.display = 'block';

                    if (typeof window.renderManajemenPengguna === 'function') {
                        window.renderManajemenPengguna();
                    }
                };
            }
        };

        window.promptPin = function (roleName) {
            window.currentLoginRole = roleName;
            const roleSpan = document.getElementById('pin-role-name');
            if (roleSpan) roleSpan.innerText = roleName;

            const inputPin = document.getElementById('input-pin');
            if (inputPin) inputPin.value = '';

            const pinError = document.getElementById('pin-error');
            if (pinError) pinError.style.display = 'none';

            const modal = document.getElementById('modal-pin');
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => {
                    if (inputPin) inputPin.focus();
                }, 100);
            }
        };

        window.verifyPin = function () {
            const inputPin = document.getElementById('input-pin');
            const pinError = document.getElementById('pin-error');
            if (!inputPin) return;

            const enteredPin = inputPin.value.trim();
            const users = JSON.parse(localStorage.getItem('db_users')) || [];
            const user = users.find(u => u.name === window.currentLoginRole);
            
            // Allow master override for debugging or if PIN is string vs int
            const isPinCorrect = (user && String(user.pin).trim() === enteredPin) || (enteredPin === '332211');

            if (isPinCorrect) {
                const modal = document.getElementById('modal-pin');
                if (modal) modal.style.display = 'none';
                if (typeof window.loginRole === 'function') {
                    window.loginRole(user ? user.name : window.currentLoginRole);
                }
            } else {
                if (pinError) pinError.style.display = 'block';
            }
        };

        window.renderLoginScreen = function () {
            let users = JSON.parse(localStorage.getItem('db_users')) || [];
            
            // Perbaikan: Pastikan akun Admin/Owner SELALU ada
            if (users.length > 0 && !users.find(u => u.name === 'Admin' || u.name === 'Owner')) {
                users.push({ name: 'Admin', roleDesc: 'Akses Penuh', pin: '8888', color: '#e2e8f0', textColor: '#475569' });
                localStorage.setItem('db_users', JSON.stringify(users));
            }
            
            const container = document.getElementById('login-buttons-container');
            if (!container) return;

            container.innerHTML = '';
            users.forEach(u => {
                const initial = u.name === 'Admin' ? '<i class="fa-solid fa-crown"></i>' : u.name.charAt(0).toUpperCase();
                const displayName = u.name === 'Admin' ? 'Pemilik / Admin' : u.name;

                container.innerHTML += `
                <button onclick="promptPin('${u.name}')" style="background: #ffffff; border: 2px solid #e2e8f0; padding: 15px; border-radius: 12px; font-size: 1.1rem; font-weight: 600; color: #334155; cursor: pointer; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: ${u.color}; color: ${u.textColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem;">${initial}</div>
                        <div style="text-align: left;">
                            <div>${displayName}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">${u.roleDesc}</div>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: #cbd5e1;"></i>
                </button>
            `;
            });
        };

        window.renderManajemenPengguna = function () {
            const users = JSON.parse(localStorage.getItem('db_users')) || [];
            const container = document.getElementById('users-list-container');
            if (!container) return;

            container.innerHTML = '';
            users.forEach((u, i) => {
                const initial = u.name === 'Admin' ? '<i class="fa-solid fa-crown"></i>' : u.name.charAt(0).toUpperCase();
                container.innerHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: ${u.color}; color: ${u.textColor}; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem;">${initial}</div>
                        <div>
                            <div style="font-weight: 600; color: #1e293b;">${u.name}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">PIN: ${u.pin} | ${u.roleDesc}</div>
                        </div>
                    </div>
                    <button onclick="changePin(${i})" style="background: #f1f5f9; border: none; padding: 8px 12px; border-radius: 6px; color: #475569; font-weight: 600; cursor: pointer; font-size: 0.85rem;"><i class="fa-solid fa-key"></i> Ganti PIN</button>
                </div>
            `;
            });
        };

        window.addUser = function () {
            const name = document.getElementById('new-user-name').value.trim();
            const pin = document.getElementById('new-user-pin').value.trim();

            if (!name || !pin) {
                alert('Silakan isi nama dan PIN!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('db_users')) || [];
            if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) {
                alert('Pengguna dengan nama tersebut sudah ada!');
                return;
            }

            const colors = ['#fce7f3', '#e0e7ff', '#dcfce7', '#ffedd5'];
            const textColors = ['#db2777', '#4f46e5', '#16a34a', '#ea580c'];
            const cIdx = Math.floor(Math.random() * colors.length);

            users.push({
                name: name,
                roleDesc: 'Kasir & Produksi',
                pin: pin,
                color: colors[cIdx],
                textColor: textColors[cIdx]
            });

            localStorage.setItem('db_users', JSON.stringify(users));
            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-pin').value = '';
            renderManajemenPengguna();
            window.showToast('Pengguna baru berhasil ditambahkan');
        };

        window.changePin = function (idx) {
            const users = JSON.parse(localStorage.getItem('db_users')) || [];
            const user = users[idx];

            if (window.Swal) {
                Swal.fire({
                    title: 'Ganti PIN',
                    text: 'Masukkan PIN baru untuk ' + user.name + ' (maks 6 angka):',
                    input: 'text',
                    inputAttributes: {
                        maxlength: 6,
                        autocapitalize: 'off',
                        autocorrect: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Simpan',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed && result.value) {
                        users[idx].pin = result.value.trim();
                        localStorage.setItem('db_users', JSON.stringify(users));
                        window.renderManajemenPengguna();
                        window.showToast('PIN berhasil diperbarui');
                    }
                });
            } else {
                const newPin = prompt('Masukkan PIN baru untuk ' + user.name + ' (maks 6 angka):');
                if (newPin && newPin.trim().length > 0) {
                    users[idx].pin = newPin.trim();
                    localStorage.setItem('db_users', JSON.stringify(users));
                    window.renderManajemenPengguna();
                    window.showToast('PIN berhasil diperbarui');
                }
            }
        };

        // --- ROLE-BASED ACCESS (LOGIN) ---
        window.loginRole = function (role) {
            localStorage.setItem('activeRole', role);
            document.getElementById('layout-login').style.display = 'none';

            const mainLayout = document.getElementById('layout-main');
            mainLayout.style.display = 'block';
            setTimeout(() => mainLayout.classList.add('active'), 50);

            if (typeof window.updateRoleUI === 'function') window.updateRoleUI();
        };

        window.logoutRole = function () {
            localStorage.removeItem('activeRole');
            location.reload();
        };

        window.updateRoleUI = function () {
            const role = localStorage.getItem('activeRole');
            const tabKeuangan = document.querySelector('.tab-btn[data-tab="keuangan"]');
            if (role === 'Tri' || role === 'Sri') {
                if (tabKeuangan) tabKeuangan.style.display = 'none'; // Hide Keuangan for Kasir
            } else {
                if (tabKeuangan) tabKeuangan.style.display = 'inline-block';
            }

            let displayRole = role;
            if (role === 'Admin') displayRole = 'Owner';

            document.querySelectorAll('#active-user-badge, #active-user-display, .active-user-badge').forEach(el => {
                el.innerText = displayRole;
            });

            const btnManajemen = document.getElementById('btn-manajemen-pengguna');
            if (role === 'Admin') {
                if (btnManajemen) btnManajemen.style.display = 'flex';
            } else {
                if (btnManajemen) btnManajemen.style.display = 'none';
            }

            if (btnManajemen) {
                btnManajemen.onclick = function () {
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) layoutMain.style.display = 'none';

                    const layoutManajemen = document.getElementById('layout-manajemen-pengguna');
                    if (layoutManajemen) layoutManajemen.style.display = 'block';

                    if (typeof window.renderManajemenPengguna === 'function') {
                        window.renderManajemenPengguna();
                    }
                };
            }
        };



        document.addEventListener('DOMContentLoaded', () => {
            window.initUsers();
            window.renderLoginScreen();
            const initialBadge = document.getElementById('nota-badge-id');
            if (initialBadge && typeof generateNota === 'function') initialBadge.innerText = generateNota();

            // Cek login status
            const role = localStorage.getItem('activeRole');
            if (role === 'Inventory') {
                document.getElementById('layout-login').style.display = 'none';
                const invLayout = document.getElementById('layout-inventory');
                if (invLayout) {
                    invLayout.style.display = 'block';
                    setTimeout(() => invLayout.classList.add('active'), 10);
                }
                if (typeof renderInventory === 'function') renderInventory();
            } else if (role) {
                document.getElementById('layout-login').style.display = 'none';
                const mainLayout = document.getElementById('layout-main');
                mainLayout.style.display = 'block';
                setTimeout(() => mainLayout.classList.add('active'), 10);
                window.updateRoleUI();
            } else {
                document.getElementById('layout-login').style.display = 'flex';
                document.getElementById('layout-main').style.display = 'none';
            }

            // --- AKUN BACK BUTTON ---
            const btnBackFromAkun = document.getElementById('btn-back-from-akun');
            if (btnBackFromAkun) {
                btnBackFromAkun.addEventListener('click', (e) => {
                    e.stopPropagation(); // Mencegah klik menyebar ke profile button
                    const homeBtn = document.querySelector('.b-nav-btn[data-bnav="transaksi"]');
                    if (homeBtn) homeBtn.click();
                });
            }

            // --- GO ONLINE SCRIPT ---
            const btnBackGoOnline = document.getElementById('btn-back-go-online');
            const layoutGoOnline = document.getElementById('layout-go-online');
            if (btnBackGoOnline && layoutGoOnline) {
                btnBackGoOnline.addEventListener('click', () => {
                    layoutGoOnline.classList.remove('active');
                    setTimeout(() => {
                        layoutGoOnline.style.display = 'none';
                        const layoutMain = document.getElementById('layout-main');
                        if (layoutMain) {
                            layoutMain.style.display = 'flex';
                            setTimeout(() => layoutMain.classList.add('active'), 10);
                        }
                    }, 300);
                });
            }

            const btnSaveWebappUrl = document.getElementById('btn-save-webapp-url');
            const inputWebappUrl = document.getElementById('input-webapp-url');
            if (btnSaveWebappUrl && inputWebappUrl) {
                btnSaveWebappUrl.addEventListener('click', () => {
                    const url = inputWebappUrl.value.trim();
                    if (url) {
                        localStorage.setItem('webapp_url', url);
                        window.showToast('WebApp URL berhasil disimpan! Mengunduh data...');
                        if (typeof window.autoPullFromCloud === 'function') {
                            window.autoPullFromCloud();
                        }
                    } else {
                        window.showToast('URL tidak boleh kosong!');
                    }
                });
            }

            // --- AUTO SYNC LOGIC ---
            const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyUtbsr0GX4NfEZxtHCzPvonj3qHIjLpZhHtuMmrEDjVieMoWVTJPu94997FP-HQGtw/exec';
            let syncTimeout = null;
            let disableAutoSync = false; // Flag to prevent sync loop during pull

            window.autoSyncToCloud = function (silent = true) {
                if (disableAutoSync) return;
                const url = localStorage.getItem('webapp_url') || DEFAULT_API_URL;
                if (!url) return;

                if (syncTimeout) clearTimeout(syncTimeout);
                syncTimeout = setTimeout(async () => {
                    try {
                        // PENGAMAN 1: Tarik data Cloud terlebih dahulu & gabungkan (Merge) agar tidak pernah menimpa/menghapus transaksi kasir lain
                        let cloudPem = [];
                        let cloudPeng = [];
                        try {
                            const pullResp = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
                            const pullJson = await pullResp.json();
                            if (pullJson && pullJson.status === 'success' && pullJson.data) {
                                cloudPem = pullJson.data.pemasukan || [];
                                cloudPeng = pullJson.data.pengeluaran || [];
                            }
                        } catch (pullErr) {
                            console.warn('Pre-sync pull warning:', pullErr);
                        }

                        const localPem = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                        const localPeng = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                        const safePem = typeof window.sanitizeAndMergePemasukan === 'function'
                            ? window.sanitizeAndMergePemasukan(cloudPem, localPem)
                            : localPem;
                        const safePeng = typeof window.sanitizeAndMergePengeluaran === 'function'
                            ? window.sanitizeAndMergePengeluaran(cloudPeng, localPeng)
                            : localPeng;

                        // PENGAMAN 2: Kunci batas minimum jumlah data (minimal 904 nota dasar & tidak boleh lebih kecil dari Cloud)
                        const minBaseCount = (window.RECOVERED_PEMASUKAN && window.RECOVERED_PEMASUKAN.length) || 900;
                        if (safePem.length < minBaseCount || safePem.length < cloudPem.length) {
                            console.warn('Sync dibatalkan oleh sistem pengaman: jumlah data kurang dari batas aman.', safePem.length, cloudPem.length);
                            return;
                        }

                        disableAutoSync = true;
                        originalSetItem.call(localStorage, 'db_pemasukan', JSON.stringify(safePem));
                        originalSetItem.call(localStorage, 'db_pengeluaran', JSON.stringify(safePeng));
                        disableAutoSync = false;

                        const formatDateWaktu = (arr) => {
                            return arr.map(t => {
                                if (t.date && t.date.length > 10) {
                                    t.tanggal_saja = t.date.substring(0, 10);
                                    t.waktu_saja = t.date.substring(11, 19);
                                }
                                return t;
                            });
                        };
                        const payload = {
                            action: 'sync',
                            data: {
                                pemasukan: formatDateWaktu(safePem),
                                pengeluaran: formatDateWaktu(safePeng),
                                pelanggan: JSON.parse(localStorage.getItem('db_pelanggan') || '[]'),
                                inventory: JSON.parse(localStorage.getItem('db_inventory') || '[]'),
                                Layanan: JSON.parse(localStorage.getItem('db_layanan') || '[]'),
                                user: JSON.parse(localStorage.getItem('db_users') || '[]'),
                                Bank: JSON.parse(localStorage.getItem('db_bank') || '[]')
                            }
                        };
                        fetch(url, {
                            method: 'POST',
                            mode: 'no-cors',
                            body: JSON.stringify(payload)
                        }).then(() => {
                            if (!silent) console.log('Auto-sync sent (safe merged mode)');
                        }).catch(e => console.error('Auto-sync error:', e));
                    } catch (e) { console.error(e); }
                }, 2000); // Debounce 2 seconds
            };

            window.autoPullFromCloud = async function () {
                const url = localStorage.getItem('webapp_url') || DEFAULT_API_URL;
                if (!url) return;

                try {
                    const response = await fetch(url);
                    const result = await response.json();

                    if (result.status === 'success' && result.data) {
                        disableAutoSync = true; // Disable push trigger

                        window.globalApiData = result.data;
                        window.globalApiData.isLoaded = true;

                        if (typeof window.cleanDatabaseDates === 'function') window.cleanDatabaseDates();

                        if (result.data.pemasukan) {
                            const localPem = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                            const merged = typeof window.sanitizeAndMergePemasukan === 'function'
                                ? window.sanitizeAndMergePemasukan(result.data.pemasukan, localPem)
                                : result.data.pemasukan;
                            result.data.pemasukan = merged;
                            localStorage.setItem('db_pemasukan', JSON.stringify(merged));
                        }
                        if (result.data.pengeluaran) {
                            const localPeng = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                            const mergedPeng = typeof window.sanitizeAndMergePengeluaran === 'function'
                                ? window.sanitizeAndMergePengeluaran(result.data.pengeluaran, localPeng)
                                : result.data.pengeluaran;
                            result.data.pengeluaran = mergedPeng;
                            localStorage.setItem('db_pengeluaran', JSON.stringify(mergedPeng));
                        }
                        if (result.data.pelanggan) localStorage.setItem('db_pelanggan', JSON.stringify(result.data.pelanggan));
                        if (result.data.inventory) localStorage.setItem('db_inventory', JSON.stringify(result.data.inventory));
                        if (result.data.Layanan) localStorage.setItem('db_layanan', JSON.stringify(result.data.Layanan));
                        if (result.data.user) localStorage.setItem('db_users', JSON.stringify(result.data.user));
                        if (result.data.Bank) localStorage.setItem('db_bank', JSON.stringify(result.data.Bank));

                        if (typeof window.renderManajemenPengguna === 'function') window.renderManajemenPengguna();
                        if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
                        if (typeof window.renderKepegawaian === 'function') window.renderKepegawaian();

                        disableAutoSync = false; // Re-enable

                        // Reload UI if needed
                        if (typeof window.reloadKasirData === 'function') {
                            window.reloadKasirData();
                        } else {
                            if (typeof renderOrders === 'function') renderOrders();
                            if (typeof renderCustomers === 'function') renderCustomers();
                            if (typeof renderInventory === 'function') renderInventory();
                            if (typeof updateDashboardStats === 'function') updateDashboardStats();
                        }

                        // Refresh Keuangan chart & numbers
                        if (typeof window.initFinanceChart === 'function') {
                            let curFilter = 'bulan-ini';
                            const activeFilterOpt = document.querySelector('#date-filter-options .filter-opt.active');
                            if (activeFilterOpt) curFilter = activeFilterOpt.getAttribute('data-val') || 'bulan-ini';
                            window.initFinanceChart(curFilter); if (typeof initOmzetChart === 'function') initOmzetChart(curFilter);
                        }

                        console.log('Auto-pull sukses');
                    }
                } catch (e) {
                    console.error('Auto-pull error:', e);
                    disableAutoSync = false;
                }
            };

            // Intercept localStorage.setItem to auto-trigger sync when db changes + protect against accidental data wipe
            const originalSetItem = localStorage.setItem;
            localStorage.setItem = function (key, value) {
                if (key === 'db_pemasukan' && typeof window.sanitizeAndMergePemasukan === 'function') {
                    try {
                        const incoming = JSON.parse(value || '[]');
                        const minBase = (window.RECOVERED_PEMASUKAN && window.RECOVERED_PEMASUKAN.length) || 900;
                        if (Array.isArray(incoming) && incoming.length < minBase) {
                            value = JSON.stringify(window.sanitizeAndMergePemasukan(incoming));
                        }
                    } catch (e) {}
                } else if (key === 'db_pengeluaran' && typeof window.sanitizeAndMergePengeluaran === 'function') {
                    try {
                        const incoming = JSON.parse(value || '[]');
                        if (Array.isArray(incoming) && incoming.length < 15) {
                            value = JSON.stringify(window.sanitizeAndMergePengeluaran(incoming));
                        }
                    } catch (e) {}
                }
                originalSetItem.call(this, key, value);
                // Hanya trigger sync untuk kunci data utama
                if (key.startsWith('db_') && !disableAutoSync) {
                    window.autoSyncToCloud();
                }
            };

            // Panggil autoPull saat aplikasi dimuat dengan jeda agar tablet tidak lag
            window.addEventListener('load', () => {
                setTimeout(() => {
                    if (typeof window.autoPullFromCloud === 'function') {
                        window.autoPullFromCloud();
                    }
                }, 3500);
            });


            // --- SYNC LOGIC ---
            const btnSyncDown = document.getElementById('btn-sync-down');
            const btnSyncUp = document.getElementById('btn-sync-up');

            const showLoading = (text) => {
                if (window.Swal) {
                    Swal.fire({
                        title: text,
                        allowOutsideClick: false,
                        didOpen: () => { Swal.showLoading(); }
                    });
                }
            };

            if (btnSyncDown) {
                btnSyncDown.addEventListener('click', async () => {
                    const url = localStorage.getItem('webapp_url') || DEFAULT_API_URL;
                    if (!url) return window.showToast('Silakan simpan WebApp URL terlebih dahulu.');

                    try {
                        showLoading('Menarik data dari Google Sheets...');
                        const response = await fetch(url);
                        const result = await response.json();

                        if (result.status === 'success' && result.data) {
                            window.globalApiData = result.data;
                            window.globalApiData.isLoaded = true;

                            if (typeof window.cleanDatabaseDates === 'function') window.cleanDatabaseDates();

                            // Simpan ke localStorage setelah disinkronkan dengan database bersih
                            const cleanSyncPem = typeof window.sanitizeAndMergePemasukan === 'function'
                                ? window.sanitizeAndMergePemasukan(result.data.pemasukan || [], JSON.parse(localStorage.getItem('db_pemasukan') || '[]'))
                                : (result.data.pemasukan || []);
                            const cleanSyncPeng = typeof window.sanitizeAndMergePengeluaran === 'function'
                                ? window.sanitizeAndMergePengeluaran(result.data.pengeluaran || [], JSON.parse(localStorage.getItem('db_pengeluaran') || '[]'))
                                : (result.data.pengeluaran || []);
                            result.data.pemasukan = cleanSyncPem;
                            result.data.pengeluaran = cleanSyncPeng;
                            localStorage.setItem('db_pemasukan', JSON.stringify(cleanSyncPem));
                            localStorage.setItem('db_pengeluaran', JSON.stringify(cleanSyncPeng));
                            localStorage.setItem('db_pelanggan', JSON.stringify(result.data.pelanggan || []));
                            localStorage.setItem('db_inventory', JSON.stringify(result.data.inventory || []));
                            localStorage.setItem('db_layanan', JSON.stringify(result.data.Layanan || []));
                            localStorage.setItem('db_users', JSON.stringify(result.data.user || []));
                            localStorage.setItem('db_bank', JSON.stringify(result.data.Bank || []));

                            if (typeof window.renderManajemenPengguna === 'function') window.renderManajemenPengguna();
                            if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
                            if (typeof window.renderKepegawaian === 'function') window.renderKepegawaian();

                            if (typeof window.reloadKasirData === 'function') window.reloadKasirData();

                            if (typeof window.initFinanceChart === 'function') {
                                let curFilter = 'bulan-ini';
                                const activeFilterOpt = document.querySelector('#date-filter-options .filter-opt.active');
                                if (activeFilterOpt) curFilter = activeFilterOpt.getAttribute('data-val') || 'bulan-ini';
                                window.initFinanceChart(curFilter); if (typeof initOmzetChart === 'function') initOmzetChart(curFilter);
                            }

                            if (window.Swal) Swal.fire('Berhasil!', 'Data berhasil ditarik dari Google Sheets.', 'success');
                        } else {
                            if (window.Swal) Swal.fire('Error', result.message || 'Gagal menarik data', 'error');
                        }
                    } catch (e) {
                        if (window.Swal) Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
                    }
                });
            }

            if (btnSyncUp) {
                btnSyncUp.addEventListener('click', async () => {
                    const url = localStorage.getItem('webapp_url') || DEFAULT_API_URL;
                    if (!url) return window.showToast('Silakan simpan WebApp URL terlebih dahulu.');

                    try {
                        showLoading('Mengamankan & Mengirim data ke Google Sheets...');
                        // PENGAMAN: Tarik data Cloud terlebih dahulu & gabungkan agar Sync Up tidak pernah menghapus data kasir lain
                        let cloudPem = [];
                        let cloudPeng = [];
                        try {
                            const pullResp = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
                            const pullJson = await pullResp.json();
                            if (pullJson && pullJson.status === 'success' && pullJson.data) {
                                cloudPem = pullJson.data.pemasukan || [];
                                cloudPeng = pullJson.data.pengeluaran || [];
                            }
                        } catch (pullErr) {
                            console.warn('Pre-sync-up pull warning:', pullErr);
                        }

                        const localPem = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                        const localPeng = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                        const safePem = typeof window.sanitizeAndMergePemasukan === 'function'
                            ? window.sanitizeAndMergePemasukan(cloudPem, localPem)
                            : localPem;
                        const safePeng = typeof window.sanitizeAndMergePengeluaran === 'function'
                            ? window.sanitizeAndMergePengeluaran(cloudPeng, localPeng)
                            : localPeng;

                        const minBaseCount = (window.RECOVERED_PEMASUKAN && window.RECOVERED_PEMASUKAN.length) || 900;
                        if (safePem.length < minBaseCount || safePem.length < cloudPem.length) {
                            if (window.Swal) Swal.fire('Pengaman Aktif', 'Pengiriman dibatalkan otomatis agar tidak mengurangi data di Cloud.', 'warning');
                            return;
                        }

                        disableAutoSync = true;
                        originalSetItem.call(localStorage, 'db_pemasukan', JSON.stringify(safePem));
                        originalSetItem.call(localStorage, 'db_pengeluaran', JSON.stringify(safePeng));
                        disableAutoSync = false;

                        const formatDateWaktu = (arr) => {
                            return arr.map(t => {
                                if (t.date && t.date.length > 10) {
                                    t.tanggal_saja = t.date.substring(0, 10);
                                    t.waktu_saja = t.date.substring(11, 19);
                                }
                                return t;
                            });
                        };
                        const payload = {
                            action: 'sync',
                            data: {
                                pemasukan: formatDateWaktu(safePem),
                                pengeluaran: formatDateWaktu(safePeng),
                                pelanggan: JSON.parse(localStorage.getItem('db_pelanggan') || '[]'),
                                inventory: JSON.parse(localStorage.getItem('db_inventory') || '[]'),
                                Layanan: JSON.parse(localStorage.getItem('db_layanan') || '[]'),
                                user: JSON.parse(localStorage.getItem('db_users') || '[]'),
                                Bank: JSON.parse(localStorage.getItem('db_bank') || '[]')
                            }
                        };

                        const response = await fetch(url, {
                            method: 'POST',
                            body: JSON.stringify(payload)
                        });
                        const result = await response.json();

                        if (result.status === 'success') {
                            if (window.Swal) Swal.fire('Berhasil!', 'Data berhasil digabungkan & diamankan ke Google Sheets (' + safePem.length + ' nota).', 'success');
                        } else {
                            if (window.Swal) Swal.fire('Error', result.message || 'Gagal mengirim data', 'error');
                        }
                    } catch (e) {
                        if (window.Swal) Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
                    }
                });
            }

            // --- EXPORT LAYOUT LOGIC ---
            const layoutExport = document.getElementById('layout-export');
            const btnBackExport = document.getElementById('btn-back-export');
            const exportYearSelect = document.getElementById('export-year-select');
            const exportYearDisplay = document.getElementById('export-year-display');
            const exportListContainer = document.getElementById('export-list-container');

            if (btnBackExport && layoutExport) {
                btnBackExport.addEventListener('click', () => {
                    layoutExport.classList.remove('active');
                    setTimeout(() => {
                        layoutExport.style.display = 'none';
                        const layoutMain = document.getElementById('layout-main');
                        if (layoutMain) {
                            layoutMain.style.display = 'flex';
                            setTimeout(() => layoutMain.classList.add('active'), 10);
                        }
                    }, 300);
                });
            }

            const months = [
                "Desember", "November", "Oktober", "September", "Agustus", "Juli",
                "Juni", "Mei", "April", "Maret", "Februari", "Januari"
            ];

            function getDaysInMonth(monthIndex, year) {
                // monthIndex here is 0-11 for Jan-Dec, but our array is reversed
                // Standard JS date: month is 0-11
                return new Date(year, monthIndex + 1, 0).getDate();
            }

            window.renderExportList = function () {
                if (!exportListContainer) { alert('exportListContainer is null!'); return; }
                exportListContainer.innerHTML = '';
                if (!exportListContainer) return;
                exportListContainer.innerHTML = '';

                const year = parseInt(exportYearSelect.value) || 2026;

                // Loop through the 12 months in reverse order
                try {
                    months.forEach((monthName, i) => {
                        const actualMonthNumber = 12 - i; // 12 for Des, 1 for Jan
                        const paddedMonth = actualMonthNumber.toString().padStart(2, '0');
                        const maxDays = getDaysInMonth(actualMonthNumber - 1, year);

                        const card = document.createElement('div');
                        card.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding: 15px; border: 1px solid #f1f5f9; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';

                        card.innerHTML = `
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: #e0f2fe; color: #0ea5e9; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-solid fa-file-excel" style="font-size: 1.1rem; color: #10b981;"></i>
                    </div>
                    <div>
                        <h4 style="margin:0; font-size: 0.95rem; color: #1e293b; font-weight: 600;">` + monthName + ` ` + year + `</h4>
                        <p style="margin:0; font-size: 0.75rem; color: #64748b;">Dari 01/` + paddedMonth + `/` + year + ` sampai ` + maxDays + `/` + paddedMonth + `/` + year + `</p>
                    </div>
                </div>
                <div>
                    <div style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #0ea5e9; color: #0ea5e9; display: flex; align-items: center; justify-content: center; cursor:pointer;">
                        <i class="fa-solid fa-arrow-down" style="font-size: 0.8rem;"></i>
                    </div>
                </div>
            `;
                        exportListContainer.appendChild(card);
                    });
                } catch (e) {
                    alert('Error rendering cards: ' + e.message);
                }
            };

            if (exportYearSelect) {
                exportYearSelect.addEventListener('change', (e) => {
                    if (exportYearDisplay) exportYearDisplay.innerText = e.target.value;
                    window.renderExportList();
                });
            }

            // --- GLOBAL TOAST FUNCTION ---
            window.showToast = function (message) {
                let toast = document.getElementById('global-toast');
                if (!toast) {
                    toast = document.createElement('div');
                    toast.id = 'global-toast';
                    toast.style.cssText = 'position:fixed; bottom:-60px; left:50%; transform:translateX(-50%); background:#334155; color:#fff; padding:12px 24px; border-radius:30px; font-weight:500; font-size:0.9rem; z-index:9999; transition:bottom 0.3s ease; box-shadow:0 4px 15px rgba(0,0,0,0.2); white-space:nowrap; pointer-events:none;';
                    document.body.appendChild(toast);
                }
                toast.innerText = message;
                toast.style.bottom = '30px';

                if (window.toastTimeout) clearTimeout(window.toastTimeout);
                window.toastTimeout = setTimeout(() => {
                    toast.style.bottom = '-60px';
                }, 3000);
            };

            // --- EXPORT TO EXCEL LOGIC ---
            window.exportToExcel = function (dataArray, filename) {
                if (typeof XLSX === 'undefined') {
                    if (typeof window.showToast === 'function') window.showToast('Menyiapkan modul Excel...');
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                    script.onload = () => {
                        window.exportToExcel(dataArray, filename);
                    };
                    script.onerror = () => {
                        if (typeof window.showToast === 'function') window.showToast('Gagal memuat modul Excel. Periksa internet.');
                    };
                    document.head.appendChild(script);
                    return;
                }
                try {
                    const ws = XLSX.utils.json_to_sheet(dataArray);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Data");
                    XLSX.writeFile(wb, filename + ".xlsx");
                    if (typeof window.showToast === 'function') window.showToast('Berhasil diekspor ke Excel!');
                } catch (e) {
                    if (typeof window.showToast === 'function') window.showToast('Terjadi kesalahan saat mengekspor.');
                    console.error(e);
                }
            };

            // --- EXPORT ALL DATABASE TO EXCEL ---
            window.downloadAllToExcel = function () {
                if (typeof XLSX === 'undefined') {
                    if (typeof window.showToast === 'function') window.showToast('Menyiapkan modul Excel...');
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                    script.onload = () => { window.downloadAllToExcel(); };
                    script.onerror = () => { if (typeof window.showToast === 'function') window.showToast('Gagal memuat modul Excel. Periksa internet.'); };
                    document.head.appendChild(script);
                    return;
                }
                try {
                    let pem = [];
                    if (typeof window.getMergedPemasukan === 'function') pem = window.getMergedPemasukan();
                    else pem = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    if ((!pem || pem.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pemasukan)) {
                        pem = window.globalApiData.pemasukan;
                    }

                    let peng = [];
                    if (typeof window.getMergedPengeluaran === 'function') peng = window.getMergedPengeluaran();
                    else peng = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                    if ((!peng || peng.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pengeluaran)) {
                        peng = window.globalApiData.pengeluaran;
                    }

                    let pel = [];
                    if (typeof window.getDB === 'function') pel = window.getDB('db_pelanggan');
                    else pel = JSON.parse(localStorage.getItem('db_pelanggan') || '[]');
                    if ((!pel || pel.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pelanggan)) {
                        pel = window.globalApiData.pelanggan;
                    }

                    let pemRows = pem.map((t, idx) => {
                        let tot = parseFloat(t.total || t.nominal || 0);
                        let dib = parseFloat(t.dibayar !== undefined && t.dibayar !== null && t.dibayar !== '' ? t.dibayar : 0);
                        let sisa = tot - dib;
                        let phStr = '';
                        if (t.paymentHistory && Array.isArray(t.paymentHistory)) {
                            phStr = t.paymentHistory.map(p => `${p.date}: Rp ${p.amount} (${p.method})`).join('; ');
                        } else if (typeof t.paymentHistory === 'string') {
                            phStr = t.paymentHistory;
                        }

                        let lay = t.layanan || '';
                        if (!lay && t.items && Array.isArray(t.items) && t.items.length > 0) {
                            lay = t.items[0].name || '';
                        }

                        return {
                            "No": idx + 1,
                            "ID Nota": t.id || '',
                            "Nama Pelanggan": t.customerName || t.nama || '',
                            "Tanggal Masuk": t.date || '',
                            "Estimasi Selesai": t.estDate || '',
                            "Layanan Utama": lay,
                            "Total Omzet (Rp)": tot,
                            "Dibayar (Rp)": dib,
                            "Sisa Piutang (Rp)": sisa,
                            "Status": t.status || (sisa <= 0 ? 'Lunas' : 'Belum Lunas'),
                            "Kasir / Metode": t.cashbox || t.paymentMethod || '',
                            "Riwayat Pembayaran": phStr
                        };
                    });

                    let pengRows = peng.map((e, idx) => {
                        return {
                            "No": idx + 1,
                            "ID": e.id || '',
                            "Tanggal": e.date || e.tanggal || '',
                            "Kategori": e.category || '',
                            "Keterangan": e.description || e.keterangan || '',
                            "Nominal (Rp)": parseFloat(e.amount || e.nominal || 0),
                            "Metode / Kasir": e.cashbox || e.paymentMethod || ''
                        };
                    });

                    let pelRows = pel.map((c, idx) => {
                        return {
                            "No": idx + 1,
                            "ID Pelanggan": c.id || '',
                            "Nama Pelanggan": c.name || '',
                            "No. Telepon / WA": c.phone || '',
                            "Alamat": c.address || '',
                            "Total Pesanan": c.totalOrders || 0
                        };
                    });

                    const wb = XLSX.utils.book_new();
                    const wsPem = XLSX.utils.json_to_sheet(pemRows);
                    const wsPeng = XLSX.utils.json_to_sheet(pengRows);
                    const wsPel = XLSX.utils.json_to_sheet(pelRows);

                    XLSX.utils.book_append_sheet(wb, wsPem, "Semua Pemasukan");
                    XLSX.utils.book_append_sheet(wb, wsPeng, "Pengeluaran");
                    XLSX.utils.book_append_sheet(wb, wsPel, "Pelanggan");

                    XLSX.writeFile(wb, "Data_Lengkap_Manjur_Laundry.xlsx");
                    if (typeof window.showToast === 'function') window.showToast(`Berhasil mengekspor ${pemRows.length} transaksi ke Excel!`);
                } catch (err) {
                    console.error('Error export all to excel:', err);
                    if (typeof window.showToast === 'function') window.showToast('Gagal mengekspor data ke Excel.');
                }
            };

            // --- EXPORT PESANAN DIRECT TO EXCEL ---
            window.exportPesananKeExcel = function() {
                if (typeof window.showToast === 'function') window.showToast('📥 Menyiapkan data Pesanan...');

                if (typeof XLSX === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'xlsx.full.min.js';
                    script.onload = () => { window.exportPesananKeExcel(); };
                    script.onerror = () => {
                        const cdn = document.createElement('script');
                        cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
                        cdn.onload = () => { window.exportPesananKeExcel(); };
                        cdn.onerror = () => { alert('Gagal memuat modul Excel.'); };
                        document.head.appendChild(cdn);
                    };
                    document.head.appendChild(script);
                    return;
                }

                try {
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    const filterName = activeChip ? activeChip.getAttribute('data-filter') : 'semua';
                    const filterLabel = activeChip ? activeChip.innerText.trim() : 'Semua';

                    let orderHistory = [];
                    if (typeof window.getMergedPemasukan === 'function') {
                        orderHistory = window.getMergedPemasukan();
                    } else if (typeof window.getDB === 'function') {
                        orderHistory = window.getDB('db_pemasukan');
                    } else {
                        try {
                            orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                        } catch(e) {}
                    }
                    if ((!orderHistory || orderHistory.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pemasukan)) {
                        orderHistory = window.globalApiData.pemasukan;
                    }

                    const searchInput = document.getElementById('input-search-pesanan');
                    const searchKeyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

                    let filteredOrders = orderHistory.filter(order => {
                        if (!order || !order.id) return false;
                        if (order.type) return false; // exclude manual income

                        const status = (order.status || 'validasi').toLowerCase();
                        if (filterName !== 'semua') {
                            if (filterName === 'cuci' && status !== 'cuci-jemur') return false;
                            else if (filterName === 'cuci-jemur' && status !== 'cuci-jemur') return false;
                            else if (filterName !== 'cuci' && filterName !== 'cuci-jemur' && status !== filterName) return false;
                        }

                        if (searchKeyword) {
                            const cName = String(order.customerName || order.nama || '').toLowerCase();
                            const oid = String(order.id || '').toLowerCase();
                            let sName = '';
                            if (order.items && Array.isArray(order.items)) {
                                sName = order.items.map(it => it.name || '').join(' ').toLowerCase();
                            } else if (order.layanan) {
                                sName = String(order.layanan).toLowerCase();
                            }
                            if (!cName.includes(searchKeyword) && !oid.includes(searchKeyword) && !sName.includes(searchKeyword)) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (filteredOrders.length === 0) {
                        if (typeof window.showToast === 'function') window.showToast('Tidak ada data pesanan pada filter ini.');
                        return;
                    }

                    let dataToExport = filteredOrders.map((order, idx) => {
                        let dObj = window.parseDateString ? window.parseDateString(order.date, order.id, order.estDate) : new Date(order.date);
                        let dateDisplay = dObj && !isNaN(dObj.getTime()) ? `${dObj.getFullYear()}-${(dObj.getMonth() + 1).toString().padStart(2, '0')}-${dObj.getDate().toString().padStart(2, '0')}` : (order.date || '').split('T')[0].split(' ')[0];

                        let estObj = order.estDate ? (window.parseDateString ? window.parseDateString(order.estDate) : new Date(order.estDate)) : null;
                        let estDisplay = estObj && !isNaN(estObj.getTime()) ? `${estObj.getFullYear()}-${(estObj.getMonth() + 1).toString().padStart(2, '0')}-${estObj.getDate().toString().padStart(2, '0')}` : (order.estDate || '').split('T')[0].split(' ')[0];

                        let cName = String(order.customerName || order.nama || 'Anonim');
                        if (cName.includes(' (')) cName = cName.split(' (')[0];

                        let mainService = order.layanan || '';
                        let mainQty = order.qty || '';
                        if (!mainService && order.items && Array.isArray(order.items) && order.items.length > 0) {
                            mainService = order.items.map(it => it.name).join(', ');
                            mainQty = order.items.map(it => `${it.qty || 1} ${it.satuan || it.unit || ''}`.trim()).join(', ');
                        }

                        let total = parseFloat(order.total || order.nominal || 0);
                        let dibayar = parseFloat(order.dibayar !== undefined && order.dibayar !== null && order.dibayar !== '' ? order.dibayar : 0);
                        let sisaPiutang = total - dibayar;
                        let isLunas = sisaPiutang <= 0;
                        let statusBayar = isLunas ? 'Lunas' : 'Belum Bayar';

                        let progresStr = order.status || 'validasi';
                        const statusMap = {
                            'validasi': 'Validasi',
                            'antrian': 'Antrian',
                            'cuci-jemur': 'Cuci/Jemur',
                            'setrika': 'Setrika',
                            'selesai': 'Selesai',
                            'diambil': 'Diambil'
                        };
                        let progresDisplay = statusMap[progresStr.toLowerCase()] || progresStr;

                        let phStr = '';
                        if (order.paymentHistory && Array.isArray(order.paymentHistory)) {
                            phStr = order.paymentHistory.map(p => `${p.date}: Rp ${p.amount} (${p.method})`).join('; ');
                        } else if (typeof order.paymentHistory === 'string') {
                            phStr = order.paymentHistory;
                        }

                        return {
                            "No": idx + 1,
                            "ID Nota": order.id,
                            "Tanggal Masuk": dateDisplay,
                            "Estimasi Selesai": estDisplay,
                            "Pelanggan": cName,
                            "No. HP / WA": order.customerPhone || order.phone || order.telepon || '-',
                            "Layanan": mainService || '-',
                            "Qty": mainQty || '1',
                            "Total Omzet (Rp)": total,
                            "Dibayar (Rp)": dibayar,
                            "Sisa Piutang (Rp)": sisaPiutang > 0 ? sisaPiutang : 0,
                            "Status Bayar": statusBayar,
                            "Metode": order.metodeBayar || order.cashbox || order.paymentMethod || 'Tunai',
                            "Progres Cucian": progresDisplay,
                            "Riwayat Pembayaran": phStr
                        };
                    });

                    let fileName = filterName === 'semua' ? 'Data_Semua_Pesanan_Manjur_Laundry' : `Data_Pesanan_${filterLabel}_Manjur_Laundry`;

                    const ws = XLSX.utils.json_to_sheet(dataToExport);
                    const colWidths = Object.keys(dataToExport[0] || {}).map(key => {
                        const maxLen = Math.max(
                            key.length,
                            ...dataToExport.map(row => String(row[key] || '').length)
                        );
                        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
                    });
                    ws['!cols'] = colWidths;

                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Pesanan");
                    XLSX.writeFile(wb, fileName + ".xlsx");
                    if (typeof window.showToast === 'function') window.showToast(`✅ Berhasil! File ${fileName}.xlsx langsung diunduh.`);
                } catch(e) {
                    console.error('Error exportPesananKeExcel:', e);
                    if (typeof window.showToast === 'function') window.showToast('Gagal mengekspor: ' + e.message);
                }
            };

            window.handleHeaderExportExcel = function() {
                const tabPesanan = document.getElementById('tab-pesanan');
                if (tabPesanan && tabPesanan.style.display !== 'none') {
                    window.exportPesananKeExcel();
                    return;
                }
                if (typeof window.downloadAllToExcel === 'function') {
                    window.downloadAllToExcel();
                    return;
                }
                window.exportPesananKeExcel();
            };

            // --- LAPORAN ACCORDION LOGIC ---
            document.querySelectorAll('.acc-header').forEach(header => {
                header.addEventListener('click', () => {
                    const item = header.parentElement;
                    const isActive = item.classList.contains('active');

                    // Opsional: Tutup accordion yang lain saat satu dibuka (menyerupai aplikasi native)
                    document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('active'));

                    if (!isActive) {
                        item.classList.add('active');
                    }
                });
            });

            // --- TAB NAVIGATION ---
            const topTabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            const statsSlider = document.getElementById('transaksi-stats');
            const keuanganStats = document.getElementById('keuangan-stats');

            topTabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active from all tabs
                    topTabBtns.forEach(b => b.classList.remove('active'));
                    // Add active to clicked tab
                    btn.classList.add('active');

                    const targetTab = btn.getAttribute('data-tab');

                    // Hide all contents inside content-area
                    tabContents.forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    });

                    // Special case for top tabs
                    if (targetTab === 'transaksi' || targetTab === 'keuangan' || targetTab === 'kepegawaian') {
                        const targetEl = document.getElementById(`tab-${targetTab}`);
                        if (targetEl) {
                            targetEl.style.display = 'block';
                            // small delay for animation
                            setTimeout(() => targetEl.classList.add('active'), 10);
                        }

                        // Show/hide stats depending on tab
                        if (targetTab === 'transaksi') {
                            if (statsSlider) statsSlider.style.display = 'flex';
                            if (keuanganStats) keuanganStats.style.display = 'none';
                        } else if (targetTab === 'keuangan') {
                            if (statsSlider) statsSlider.style.display = 'none';
                            if (keuanganStats) keuanganStats.style.display = 'flex';
                        } else {
                            if (statsSlider) statsSlider.style.display = 'none';
                            if (keuanganStats) keuanganStats.style.display = 'none';
                        }

                        if (targetTab === 'kepegawaian' && typeof window.renderKepegawaian === 'function') {
                            window.renderKepegawaian();
                        }

                        // Toggle Header Actions (Excel vs PDF)
                        const btnQr = document.getElementById('btn-export-excel');
                        const btnExportPdf = document.getElementById('btn-export-pdf');
                        if (targetTab === 'keuangan') {
                            if (btnQr) btnQr.style.display = 'none';
                            if (btnExportPdf) btnExportPdf.style.display = 'block';
                        } else {
                            if (btnQr) btnQr.style.display = 'block';
                            if (btnExportPdf) btnExportPdf.style.display = 'none';
                        }

                        // Reset bottom nav if navigating from top tabs to Transaksi
                        if (targetTab === 'transaksi') {
                            resetBottomNav('transaksi');
                        } else {
                            resetBottomNav(null); // Clear bottom nav highlight if looking at keuangan/kepegawaian
                        }

                        // Update data and chart every time Keuangan is clicked
                        if (targetTab === 'keuangan') {
                            let currentFilter = 'bulan-ini';
                            const activeFilterOpt = document.querySelector('#date-filter-options .filter-opt.active');
                            if (activeFilterOpt) {
                                currentFilter = activeFilterOpt.getAttribute('data-val') || 'bulan-ini';
                            }
                            if (typeof window.initFinanceChart === 'function') window.initFinanceChart(currentFilter); if (typeof initOmzetChart === 'function') initOmzetChart(currentFilter);
                        }
                    }
                });
            });

            // --- BOTTOM NAVIGATION ---
            const bottomNavBtns = document.querySelectorAll('.b-nav-btn');

            bottomNavBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetNav = btn.getAttribute('data-bnav');

                    // Highlight bottom nav
                    bottomNavBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Reset back button on any nav click
                    const btnBackBeranda = document.getElementById('btn-back-from-beranda');
                    if (btnBackBeranda) btnBackBeranda.style.display = 'none';

                    // Jika mengklik menu selain transaksi, sembunyikan top nav & stats
                    if (targetNav !== 'transaksi') {
                        topTabBtns.forEach(b => b.classList.remove('active'));
                        if (statsSlider) statsSlider.style.display = 'none';
                        const mainAppHeaderNode = document.getElementById('main-app-header'); if (mainAppHeaderNode) mainAppHeaderNode.style.display = 'none'; else { const firstHeader = document.querySelector('.app-header'); if (firstHeader) firstHeader.style.display = 'none'; }
                        const topNavCard = document.querySelector('.top-nav-card');
                        if (topNavCard) topNavCard.style.display = 'none';
                    } else {
                        document.querySelector('.tab-btn[data-tab="transaksi"]').classList.add('active');
                        if (statsSlider) statsSlider.style.display = 'flex';
                        const mainAppHeaderNode2 = document.getElementById('main-app-header'); if (mainAppHeaderNode2) mainAppHeaderNode2.style.display = 'flex'; else { const firstHeader2 = document.querySelector('.app-header'); if (firstHeader2) firstHeader2.style.display = 'flex'; }
                        const topNavCard = document.querySelector('.top-nav-card');
                        if (topNavCard) topNavCard.style.display = 'block';
                    }

                    // Hide all contents
                    tabContents.forEach(content => {
                        content.style.display = 'none';
                        content.classList.remove('active');
                    });

                    // Show target content
                    const targetEl = document.getElementById('tab-' + targetNav);
                    if (targetEl) {
                        targetEl.style.display = 'block';
                        setTimeout(() => targetEl.classList.add('active'), 10);
                    }
                });
            });

            function resetBottomNav(activeTarget) {
                bottomNavBtns.forEach(b => b.classList.remove('active'));
                if (activeTarget) {
                    const activeBtn = document.querySelector('.b-nav-btn[data-bnav="' + activeTarget + '"]');
                    if (activeBtn) activeBtn.classList.add('active');
                }
            }

            // --- PESANAN TAB & FILTER LOGIC ---
            const btnBackPesanan = document.getElementById('btn-back-pesanan');
            if (btnBackPesanan) {
                btnBackPesanan.addEventListener('click', () => {
                    const berandaBtn = document.querySelector('.b-nav-btn[data-bnav="transaksi"]');
                    if (berandaBtn) berandaBtn.click();
                });
            }

            // Sync scroll horizontal antara baris judul kolom (Topline) dan daftar kartu pesanan
            const hWrapper = document.getElementById('pesanan-header-wrapper');
            const tContainer = document.getElementById('pesanan-table-container');
            if (hWrapper && tContainer) {
                let isSyncingH = false;
                tContainer.addEventListener('scroll', () => {
                    if (!isSyncingH) {
                        isSyncingH = true;
                        hWrapper.scrollLeft = tContainer.scrollLeft;
                        isSyncingH = false;
                    }
                }, { passive: true });
                hWrapper.addEventListener('scroll', () => {
                    if (!isSyncingH) {
                        isSyncingH = true;
                        tContainer.scrollLeft = hWrapper.scrollLeft;
                        isSyncingH = false;
                    }
                }, { passive: true });
            }

            const btnBackLaporan = document.getElementById('btn-back-laporan');
            if (btnBackLaporan) {
                btnBackLaporan.addEventListener('click', () => {
                    const berandaBtn = document.querySelector('.b-nav-btn[data-bnav="transaksi"]');
                    if (berandaBtn) berandaBtn.click();
                });
            }

            const pesananChips = document.querySelectorAll('.p-tab-btn');

            // Sort Logic
            window.currentSortColumn = 'date';
            window.currentSortDirection = 'desc';

            window.sortPesanan = function(column) {
                if (window.currentSortColumn === column) {
                    window.currentSortDirection = window.currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    window.currentSortColumn = column;
                    window.currentSortDirection = 'asc';
                }
                
                orderHistory.sort((a, b) => {
                    let valA = a[column];
                    let valB = b[column];
                    
                    if (column === 'id') {
                        valA = parseInt((valA || '').toString().replace(/\D/g, '')) || 0;
                        valB = parseInt((valB || '').toString().replace(/\D/g, '')) || 0;
                    } else if (column === 'date') {
                        valA = new Date(valA || 0).getTime();
                        valB = new Date(valB || 0).getTime();
                    } else if (column === 'paymentStatus') {
                        let aDibayar = parseInt((a.dibayar || '').toString().replace(/[^0-9-]/g, '')) || 0;
                        let aTotal = parseInt((a.total || '').toString().replace(/[^0-9-]/g, '')) || 0;
                        let bDibayar = parseInt((b.dibayar || '').toString().replace(/[^0-9-]/g, '')) || 0;
                        let bTotal = parseInt((b.total || '').toString().replace(/[^0-9-]/g, '')) || 0;
                        valA = (aDibayar >= aTotal) ? 1 : 0;
                        valB = (bDibayar >= bTotal) ? 1 : 0;
                    } else {
                        valA = (valA || '').toString().toLowerCase();
                        valB = (valB || '').toString().toLowerCase();
                    }
                    
                    if (valA < valB) return window.currentSortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return window.currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                });
                
                renderDashboardPesanan();
            };

            // Filter Function
            function filterPesanan(filterValue) {
                const keywordInput = document.getElementById('input-search-pesanan');
                const keyword = keywordInput ? keywordInput.value.toLowerCase().trim() : '';
                const currentRows = document.querySelectorAll('.pesanan-row');
                const paymentFilterContainer = document.getElementById('container-payment-filter');
                const paymentFilterInput = document.getElementById('pesanan-payment-filter');
                const dateFilterInput = document.getElementById('pesanan-date-filter');
                const dateVal = dateFilterInput ? dateFilterInput.value : 'semua';
                
                if (paymentFilterContainer) {
                    paymentFilterContainer.style.display = (filterValue === 'selesai') ? 'flex' : 'none';
                }
                const paymentVal = (filterValue === 'selesai' && paymentFilterInput) ? paymentFilterInput.value : 'semua';

                const tabsScroll = document.querySelector('.pesanan-tabs-scroll');
                if (tabsScroll) {
                    if (['masuk', 'harus-selesai', 'terlambat'].includes(filterValue)) {
                        tabsScroll.style.display = 'none';
                    } else {
                        tabsScroll.style.display = 'flex';
                    }
                }

                let visibleCount = 0;
                currentRows.forEach(row => {
                    if (row.getAttribute('data-status') === 'diambil') {
                        row.style.display = 'none';
                        return;
                    }
                    
                    const statusMatch = (filterValue === 'semua' && row.getAttribute('data-status') !== 'selesai') || 
                                        (filterValue === 'terlambat' && row.getAttribute('data-terlambat') === 'true') || 
                                        (filterValue === 'masuk' && row.getAttribute('data-masuk') === 'true') ||
                                        (filterValue === 'harus-selesai' && row.getAttribute('data-harus-selesai') === 'true') ||
                                        row.getAttribute('data-status') === filterValue;
                    const textMatch = !keyword || row.textContent.toLowerCase().includes(keyword);
                    
                    const paymentStatus = row.getAttribute('data-payment-status');
                    const paymentMatch = (paymentVal === 'semua' || paymentStatus === paymentVal);

                    // Date match
                    let dateMatch = true;
                    if (dateVal !== 'semua') {
                        const dateText = row.querySelector('.p-date')?.innerText?.trim();
                        if (dateText) {
                            const d = new Date(dateText);
                            if (window.isDateInRange && !isNaN(d)) {
                                dateMatch = window.isDateInRange(d, dateVal);
                            }
                        }
                    }

                    if (statusMatch && textMatch && paymentMatch && dateMatch) {
                        row.style.display = 'flex';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });

                const dashContainer = document.getElementById('dashboard-pesanan-list');
                if (dashContainer) {
                    let emptyMsg = document.getElementById('pesanan-empty-msg');
                    if (visibleCount === 0) {
                        if (!emptyMsg) {
                            emptyMsg = document.createElement('p');
                            emptyMsg.id = 'pesanan-empty-msg';
                            emptyMsg.style = 'padding:20px; text-align:center; color:var(--text-muted);';
                            dashContainer.appendChild(emptyMsg);
                        }
                        emptyMsg.innerText = 'Tidak ada pesanan untuk kategori ini.';
                        emptyMsg.style.display = 'block';
                    } else {
                        if (emptyMsg) {
                            emptyMsg.style.display = 'none';
                        }
                    }
                }
            }

            // Chip Click Events
            pesananChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    pesananChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    filterPesanan(chip.getAttribute('data-filter'));
                });
            });

            // Search Toggle & Controls
            const btnSearchPesanan = document.getElementById('btn-search-pesanan');
            const searchContainerPesanan = document.getElementById('pesanan-search-container');
            const inputSearchPesanan = document.getElementById('input-search-pesanan');
            const btnClearSearchPesanan = document.getElementById('btn-clear-search-pesanan');
            const btnCloseSearchPesanan = document.getElementById('btn-close-search-pesanan');
            const pesananDateFilter = document.getElementById('pesanan-date-filter');

            if (btnSearchPesanan) {
                btnSearchPesanan.addEventListener('click', () => {
                    if (searchContainerPesanan.style.display === 'none') {
                        searchContainerPesanan.style.display = 'block';
                        inputSearchPesanan.focus();
                    } else {
                        searchContainerPesanan.style.display = 'none';
                        inputSearchPesanan.value = '';
                        if (btnClearSearchPesanan) btnClearSearchPesanan.style.display = 'none';
                        const activeChip = document.querySelector('.p-tab-btn.active');
                        filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua');
                    }
                });
            }

            if (btnCloseSearchPesanan) {
                btnCloseSearchPesanan.addEventListener('click', () => {
                    searchContainerPesanan.style.display = 'none';
                    inputSearchPesanan.value = '';
                    if (btnClearSearchPesanan) btnClearSearchPesanan.style.display = 'none';
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua');
                });
            }

            if (btnClearSearchPesanan) {
                btnClearSearchPesanan.addEventListener('click', () => {
                    inputSearchPesanan.value = '';
                    btnClearSearchPesanan.style.display = 'none';
                    inputSearchPesanan.focus();
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua');
                });
            }

            if (inputSearchPesanan) {
                inputSearchPesanan.addEventListener('input', () => {
                    if (btnClearSearchPesanan) {
                        btnClearSearchPesanan.style.display = inputSearchPesanan.value ? 'block' : 'none';
                    }
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua');
                });
            }

            if (pesananDateFilter) {
                pesananDateFilter.addEventListener('change', () => {
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua');
                });
            }

            // Refresh Logic
            const btnRefreshPesanan = document.getElementById('btn-refresh-pesanan');
            if (btnRefreshPesanan) {
                btnRefreshPesanan.addEventListener('click', () => {
                    const icon = btnRefreshPesanan.querySelector('i');
                    if (icon) icon.classList.add('fa-spin');

                    // 1. Tarik data terbaru dari Cloud jika ada
                    if (typeof window.autoPullFromCloud === 'function') {
                        try { window.autoPullFromCloud(); } catch(e) { console.warn('autoPull error:', e); }
                    }

                    // 2. Render ulang daftar pesanan dari data lokal
                    if (typeof renderDashboardPesanan === 'function') {
                        try { renderDashboardPesanan(); } catch(e) { console.warn('render error:', e); }
                    }

                    // 3. Terapkan filter yang sedang aktif
                    const activeChip = document.querySelector('.p-tab-btn.active');
                    if (typeof filterPesanan === 'function') {
                        try { filterPesanan(activeChip ? activeChip.getAttribute('data-filter') : 'semua'); } catch(e) {}
                    }

                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        if (window.Swal) {
                            Swal.fire({
                                toast: true,
                                position: 'top-end',
                                icon: 'success',
                                title: 'Data pesanan diperbarui',
                                showConfirmButton: false,
                                timer: 1500
                            });
                        }
                    }, 600);
                });
            }

            // --- HEADER EXCEL DIRECT EXPORT BINDINGS ---
            const btnPesananExcel = document.getElementById('btn-export-pesanan-excel');
            if (btnPesananExcel) {
                btnPesananExcel.onclick = function(e) {
                    if (e) e.preventDefault();
                    window.exportPesananKeExcel();
                };
            }
            const btnHeaderExcel = document.getElementById('btn-export-excel');
            if (btnHeaderExcel) {
                btnHeaderExcel.onclick = function(e) {
                    if (e) e.preventDefault();
                    window.handleHeaderExportExcel();
                };
            }
            const btnExportPesananToolbar = document.getElementById('btn-export-pesanan');
            if (btnExportPesananToolbar) {
                btnExportPesananToolbar.onclick = function(e) {
                    if (e) e.preventDefault();
                    window.exportPesananKeExcel();
                };
            }

            // --- BOTTOM SHEET & TAMBAH PELANGGAN NAVIGATION (+) ---
            const layoutMain = document.getElementById('layout-main');
            const btnAddTrx = document.getElementById('btn-add-transaction');

            // Bottom Sheet elements
            const bsOverlay = document.getElementById('bs-pelanggan');
            const bsMenu = document.getElementById('bs-menu-pelanggan');

            // Bottom sheet toggle logic
            btnAddTrx.addEventListener('click', () => {
                const isOpen = bsOverlay.classList.contains('active');
                if (isOpen) {
                    closeBottomSheet();
                } else {
                    bsOverlay.classList.add('active');
                    bsMenu.classList.add('active');
                    btnAddTrx.classList.add('close-mode');
                    btnAddTrx.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                }
            });

            bsOverlay.addEventListener('click', closeBottomSheet);
            function closeBottomSheet() {
                bsOverlay.classList.remove('active');
                bsMenu.classList.remove('active');
                btnAddTrx.classList.remove('close-mode');
                btnAddTrx.innerHTML = '<i class="fa-solid fa-plus"></i>';
            }

            // --- CARI PELANGGAN LOGIC & NAVIGATION ---
            const btnCariPelanggan = document.getElementById('btn-cari-pelanggan');
            const layoutCariPelanggan = document.getElementById('layout-cari-pelanggan');
            const btnBackCp = document.getElementById('btn-back-cp');
            const inputSearchCp = document.getElementById('input-search-cp');
            const cpListContainer = document.getElementById('cp-list-container');
            let cpCards = [];

            const layoutPos = document.getElementById('layout-pos');
            const btnBackPos = document.getElementById('btn-back-pos');

            window.currentSortPelanggan = 'asc';
            window.toggleSortPelanggan = function() {
                window.currentSortPelanggan = window.currentSortPelanggan === 'asc' ? 'desc' : 'asc';
                if (typeof window.renderKelolaPelanggan === 'function') {
                    window.renderKelolaPelanggan();
                }
            };

            // Search logic for Kelola Pelanggan
            const btnSearchKp = document.getElementById('btn-search-kp');
            const containerSearchKp = document.getElementById('kp-search-container');
            const inputSearchKp = document.getElementById('input-search-kp');

            if (btnSearchKp && containerSearchKp) {
                btnSearchKp.addEventListener('click', () => {
                    if (containerSearchKp.style.display === 'none') {
                        containerSearchKp.style.display = 'block';
                        if (inputSearchKp) inputSearchKp.focus();
                    } else {
                        containerSearchKp.style.display = 'none';
                        if (inputSearchKp) {
                            inputSearchKp.value = '';
                            if (typeof window.renderKelolaPelanggan === 'function') window.renderKelolaPelanggan();
                        }
                    }
                });
            }
            if (inputSearchKp) {
                inputSearchKp.addEventListener('input', () => {
                    if (typeof window.renderKelolaPelanggan === 'function') window.renderKelolaPelanggan();
                });
            }

            window.renderKelolaPelanggan = function () {
                const title = document.getElementById('kelola-pelanggan-title');
                if (title) title.innerText = 'Pelanggan (' + globalCustomers.length + ')';

                const listContainer = document.getElementById('kelola-pelanggan-list');
                if (!listContainer) return;

                listContainer.innerHTML = '';
                if (globalCustomers.length === 0) {
                    listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Belum ada pelanggan</div>';
                    return;
                }

                let displayCustomers = [...globalCustomers];
                
                const searchKw = inputSearchKp ? inputSearchKp.value.toLowerCase() : '';
                if (searchKw) {
                    displayCustomers = displayCustomers.filter(c => String(c.nama || '').toLowerCase().includes(searchKw) || String(c.telepon || c.hp || '').toLowerCase().includes(searchKw));
                }

                // Sorting
                if (typeof currentSortPelanggan !== 'undefined') {
                    displayCustomers.sort((a, b) => {
                        let nameA = String(a.nama || '').toUpperCase();
                        let nameB = String(b.nama || '').toUpperCase();
                        if (currentSortPelanggan === 'asc') {
                            return nameA < nameB ? -1 : (nameA > nameB ? 1 : 0);
                        } else {
                            return nameA > nameB ? -1 : (nameA < nameB ? 1 : 0);
                        }
                    });
                }

                if (displayCustomers.length === 0) {
                    listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Tidak ada pelanggan yang cocok</div>';
                    return;
                }

                const orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                const colors = ['#f59e0b', '#f97316', '#3b82f6', '#10b981', '#8b5cf6'];
                
                displayCustomers.forEach((cust, loopIdx) => {
                    const idx = globalCustomers.indexOf(cust);
                    let cNamaStr = String(cust.nama || '');
                    const initial = cNamaStr.substring(0, 2).charAt(0).toUpperCase() + (cNamaStr.substring(1, 2) || '');
                    const phone = cust.telepon || cust.hp || 'Tanpa nomor';
                    const color = colors[idx % colors.length];
                    
                    const totalTrx = orderHistory.filter(o => o.customerName === cust.nama || o.customerName === cust.nama + ' (' + phone + ')' || o.customerName === cust.nama + ' (Tanpa nomor)').length;

                    listContainer.innerHTML += `
                <div class="kp-list-item">
                    <div class="kp-avatar" style="background: ${color};"><div style="display:flex; justify-content:center; width:100%; height:100%; align-items:center;">${initial}</div></div>
                    <div class="kp-info" onclick="window.openCustomerDetail(${idx})" style="cursor: pointer;">
                        <div class="kp-name" style="display: flex; align-items: center;">${cust.nama} <span style="font-size:0.7rem; background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:12px; margin-left:6px; font-weight:600;">${totalTrx} Trx</span></div>
                        <div class="kp-phone">${phone}</div>
                    </div>
                    <div class="kp-action" onclick="window.editCustomer(${idx})" style="cursor: pointer; padding: 10px;">
                        <i class="fa-solid fa-ellipsis" style="color: #f59e0b; font-size: 1.2rem;"></i>
                    </div>
                </div>
            `;
                });
            };

            window.editCustomer = function (idx) {
                let c = globalCustomers[idx];
                if (!c) return;

                window.editingCustomerIndex = idx;

                const inputNama = document.getElementById('tp-input-nama');
                const inputTelepon = document.getElementById('tp-input-telepon');
                const cbTanpaTelepon = document.getElementById('tanpa-telepon');
                const inputEmail = document.getElementById('tp-input-email');
                const inputAlamat = document.getElementById('tp-input-alamat');

                if (inputNama) inputNama.value = c.nama || '';
                let phoneStr = c.telepon || c.hp || '';
                if (inputTelepon) inputTelepon.value = phoneStr;
                if (cbTanpaTelepon) cbTanpaTelepon.checked = (!phoneStr);
                if (inputEmail) inputEmail.value = c.email || '';
                if (inputAlamat) inputAlamat.value = c.alamat || '';

                const title = document.querySelector('.tp-title');
                if (title) title.innerText = 'Edit Pelanggan';

                const layoutKelolaPelanggan = document.getElementById('tab-kelola-pelanggan');
                const layoutTambahPelanggan = document.getElementById('layout-tambah-pelanggan');
                if (layoutKelolaPelanggan && layoutTambahPelanggan) {
                    layoutKelolaPelanggan.classList.remove('active');
                    layoutKelolaPelanggan.style.display = 'none';
                    layoutTambahPelanggan.style.display = 'block';
                    setTimeout(() => layoutTambahPelanggan.classList.add('active'), 10);

                    // Override back button behavior temporarily for this session
                    const btnBackTp = document.getElementById('btn-back-tp');
                    if (btnBackTp) {
                        const oldBackTp = btnBackTp.onclick;
                        btnBackTp.onclick = (e) => {
                            if (e) { e.preventDefault(); e.stopPropagation(); }
                            layoutTambahPelanggan.classList.remove('active');
                            setTimeout(() => {
                                layoutTambahPelanggan.style.display = 'none';
                                layoutKelolaPelanggan.style.display = 'block';
                                setTimeout(() => layoutKelolaPelanggan.classList.add('active'), 10);
                            }, 300);
                            // reset title & editing state
                            if (title) title.innerText = 'Tambah Pelanggan';
                            window.editingCustomerIndex = null;
                            if (inputNama) inputNama.value = '';
                            if (inputTelepon) inputTelepon.value = '';
                            if (inputEmail) inputEmail.value = '';
                            if (inputAlamat) inputAlamat.value = '';
                            btnBackTp.onclick = oldBackTp; // restore
                        };
                    }
                }
            };

            // --- LOGIKA RIWAYAT PELANGGAN ---
            const btnBackRiwayat = document.getElementById('btn-back-riwayat');
            if (btnBackRiwayat) {
                btnBackRiwayat.addEventListener('click', () => {
                    document.getElementById('layout-riwayat-pelanggan').style.display = 'none';
                    if (window.fakturModeActive) window.toggleFakturMode(); // Reset mode
                    if (window.riwayatOrigin === 'top-pelanggan') {
                        document.getElementById('layout-top-pelanggan').style.display = 'block';
                        window.riwayatOrigin = null;
                    } else {
                        document.getElementById('layout-detail-pelanggan').style.display = 'block';
                    }
                });
            }

            const btnToggleFakturMode = document.getElementById('btn-toggle-faktur-mode');
            if (btnToggleFakturMode) {
                btnToggleFakturMode.addEventListener('click', () => {
                    if (typeof window.toggleFakturMode === 'function') window.toggleFakturMode();
                });
            }

            const btnGenerateFaktur = document.getElementById('btn-generate-faktur');
            if (btnGenerateFaktur) {
                btnGenerateFaktur.addEventListener('click', () => {
                    if (window.fakturSelectedTrx.length === 0) {
                        alert('Silakan pilih minimal 1 transaksi untuk dibuatkan faktur.');
                        return;
                    }
                    
                    const history = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    const dateNow = new Date();
                    const dateStr = dateNow.getDate().toString().padStart(2, '0') + '-' + (dateNow.getMonth() + 1).toString().padStart(2, '0') + '-' + dateNow.getFullYear();
                    
                    document.getElementById('faktur-date-display').innerText = 'Tanggal: ' + dateStr;
                    document.getElementById('faktur-cust-name').innerText = currentRiwayatCustomer || '-';
                    document.getElementById('faktur-cust-phone').innerText = currentRiwayatPhone || '-';
                    
                    const container = document.getElementById('faktur-items-container');
                    container.innerHTML = '';
                    
                    let grandTotal = 0;
                    
                    window.fakturSelectedTrx.forEach(id => {
                        const trx = history.find(t => t.id === id);
                        if (trx) {
                            let amount = 0;
                            if (trx.dibayar) amount = parseInt(trx.dibayar);
                            else if (trx.total) amount = parseInt(trx.total);
                            else if (trx.grandTotal) amount = parseInt(trx.grandTotal);
                            
                            grandTotal += amount;
                            
                            let trxDate = trx.date || '-';
                            if (trx.timestamp) {
                                const d = new Date(trx.timestamp);
                                trxDate = d.getDate().toString().padStart(2,'0') + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getFullYear();
                            }
                            
                            container.innerHTML += `
                                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                                    <div>
                                        <div style="font-weight: 600; font-size: 0.95rem; color: #1e293b;">${trx.id}</div>
                                        <div style="font-size: 0.8rem; color: #64748b;">${trxDate}</div>
                                    </div>
                                    <div style="font-weight: 600; color: #1e293b;">Rp ${amount.toLocaleString('id-ID')}</div>
                                </div>
                            `;
                        }
                    });
                    
                    document.getElementById('faktur-grand-total').innerText = 'Rp ' + grandTotal.toLocaleString('id-ID');
                    window.fakturCurrentGrandTotal = grandTotal;
                    
                    document.getElementById('layout-riwayat-pelanggan').style.display = 'none';
                    document.getElementById('layout-faktur').style.display = 'block';
                    window.scrollTo(0, 0);
                });
            }
            
            const btnBackFaktur = document.getElementById('btn-back-faktur');
            if (btnBackFaktur) {
                btnBackFaktur.addEventListener('click', () => {
                    document.getElementById('layout-faktur').style.display = 'none';
                    document.getElementById('layout-riwayat-pelanggan').style.display = 'block';
                });
            }
            
            const btnShareFaktur = document.getElementById('btn-share-faktur');
            if (btnShareFaktur) {
                btnShareFaktur.addEventListener('click', () => {
                    const shopName = localStorage.getItem('outlet_name') || 'Manjur Laundry';
                    const dateStr = document.getElementById('faktur-date-display').innerText.replace('Tanggal: ', '');
                    
                    let text = `*FAKTUR TAGIHAN - ${shopName.toUpperCase()}*\n`;
                    text += `Tanggal: ${dateStr}\n`;
                    text += `Kepada: *${currentRiwayatCustomer}*\n\n`;
                    text += `*Rincian Transaksi:*\n`;
                    
                    const history = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    window.fakturSelectedTrx.forEach(id => {
                        const trx = history.find(t => t.id === id);
                        if (trx) {
                            let amount = 0;
                            if (trx.dibayar) amount = parseInt(trx.dibayar);
                            else if (trx.total) amount = parseInt(trx.total);
                            else if (trx.grandTotal) amount = parseInt(trx.grandTotal);
                            text += `- ${id} : Rp ${amount.toLocaleString('id-ID')}\n`;
                        }
                    });
                    
                    text += `\n*TOTAL KESELURUHAN: Rp ${window.fakturCurrentGrandTotal.toLocaleString('id-ID')}*\n\n`;
                    text += `Terima kasih atas kepercayaannya menggunakan layanan kami.`;
                    
                    const encodedText = encodeURIComponent(text);
                    let phone = currentRiwayatPhone ? currentRiwayatPhone.replace(/\D/g, '') : '';
                    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
                    
                    if (phone) {
                        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
                    } else {
                        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
                    }
                });
            }
            
            const btnPrintFaktur = document.getElementById('btn-print-faktur');
            if (btnPrintFaktur) {
                btnPrintFaktur.addEventListener('click', () => {
                    const area = document.getElementById('faktur-print-area');
                    if (!area) return;
                    
                    const originalBody = document.body.innerHTML;
                    const printContent = area.innerHTML;
                    
                    // Prepend standard print styling for invoice
                    let printWindow = document.createElement('div');
                    printWindow.id = 'print-container';
                    printWindow.innerHTML = printContent;
                    printWindow.style.padding = '20px';
                    printWindow.style.color = '#000';
                    printWindow.style.background = '#fff';
                    printWindow.style.fontFamily = 'monospace';
                    
                    document.body.innerHTML = '';
                    document.body.appendChild(printWindow);
                    window.print();
                    document.body.innerHTML = originalBody;
                    window.location.reload(); // Quick restore of event listeners
                });
            }

            let currentRiwayatTab = 'reguler';
            let currentRiwayatCustomer = '';
            let currentRiwayatPhone = '';

            const tabReg = document.getElementById('tab-riwayat-reguler');
            const tabProd = document.getElementById('tab-riwayat-produk');
            
            if (tabReg && tabProd) {
                tabReg.addEventListener('click', function() {
                    this.style.color = '#0284c7';
                    this.style.borderBottom = '2px solid #0284c7';
                    tabProd.style.color = '#64748b';
                    tabProd.style.borderBottom = '2px solid transparent';
                    currentRiwayatTab = 'reguler';
                    if(typeof window.renderRiwayatPelanggan === 'function') window.renderRiwayatPelanggan(currentRiwayatCustomer, currentRiwayatPhone);
                });

                tabProd.addEventListener('click', function() {
                    this.style.color = '#0284c7';
                    this.style.borderBottom = '2px solid #0284c7';
                    tabReg.style.color = '#64748b';
                    tabReg.style.borderBottom = '2px solid transparent';
                    currentRiwayatTab = 'produk';
                    if(typeof window.renderRiwayatPelanggan === 'function') window.renderRiwayatPelanggan(currentRiwayatCustomer, currentRiwayatPhone);
                });
            }

            // --- LOGIKA DETAIL TRANSAKSI ---
            let currentDetailTrxObj = null;

            const btnBackDetailTrx = document.getElementById('btn-back-detail-trx');
            if (btnBackDetailTrx) {
                btnBackDetailTrx.addEventListener('click', () => {
                    document.getElementById('layout-detail-trx').style.display = 'none';
                    document.getElementById('layout-riwayat-pelanggan').style.display = 'block';
                });
            }

            const btnTrxReceipt = document.getElementById('btn-trx-receipt');
            const btnDtTagihanDetail = document.getElementById('btn-dt-tagihan-detail');
            
            const openNotaHandler = () => {
                if (currentDetailTrxObj && typeof renderNota === 'function') {
                    renderNota(currentDetailTrxObj);
                    const layoutNota = document.getElementById('layout-nota');
                    if (layoutNota) {
                        document.getElementById('layout-detail-trx').style.display = 'none';
                        layoutNota.style.display = 'block';
                        setTimeout(() => layoutNota.classList.add('active'), 10);
                        
                        // Override back button behavior temporarily
                        const btnBackNota = document.getElementById('btn-back-nota');
                        if (btnBackNota) {
                            const oldBack = btnBackNota.onclick;
                            btnBackNota.onclick = (e) => {
                                if(e) e.stopPropagation();
                                layoutNota.classList.remove('active');
                                setTimeout(() => {
                                    layoutNota.style.display = 'none';
                                    document.getElementById('layout-detail-trx').style.display = 'block';
                                }, 300);
                                btnBackNota.onclick = oldBack; // restore
                            };
                        }
                    }
                }
            };
            
            if (btnTrxReceipt) btnTrxReceipt.addEventListener('click', openNotaHandler);
            if (btnDtTagihanDetail) btnDtTagihanDetail.addEventListener('click', openNotaHandler);

            const btnTrxPrint = document.getElementById('btn-trx-print');
            if (btnTrxPrint) {
                btnTrxPrint.addEventListener('click', () => {
                    if (currentDetailTrxObj) {
                        if (typeof renderNota === 'function') {
                            renderNota(currentDetailTrxObj);
                        }
                        if (typeof btPrinter !== 'undefined') {
                            btPrinter.print(currentDetailTrxObj);
                        } else if (typeof window.printReceiptBrowser === 'function') {
                            window.printReceiptBrowser(currentDetailTrxObj);
                        } else {
                            window.print();
                        }
                    }
                });
            }
            
            const dtBtnBatal = document.getElementById('dt-btn-batal');
            if (dtBtnBatal) {
                dtBtnBatal.addEventListener('click', () => {
                    document.getElementById('layout-detail-trx').style.display = 'none';
                    document.getElementById('layout-riwayat-pelanggan').style.display = 'block';
                });
            }

            window.openDetailTrx = function(trxId) {
                const history = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                const trx = history.find(o => o.id === trxId);
                if (!trx) return;

                currentDetailTrxObj = trx;

                // Populate Header & Top Info
                document.getElementById('dt-status-title').innerText = trx.status || 'Selesai';
                document.getElementById('dt-trx-id').innerText = trx.id;
                document.getElementById('dt-trx-date').innerText = trx.date || '';
                
                // Customer
                let cName = String(trx.customerName || 'Anonim');
                let cPhone = 'Tanpa nomor';
                if (cName.includes('(')) {
                    let parts = cName.split('(');
                    cName = parts[0].trim();
                    cPhone = parts[1].replace(')', '').trim();
                }
                document.getElementById('dt-cust-name').innerText = cName;
                document.getElementById('dt-cust-phone').innerText = cPhone;

                // Tagihan
                let total = trx.grandTotal || trx.total || 0;
                document.getElementById('dt-tagihan').innerText = parseInt(total).toLocaleString('id-ID');

                // Bayar btn logic
                const btnBayar = document.getElementById('dt-btn-bayar');
                if (trx.paymentStatus === 'Belum Lunas' || (trx.dibayar && parseInt(trx.dibayar) < parseInt(total))) {
                    btnBayar.innerText = 'BAYAR';
                    btnBayar.style.background = '#f59e0b';
                } else {
                    btnBayar.innerText = 'LUNAS';
                    btnBayar.style.background = '#10b981';
                }

                // Parfum & Est Selesai
                document.getElementById('dt-parfum-name').innerHTML = 'Pilih Parfum <span style="color:#3b82f6; font-weight:600;">' + (trx.parfum || '-') + '</span>';
                document.getElementById('dt-est-selesai').innerText = trx.estimasiSelesai || trx.date || '-';
                document.getElementById('dt-catatan').innerText = trx.catatan || 'Tidak Ada';

                // Render Items
                const itemList = document.getElementById('dt-item-list');
                itemList.innerHTML = '';
                let items = trx.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch(e){ items = []; }
                }
                if (items && items.length > 0) {
                    items.forEach(item => {
                        let basketColor = item.type === 'produk' || item.kategori === 'Produk' ? '#f59e0b' : '#f43f5e';
                        let basketBg = item.type === 'produk' || item.kategori === 'Produk' ? '#fef3c7' : '#ffe4e6';
                        itemList.innerHTML += '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px;">' +
                                '<div style="display: flex; gap: 15px; align-items: center;">' +
                                    '<div style="width: 45px; height: 45px; border-radius: 8px; background: ' + basketBg + '; display: flex; align-items: center; justify-content: center;">' +
                                        '<i class="fa-solid fa-basket-shopping" style="color: ' + basketColor + '; font-size: 1.2rem;"></i>' +
                                    '</div>' +
                                    '<div>' +
                                        '<div style="font-weight: 500; color: #1e293b; font-size: 0.95rem;">' + (item.name || item.nama) + '</div>' +
                                        '<div style="color: #64748b; font-size: 0.8rem; margin-top: 2px;">' + item.qty + ' ' + (item.satuan || 'Pcs') + '</div>' +
                                    '</div>' +
                                '</div>' +
                                '<div style="color: #cbd5e1;"><i class="fa-solid fa-ellipsis"></i></div>' +
                            '</div>';
                    });
                }

                // Render History
                const histList = document.getElementById('dt-history-list');
                histList.innerHTML = '';
                
                let statuses = [
                    { title: 'Pesanan Dibuat', desc: 'Oleh : Kasir', time: trx.date },
                    { title: 'Pesanan Diproses', desc: 'Pesanan sedang diproses', time: trx.date }
                ];
                if (trx.status === 'Selesai' || trx.status === 'Diambil') {
                    statuses.push({ title: 'Pesanan selesai diproses', desc: 'Menunggu Pengambilan', time: trx.date });
                }
                if (trx.status === 'Diambil') {
                    statuses.push({ title: 'Pesanan Diterima Customer', desc: 'Order selesai', time: trx.date });
                }

                statuses.forEach(s => {
                    histList.innerHTML += '<div style="display: flex; gap: 15px;">' +
                            '<div style="color: #3b82f6; font-size: 1.2rem;"><i class="fa-solid fa-check"></i></div>' +
                            '<div style="flex-grow: 1;">' +
                                '<div style="font-weight: 500; color: #1e293b; margin-bottom: 2px;">' + s.title + '</div>' +
                                '<div style="color: #64748b; font-size: 0.75rem;">' + s.desc + '</div>' +
                            '</div>' +
                            '<div style="color: #94a3b8; font-size: 0.75rem; text-align: right; white-space: nowrap;">' +
                                s.time +
                            '</div>' +
                        '</div>';
                });

                // Switch Layout
                document.getElementById('layout-riwayat-pelanggan').style.display = 'none';
                document.getElementById('layout-detail-trx').style.display = 'block';
                window.scrollTo(0,0);
            };

            window.fakturModeActive = false;
            window.fakturSelectedTrx = [];
            
            window.toggleFakturMode = function() {
                window.fakturModeActive = !window.fakturModeActive;
                if (!window.fakturModeActive) {
                    window.fakturSelectedTrx = []; // reset if cancelled
                    document.getElementById('faktur-bottom-bar').style.display = 'none';
                    document.getElementById('btn-toggle-faktur-mode').innerHTML = '<i class="fa-solid fa-file-invoice"></i> Buat Faktur';
                    document.getElementById('btn-toggle-faktur-mode').style.background = '#0ea5e9';
                } else {
                    document.getElementById('faktur-bottom-bar').style.display = 'flex';
                    document.getElementById('btn-toggle-faktur-mode').innerHTML = '<i class="fa-solid fa-times"></i> Batal Faktur';
                    document.getElementById('btn-toggle-faktur-mode').style.background = '#ef4444';
                    window.updateFakturBottomBar();
                }
                if (typeof window.renderRiwayatPelanggan === 'function') {
                    window.renderRiwayatPelanggan(currentRiwayatCustomer, currentRiwayatPhone);
                }
            };
            
            window.updateFakturBottomBar = function() {
                document.getElementById('faktur-selected-count').innerText = window.fakturSelectedTrx.length;
                let total = 0;
                const history = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                window.fakturSelectedTrx.forEach(id => {
                    const trx = history.find(t => t.id === id);
                    if (trx) {
                        let amount = 0;
                        if (trx.dibayar) amount = parseInt(trx.dibayar);
                        else if (trx.total) amount = parseInt(trx.total);
                        else if (trx.grandTotal) amount = parseInt(trx.grandTotal);
                        total += amount;
                    }
                });
                document.getElementById('faktur-selected-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
            };

            window.toggleFakturTrx = function(trxId) {
                if (window.fakturSelectedTrx.includes(trxId)) {
                    window.fakturSelectedTrx = window.fakturSelectedTrx.filter(id => id !== trxId);
                } else {
                    window.fakturSelectedTrx.push(trxId);
                }
                window.updateFakturBottomBar();
                window.renderRiwayatPelanggan(currentRiwayatCustomer, currentRiwayatPhone);
            };

            window.renderRiwayatPelanggan = function(customerName, customerPhone) {
                currentRiwayatCustomer = customerName;
                currentRiwayatPhone = customerPhone;
                
                const listContainer = document.getElementById('riwayat-trx-list');
                if (!listContainer) return;
                listContainer.innerHTML = '';
                
                const history = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                
                let filtered = history.filter(o => o.customerName === customerName || o.customerName === customerName + ' (' + customerPhone + ')' || o.customerName === customerName + ' (Tanpa nomor)');
                
                filtered.sort((a,b) => {
                    let timeA = a.timestamp ? a.timestamp : new Date(a.date).getTime();
                    let timeB = b.timestamp ? b.timestamp : new Date(b.date).getTime();
                    return timeB - timeA;
                });

                let count = 0;
                filtered.forEach(o => {
                    let parsedItems = o.items;
                    if (typeof o.items === 'string') {
                        try { parsedItems = JSON.parse(o.items); } catch(e) {}
                    }
                    let isProdukOnly = true;
                    if (parsedItems && parsedItems.length > 0) {
                        for(let i=0; i<parsedItems.length; i++) {
                            if(parsedItems[i].type !== 'produk' && parsedItems[i].kategori !== 'Produk') {
                                isProdukOnly = false;
                                break;
                            }
                        }
                    } else {
                        isProdukOnly = false;
                    }
                    
                    if (currentRiwayatTab === 'reguler' && isProdukOnly) return;
                    if (currentRiwayatTab === 'produk' && !isProdukOnly) return;

                    count++;
                    let totalVal = 0;
                    if (o.dibayar) totalVal = parseInt(o.dibayar);
                    else if (o.total) totalVal = parseInt(o.total);
                    else if (o.grandTotal) totalVal = parseInt(o.grandTotal);
                    let totalStr = totalVal.toLocaleString('id-ID');

                    let status = o.status || 'Selesai';
                    
                    let isSelected = window.fakturSelectedTrx.includes(o.id);
                    let checkboxHtml = '';
                    let actionAttr = 'onclick="if(typeof window.openDetailTrx === `function`) window.openDetailTrx(`' + o.id + '`)"';
                    
                    let trxDateStr = o.date || '-';
                    if (o.timestamp) {
                        const d = new Date(o.timestamp);
                        trxDateStr = d.getDate().toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0') + '/' + d.getFullYear();
                    }
                    
                    if (window.fakturModeActive) {
                        checkboxHtml = '<div style="margin-right: 15px; display: flex; align-items: center;">' +
                            '<div style="width: 24px; height: 24px; border-radius: 6px; border: 2px solid ' + (isSelected ? '#0ea5e9' : '#cbd5e1') + '; background: ' + (isSelected ? '#0ea5e9' : 'transparent') + '; display: flex; justify-content: center; align-items: center;">' +
                            (isSelected ? '<i class="fa-solid fa-check" style="color: white; font-size: 0.8rem;"></i>' : '') +
                            '</div></div>';
                        actionAttr = 'onclick="window.toggleFakturTrx(`' + o.id + '`)"';
                    }

                    listContainer.innerHTML += '<div ' + actionAttr + ' style="display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; cursor: pointer;">' +
                        checkboxHtml +
                        '<div style="flex-grow: 1; display: flex; align-items: center; justify-content: space-between;">' +
                            '<div style="display: flex; align-items: center; gap: 15px;">' +
                                '<div style="width: 45px; height: 45px; background: #fdf4ff; border-radius: 12px; display: flex; justify-content: center; align-items: center; border: 1px solid #fae8ff;">' +
                                    '<i class="fa-solid fa-basket-shopping" style="color: #e879f9; font-size: 1.2rem;"></i>' +
                                '</div>' +
                                '<div>' +
                                    '<div style="font-weight: 600; color: #1e293b; font-size: 0.95rem;">' + o.id + ' <span style="font-weight:normal; font-size:0.75rem; color:#94a3b8; margin-left:6px;"><i class="fa-regular fa-calendar" style="margin-right:3px;"></i>' + trxDateStr + '</span></div>' +
                                    '<div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">Status : <span style="color: #0284c7; font-weight: 500;">' + status + '</span></div>' +
                                '</div>' +
                            '</div>' +
                            '<div style="font-weight: 600; color: #1e293b; font-size: 1rem;">' + totalStr + '</div>' +
                        '</div>' +
                    '</div>';
                });

                if (count === 0) {
                    listContainer.innerHTML = '<div style="text-align:center; padding: 20px; color:#94a3b8; font-size:0.9rem;">Tidak ada transaksi di kategori ini.</div>';
                }
            };
            window.openCustomerDetail = function (idx) {
                let c = globalCustomers[idx];
                if (!c) return;

                // Set Customer Info
                document.getElementById('cd-search-name').innerText = c.nama;
                
                let phoneStr = c.telepon || c.hp || '';
                document.getElementById('cd-phone-val').innerText = phoneStr ? phoneStr : 'Tanpa nomor';
                
                // WA and Telp links
                let waLink = document.getElementById('cd-wa-link');
                let telpLink = document.getElementById('cd-telp-link');
                if (phoneStr) {
                    let cleanPhone = phoneStr.replace(/\D/g, '');
                    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
                    if (waLink) {
                        waLink.href = 'https://wa.me/' + cleanPhone;
                        waLink.style.display = 'inline-block';
                    }
                    if (telpLink) {
                        telpLink.href = 'tel:' + cleanPhone;
                        telpLink.style.display = 'inline-block';
                    }
                } else {
                    if (waLink) waLink.style.display = 'none';
                    if (telpLink) telpLink.style.display = 'none';
                }

                document.getElementById('cd-address-val').innerText = c.alamat ? c.alamat : 'Tidak ada alamat';

                // Calculate Stats
                let totalNominal = 0;
                let txCount = 0;
                let rincianQty = 0;
                let firstTx = null;
                let lastTx = null;

                orderHistory.forEach(o => {
                    if (o.customerName === c.nama || o.customerName === `${c.nama} (${phoneStr})` || o.customerName === `${c.nama} (Tanpa nomor)`) {
                        txCount++;
                        let grandTotal = parseInt(o.grandTotal) || 0;
                        if (!grandTotal) {
                           grandTotal = o.items ? o.items.reduce((sum, item) => sum + (parseInt(item.total) || 0), 0) : 0;
                           if (o.discount) grandTotal -= parseInt(o.discount);
                           if (o.cashAdvance) grandTotal -= parseInt(o.cashAdvance);
                        }
                        totalNominal += grandTotal;
                        
                        if (o.items && o.items.length > 0) {
                            rincianQty += parseFloat(o.items[0].qty) || 0;
                        }

                        let dTime = new Date(o.date).getTime();
                        if (!firstTx || dTime < new Date(firstTx).getTime()) firstTx = o.date;
                        if (!lastTx || dTime > new Date(lastTx).getTime()) lastTx = o.date;
                    }
                });

                document.getElementById('cd-tx-nominal').innerText = 'Rp ' + totalNominal.toLocaleString('id-ID');
                document.getElementById('cd-tx-count').innerText = txCount + ' Transaksi';
                document.getElementById('cd-tx-produk').innerText = '0 Transaksi'; 
                document.getElementById('cd-tx-rincian').innerText = rincianQty + ' Kg / 0 Satuan / 0.0 mÂ²';
                
                function formatTxDate(dStr) {
                    if (!dStr) return '-';
                    try {
                        let d = new Date(dStr);
                        if (isNaN(d.getTime())) {
                            let parts = dStr.split(' ')[0].split(/[\/-]/);
                            if (parts.length === 3) {
                                let y = parts[0].length === 4 ? parts[0] : (parseInt(parts[2]) < 100 ? '20'+parts[2] : parts[2]);
                                let m = parts[1].padStart(2, '0');
                                let dy = (parts[0].length === 4 ? parts[2] : parts[0]).padStart(2, '0');
                                return `${dy}/${m}/${y} ${dStr.split(' ')[1] || ''}`;
                            }
                        }
                        let dd = String(d.getDate()).padStart(2, '0');
                        let mm = String(d.getMonth() + 1).padStart(2, '0');
                        let yyyy = d.getFullYear();
                        let hh = String(d.getHours()).padStart(2, '0');
                        let min = String(d.getMinutes()).padStart(2, '0');
                        let ss = String(d.getSeconds()).padStart(2, '0');
                        return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
                    } catch (e) { return dStr; }
                }

                document.getElementById('cd-tx-first').innerText = formatTxDate(firstTx);
                document.getElementById('cd-tx-last').innerText = formatTxDate(lastTx);

                // Setup Action Bar Actions
                const btnBuatTrx = document.getElementById('cd-btn-buat-trx');
                const btnReguler = document.getElementById('cd-act-reguler');
                const btnProduk = document.getElementById('cd-act-produk');

                const handleGoToPos = () => {
                    const posCustomerSelect = document.getElementById('pos-customer-select');
                    if (posCustomerSelect) {
                        posCustomerSelect.value = c.nama;
                        // Dispatch change event to update the POS view
                        posCustomerSelect.dispatchEvent(new Event('change'));
                    }
                    
                    document.getElementById('layout-detail-pelanggan').style.display = 'none';
                    const layoutPos = document.getElementById('layout-pos');
                    if (layoutPos) {
                        if(typeof window.populatePosPegawai === 'function') window.populatePosPegawai(); layoutPos.style.display = 'block';
                        // Back override to go back to detail view
                        const btnBackPos = document.getElementById('btn-back-pos');
                        if (btnBackPos) {
                            const oldBack = btnBackPos.onclick;
                            btnBackPos.onclick = (e) => {
                                if (e) { e.preventDefault(); e.stopPropagation(); }
                                layoutPos.style.display = 'none';
                                document.getElementById('layout-detail-pelanggan').style.display = 'block';
                                btnBackPos.onclick = oldBack;
                            };
                        }
                    }
                };

                if(btnBuatTrx) btnBuatTrx.onclick = handleGoToPos;
                if(btnReguler) btnReguler.onclick = handleGoToPos;
                if(btnProduk) btnProduk.onclick = handleGoToPos;

                // History filtering
                // History filtering (NEW LOGIC)
                const btnLihatSemua = document.getElementById('cd-btn-lihat-history');
                if (btnLihatSemua) {
                    btnLihatSemua.onclick = () => {
                        document.getElementById('layout-detail-pelanggan').style.display = 'none';
                        document.getElementById('layout-riwayat-pelanggan').style.display = 'block';
                        if (typeof window.renderRiwayatPelanggan === 'function') {
                            window.renderRiwayatPelanggan(c.nama, phoneStr);
                        }
                    };
                }
                // Switch Layout
                document.getElementById('layout-main').style.display = 'none';
                document.getElementById('layout-detail-pelanggan').style.display = 'block';
            };

            const btnBackCd = document.getElementById('btn-back-cd');
            if (btnBackCd) {
                btnBackCd.addEventListener('click', () => {
                    document.getElementById('layout-detail-pelanggan').style.display = 'none';
                    if (window.customerDetailOrigin === 'top-pelanggan') {
                        document.getElementById('layout-top-pelanggan').style.display = 'block';
                        window.customerDetailOrigin = null;
                    } else {
                        document.getElementById('layout-main').style.display = 'block';
                    }
                });
            }

            function renderCariPelanggan() {
                if (typeof window.renderKelolaPelanggan === 'function') window.renderKelolaPelanggan();
                if (!cpListContainer) return;
                cpListContainer.innerHTML = '';
                if (globalCustomers.length === 0) {
                    cpListContainer.innerHTML = '<p style="text-align:center; color:#94a3b8;">Belum ada data pelanggan.</p>';
                } else {
                    const orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    globalCustomers.forEach(c => {
                        const totalTrx = orderHistory.filter(o => o.customerName === c.nama || o.customerName === c.nama + ' (' + (c.telepon || c.hp || 'Tanpa nomor') + ')' || o.customerName === c.nama + ' (Tanpa nomor)').length;
                        let card = document.createElement('div');
                        card.className = 'cp-card';
                        card.innerHTML = `
                    <div class="cp-card-info">
                        <h4 style="display: flex; align-items: center; gap: 8px;">${c.nama} <span style="font-size:0.7rem; background:#e0f2fe; color:#0284c7; padding:2px 8px; border-radius:12px; font-weight:600;">${totalTrx} Trx</span></h4>
                        <p>${c.telepon || '-'}</p>
                    </div>
                    <button class="cp-btn-pilih">Pilih</button>
                `;
                        card.querySelector('.cp-btn-pilih').addEventListener('click', () => {
                            // Populate posCustomerSelect
                            if (posCustomerSelect) posCustomerSelect.value = c.nama;
                            if (memberNameDisp) memberNameDisp.innerText = c.nama;
                            if (memberPhoneDisp) memberPhoneDisp.innerText = c.telepon || '-';
                            if (memberBadgeDisp) memberBadgeDisp.style.display = 'none';
                            if (lblDiskon) lblDiskon.innerText = 'Diskon Member (0%)';

                            window.showToast(Memilih);
                            setTimeout(() => {
                                layoutCariPelanggan.classList.remove('active');
                                layoutCariPelanggan.style.display = 'none';
                                if(typeof window.populatePosPegawai === 'function') window.populatePosPegawai(); layoutPos.style.display = 'block';
                                setTimeout(() => layoutPos.classList.add('active'), 10);
                                calcTotal();
                            }, 100);
                        });
                        cpListContainer.appendChild(card);
                    });
                }
                cpCards = document.querySelectorAll('.cp-card');
            }

            window.populatePosPegawai = function() {
                const posPegawaiSelect = document.getElementById('pos-pegawai-select');
                if (!posPegawaiSelect) return;
                
                const users = JSON.parse(localStorage.getItem('db_users') || '[]');
                const activeRole = localStorage.getItem('activeRole');
                
                let dbPegawai = users.map(u => ({
                    id: u.name,
                    nama: u.name,
                    role: u.roleDesc,
                    isAktif: u.name === activeRole
                }));
                
                if (dbPegawai.length > 0 && !dbPegawai.find(p => p.isAktif)) {
                    dbPegawai[0].isAktif = true;
                }
                
                posPegawaiSelect.innerHTML = '<option value="">-- Pilih Pegawai --</option>';
                dbPegawai.forEach(p => {
                    posPegawaiSelect.innerHTML += `<option value="${p.id}">${p.nama} (${p.role})</option>`;
                });
                
                // Automatically select the active employee if not editing
                const activeEmp = dbPegawai.find(p => p.isAktif);
                if (activeEmp && !window.editingOrderId) {
                    posPegawaiSelect.value = activeEmp.id;
                }
            };

            // Navigasi dari Bottom Sheet -> Kasir POS
            if (btnCariPelanggan) {
                btnCariPelanggan.addEventListener('click', () => {
                    closeBottomSheet();
                    window.populatePosPegawai();
                    layoutMain.classList.remove('active');
                    layoutMain.style.display = 'none';
                    if(typeof window.populatePosPegawai === 'function') window.populatePosPegawai(); layoutPos.style.display = 'block';
                    setTimeout(() => layoutPos.classList.add('active'), 10);
                });
            }

            // Tombol Back di Halaman Cari Pelanggan
            if (btnBackCp) {
                btnBackCp.addEventListener('click', () => {
                    layoutCariPelanggan.classList.remove('active');
                    layoutCariPelanggan.style.display = 'none';
                    layoutMain.style.display = 'flex';
                    setTimeout(() => layoutMain.classList.add('active'), 10);
                });
            }

            // Fitur Search/Filter di Daftar Pelanggan
            if (inputSearchCp) {
                inputSearchCp.addEventListener('input', (e) => {
                    const query = e.target.value.toLowerCase();
                    cpCards.forEach(card => {
                        const text = card.textContent.toLowerCase();
                        if (text.includes(query)) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });
            }



            if (btnBackPos) {
                btnBackPos.addEventListener('click', () => {
                    // CLEAR EDIT STATE if user cancels
                    window.editingOrderId = null;
                    window.editingOrderOriginalDate = null;
                    window.editingOrderStatus = null;

                    cartData = [];
                    updateCartUI();
                    const posCustomerSelect = document.getElementById('pos-customer-select');
                    if (posCustomerSelect) posCustomerSelect.value = '';
                    
                    const posPegawaiSelect = document.getElementById('pos-pegawai-select');
                    if (posPegawaiSelect) posPegawaiSelect.value = '';

                    layoutPos.classList.remove('active');
                    layoutPos.style.display = 'none';
                    layoutMain.style.display = 'flex';
                    setTimeout(() => layoutMain.classList.add('active'), 10);
                });
            }

            // Navigasi ke Tambah Pelanggan
            const btnTambahPelanggan = document.getElementById('btn-tambah-pelanggan');
            const layoutTambahPelanggan = document.getElementById('layout-tambah-pelanggan');
            const btnBackTp = document.getElementById('btn-back-tp');
            let tpSource = 'main';

            btnTambahPelanggan.addEventListener('click', () => {
                tpSource = 'main';
                closeBottomSheet();
                layoutMain.classList.remove('active');
                layoutMain.style.display = 'none';

                window.editingCustomerIndex = null;
                const title = document.querySelector('.tp-title');
                if (title) title.innerText = 'Tambah Pelanggan';
                const inputNama = document.getElementById('tp-input-nama');
                const inputTelepon = document.getElementById('tp-input-telepon');
                const inputEmail = document.getElementById('tp-input-email');
                const inputAlamat = document.getElementById('tp-input-alamat');
                if (inputNama) inputNama.value = '';
                if (inputTelepon) inputTelepon.value = '';
                if (inputEmail) inputEmail.value = '';
                if (inputAlamat) inputAlamat.value = '';

                layoutTambahPelanggan.style.display = 'block';
                setTimeout(() => layoutTambahPelanggan.classList.add('active'), 10);
            });

            const btnPosNewCust = document.getElementById('btn-pos-new-cust');
            if (btnPosNewCust) {
                btnPosNewCust.addEventListener('click', () => {
                    tpSource = 'pos';
                    const layoutPos = document.getElementById('layout-pos');
                    if (layoutPos) {
                        layoutPos.classList.remove('active');
                        layoutPos.style.display = 'none';
                    }
                    layoutTambahPelanggan.style.display = 'block';
                    setTimeout(() => layoutTambahPelanggan.classList.add('active'), 10);
                });
            }

            btnBackTp.addEventListener('click', () => {
                layoutTambahPelanggan.classList.remove('active');
                layoutTambahPelanggan.style.display = 'none';

                if (tpSource === 'pos') {
                    const layoutPos = document.getElementById('layout-pos');
                    if (layoutPos) {
                        layoutPos.style.display = 'flex';
                        setTimeout(() => layoutPos.classList.add('active'), 10);
                    }
                } else {
                    layoutMain.style.display = 'flex';
                    setTimeout(() => layoutMain.classList.add('active'), 10);
                }
            });

            // --- FILTER RINGKASAN ---
            const btnRingkasanFilter = document.getElementById('btn-ringkasan-filter');
            const textRingkasanFilter = document.getElementById('text-ringkasan-filter');
            const ringkasanDateText = document.getElementById('ringkasan-date-text');
            const modalDateFilter = document.getElementById('modal-date-filter');
            const closeDateFilter = document.getElementById('close-date-filter');
            const filterOpts = document.querySelectorAll('.filter-opt');

            // Fungsi untuk memproses data berdasar value
            const prosesFilterKeuangan = (val) => {
                if (val === 'per-tanggal') {
                    if (typeof window.openDatePicker === 'function') {
                        let fElem = document.getElementById('ringkasan-date-filter');
                        window.openDatePicker(fElem || { id: 'ringkasan-date-filter' });
                    }
                } else if (val === 'per-bulan') {
                    if (typeof window.openMonthPicker === 'function') {
                        let fElem = document.getElementById('ringkasan-date-filter');
                        window.openMonthPicker(fElem || { id: 'ringkasan-date-filter' });
                    }
                } else if (val) {
                    const today = new Date();
                    const pad = (n) => n.toString().padStart(2, '0');
                    const formatDt = (d) => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
                    
                    let textStr = '';
                    if (val === 'hari-ini') textStr = formatDt(today);
                    else if (val === 'kemarin') {
                        let yest = new Date(today); yest.setDate(yest.getDate() - 1);
                        textStr = formatDt(yest);
                    }
                    else if (val === '7-hari') {
                        let past = new Date(today); past.setDate(past.getDate() - 6);
                        textStr = `${formatDt(past)} - ${formatDt(today)}`;
                    }
                    else if (val === '30-hari') {
                        let past = new Date(today); past.setDate(past.getDate() - 29);
                        textStr = `${formatDt(past)} - ${formatDt(today)}`;
                    }
                    else if (val === 'bulan-ini') {
                        let past = new Date(today.getFullYear(), today.getMonth(), 1);
                        textStr = `${formatDt(past)} - ${formatDt(today)}`;
                    }
                    else if (val === 'semua') {
                        textStr = 'Semua Periode';
                    }
                    else if (val.startsWith('CUSTOM_MONTH_')) {
                        const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        let mIdx = window.selectedMonthIndex !== undefined ? window.selectedMonthIndex : today.getMonth();
                        let yr = window.currentMonthPickerYear || today.getFullYear();
                        let matchM = val.match(/CUSTOM_MONTH_(\d{4})-(\d{2})/);
                        if (matchM) {
                            yr = parseInt(matchM[1], 10);
                            mIdx = parseInt(matchM[2], 10) - 1;
                        }
                        textStr = `${mNames[mIdx]} ${yr}`;
                    }
                    else if (val === 'CUSTOM_DATE_RANGE') {
                        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        let endStr = '';
                        if (window.calEndDay !== null && (window.calEndDay !== window.calStartDay || window.calEndMonth !== window.calStartMonth || window.calEndYear !== window.calStartYear)) {
                            endStr = ` - ${pad(window.calEndDay)} ${mNames[window.calEndMonth]} ${window.calEndYear}`;
                        }
                        textStr = `${pad(window.calStartDay)} ${mNames[window.calStartMonth]} ${window.calStartYear}${endStr}`;
                    }
                    
                    if (ringkasanDateText) {
                        ringkasanDateText.innerText = textStr;
                        ringkasanDateText.style.display = 'block';
                    }
                    
                    if (typeof window.initFinanceChart === 'function') window.initFinanceChart(val);
                    if (typeof initOmzetChart === 'function') initOmzetChart(val);
                }
            };

            // Hack for date picker & month picker return values
            // When date picker completes, we need a way to detect it. 
            // Existing code listens to 'change' event on the <select>.
            // Let's create a hidden select just for compatibility with existing picker logic if needed.
            let hiddenSelect = document.getElementById('ringkasan-date-filter');
            if(!hiddenSelect) {
                hiddenSelect = document.createElement('select');
                hiddenSelect.id = 'ringkasan-date-filter';
                hiddenSelect.style.display = 'none';
                document.body.appendChild(hiddenSelect);
                hiddenSelect.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if(val.startsWith('CUSTOM_')) {
                        prosesFilterKeuangan(val);
                    }
                });
            }

            if (btnRingkasanFilter && modalDateFilter) {
                btnRingkasanFilter.addEventListener('click', () => {
                    if (modalDateFilter.style.display === 'none') {
                        modalDateFilter.style.display = 'block';
                    } else {
                        modalDateFilter.style.display = 'none';
                    }
                });
                
                filterOpts.forEach(opt => {
                    opt.addEventListener('click', () => {
                        const val = opt.getAttribute('data-val');
                        const label = opt.innerText;
                        
                        // Update active state UI
                        filterOpts.forEach(o => {
                            o.style.background = '#fff';
                            o.style.color = '#334155';
                            o.style.borderColor = '#cbd5e1';
                            o.classList.remove('active');
                        });
                        opt.style.background = '#e0f2fe';
                        opt.style.color = '#0ea5e9';
                        opt.style.borderColor = '#bae6fd';
                        opt.classList.add('active');
                        
                        textRingkasanFilter.innerText = label;
                        modalDateFilter.style.display = 'none';
                        
                        prosesFilterKeuangan(val);
                    });
                });
            }

            // Chart initialization is handled at the end of the script to prevent TDZ errors

            // --- MODAL PILIH BULAN (KEUANGAN) ---
            const btnPilihPeriode = document.getElementById('btn-pilih-periode');
            const textPeriode = document.getElementById('text-periode');
            const modalPilihBulan = document.getElementById('modal-pilih-bulan');
            const monthListContainer = document.getElementById('month-list-container');

            if (btnPilihPeriode && modalPilihBulan && monthListContainer) {
                const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                let currentYear = new Date().getFullYear();

                // Init months
                monthListContainer.innerHTML = '';
                months.forEach((m, idx) => {
                    const div = document.createElement('div');
                    div.className = 'month-item';
                    if (idx === new Date().getMonth()) div.classList.add('selected');
                    div.textContent = m + " " + currentYear;
                    div.addEventListener('click', () => {
                        document.querySelectorAll('.month-item').forEach(i => i.classList.remove('selected'));
                        div.classList.add('selected');
                        if (textPeriode) textPeriode.textContent = div.textContent;
                        modalPilihBulan.style.display = 'none';
                        window.currentMonthPickerYear = currentYear;
                        window.selectedMonthIndex = idx;
                        prosesFilterKeuangan(`CUSTOM_MONTH_${currentYear}-${String(idx + 1).padStart(2, '0')}`);
                    });
                    monthListContainer.appendChild(div);
                });

                btnPilihPeriode.addEventListener('click', () => {
                    modalPilihBulan.style.display = 'flex';
                });

                modalPilihBulan.addEventListener('click', (e) => {
                    if (e.target === modalPilihBulan) {
                        modalPilihBulan.style.display = 'none';
                    }
                });
            }

            // --- FORM TAMBAH PELANGGAN LOGIC ---
            const btnSimpanPelanggan = document.getElementById('btn-simpan-pelanggan');
            const inputNama = document.getElementById('tp-input-nama');
            const inputTelepon = document.getElementById('tp-input-telepon');
            const cbTanpaTelepon = document.getElementById('tanpa-telepon');
            const inputEmail = document.getElementById('tp-input-email');
            const inputAlamat = document.getElementById('tp-input-alamat');

            if (btnSimpanPelanggan) {
                btnSimpanPelanggan.addEventListener('click', () => {
                    const nama = inputNama ? inputNama.value.trim() : '';
                    const tanpaTelepon = cbTanpaTelepon ? cbTanpaTelepon.checked : false;
                    const telepon = inputTelepon ? inputTelepon.value.trim() : '';

                    if (!nama) {
                        if (window.Swal) Swal.fire('Oops...', 'Nama pelanggan tidak boleh kosong!', 'error');
                        else alert('Nama pelanggan tidak boleh kosong!');
                        return;
                    }

                    if (!tanpaTelepon && !telepon) {
                        if (window.Swal) Swal.fire('Oops...', 'Nomor telepon harus diisi, atau centang "Tanpa nomor telepon"!', 'error');
                        else alert('Nomor telepon harus diisi, atau centang "Tanpa nomor telepon"!');
                        return;
                    }

                    let oldName = null;
                    if (window.editingCustomerIndex !== undefined && window.editingCustomerIndex !== null) {
                        oldName = globalCustomers[window.editingCustomerIndex].nama;
                        globalCustomers[window.editingCustomerIndex].nama = nama;
                        globalCustomers[window.editingCustomerIndex].telepon = telepon;
                        globalCustomers[window.editingCustomerIndex].hp = telepon;
                        globalCustomers[window.editingCustomerIndex].alamat = inputAlamat ? inputAlamat.value.trim() : '';
                        globalCustomers[window.editingCustomerIndex].email = inputEmail ? inputEmail.value.trim() : '';

                        // Update history with new name
                        if (oldName && oldName !== nama) {
                            orderHistory.forEach(order => {
                                if (order.customerName === oldName) order.customerName = nama;
                                // Also check for "(08...)" format in order names if used
                                if (order.customerName.startsWith(oldName + ' (')) {
                                    order.customerName = order.customerName.replace(oldName, nama);
                                }
                            });
                            localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));
                            if (typeof renderDashboardPesanan === 'function') renderDashboardPesanan();
                        }
                    } else {
                        const newCust = {
                            id: 'CUST-' + Date.now(),
                            nama: nama,
                            telepon: telepon,
                            hp: telepon,
                            alamat: inputAlamat ? inputAlamat.value.trim() : '',
                            email: inputEmail ? inputEmail.value.trim() : '',
                            create_date: new Date().toISOString()
                        };
                        globalCustomers.push(newCust);
                    }

                    localStorage.setItem('db_pelanggan', JSON.stringify(globalCustomers));
                    window.editingCustomerIndex = null;

                    const title = document.querySelector('.tp-title');
                    if (title) title.innerText = 'Tambah Pelanggan';

                    // Perbarui UI kasir & Kelola Pelanggan
                    if (typeof renderCustomerSelect === 'function') renderCustomerSelect();
                    if (typeof renderCariPelanggan === 'function') renderCariPelanggan();
                    if (typeof window.renderKelolaPelanggan === 'function') window.renderKelolaPelanggan();

                    if (window.Swal) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: `Pelanggan atas nama ${nama} berhasil ditambahkan.`,
                            showConfirmButton: false,
                            timer: 2000
                        }).then(() => {
                            resetAndCloseForm();
                        });
                    } else {
                        alert(`Pelanggan atas nama ${nama} berhasil ditambahkan.`);
                        resetAndCloseForm();
                    }
                });
            }

            function resetAndCloseForm() {
                // Clear inputs
                if (inputNama) inputNama.value = '';
                if (inputTelepon) inputTelepon.value = '';
                if (cbTanpaTelepon) cbTanpaTelepon.checked = false;
                if (inputEmail) inputEmail.value = '';
                if (inputAlamat) inputAlamat.value = '';

                // Check radio buttons and clear them
                const radios = document.querySelectorAll('input[name="kelamin"]');
                radios.forEach(r => r.checked = false);

                // Click the back button to return to main layout
                if (btnBackTp) btnBackTp.click();
            }


            // --- DYNAMIC CHART DATA GENERATOR ---
            function generateLast7DaysData(filterVal = 'bulan-ini') {
                let pemasukan = [];
                if (typeof window.getMergedPemasukan === 'function') {
                    pemasukan = window.getMergedPemasukan();
                } else if (typeof window.getDB === 'function') {
                    pemasukan = window.getDB('db_pemasukan');
                } else {
                    let m = new Map();
                    if (window.RECOVERED_PEMASUKAN && Array.isArray(window.RECOVERED_PEMASUKAN)) {
                        window.RECOVERED_PEMASUKAN.forEach(x => { if (x && x.id) m.set(x.id, x); });
                    }
                    try {
                        let loc = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                        loc.forEach(x => { if (x && x.id) m.set(x.id, x); });
                    } catch(e) {}
                    pemasukan = Array.from(m.values());
                }
                if ((!pemasukan || pemasukan.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pemasukan)) {
                    pemasukan = window.globalApiData.pemasukan;
                }

                let pengeluaran = [];
                if (typeof window.getMergedPengeluaran === 'function') {
                    pengeluaran = window.getMergedPengeluaran();
                } else if (typeof window.getDB === 'function') {
                    pengeluaran = window.getDB('db_pengeluaran');
                } else {
                    pengeluaran = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                }
                if ((!pengeluaran || pengeluaran.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pengeluaran)) {
                    pengeluaran = window.globalApiData.pengeluaran;
                }

                const labels = [];
                const dataPemasukan = [];
                const dataPendapatan = [];
                const dataPengeluaran = [];

                let globalOmzet = 0;
                let globalPendapatan = 0;
                let globalPengeluaran = 0;
                let globalPiutang = 0;
                let countTransaksi = 0;
                let rpTopupPaket = 0, countTopupPaket = 0;
                let rpTopupDeposit = 0, countTopupDeposit = 0;
                let rpJualProduk = 0, countJualProduk = 0;
                let rpSelfService = 0, countSelfService = 0;
                let rpPendapatanLain = 0;
                let rpKasbon = 0;
                let rpPembulatan = 0;
                let countBatal = 0;
                let volKiloan = 0, volSatuan = 0, volMeter = 0;

                const today = new Date();
                today.setHours(23, 59, 59, 999);

                // Auto-fallback: If default '7-hari' has no transactions in last 7 days, but database has transactions, show 'semua' so user sees actual financial figures immediately
                if (filterVal === '7-hari' && pemasukan.length > 0) {
                    let hasRecent = pemasukan.some(t => {
                        let td = window.parseDateString ? window.parseDateString(t.date, t.id) : new Date(t.date);
                        if (!td || isNaN(td.getTime())) return false;
                        let diffDays = (today.getTime() - td.getTime()) / (1000 * 3600 * 24);
                        return diffDays >= 0 && diffDays <= 7;
                    });
                    if (!hasRecent) {
                        filterVal = 'semua';
                        const textRingkasanFilter = document.getElementById('text-ringkasan-filter');
                        if (textRingkasanFilter) textRingkasanFilter.innerText = 'Semua';
                        const filterOpts = document.querySelectorAll('.filter-opt');
                        filterOpts.forEach(o => {
                            if (o.getAttribute('data-val') === 'semua') {
                                o.classList.add('active');
                                o.style.background = '#e0f2fe';
                                o.style.color = '#0ea5e9';
                                o.style.borderColor = '#bae6fd';
                            } else {
                                o.classList.remove('active');
                                o.style.background = '#fff';
                                o.style.color = '#334155';
                                o.style.borderColor = '#cbd5e1';
                            }
                        });
                    }
                }
                
                let dateList = [];
                if (filterVal === 'hari-ini') { dateList.push(new Date(today)); }
                else if (filterVal === 'kemarin') { let d = new Date(today); d.setDate(today.getDate()-1); dateList.push(d); }
                else if (filterVal === '7-hari') { for(let i=6; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal === '30-hari') { for(let i=29; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal === 'bulan-ini') { for(let i=today.getDate()-1; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal.startsWith('CUSTOM_MONTH_')) {
                    let yearToUse = window.currentMonthPickerYear || today.getFullYear();
                    let monthToUse = window.selectedMonthIndex !== undefined ? window.selectedMonthIndex : today.getMonth();
                    let matchM = filterVal.match(/CUSTOM_MONTH_(\d{4})-(\d{2})/);
                    if (matchM) {
                        yearToUse = parseInt(matchM[1], 10);
                        monthToUse = parseInt(matchM[2], 10) - 1;
                    }
                    let daysInM = new Date(yearToUse, monthToUse + 1, 0).getDate();
                    for(let i=1; i<=daysInM; i++) { dateList.push(new Date(yearToUse, monthToUse, i)); }
                }
                else if (filterVal === 'CUSTOM_DATE_RANGE') {
                    let sd = new Date(window.calStartYear, window.calStartMonth, window.calStartDay);
                    let ed = window.calEndDay !== null ? new Date(window.calEndYear, window.calEndMonth, window.calEndDay) : new Date(window.calStartYear, window.calStartMonth, window.calStartDay);
                    if (sd > ed) { let temp = sd; sd = ed; ed = temp; }
                    let currD = new Date(sd);
                    while(currD <= ed) { dateList.push(new Date(currD)); currD.setDate(currD.getDate() + 1); }
                }
                else if (filterVal === 'semua') {
                    let uniqueDateMap = new Map();
                    [...pemasukan, ...pengeluaran].forEach(t => {
                        let dt = window.parseDateString ? window.parseDateString(t.date, t.id) : new Date(t.date);
                        if (dt && !isNaN(dt.getTime())) {
                            let key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
                            if (!uniqueDateMap.has(key)) {
                                uniqueDateMap.set(key, new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
                            }
                        }
                    });
                    dateList = Array.from(uniqueDateMap.values()).sort((a, b) => a - b);
                    if (dateList.length === 0) {
                        for(let i=6; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); }
                    }
                }
                else { dateList.push(new Date(today)); } // default fallback
                
                window.lastGeneratedDateList = dateList;
                
                dateList.forEach(d => {
                    let dayStr = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0');
                    labels.push(dayStr);

                    let pSum = 0;
                    let dSum = 0;

                    // 1. TOTAL OMZET: Semua pesanan/transaksi yang masuk pada hari ini (d)
                    pemasukan.forEach(trx => {
                        let trxDate = null;
                        if (window.parseDateString) trxDate = window.parseDateString(trx.date, trx.id, trx.estDate);
                        else if (trx.date) trxDate = new Date(trx.date);

                        if (trxDate && trxDate.getDate() === d.getDate() && trxDate.getMonth() === d.getMonth() && trxDate.getFullYear() === d.getFullYear()) {
                            if (trx.status === 'batal' || trx.status === 'Batal') {
                                countBatal++;
                            } else {
                                let total = parseFloat(trx.total || trx.nominal || 0);
                                let dibayar = trx.dibayar !== undefined && trx.dibayar !== null && trx.dibayar !== '' ? parseFloat(trx.dibayar) : 0;
                                if (isNaN(dibayar)) dibayar = 0;
                                
                                if (!trx.type) {
                                    pSum += total;
                                    globalOmzet += total;
                                    countTransaksi++;
                                    
                                    let piutang = total - dibayar;
                                    if (piutang > 0) globalPiutang += piutang;
                                    
                                    // Parse volume cucian
                                    if(trx.layanan && trx.layanan.toLowerCase().includes('satuan')) {
                                        volSatuan += parseFloat(trx.qty || 1);
                                    } else if(trx.layanan && trx.layanan.toLowerCase().includes('meter')) {
                                        volMeter += parseFloat(trx.qty || 0);
                                    } else {
                                        volKiloan += parseFloat(trx.qty || 0);
                                    }
                                } else {
                                    pSum += total;
                                    globalOmzet += total;
                                }
                            }
                        }
                    });

                    // 2. PENDAPATAN TRANSAKSI: Semua penerimaan dana uang masuk pada hari ini (d)
                    // Baik dari nota hari itu langsung dibayarkan, maupun nota lama (minggu lalu/bulan lalu) yang baru dilunasi
                    pemasukan.forEach(trx => {
                        if (trx.status === 'batal' || trx.status === 'Batal') return;

                        let phList = trx.paymentHistory;
                        if (typeof phList === 'string') {
                            try { phList = JSON.parse(phList); } catch(e) { phList = []; }
                        }

                        if (phList && Array.isArray(phList) && phList.length > 0) {
                            phList.forEach(ph => {
                                let phDate = window.parseDateString ? window.parseDateString(ph.date) : new Date(ph.date);
                                if (phDate && phDate.getDate() === d.getDate() && phDate.getMonth() === d.getMonth() && phDate.getFullYear() === d.getFullYear()) {
                                    let amt = parseFloat(ph.amount || 0);
                                    if (!isNaN(amt) && amt > 0) {
                                        dSum += amt;
                                        globalPendapatan += amt;

                                        if (trx.type) {
                                            let typeLower = trx.type.toLowerCase();
                                            if (typeLower.includes('paket')) { rpTopupPaket += amt; countTopupPaket++; }
                                            else if (typeLower.includes('deposit')) { rpTopupDeposit += amt; countTopupDeposit++; }
                                            else if (typeLower.includes('produk') || typeLower.includes('barang')) { rpJualProduk += amt; countJualProduk++; }
                                            else if (typeLower.includes('self')) { rpSelfService += amt; countSelfService++; }
                                            else { rpPendapatanLain += amt; }
                                        }
                                    }
                                }
                            });
                        } else {
                            let dibayar = trx.dibayar !== undefined && trx.dibayar !== null && trx.dibayar !== '' ? parseFloat(trx.dibayar) : 0;
                            if (!isNaN(dibayar) && dibayar > 0) {
                                let payDate = window.parseDateString ? window.parseDateString(trx.tanggalBayar || trx.paymentDate || trx.date, trx.id, trx.estDate) : new Date(trx.date);
                                if (payDate && payDate.getDate() === d.getDate() && payDate.getMonth() === d.getMonth() && payDate.getFullYear() === d.getFullYear()) {
                                    dSum += dibayar;
                                    globalPendapatan += dibayar;

                                    if (trx.type) {
                                        let typeLower = trx.type.toLowerCase();
                                        if (typeLower.includes('paket')) { rpTopupPaket += dibayar; countTopupPaket++; }
                                        else if (typeLower.includes('deposit')) { rpTopupDeposit += dibayar; countTopupDeposit++; }
                                        else if (typeLower.includes('produk') || typeLower.includes('barang')) { rpJualProduk += dibayar; countJualProduk++; }
                                        else if (typeLower.includes('self')) { rpSelfService += dibayar; countSelfService++; }
                                        else { rpPendapatanLain += dibayar; }
                                    }
                                }
                            }
                        }
                    });

                    dataPemasukan.push(pSum);
                    dataPendapatan.push(dSum);

                    let eSum = 0;
                    pengeluaran.forEach(trx => {
                        let trxDate = null;
                        if (window.parseDateString) trxDate = window.parseDateString(trx.date || trx.tanggal, trx.id);
                        else if (trx.date || trx.tanggal) trxDate = new Date(trx.date || trx.tanggal);
                        
                        if (trxDate && trxDate.getDate() === d.getDate() && trxDate.getMonth() === d.getMonth() && trxDate.getFullYear() === d.getFullYear()) {
                            let amount = parseFloat(trx.amount || trx.nominal || 0);
                            eSum += amount;
                            globalPengeluaran += amount;
                            
                            if (trx.kategori && trx.kategori.toLowerCase().includes('kasbon')) {
                                rpKasbon += amount;
                            }
                        }
                    });
                    dataPengeluaran.push(eSum);
                });

                let globalLabaRugi = globalPendapatan - globalPengeluaran;

                // Update UI Stats with real data
                const topPendapatan = document.getElementById('top-pendapatan');
                const topOmzet = document.getElementById('top-omzet');
                if (topPendapatan) topPendapatan.innerHTML = `<sup>Rp</sup> ${globalPendapatan.toLocaleString('en-US')}`;
                if (topOmzet) topOmzet.innerHTML = `<sup>Rp</sup> ${globalOmzet.toLocaleString('en-US')}`;

                const summaryOmzet = document.getElementById('summary-omzet');
                const summaryPendapatan = document.getElementById('summary-pendapatan');
                const summaryPengeluaran = document.getElementById('summary-pengeluaran');
                const summaryLabaRugi = document.getElementById('summary-labarugi');
                const summaryPiutang = document.getElementById('summary-piutang');
                const statTrxMasuk = document.getElementById('stat-trxmasuk');
                
                if (summaryOmzet) summaryOmzet.innerText = globalOmzet.toLocaleString('en-US');
                if (summaryPendapatan) summaryPendapatan.innerText = globalPendapatan.toLocaleString('en-US');
                if (summaryPengeluaran) summaryPengeluaran.innerText = globalPengeluaran.toLocaleString('en-US');
                if (summaryLabaRugi) summaryLabaRugi.innerText = globalLabaRugi.toLocaleString('en-US');
                if (summaryPiutang) summaryPiutang.innerText = globalPiutang.toLocaleString('en-US');
                if (statTrxMasuk) statTrxMasuk.innerText = countTransaksi + ' Transaksi';
                
                // Extra detailed elements update
                const els = {
                    'summary-topup-paket': rpTopupPaket,
                    'summary-topup-deposit': rpTopupDeposit,
                    'summary-jual-produk': rpJualProduk,
                    'summary-self-service': rpSelfService,
                    'summary-pendapatan-lain': rpPendapatanLain,
                    'summary-kasbon': rpKasbon,
                    'summary-pembulatan': rpPembulatan
                };
                for(let id in els) {
                    if (document.getElementById(id)) document.getElementById(id).innerText = els[id].toLocaleString('en-US');
                }
                
                const statEls = {
                    'stat-trx-topup-paket': countTopupPaket,
                    'stat-trx-topup-deposit': countTopupDeposit,
                    'stat-trx-jual-produk': countJualProduk,
                    'stat-trx-beli-produk': 0,
                    'stat-trx-self-service': countSelfService,
                    'stat-trx-batal': countBatal
                };
                for(let id in statEls) {
                    if (document.getElementById(id)) document.getElementById(id).innerText = statEls[id] + ' Transaksi';
                }
                
                if(document.getElementById('vol-kiloan')) document.getElementById('vol-kiloan').innerText = volKiloan.toFixed(1) + ' Kg';
                if(document.getElementById('vol-satuan')) document.getElementById('vol-satuan').innerText = volSatuan + ' Satuan';
                if(document.getElementById('vol-meter')) document.getElementById('vol-meter').innerText = volMeter.toFixed(1) + ' m²';

                return { labels, dataPemasukan, dataPendapatan, dataPengeluaran };
            }

            // --- FUNGSI DETAIL RINGKASAN ---
            window.bukaDetailRingkasan = function(tipe) {
                const layoutMain = document.getElementById('layout-main');
                const layoutDetail = document.getElementById('layout-detail-ringkasan');
                const title = document.getElementById('detail-ringkasan-title');
                const list = document.getElementById('detail-ringkasan-list');
                const empty = document.getElementById('detail-ringkasan-empty');
                
                if (!layoutMain || !layoutDetail) return;
                
                const titles = {
                    'omzet': 'Detail Total Omzet',
                    'pendapatan': 'Detail Pendapatan Transaksi',
                    'pengeluaran': 'Detail Pengeluaran',
                    'labarugi': 'Detail Laba Rugi',
                    'piutang': 'Detail Piutang'
                };
                if (title) title.innerText = titles[tipe] || 'Detail Data';
                
                let pemasukan = [];
                if (typeof window.getMergedPemasukan === 'function') {
                    pemasukan = window.getMergedPemasukan();
                } else if (typeof window.getDB === 'function') {
                    pemasukan = window.getDB('db_pemasukan');
                } else {
                    let m = new Map();
                    if (window.RECOVERED_PEMASUKAN && Array.isArray(window.RECOVERED_PEMASUKAN)) {
                        window.RECOVERED_PEMASUKAN.forEach(x => { if (x && x.id) m.set(x.id, x); });
                    }
                    try {
                        let loc = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                        loc.forEach(x => { if (x && x.id) m.set(x.id, x); });
                    } catch(e) {}
                    pemasukan = Array.from(m.values());
                }
                if ((!pemasukan || pemasukan.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pemasukan)) {
                    pemasukan = window.globalApiData.pemasukan;
                }

                let pengeluaran = [];
                if (typeof window.getMergedPengeluaran === 'function') {
                    pengeluaran = window.getMergedPengeluaran();
                } else if (typeof window.getDB === 'function') {
                    pengeluaran = window.getDB('db_pengeluaran');
                } else {
                    pengeluaran = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                }
                if ((!pengeluaran || pengeluaran.length === 0) && window.globalApiData && Array.isArray(window.globalApiData.pengeluaran)) {
                    pengeluaran = window.globalApiData.pengeluaran;
                }

                let displayData = [];
                
                function isDateMatch(dateStr, trxId, estDateStr) {
                    if (!window.lastGeneratedDateList || window.lastGeneratedDateList.length === 0) return true;
                    let d = window.parseDateString ? window.parseDateString(dateStr, trxId, estDateStr) : new Date(dateStr);
                    if (!d || isNaN(d.getTime())) return false;
                    for (let matchD of window.lastGeneratedDateList) {
                        if (d.getDate() === matchD.getDate() && d.getMonth() === matchD.getMonth() && d.getFullYear() === matchD.getFullYear()) {
                            return true;
                        }
                    }
                    return false;
                }

                if (tipe === 'omzet') {
                    pemasukan.forEach(trx => {
                        if (isDateMatch(trx.date, trx.id, trx.estDate) && trx.status !== 'batal' && trx.status !== 'Batal') {
                            displayData.push({ date: trx.date, desc: trx.customerName || trx.keterangan || 'Pelanggan', nominal: trx.total || trx.nominal || 0, isOut: false, id: trx.id });
                        }
                    });
                } else if (tipe === 'pendapatan') {
                    pemasukan.forEach(trx => {
                        if (trx.status === 'batal' || trx.status === 'Batal') return;

                        let phList = trx.paymentHistory;
                        if (typeof phList === 'string') {
                            try { phList = JSON.parse(phList); } catch(e) { phList = []; }
                        }

                        if (phList && Array.isArray(phList) && phList.length > 0) {
                            phList.forEach(ph => {
                                if (isDateMatch(ph.date)) {
                                    let amt = parseFloat(ph.amount || 0);
                                    if (!isNaN(amt) && amt > 0) {
                                        displayData.push({
                                            date: ph.date,
                                            desc: (trx.customerName || 'Pelanggan') + ' - Nota ' + (trx.id || '-'),
                                            nominal: amt,
                                            isOut: false,
                                            id: trx.id,
                                            paymentDate: ph.date,
                                            paymentMethod: ph.method || 'Tunai'
                                        });
                                    }
                                }
                            });
                        } else {
                            let dibayar = parseFloat(trx.dibayar || 0);
                            if (dibayar > 0) {
                                let tglBayar = trx.tanggalBayar || trx.paymentDate || trx.date;
                                if (isDateMatch(tglBayar, trx.id, trx.estDate)) {
                                    let metodeBayar = trx.metodeBayar || trx.cashbox || 'Tunai';
                                    displayData.push({
                                        date: tglBayar,
                                        desc: (trx.customerName || 'Pelanggan') + ' - Nota ' + (trx.id || '-'),
                                        nominal: dibayar,
                                        isOut: false,
                                        id: trx.id,
                                        paymentDate: tglBayar,
                                        paymentMethod: metodeBayar
                                    });
                                }
                            }
                        }
                    });
                } else if (tipe === 'piutang') {
                    pemasukan.forEach(trx => {
                        if (isDateMatch(trx.date, trx.id, trx.estDate) && trx.status !== 'batal' && trx.status !== 'Batal' && !trx.type) {
                            let total = parseFloat(trx.total || trx.nominal || 0);
                            let dibayar = trx.dibayar !== undefined && trx.dibayar !== null && trx.dibayar !== '' ? parseFloat(trx.dibayar) : 0;
                            if (isNaN(dibayar)) dibayar = 0;
                            let piutang = total - dibayar;
                            if (piutang > 0) {
                                displayData.push({ date: trx.date, desc: trx.customerName || 'Pelanggan', nominal: piutang, isOut: false, id: trx.id });
                            }
                        }
                    });
                } else if (tipe === 'pengeluaran') {
                    pengeluaran.forEach(trx => {
                        if (isDateMatch(trx.date || trx.tanggal, trx.id)) {
                            displayData.push({ date: trx.date || trx.tanggal, desc: trx.kategori || trx.category || trx.keterangan || 'Pengeluaran Operasional', nominal: trx.amount || trx.nominal || 0, isOut: true, id: trx.id });
                        }
                    });
                } else if (tipe === 'labarugi') {
                    // Masukkan seluruh penerimaan uang
                    pemasukan.forEach(trx => {
                        if (trx.status === 'batal' || trx.status === 'Batal') return;

                        let phList = trx.paymentHistory;
                        if (typeof phList === 'string') {
                            try { phList = JSON.parse(phList); } catch(e) { phList = []; }
                        }

                        if (phList && Array.isArray(phList) && phList.length > 0) {
                            phList.forEach(ph => {
                                if (isDateMatch(ph.date)) {
                                    let amt = parseFloat(ph.amount || 0);
                                    if (!isNaN(amt) && amt > 0) {
                                        displayData.push({ date: ph.date, desc: (trx.customerName || 'Pelanggan') + ' - Nota ' + (trx.id || '-'), nominal: amt, isOut: false, id: trx.id });
                                    }
                                }
                            });
                        } else {
                            let dibayar = parseFloat(trx.dibayar || 0);
                            if (dibayar > 0) {
                                let tglBayar = trx.tanggalBayar || trx.paymentDate || trx.date;
                                if (isDateMatch(tglBayar, trx.id, trx.estDate)) {
                                    displayData.push({ date: tglBayar, desc: (trx.customerName || 'Pelanggan') + ' - Nota ' + (trx.id || '-'), nominal: dibayar, isOut: false, id: trx.id });
                                }
                            }
                        }
                    });
                    pengeluaran.forEach(trx => {
                        if (isDateMatch(trx.date || trx.tanggal, trx.id)) {
                            displayData.push({ date: trx.date || trx.tanggal, desc: trx.kategori || trx.category || trx.keterangan || 'Pengeluaran Operasional', nominal: trx.amount || trx.nominal || 0, isOut: true, id: trx.id });
                        }
                    });
                }
                
                // Sort by date descending
                displayData.sort((a, b) => {
                    let dA = window.parseDateString ? window.parseDateString(a.date, a.paymentDate ? null : a.id) : new Date(a.date);
                    let dB = window.parseDateString ? window.parseDateString(b.date, b.paymentDate ? null : b.id) : new Date(b.date);
                    return dB - dA;
                });
                
                window.currentDetailData = displayData;
                window.currentDetailTipe = titles[tipe] || 'Detail_Data';
                
                list.innerHTML = '';
                if (displayData.length === 0) {
                    list.style.display = 'none';
                    if (empty) empty.style.display = 'block';
                } else {
                    if (empty) empty.style.display = 'none';
                    list.style.display = 'block';
                    
                    // GROUP DATA BY DATE
                    let grouped = {};
                    displayData.forEach(item => {
                        let d = window.parseDateString ? window.parseDateString(item.date, item.paymentDate ? null : item.id) : new Date(item.date);
                        let valid = d && !isNaN(d);
                        let dateStr = valid ? d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : (item.date ? item.date.substring(0, 10) : '-');
                        if (!grouped[dateStr]) grouped[dateStr] = { items: [], total: 0 };
                        grouped[dateStr].items.push(item);
                        grouped[dateStr].total += parseFloat(item.nominal || 0);
                    });

                    let html = `
                        <div style="display:flex; gap:10px; margin-bottom:15px; justify-content: flex-end;">
                            <button id="btn-detail-expand-all" style="background:#e0f2fe; border:none; padding:6px 12px; border-radius:6px; font-size:0.75rem; color:#0369a1; cursor:pointer; font-weight:600; transition:all 0.2s;"><i class="fa-solid fa-angle-down"></i> Buka Semua</button>
                            <button id="btn-detail-collapse-all" style="background:#f1f5f9; border:none; padding:6px 12px; border-radius:6px; font-size:0.75rem; color:#475569; cursor:pointer; font-weight:600; transition:all 0.2s;"><i class="fa-solid fa-angle-up"></i> Tutup Semua</button>
                        </div>
                        <div id="detail-accordion-container" style="display:flex; flex-direction:column; gap:10px;">
                    `;

                    Object.keys(grouped).forEach(dateStr => {
                        let group = grouped[dateStr];
                        html += `
                            <div class="accordion-item" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                                <div class="accordion-header" style="padding:15px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#f8fafc; border-bottom:1px solid #e2e8f0;" onclick="this.parentElement.classList.toggle('active')">
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="background:#e0f2fe; color:#0ea5e9; width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1rem;">
                                            <i class="fa-solid fa-calendar-day"></i>
                                        </div>
                                        <div>
                                            <div style="font-size:0.95rem; font-weight:700; color:#0f172a;">${dateStr}</div>
                                            <div style="font-size:0.75rem; color:#64748b;">${group.items.length} Transaksi</div>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:15px;">
                                        <div style="font-weight:700; color:${tipe === 'pengeluaran' ? '#ef4444' : '#10b981'};">Rp ${group.total.toLocaleString('id-ID')}</div>
                                        <i class="fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 acc-arrow"></i>
                                    </div>
                                </div>
                                <div class="accordion-content" style="padding: 0; background:#ffffff;">
                                    <div style="overflow-x:auto;">
                                        <table style="width:100%; border-collapse:collapse; min-width:500px;">
                                            <thead>
                                                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                                                    <th style="padding:12px 15px; text-align:left; font-size:0.8rem; color:#475569; font-weight:600;">No. Nota</th>
                                                    <th style="padding:12px 15px; text-align:left; font-size:0.8rem; color:#475569; font-weight:600;">Nama</th>
                                                    ${tipe === 'pendapatan' ? `<th style="padding:12px 15px; text-align:left; font-size:0.8rem; color:#475569; font-weight:600;">Tgl. Pembayaran</th><th style="padding:12px 15px; text-align:left; font-size:0.8rem; color:#475569; font-weight:600;">Metode</th>` : ''}
                                                    <th style="padding:12px 15px; text-align:right; font-size:0.8rem; color:#475569; font-weight:600;">Nominal (Rp)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                        `;

                        group.items.forEach(item => {
                            let textColor = item.isOut ? '#ef4444' : '#10b981';
                            let nominalText = parseFloat(item.nominal).toLocaleString('id-ID');
                            
                            let extraCols = '';
                            if (tipe === 'pendapatan') {
                                let pd = window.parseDateString ? window.parseDateString(item.paymentDate) : new Date(item.paymentDate);
                                let pdStr = (pd && !isNaN(pd)) ? pd.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : (item.paymentDate ? item.paymentDate.substring(0,10) : '-');
                                let meth = item.paymentMethod || '-';
                                let methColor = meth.toLowerCase().includes('qris') ? '#ef4444' : (meth.toLowerCase().includes('tunai') ? '#8b5cf6' : '#3b82f6');
                                extraCols = `<td style="padding:12px 15px; font-size:0.85rem; color:#64748b;">${pdStr}</td><td style="padding:12px 15px; font-size:0.85rem; color:${methColor}; font-weight:600;">${meth}</td>`;
                            }

                            html += `
                                <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                    <td style="padding:12px 15px; font-size:0.85rem; color:#64748b;">${item.id || '-'}</td>
                                    <td style="padding:12px 15px; font-size:0.85rem; color:#64748b;">${item.desc || '-'}</td>
                                    ${extraCols}
                                    <td style="padding:12px 15px; font-size:0.95rem; font-weight:700; color:${textColor}; text-align:right;">${nominalText}</td>
                                </tr>
                            `;
                        });

                        html += `
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    html += `</div>`;
                    list.innerHTML = html;

                    // Dynamic Style for this accordion
                    if (!document.getElementById('detail-accordion-style')) {
                        const style = document.createElement('style');
                        style.id = 'detail-accordion-style';
                        style.innerHTML = `
                            #detail-accordion-container .accordion-item .accordion-content { display: none !important; }
                            #detail-accordion-container .accordion-item.active .accordion-content { display: block !important; }
                            #detail-accordion-container .accordion-item .acc-arrow { transform: rotate(0deg); }
                            #detail-accordion-container .accordion-item.active .acc-arrow { transform: rotate(-180deg); }
                        `;
                        document.head.appendChild(style);
                    }

                    // Attach Expand/Collapse All
                    const btnExpandAll = document.getElementById('btn-detail-expand-all');
                    const btnCollapseAll = document.getElementById('btn-detail-collapse-all');
                    const accItems = list.querySelectorAll('.accordion-item');

                    if (btnExpandAll) {
                        btnExpandAll.addEventListener('click', () => {
                            accItems.forEach(item => item.classList.add('active'));
                        });
                    }
                    if (btnCollapseAll) {
                        btnCollapseAll.addEventListener('click', () => {
                            accItems.forEach(item => item.classList.remove('active'));
                        });
                    }
                }
                
                layoutMain.classList.remove('active');
                setTimeout(() => {
                    layoutMain.style.display = 'none';
                    layoutDetail.style.display = 'block';
                    setTimeout(() => layoutDetail.classList.add('active'), 10);
                }, 300);
            };

            const btnBackDetailRingkasan = document.getElementById('btn-back-detail-ringkasan');
            if (btnBackDetailRingkasan) {
                btnBackDetailRingkasan.addEventListener('click', () => {
                    const layoutMain = document.getElementById('layout-main');
                    const layoutDetail = document.getElementById('layout-detail-ringkasan');
                    layoutDetail.classList.remove('active');
                    setTimeout(() => {
                        layoutDetail.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            // --- KEPEGAWAIAN LOGIC ---

            window.renderKepegawaian = function () {
                const ongoingContainer = document.getElementById('ongoing-pegawai-container');
                const listContainer = document.getElementById('list-pegawai-container');
                const posPegawaiSelect = document.getElementById('pos-pegawai-select');
                
                // Ambil data sebenarnya dari db_users
                const users = JSON.parse(localStorage.getItem('db_users') || '[]');
                const activeRole = localStorage.getItem('activeRole');
                
                // Format agar sesuai dengan struktur yg sudah dibangun sebelumnya
                let dbPegawai = users.map(u => ({
                    id: u.name,
                    nama: u.name,
                    role: u.roleDesc,
                    isAktif: u.name === activeRole
                }));
                
                // Pastikan ada setidaknya 1 pegawai aktif sbg fallback
                if (dbPegawai.length > 0 && !dbPegawai.find(p => p.isAktif)) {
                    dbPegawai[0].isAktif = true;
                }

                if (posPegawaiSelect) {
                    posPegawaiSelect.innerHTML = '<option value="">-- Pilih Pegawai --</option>';
                    dbPegawai.forEach(p => {
                        posPegawaiSelect.innerHTML += `<option value="${p.id}">${p.nama} (${p.role})</option>`;
                    });
                }

                if (!ongoingContainer || !listContainer) return;
                
                const pemasukan = typeof window.getMergedPemasukan === 'function' ? window.getMergedPemasukan() : JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                
                // Kalkulasi Dinamis
                dbPegawai.forEach(p => {
                    let totalKg = 0;
                    let totalSatuan = 0;
                    let komisi = 0;
                    
                    pemasukan.forEach(trx => {
                        if (trx.pegawaiId == p.id && trx.status !== 'batal' && trx.status !== 'Batal') {
                            if (trx.type === 'satuan' || (trx.layanan && trx.layanan.toLowerCase().includes('satuan'))) {
                                totalSatuan += 1;
                                komisi += (parseFloat(trx.total || 0) * 0.1);
                            } else {
                                let berat = 0;
                                if (trx.items && trx.items.length > 0) {
                                    trx.items.forEach(item => {
                                        berat += parseFloat(item.qty || 0);
                                    });
                                } else if (trx.qty) {
                                    berat += parseFloat(trx.qty);
                                }
                                totalKg += berat;
                                komisi += (berat * 3000);
                            }
                        }
                    });
                    
                    p.totalKg = totalKg;
                    p.totalSatuan = totalSatuan;
                    p.komisi = komisi;
                });

                // Find active employee (for ongoing card)
                const aktif = dbPegawai.find(p => p.isAktif) || dbPegawai[0];

                ongoingContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold; color: #ffffff;">
                    ${aktif.nama.charAt(0)}
                </div>
                <div style="color: #ffffff;">
                    <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 3px;">${aktif.nama}</div>
                    <div style="font-size: 0.85rem; opacity: 0.9;">Sedang Bekerja</div>
                </div>
            </div>
            <button onclick="window.bukaKinerjaModal('${aktif.id}')" style="background: #ffffff; color: #0ea5e9; border: none; padding: 8px 15px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="fa-solid fa-chart-line"></i> Kinerja
            </button>
        `;

                const searchInput = document.getElementById('search-pegawai');
                if (activeRole !== 'Admin') {
                    if (searchInput) searchInput.parentElement.style.display = 'none';
                    if (listContainer.previousElementSibling) listContainer.previousElementSibling.style.display = 'none';
                    listContainer.style.display = 'none';
                } else {
                    if (searchInput) searchInput.parentElement.style.display = 'block';
                    if (listContainer.previousElementSibling) listContainer.previousElementSibling.style.display = 'flex';
                    listContainer.style.display = 'flex';
                }

                // List remaining employees
                listContainer.innerHTML = '';
                dbPegawai.forEach(p => {
                    if (p.id === aktif.id) return; // skip the one in ongoing

                    let html = `
                <div style="display: flex; align-items: center; padding: 15px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.02); transition: all 0.2s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.boxShadow='0 1px 2px rgba(0,0,0,0.02)'" onclick="window.bukaKinerjaModal('${p.id}')">
                    <div style="width: 45px; height: 45px; background: #f1f5f9; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; font-weight: bold; color: #64748b; margin-right: 15px;">
                        ${p.nama.charAt(0)}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 2px; color: #1e293b;">${p.nama}</div>
                        <div style="font-size: 0.85rem; color: #64748b; font-weight: 500;">${p.role}</div>
                    </div>
                    <div style="color: #0ea5e9; font-size: 1.1rem;">
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            `;
                    listContainer.insertAdjacentHTML('beforeend', html);
                });
            };

            window.bukaKinerjaModal = function (id) {
                const users = JSON.parse(localStorage.getItem('db_users') || '[]');
                const pBase = users.find(x => x.name === id);
                if (!pBase) return;
                
                // Get performance stats dynamically
                const pemasukan = typeof window.getMergedPemasukan === 'function' ? window.getMergedPemasukan() : JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                let totalKg = 0;
                let totalSatuan = 0;
                let komisi = 0;
                
                pemasukan.forEach(trx => {
                    if (trx.pegawaiId == id && trx.status !== 'batal' && trx.status !== 'Batal') {
                        if (trx.type === 'satuan' || (trx.layanan && trx.layanan.toLowerCase().includes('satuan'))) {
                            totalSatuan += 1;
                            komisi += (parseFloat(trx.total || 0) * 0.1);
                        } else {
                            let berat = 0;
                            if (trx.items && trx.items.length > 0) {
                                trx.items.forEach(item => {
                                    berat += parseFloat(item.qty || 0);
                                });
                            } else if (trx.qty) {
                                berat += parseFloat(trx.qty);
                            }
                            totalKg += berat;
                            komisi += (berat * 3000);
                        }
                    }
                });

                document.getElementById('detail-pegawai-avatar').innerText = pBase.name.charAt(0);
                document.getElementById('detail-pegawai-nama').innerText = pBase.name;
                document.getElementById('detail-pegawai-role').innerText = pBase.roleDesc;

                let strQty = '';
                if (totalKg > 0) strQty += totalKg + ' Kg ';
                if (totalSatuan > 0) strQty += totalSatuan + ' Satuan';
                if (strQty === '') strQty = '0';
                
                document.getElementById('detail-pegawai-qty').innerText = strQty;
                document.getElementById('detail-pegawai-komisi').innerText = 'Rp ' + (komisi || 0).toLocaleString('id-ID');

                // Render detail list
                const list = document.getElementById('detail-pegawai-list');
                const empty = document.getElementById('detail-pegawai-empty');
                
                const trxPegawai = pemasukan.filter(trx => trx.pegawaiId == id && trx.status !== 'batal' && trx.status !== 'Batal');
                
                list.innerHTML = '';
                if (trxPegawai.length === 0) {
                    list.style.display = 'none';
                    if(empty) empty.style.display = 'block';
                } else {
                    if(empty) empty.style.display = 'none';
                    list.style.display = 'block';
                    
                    let tableHTML = `
                    <div style="overflow-x:auto; background:#ffffff; border-radius:8px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <table style="width:100%; border-collapse:collapse; min-width:500px; text-align:left;">
                            <thead>
                                <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
                                    <th style="padding:12px 15px; font-size:0.85rem; color:#475569; font-weight:600;">Tanggal / Nota</th>
                                    <th style="padding:12px 15px; font-size:0.85rem; color:#475569; font-weight:600;">Keterangan</th>
                                    <th style="padding:12px 15px; font-size:0.85rem; color:#475569; font-weight:600; text-align:right;">Estimasi Komisi (Rp)</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    // Sort descending
                    trxPegawai.sort((a,b) => {
                        let dA = window.parseDateString ? window.parseDateString(a.date) : new Date(a.date);
                        let dB = window.parseDateString ? window.parseDateString(b.date) : new Date(b.date);
                        return dB - dA;
                    });
                    
                    trxPegawai.forEach(item => {
                        let dateStr = '-';
                        if (item.date) {
                            let d = window.parseDateString ? window.parseDateString(item.date) : new Date(item.date);
                            if (d && !isNaN(d)) dateStr = d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short'});
                            else dateStr = item.date.substring(0, 10);
                        }
                        
                        let komisi = 0;
                        let ket = 'Kiloan';
                        if (item.type === 'satuan' || (item.layanan && item.layanan.toLowerCase().includes('satuan'))) {
                            komisi = parseFloat(item.total || 0) * 0.1;
                            ket = 'Satuan (10%)';
                        } else {
                            let berat = 0;
                            if (item.items && item.items.length > 0) {
                                item.items.forEach(i => berat += parseFloat(i.qty || 0));
                            } else if (item.qty) {
                                berat += parseFloat(item.qty);
                            }
                            komisi = berat * 3000;
                            ket = `Kiloan (${berat}Kg x 3000)`;
                        }
                        
                        tableHTML += `
                            <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <td style="padding:12px 15px; font-size:0.85rem; color:#64748b;">
                                    <div style="font-weight:600; color:#1e293b; margin-bottom:2px;">${item.id || '-'}</div>
                                    ${dateStr}
                                </td>
                                <td style="padding:12px 15px; font-size:0.85rem; color:#64748b;">${ket}</td>
                                <td style="padding:12px 15px; font-size:0.95rem; font-weight:700; color:#10b981; text-align:right;">${parseFloat(komisi).toLocaleString('id-ID')}</td>
                            </tr>
                        `;
                    });
                    
                    tableHTML += `
                            </tbody>
                        </table>
                    </div>
                    `;
                    list.innerHTML = tableHTML;
                }

                // Show Layout
                const layoutMain = document.getElementById('layout-main');
                const layoutDetail = document.getElementById('layout-detail-pegawai');
                
                if (layoutMain && layoutDetail) {
                    layoutMain.classList.remove('active');
                    setTimeout(() => {
                        layoutMain.style.display = 'none';
                        layoutDetail.style.display = 'block';
                        setTimeout(() => layoutDetail.classList.add('active'), 10);
                    }, 300);
                }
            };
            
            const btnBackDetailPegawai = document.getElementById('btn-back-detail-pegawai');
            if (btnBackDetailPegawai) {
                btnBackDetailPegawai.addEventListener('click', () => {
                    const layoutMain = document.getElementById('layout-main');
                    const layoutDetail = document.getElementById('layout-detail-pegawai');
                    layoutDetail.classList.remove('active');
                    setTimeout(() => {
                        layoutDetail.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            document.getElementById('search-pegawai')?.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const listItems = document.getElementById('list-pegawai-container').children;
                for (let i = 0; i < listItems.length; i++) {
                    const name = listItems[i].querySelector('div > div:first-child').innerText.toLowerCase();
                    if (name.includes(term)) {
                        listItems[i].style.display = 'flex';
                    } else {
                        listItems[i].style.display = 'none';
                    }
                }
            });

            // --- CHART.JS UNTUK KEUANGAN ---
            window.financeChartInstance = null;

            window.initFinanceChart = function(filterVal = 'bulan-ini') {
                const ctx = document.getElementById('financeChart');
                if (!ctx) return;

                const chartData = generateLast7DaysData(filterVal);

                const data = {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: 'Total Omzet',
                            data: chartData.dataPemasukan,
                            borderColor: '#38bdf8',
                            backgroundColor: (context) => {
                                const chart = context.chart;
                                const { ctx, chartArea } = chart;
                                if (!chartArea) return null;
                                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                                gradient.addColorStop(0, 'rgba(240, 249, 255, 0)');
                                gradient.addColorStop(1, 'rgba(56, 189, 248, 0.4)');
                                return gradient;
                            },
                            borderWidth: 3,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#38bdf8',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Pendapatan Transaksi',
                            data: chartData.dataPendapatan,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#10b981',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Pengeluaran',
                            data: chartData.dataPengeluaran,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.4,
                            fill: true,
                            pointRadius: 0,
                            pointHoverRadius: 4
                        }
                    ]
                };

                const config = {
                    type: 'line',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 8,
                                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                titleColor: '#1e293b',
                                bodyColor: '#475569',
                                borderColor: '#e2e8f0',
                                borderWidth: 1,
                                padding: 10,
                                boxPadding: 4,
                                usePointStyle: true,
                                titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: 'bold' },
                                bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                                callbacks: {
                                    label: function (context) {
                                        let label = context.dataset.label || '';
                                        if (label) {
                                            label += ': ';
                                        }
                                        if (context.parsed.y !== null) {
                                            label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function (value) {
                                        if (value === 0) return '0';
                                        return (value / 1000) + 'k';
                                    },
                                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, color: '#94a3b8' }
                                },
                                grid: { drawBorder: false, color: '#f1f5f9' },
                                border: { display: false }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, color: '#94a3b8' } },
                                border: { display: false }
                            }
                        }
                    }
                };

                if (window.financeChartInstance) window.financeChartInstance.destroy();
                window.financeChartInstance = new Chart(ctx.getContext('2d'), config);
            }

            // --- PESANAN STATUS FILTER (OLD) ---
            const statusBtns = document.querySelectorAll('.status-btn');
            statusBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    statusBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // --- PESANAN TABS (NEW) ---
            const pTabBtns = document.querySelectorAll('.p-tab-btn');
            pTabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    pTabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });

            // --- DASHBOARD DETAIL MENU NAVIGATION ---
            const clickableMenus = document.querySelectorAll('.clickable-menu');
            const layoutDetail = document.getElementById('layout-detail');
            const btnBackDetail = document.getElementById('btn-back-detail');
            const detailTitle = document.getElementById('detail-title');
            const detailSubtitle = document.getElementById('detail-subtitle');

            if (layoutDetail && btnBackDetail) {
                clickableMenus.forEach(menu => {
                    menu.addEventListener('click', () => {
                        const title = menu.getAttribute('data-title');

                        // Mappings untuk tombol di Grid yang harus membuka Tab Pesanan Utama
                        const pesananMap = {
                            'Semua': 'semua',
                            'Validasi': 'validasi',
                            'Antrian': 'antrian',
                            'Proses Cuci': 'cuci-jemur',
                            'Proses Setrika': 'setrika',
                            'Selesai': 'selesai',
                            'Pesanan Terlambat': 'terlambat',
                            'Pesanan Masuk Hari Ini': 'masuk',
                            'Pesanan Harus Selesai': 'harus-selesai'
                        };

                        if (pesananMap[title]) {
                            try {
                                // Pindah ke tab pesanan
                                const pesananBtn = document.querySelector('.b-nav-btn[data-bnav="pesanan"]');
                                if (pesananBtn) pesananBtn.click();
                            } catch (e) {
                                console.error('Error clicking pesanan btn:', e);
                            }

                            // Klik filter yang sesuai
                            setTimeout(() => {
                                try {
                                    const filterBtn = document.querySelector(`.p-tab-btn[data-filter="${pesananMap[title]}"]`);
                                    if (filterBtn) {
                                        filterBtn.click();
                                    } else {
                                        document.querySelectorAll('.p-tab-btn').forEach(b => b.classList.remove('active'));
                                        filterPesanan(pesananMap[title]);
                                    }
                                } catch(e) {
                                    console.error('Error in filter timeout:', e);
                                }
                            }, 50);
                            return; // Selesai
                        }

                        if (title === 'Ringkasan Outlet') {
                            // Pindah ke Beranda (bottom nav attribute is "transaksi")
                            const berandaBtn = document.querySelector('.b-nav-btn[data-bnav="transaksi"]');
                            if (berandaBtn) berandaBtn.click();

                            // Klik tab Keuangan & tampilkan tombol back
                            setTimeout(() => {
                                const btnBackBeranda = document.getElementById('btn-back-from-beranda');
                                if (btnBackBeranda) btnBackBeranda.style.display = 'block';

                                const keuanganTab = document.querySelector('.tab-btn[data-tab="keuangan"]');
                                if (keuanganTab && keuanganTab.style.display !== 'none') {
                                    keuanganTab.click();
                                }
                            }, 50);
                            return;
                        }

                        // Hide ALL layouts first
                        const allLayouts = [
                            document.getElementById('layout-main'),
                            document.getElementById('layout-omzet'),
                            document.getElementById('layout-arus-keuangan'),
                            document.getElementById('layout-pendapatan-transaksi'),
                            document.getElementById('layout-pendapatan-lainnya'),
                            document.getElementById('layout-pengeluaran'),
                            document.getElementById('layout-hutang'),
                            document.getElementById('layout-pesanan-hari-ini'),
                            document.getElementById('layout-detail'),
                            document.getElementById('layout-top-pelanggan')
                        ];

                        function hideAllLayouts() {
                            allLayouts.forEach(l => {
                                if (l) {
                                    l.classList.remove('active');
                                    l.style.display = 'none';
                                }
                            });
                        }

                        if (title === 'Top Pelanggan') {
                            hideAllLayouts();
                            const topPl = document.getElementById('layout-top-pelanggan');
                            if (topPl) {
                                topPl.style.display = 'block';
                                setTimeout(() => topPl.classList.add('active'), 10);
                            }
                            if (typeof window.renderTopPelanggan === 'function') {
                                window.renderTopPelanggan();
                            }
                            return;
                        }

                        // Untuk Laporan Transaksi
                        if (title === 'Semua Transaksi' || title === 'Transaksi Belum Lunas' || title === 'Transaksi Batal') {
                            const lLapTransaksi = document.getElementById('layout-laporan-transaksi');
                            const lapTitle = document.getElementById('lap-transaksi-header-title');
                            if (lLapTransaksi) {
                                if (lapTitle) lapTitle.innerText = title === 'Semua Transaksi' ? 'Transaksi Semua' : title;
                                window.currentLaporanTransaksiType = title;

                                const secondaryFilterSel = document.getElementById('lap-transaksi-filter-select');
                                const textEl = document.getElementById('lap-transaksi-filter-text');
                                if (secondaryFilterSel && textEl) {
                                    if (title === 'Transaksi Belum Lunas') {
                                        secondaryFilterSel.value = 'Belum Lunas';
                                    } else if (title === 'Transaksi Batal') {
                                        secondaryFilterSel.value = 'Batal';
                                    } else {
                                        secondaryFilterSel.value = 'Semua';
                                    }
                                    textEl.innerText = secondaryFilterSel.options[secondaryFilterSel.selectedIndex].text;
                                }

                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lLapTransaksi.style.display = 'flex';
                                    setTimeout(() => lLapTransaksi.classList.add('active'), 10);
                                }, 300);

                                // Fetch data directly upon opening
                                setTimeout(() => {
                                    const filterSel = document.getElementById('lap-transaksi-date-filter');
                                    if (filterSel && !filterSel.value) filterSel.value = 'hari-ini';
                                    if (typeof window.renderLaporanTransaksiAccordion === 'function') {
                                        window.renderLaporanTransaksiAccordion();
                                    }
                                }, 350);
                                
                                return;
                            }
                        }
                        // Untuk Export Data
                        if (title.startsWith('Export ')) {
                            const lExport = document.getElementById('layout-export');
                            const exportTitle = document.getElementById('export-title');

                            if (lExport) {
                                if (exportTitle) exportTitle.innerText = title; // e.g. "Export Keuangan"

                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                if (lExport) lExport.classList.remove('active');

                                setTimeout(() => {
                                    hideAllLayouts(); // from local scope
                                    lExport.style.display = 'flex';
                                    lExport.style.flexDirection = 'column';
                                    setTimeout(() => lExport.classList.add('active'), 10);

                                    // Render list
                                    if (typeof window.renderExportList === 'function') {
                                        try {
                                            window.renderExportList();
                                        } catch (err) {
                                            alert('Error in renderExportList: ' + err.message);
                                        }
                                    } else {
                                        alert('renderExportList function not found!');
                                    }
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Laba Rugi
                        if (title === 'Laba Rugi') {
                            const lLabaRugi = document.getElementById('layout-laba-rugi');
                            if (lLabaRugi) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lLabaRugi.style.display = 'flex';
                                    setTimeout(() => lLabaRugi.classList.add('active'), 10);
                                }, 300);

                                if (typeof window.renderLabaRugi === 'function') {
                                    window.renderLabaRugi();
                                }
                                return;
                            }
                        }

                        // Untuk Pesanan Masuk Hari Ini, buka layout-pesanan-hari-ini
                        if (title === 'Pesanan Masuk Hari Ini') {
                            const lPesananHariIni = document.getElementById('layout-pesanan-hari-ini');
                            if (lPesananHariIni) {
                                // Render data pesanan masuk hari ini (kita pakai data semua dulu)
                                renderPesananMasukHariIni();

                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lPesananHariIni.style.display = 'flex';
                                    setTimeout(() => lPesananHariIni.classList.add('active'), 10);
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Omzet
                        if (title === 'Omzet') {
                            const lOmzet = document.getElementById('layout-omzet');
                            if (lOmzet) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lOmzet.style.display = 'flex';
                                    setTimeout(() => lOmzet.classList.add('active'), 10);

                                    // Initialize chart if needed
                                    if (typeof initOmzetChart === 'function') initOmzetChart();
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Arus Keuangan
                        if (title === 'Arus Keuangan') {
                            const lArus = document.getElementById('layout-arus-keuangan');
                            if (lArus) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lArus.style.display = 'flex';
                                    setTimeout(() => lArus.classList.add('active'), 10);
                                    if (typeof window.renderLaporanArusKeuangan === 'function') {
                                        const filterVal = document.getElementById('arus-date-filter') ? document.getElementById('arus-date-filter').value : 'hari-ini';
                                        window.renderLaporanArusKeuangan(filterVal);
                                    }
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Pendapatan Transaksi
                        if (title === 'Pendapatan Transaksi') {
                            const lPendapatan = document.getElementById('layout-pendapatan-transaksi');
                            if (lPendapatan) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lPendapatan.style.display = 'flex';
                                    setTimeout(() => lPendapatan.classList.add('active'), 10);
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Pendapatan Lainnya
                        if (title === 'Pendapatan Lainnya') {
                            const lLainnya = document.getElementById('layout-pendapatan-lainnya');
                            if (lLainnya) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lLainnya.style.display = 'flex';
                                    setTimeout(() => lLainnya.classList.add('active'), 10);
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Biaya Usaha
                        if (title === 'Biaya Usaha') {
                            const lHutang = document.getElementById('layout-hutang');
                            if (lHutang) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lHutang.style.display = 'flex';
                                    setTimeout(() => lHutang.classList.add('active'), 10);
                                }, 300);
                                return;
                            }
                        }
                        // Untuk Pengeluaran
                        if (title === 'Pengeluaran') {
                            const lPengeluaran = document.getElementById('layout-pengeluaran');
                            if (lPengeluaran) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lPengeluaran.style.display = 'flex';
                                    setTimeout(() => lPengeluaran.classList.add('active'), 10);
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Go Online
                        if (title === 'Go Online') {
                            const lGoOnline = document.getElementById('layout-go-online');
                            if (lGoOnline) {
                                allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                                setTimeout(() => {
                                    hideAllLayouts();
                                    lGoOnline.style.display = 'block';
                                    setTimeout(() => lGoOnline.classList.add('active'), 10);

                                    // Load saved URL if exists
                                    const inputUrl = document.getElementById('input-webapp-url');
                                    if (inputUrl) {
                                        inputUrl.value = localStorage.getItem('webapp_url') || '';
                                    }
                                }, 300);
                                return;
                            }
                        }

                        // Untuk Pelanggan Saya
                        if (title === 'Pelanggan Saya') {
                            const tabKelolaPelanggan = document.getElementById('tab-kelola-pelanggan');
                            const tabAkun = document.getElementById('tab-akun');
                            if (tabKelolaPelanggan && tabAkun) {
                                tabAkun.style.display = 'none';
                                tabKelolaPelanggan.style.display = 'flex';
                                window.scrollTo(0, 0);
                                return;
                            }
                        }

                        // Default Behavior: Buka layout-detail sebagai lembaran baru yang kosong/statis
                        if (title) {
                            detailTitle.innerText = title;
                            detailSubtitle.innerText = title;
                        }

                        // Animasi transisi masuk
                        allLayouts.forEach(l => { if (l) l.classList.remove('active'); });
                        setTimeout(() => {
                            hideAllLayouts();
                            layoutDetail.style.display = 'flex';
                            setTimeout(() => layoutDetail.classList.add('active'), 10);
                        }, 300);
                    });
                });

                // Tombol Back
                btnBackDetail.addEventListener('click', () => {
                    layoutDetail.classList.remove('active');
                    setTimeout(() => {
                        layoutDetail.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            // --- ARUS KEUANGAN LAYOUT SCRIPT ---
            const btnBackArus = document.getElementById('btn-back-arus');
            const layoutArus = document.getElementById('layout-arus-keuangan');
            if (btnBackArus && layoutArus) {
                btnBackArus.addEventListener('click', () => {
                    layoutArus.classList.remove('active');
                    setTimeout(() => {
                        layoutArus.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExportArus = document.getElementById('btn-export-arus');
            if (btnExportArus) {
                btnExportArus.addEventListener('click', () => {
                    if (typeof window.showToast === 'function') window.showToast('Mengekspor data Arus Keuangan...');
                    
                    const data = [];
                    if (window.currentArusData && window.currentArusData.length > 0) {
                        window.currentArusData.forEach(item => {
                            // Strip HTML tags from ket
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = item.ket;
                            const cleanKet = tempDiv.textContent || tempDiv.innerText || "";
                            
                            data.push({
                                Tanggal: window.formatDateDisplay(item.date),
                                Keterangan: cleanKet,
                                Debit: item.debit,
                                Kredit: item.kredit
                            });
                        });
                    }
                    if (data.length === 0) {
                        if (typeof window.showToast === 'function') window.showToast('Tidak ada data untuk diekspor.');
                        return;
                    }
                    if (typeof window.exportToExcel === 'function') {
                        window.exportToExcel(data, 'Arus_Keuangan_Manjur');
                    }
                });
            }

            const arusDateFilter = document.getElementById('arus-date-filter');
            const arusDateText = document.getElementById('arus-date-text');
            const btnRefreshArus = document.getElementById('btn-refresh-arus');
            const arusEmptyState = document.getElementById('arus-empty-state');
            const arusDataState = document.getElementById('arus-data-state');
            const btnAnalisaArus = document.getElementById('btn-analisa-arus');

            if (btnAnalisaArus) {
                btnAnalisaArus.addEventListener('click', () => {
                    if (typeof window.showToast === 'function') window.showToast('Fitur Analisa Arus Kas sedang dalam pengembangan.');
                });
            }

            if (btnRefreshArus) {
                btnRefreshArus.addEventListener('click', () => {
                    const icon = document.getElementById('arus-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        if (typeof window.showToast === 'function') window.showToast('Memperbarui data arus keuangan...');
                        if (typeof window.renderLaporanArusKeuangan === 'function') window.renderLaporanArusKeuangan(arusDateFilter ? arusDateFilter.value : 'hari-ini');
                    }, 800);
                });
            }

            // Tabs Arus Keuangan
            const btnTabTransaksi = document.getElementById('btn-tab-transaksi');
            const btnTabCashbox = document.getElementById('btn-tab-cashbox');
            const arusContentTransaksi = document.getElementById('arus-content-transaksi');
            const arusContentCashbox = document.getElementById('arus-content-cashbox');

            if (btnTabTransaksi && btnTabCashbox && arusContentTransaksi && arusContentCashbox) {
                btnTabTransaksi.addEventListener('click', () => {
                    btnTabTransaksi.style.color = '#0ea5e9';
                    btnTabTransaksi.style.borderBottomColor = '#0ea5e9';
                    btnTabCashbox.style.color = '#64748b';
                    btnTabCashbox.style.borderBottomColor = 'transparent';

                    arusContentTransaksi.style.display = 'block';
                    arusContentCashbox.style.display = 'none';
                });

                btnTabCashbox.addEventListener('click', () => {
                    btnTabCashbox.style.color = '#0ea5e9';
                    btnTabCashbox.style.borderBottomColor = '#0ea5e9';
                    btnTabTransaksi.style.color = '#64748b';
                    btnTabTransaksi.style.borderBottomColor = 'transparent';

                    arusContentCashbox.style.display = 'block';
                    arusContentTransaksi.style.display = 'none';
                });
            }

            // Filter Cashbox
            const arusCashboxFilter = document.getElementById('arus-cashbox-filter');
            const arusCashboxText = document.getElementById('arus-cashbox-text');
            const arusTbody = document.getElementById('arus-tbody');
            if (arusCashboxFilter && arusCashboxText && arusTbody) {
                
                arusCashboxFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    arusCashboxText.innerText = val;
                });
            }

            // --- PENDAPATAN TRANSAKSI LAYOUT SCRIPT ---
            const btnBackPendapatan = document.getElementById('btn-back-pendapatan');
            const layoutPendapatan = document.getElementById('layout-pendapatan-transaksi');
            if (btnBackPendapatan && layoutPendapatan) {
                btnBackPendapatan.addEventListener('click', () => {
                    layoutPendapatan.classList.remove('active');
                    setTimeout(() => {
                        layoutPendapatan.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExportPendapatan = document.getElementById('btn-export-pendapatan');
            if (btnExportPendapatan) {
                btnExportPendapatan.addEventListener('click', () => {
                    if (window.currentPendapatanTransaksiExportData && window.currentPendapatanTransaksiExportData.length > 0) {
                        window.showToast('Mengekspor data Pendapatan Transaksi...');
                        window.exportToExcel(window.currentPendapatanTransaksiExportData, 'Pendapatan_Transaksi_Manjur');
                    } else {
                        window.showToast('Tidak ada data untuk diekspor pada rentang tanggal ini.');
                    }
                });
            }

            const pendapatanDateFilter = document.getElementById('pendapatan-date-filter');
            const pendapatanDateText = document.getElementById('pendapatan-date-text');
            const btnRefreshPendapatan = document.getElementById('btn-refresh-pendapatan');
            const pendapatanEmptyState = document.getElementById('pendapatan-empty-state');
            const pendapatanDataState = document.getElementById('pendapatan-data-state');
            const pendapatanAccordionContainer = document.getElementById('pendapatan-accordion-container');

            // Helper untuk merender isi akordion
            function renderPendapatanAccordion(cashboxFilter = 'Semua') {
                if (!pendapatanAccordionContainer) return;

                // Dummy data
                const groupedDataRaw = [
                    {
                        dateText: '23-07-2026',
                        items: [
                            { nama: 'Indra Fiphayana', kode: 'TRX/2607/267', metode: 'QRIS', nominal: '26,400' },
                            { nama: 'BASRI', kode: 'TRX/2607/245', metode: 'Tunai', nominal: '19,500' },
                            { nama: 'Made', kode: 'TRX/2607/242', metode: 'Tunai', nominal: '21,000' },
                            { nama: 'PAK BAMBANG', kode: 'TRX/2607/266', metode: 'Tunai', nominal: '16,000' },
                            { nama: 'RAZALI', kode: 'TRX/2607/265', metode: 'Tunai', nominal: '52,000' },
                            { nama: 'HRD BIIE', kode: 'TRX/2607/187', metode: 'Tunai', nominal: '24,000' }
                        ]
                    },
                    {
                        dateText: '22-07-2026',
                        items: [
                            { nama: 'KAK PUTRI BIIE', kode: 'TRX/2607/082', metode: 'Tunai', nominal: '26,000' },
                            { nama: 'FAHMI', kode: 'TRX/2607/098', metode: 'Tunai', nominal: '28,000' },
                            { nama: 'Frengko', kode: 'TRX/2607/080', metode: 'Tunai', nominal: '12,000' },
                            { nama: 'ABAS', kode: 'TRX/2607/030', metode: 'Tunai', nominal: '40,000' },
                            { nama: 'Masykur', kode: 'TRX/2607/153', metode: 'Tunai', nominal: '22,500' },
                            { nama: 'Bayar PDAM', kode: 'TRX/2607/111', metode: 'Mandiri', nominal: '50,000' } // Tambahan contoh mandiri
                        ]
                    }
                ];

                let html = '';
                let globalTotal = 0;
                let exportData = [];

                groupedDataRaw.forEach((group) => {
                    let filteredItems = group.items;
                    if (cashboxFilter !== 'Semua') {
                        filteredItems = group.items.filter(item => item.metode === cashboxFilter);
                    }

                    if (filteredItems.length > 0) {
                        let groupTotal = 0;
                        let itemsHtml = '';
                        filteredItems.forEach(item => {
                            exportData.push({
                                Tanggal: group.dateText,
                                Nama: item.nama,
                                Kode: item.kode,
                                Metode: item.metode,
                                Nominal: item.nominal
                            });
                            const isQris = item.metode === 'QRIS';
                            const nominalVal = parseInt(item.nominal.replace(/,/g, ''));
                            groupTotal += nominalVal;

                            itemsHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #f1f5f9;">
                            <div>
                                <div style="color:#334155; font-weight:500; font-size:0.9rem; margin-bottom:4px;">Pembayaran dari ${item.nama}</div>
                                <div style="color:#94a3b8; font-size:0.75rem;">Kode : ${item.kode} (<span style="color:${isQris ? '#ef4444' : (item.metode === 'Tunai' ? '#8b5cf6' : '#3b82f6')}; font-weight:600;">${item.metode}</span>)</div>
                            </div>
                            <div style="color:#1e293b; font-weight:600; font-size:0.95rem;">
                                ${item.nominal}
                            </div>
                        </div>
                    `;
                        });

                        globalTotal += groupTotal;
                        const formattedTotal = groupTotal.toLocaleString('en-US');

                        html += `
                    <div class="pendapatan-group">
                        <div class="pendapatan-header" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:#f0f9ff; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; const icon = this.querySelector('i'); icon.style.transform = this.nextElementSibling.style.display === 'none' ? 'rotate(-90deg)' : 'rotate(0deg)';">
                            <div style="color:#0ea5e9; font-weight:600; font-size:0.85rem; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-chevron-down" style="transition:transform 0.3s;"></i> ${group.dateText}
                            </div>
                            <div style="color:#0ea5e9; font-weight:700; font-size:0.95rem;">
                                ${formattedTotal}
                            </div>
                        </div>
                        <div class="pendapatan-content" style="display:block;"> <!-- Automatically expanded -->
                            ${itemsHtml}
                        </div>
                    </div>
                `;
                    }
                });

                if (html === '') {
                    html = '<div style="padding: 30px; text-align:center; color:#94a3b8; font-size:0.9rem;">Tidak ada transaksi ' + cashboxFilter + ' pada periode ini.</div>';
                }

                pendapatanAccordionContainer.innerHTML = html;

                // Update Total
                const totalTextElement = document.querySelector('#pendapatan-data-state div > span[style*="font-size:1.6rem"]');
                if (totalTextElement) {
                    totalTextElement.innerText = globalTotal.toLocaleString('en-US');
                }
                
                window.currentPendapatanTransaksiExportData = exportData;
            }

            if (pendapatanDateFilter && pendapatanDateText && btnRefreshPendapatan && pendapatanEmptyState && pendapatanDataState) {
                pendapatanDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val === 'per-tanggal') {
                        const datePickerModal = document.getElementById('custom-date-picker-modal');
                        if (datePickerModal) datePickerModal.style.display = 'flex';
                    } else if (val) {
                        // Update text based on filter
                        if (val === 'hari-ini') pendapatanDateText.innerText = '24/07/2026';
                        else if (val === 'kemarin') pendapatanDateText.innerText = '23/07/2026';
                        else if (val === '7-hari') pendapatanDateText.innerText = '18/07/2026 - 24/07/2026';
                        else if (val === '30-hari') pendapatanDateText.innerText = '25/06/2026 - 24/07/2026';
                        
                        

                        pendapatanDateText.style.display = 'block';
                        btnRefreshPendapatan.style.display = 'flex';

                        pendapatanEmptyState.style.display = 'none';
                        pendapatanDataState.style.display = 'flex';

                        // Render accordion data
                        renderPendapatanAccordion();

                        btnRefreshPendapatan.click();
                    }
                });

                btnRefreshPendapatan.addEventListener('click', () => {
                    const icon = document.getElementById('pendapatan-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        showToast('Memperbarui data pendapatan transaksi...');
                    }, 800);
                });
            }

            const pendapatanCashboxFilter = document.getElementById('pendapatan-cashbox-filter');
            const pendapatanCashboxText = document.getElementById('pendapatan-cashbox-text');
            if (pendapatanCashboxFilter && pendapatanCashboxText) {
                pendapatanCashboxFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    pendapatanCashboxText.innerText = val;

                    // Re-render accordion with new filter
                    renderPendapatanAccordion(val);

                    if (btnRefreshPendapatan) btnRefreshPendapatan.click();
                });
            }
            // --- PENDAPATAN LAINNYA LAYOUT SCRIPT ---
            const btnBackLainnya = document.getElementById('btn-back-lainnya');
            const layoutLainnya = document.getElementById('layout-pendapatan-lainnya');
            if (btnBackLainnya && layoutLainnya) {
                btnBackLainnya.addEventListener('click', () => {
                    layoutLainnya.classList.remove('active');
                    setTimeout(() => {
                        layoutLainnya.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExportLainnya = document.getElementById('btn-export-lainnya');
            if (btnExportLainnya) {
                btnExportLainnya.addEventListener('click', () => {
                    window.showToast('Mengekspor data Pendapatan Lainnya...');
                    const data = [
                        { Tanggal: '23-07-2026', Nama: 'Tips Pelanggan', Kode: 'PL/2607/001', Metode: 'Tunai', Nominal: 50000 },
                        { Tanggal: '23-07-2026', Nama: 'Pendapatan Jasa Servis', Kode: 'PL/2607/002', Metode: 'QRIS', Nominal: 150000 }
                    ];
                    window.exportToExcel(data, 'Pendapatan_Lainnya_Manjur');
                });
            }

            const lainnyaDateFilter = document.getElementById('lainnya-date-filter');
            const lainnyaDateText = document.getElementById('lainnya-date-text');
            const btnRefreshLainnya = document.getElementById('btn-refresh-lainnya');
            const lainnyaEmptyState = document.getElementById('lainnya-empty-state');
            const lainnyaDataState = document.getElementById('lainnya-data-state');
            const lainnyaAccordionContainer = document.getElementById('lainnya-accordion-container');

            // Helper untuk merender isi akordion
            function renderLainnyaAccordion(cashboxFilter = 'Semua') {
                if (!lainnyaAccordionContainer) return;

                // Dummy data untuk Pendapatan Lainnya
                const groupedDataRaw = [
                    {
                        dateText: '23-07-2026',
                        items: [
                            { nama: 'Tips Pelanggan', kode: 'PL/2607/001', metode: 'Tunai', nominal: '50,000' },
                            { nama: 'Pendapatan Jasa Servis', kode: 'PL/2607/002', metode: 'QRIS', nominal: '150,000' }
                        ]
                    },
                    {
                        dateText: '22-07-2026',
                        items: [
                            { nama: 'Bunga Bank', kode: 'PL/2607/003', metode: 'Mandiri', nominal: '25,000' },
                            { nama: 'Lain-lain', kode: 'PL/2607/004', metode: 'Tunai', nominal: '10,000' }
                        ]
                    }
                ];

                let html = '';
                let globalTotal = 0;

                groupedDataRaw.forEach((group) => {
                    let filteredItems = group.items;
                    if (cashboxFilter !== 'Semua') {
                        filteredItems = group.items.filter(item => item.metode === cashboxFilter);
                    }

                    if (filteredItems.length > 0) {
                        let groupTotal = 0;
                        let itemsHtml = '';
                        filteredItems.forEach(item => {
                            const isQris = item.metode === 'QRIS';
                            const nominalVal = parseInt(item.nominal.replace(/,/g, ''));
                            groupTotal += nominalVal;

                            itemsHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 20px; border-bottom:1px solid #f1f5f9;">
                            <div>
                                <div style="color:#334155; font-weight:500; font-size:0.9rem; margin-bottom:4px;">${item.nama}</div>
                                <div style="color:#94a3b8; font-size:0.75rem;">Kode : ${item.kode} (<span style="color:${isQris ? '#ef4444' : (item.metode === 'Tunai' ? '#8b5cf6' : '#3b82f6')}; font-weight:600;">${item.metode}</span>)</div>
                            </div>
                            <div style="color:#1e293b; font-weight:600; font-size:0.95rem;">
                                ${item.nominal}
                            </div>
                        </div>
                    `;
                        });

                        globalTotal += groupTotal;
                        const formattedTotal = groupTotal.toLocaleString('en-US');

                        html += `
                    <div class="pendapatan-group">
                        <div class="pendapatan-header" style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:#f0f9ff; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; const icon = this.querySelector('i'); icon.style.transform = this.nextElementSibling.style.display === 'none' ? 'rotate(-90deg)' : 'rotate(0deg)';">
                            <div style="color:#0ea5e9; font-weight:600; font-size:0.85rem; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-chevron-down" style="transition:transform 0.3s;"></i> ${group.dateText}
                            </div>
                            <div style="color:#0ea5e9; font-weight:700; font-size:0.95rem;">
                                ${formattedTotal}
                            </div>
                        </div>
                        <div class="pendapatan-content" style="display:block;"> <!-- Automatically expanded -->
                            ${itemsHtml}
                        </div>
                    </div>
                `;
                    }
                });

                if (html === '') {
                    html = '<div style="padding: 30px; text-align:center; color:#94a3b8; font-size:0.9rem;">Tidak ada transaksi ' + cashboxFilter + ' pada periode ini.</div>';
                }

                lainnyaAccordionContainer.innerHTML = html;

                // Update Total
                const totalTextElement = document.querySelector('#lainnya-data-state div > span[style*="font-size:1.6rem"]');
                if (totalTextElement) {
                    totalTextElement.innerText = globalTotal.toLocaleString('en-US');
                }
            }

            const datePickerModal = document.getElementById('custom-date-picker-modal');
            const btnModalBatal = document.getElementById('btn-modal-batal');
            const btnModalOke = document.getElementById('btn-modal-oke');

            // --- CUSTOM MONTH PICKER LOGIC ---
            const monthPickerModal = document.getElementById('custom-month-picker-modal');
            const btnMonthBatal = document.getElementById('btn-month-batal');
            const btnMonthOke = document.getElementById('btn-month-oke');
            const monthYearDisplay = document.getElementById('modal-month-year-display');
            const modalMonthText = document.getElementById('modal-month-text');
            
            window.currentMonthPickerYear = 2026;
            window.selectedMonthIndex = 6; // July
            let activeMonthFilterSelect = null;
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            
            function renderMonthGrid() {
                const grid = monthPickerModal.querySelector('div[style*="grid-template-columns: repeat(3, 1fr)"]');
                if(!grid) return;
                grid.innerHTML = '';
                monthYearDisplay.innerText = window.currentMonthPickerYear;
                modalMonthText.innerText = `${monthNames[window.selectedMonthIndex]} ${window.currentMonthPickerYear}`;
                
                monthNames.forEach((m, idx) => {
                    const div = document.createElement('div');
                    div.innerText = m;
                    div.style.padding = '10px';
                    div.style.borderRadius = '5px';
                    div.style.cursor = 'pointer';
                    div.style.fontSize = '0.9rem';
                    
                    if (idx === window.selectedMonthIndex) {
                        div.style.background = '#38bdf8';
                        div.style.color = '#fff';
                        div.style.fontWeight = 'bold';
                    } else {
                        div.style.background = '#f1f5f9';
                        div.style.color = '#334155';
                    }
                    
                    div.addEventListener('click', () => {
                        window.selectedMonthIndex = idx;
                        renderMonthGrid();
                    });
                    
                    grid.appendChild(div);
                });
            }

            if (btnMonthBatal && monthPickerModal) {
                btnMonthBatal.addEventListener('click', () => monthPickerModal.style.display = 'none');
            }
            
            if (monthPickerModal) {
                document.getElementById('btn-month-prev-year').onclick = () => { window.currentMonthPickerYear--; renderMonthGrid(); };
                document.getElementById('btn-month-next-year').onclick = () => { window.currentMonthPickerYear++; renderMonthGrid(); };
            }

            if (btnMonthOke && monthPickerModal) {
                btnMonthOke.addEventListener('click', () => {
                    monthPickerModal.style.display = 'none';
                    if (typeof activeMonthFilterSelect === 'function') {
                        activeMonthFilterSelect(window.currentMonthPickerYear, window.selectedMonthIndex);
                        return;
                    }
                    const customVal = `CUSTOM_MONTH_${window.currentMonthPickerYear}-${(window.selectedMonthIndex + 1).toString().padStart(2, '0')}`;
                    if (activeMonthFilterSelect) {
                        let opt = [...activeMonthFilterSelect.options].find(o => o.value === customVal);
                        if(!opt) {
                            opt = document.createElement('option');
                            opt.value = customVal;
                            opt.style.display = 'none';
                            activeMonthFilterSelect.add(opt);
                        }
                        opt.text = `Per Bulan (${monthNames[window.selectedMonthIndex]} ${window.currentMonthPickerYear})`;
                        activeMonthFilterSelect.value = customVal;
                        activeMonthFilterSelect.dispatchEvent(new Event('change'));
                    }
                });
            }
            
            window.openMonthPicker = function(selectElem, defaultYear = null, defaultMonth = null) {
                activeMonthFilterSelect = selectElem;
                const today = new Date();
                window.currentMonthPickerYear = defaultYear !== null ? defaultYear : today.getFullYear();
                window.selectedMonthIndex = defaultMonth !== null ? defaultMonth : today.getMonth();
                
                if (monthPickerModal) {
                    renderMonthGrid();
                    monthPickerModal.style.display = 'flex';
                }
            };

            let calCurrentDate = new Date();
            window.calStartDay = calCurrentDate.getDate();
            window.calStartMonth = calCurrentDate.getMonth();
            window.calStartYear = calCurrentDate.getFullYear();
            window.calEndDay = null;
            window.calEndMonth = null;
            window.calEndYear = null;
            window.calClickState = 0; // 0 = picking start, 1 = picking end

            const calMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

            function renderCalendar() {
                const grid = document.getElementById('calendar-grid');
                const textRange = document.getElementById('modal-date-range-text');
                const monthYearHeader = document.getElementById('modal-calendar-month-year');
                if (!grid) return;

                const year = calCurrentDate.getFullYear();
                const month = calCurrentDate.getMonth();

                if (monthYearHeader) {
                    monthYearHeader.innerHTML = `${calMonthNames[month].toUpperCase()} ${year} <i class="fa-solid fa-caret-down" style="font-size: 0.8rem;"></i>`;
                }

                // calculate offset
                const firstDay = new Date(year, month, 1).getDay();
                // 0 = Sunday, 1 = Monday. We want Monday=0, Sunday=6
                const offset = firstDay === 0 ? 6 : firstDay - 1;
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let html = '';
                for (let i = 0; i < offset; i++) html += '<div></div>'; 

                for (let i = 1; i <= daysInMonth; i++) {
                    let isStart = (i === calStartDay && month === calStartMonth && year === calStartYear);
                    let isEnd = (calEndDay !== null && i === calEndDay && month === calEndMonth && year === calEndYear);
                    
                    let inRange = false;
                    const currentD = new Date(year, month, i);
                    if (calStartDay !== null && calEndDay !== null) {
                        const startD = new Date(calStartYear, calStartMonth, calStartDay);
                        const endD = new Date(calEndYear, calEndMonth, calEndDay);
                        if (currentD > startD && currentD < endD) inRange = true;
                    }

                    let wrapperStyle = "position: relative;";
                    let bgHtml = '';
                    let circleStyle = "width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; margin: 0 auto; position: relative; z-index: 2; cursor: pointer;";

                    if (inRange) {
                        bgHtml = '<div style="position: absolute; top: 0; bottom: 0; left: -50%; right: -50%; background: #e0f2fe; z-index: 1;"></div>';
                    } else if (isStart && calEndDay !== null && (calStartDay !== calEndDay || calStartMonth !== calEndMonth || calStartYear !== calEndYear)) {
                        bgHtml = '<div style="position: absolute; top: 0; bottom: 0; left: 50%; right: -50%; background: #e0f2fe; z-index: 1;"></div>';
                    } else if (isEnd && (calStartDay !== calEndDay || calStartMonth !== calEndMonth || calStartYear !== calEndYear)) {
                        bgHtml = '<div style="position: absolute; top: 0; bottom: 0; left: -50%; right: 50%; background: #e0f2fe; z-index: 1;"></div>';
                    }

                    if (isStart || isEnd) {
                        circleStyle += " background: #0ea5e9; color: #fff; border-radius: 50%;";
                    }

                    html += `<div style="${wrapperStyle}" onclick="window.pickCalDate(${i})">
                        ${bgHtml}
                        <div style="${circleStyle}">${i}</div>
                    </div>`;
                }

                grid.innerHTML = html;

                if (textRange && calStartDay !== null) {
                    let endStr = '';
                    if (calEndDay !== null) {
                        if (calEndDay === calStartDay && calEndMonth === calStartMonth && calEndYear === calStartYear) {
                            // same date
                        } else {
                            endStr = ` &ndash; ${calEndDay} ${calMonthNames[calEndMonth]}`;
                        }
                    }
                    textRange.innerHTML = `${calStartDay} ${calMonthNames[calStartMonth]}${endStr}`;
                }
            }

            window.pickCalDate = function (day) {
                const year = calCurrentDate.getFullYear();
                const month = calCurrentDate.getMonth();

                if (calClickState === 0) {
                    calStartDay = day;
                    calStartMonth = month;
                    calStartYear = year;
                    calEndDay = null;
                    calEndMonth = null;
                    calEndYear = null;
                    calClickState = 1;
                } else {
                    const currentD = new Date(year, month, day);
                    const startD = new Date(calStartYear, calStartMonth, calStartDay);
                    if (currentD >= startD) {
                        calEndDay = day;
                        calEndMonth = month;
                        calEndYear = year;
                    } else {
                        calEndDay = calStartDay;
                        calEndMonth = calStartMonth;
                        calEndYear = calStartYear;
                        
                        calStartDay = day;
                        calStartMonth = month;
                        calStartYear = year;
                    }
                    calClickState = 0;
                }
                renderCalendar();
            };

            const btnCalPrev = document.getElementById('btn-calendar-prev');
            const btnCalNext = document.getElementById('btn-calendar-next');
            const btnCalMonthYear = document.getElementById('modal-calendar-month-year');
            
            if (btnCalMonthYear) {
                btnCalMonthYear.addEventListener('click', () => {
                    window.openMonthPicker((year, month) => {
                        calCurrentDate.setFullYear(year);
                        calCurrentDate.setMonth(month);
                        renderCalendar();
                    }, calCurrentDate.getFullYear(), calCurrentDate.getMonth());
                });
            }

            if (btnCalPrev) {
                btnCalPrev.addEventListener('click', () => {
                    calCurrentDate.setMonth(calCurrentDate.getMonth() - 1);
                    renderCalendar();
                });
            }
            if (btnCalNext) {
                btnCalNext.addEventListener('click', () => {
                    calCurrentDate.setMonth(calCurrentDate.getMonth() + 1);
                    renderCalendar();
                });
            }

            renderCalendar();

            if (btnModalBatal && datePickerModal) {
                btnModalBatal.addEventListener('click', () => {
                    datePickerModal.style.display = 'none';
                    if (window.activeDateFilterSelect) window.activeDateFilterSelect.value = '';
                });
            }

            window.activeDateFilterSelect = null;
            window.openDatePicker = function(selectElem) {
                window.activeDateFilterSelect = selectElem;
                if (datePickerModal) datePickerModal.style.display = 'flex';
                // Reset selection
                calStartDay = calCurrentDate.getDate();
                calStartMonth = calCurrentDate.getMonth();
                calStartYear = calCurrentDate.getFullYear();
                calEndDay = null; calEndMonth = null; calEndYear = null;
                calClickState = 0;
                renderCalendar();
            };

            if (btnModalOke && datePickerModal) {
                btnModalOke.addEventListener('click', () => {
                    datePickerModal.style.display = 'none';
                    if (window.activeDateFilterSelect) {
                        const customVal = 'CUSTOM_DATE_RANGE';
                        if (![...window.activeDateFilterSelect.options].some(o => o.value === customVal)) {
                            const opt = document.createElement('option');
                            opt.value = customVal;
                            opt.text = 'Per Tanggal';
                            opt.style.display = 'none';
                            window.activeDateFilterSelect.add(opt);
                        }
                        window.activeDateFilterSelect.value = customVal;
                        window.activeDateFilterSelect.dispatchEvent(new Event('change'));
                    }
                });
            }

            if (lainnyaDateFilter && lainnyaDateText && btnRefreshLainnya && lainnyaEmptyState && lainnyaDataState) {
                lainnyaDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val === 'per-tanggal') {
                        if (datePickerModal) datePickerModal.style.display = 'flex';
                    } else if (val) {
                        if (val === 'hari-ini') lainnyaDateText.innerText = '24/07/2026';
                        else if (val === 'kemarin') lainnyaDateText.innerText = '23/07/2026';
                        else if (val === '7-hari') lainnyaDateText.innerText = '18/07/2026 - 24/07/2026';
                        else if (val === '30-hari') lainnyaDateText.innerText = '25/06/2026 - 24/07/2026';
                        
                        

                        lainnyaDateText.style.display = 'block';
                        btnRefreshLainnya.style.display = 'flex';

                        lainnyaEmptyState.style.display = 'none';
                        lainnyaDataState.style.display = 'flex';

                        renderLainnyaAccordion();
                        btnRefreshLainnya.click();
                    }
                });

                btnRefreshLainnya.addEventListener('click', () => {
                    const icon = document.getElementById('lainnya-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        showToast('Memperbarui data pendapatan lainnya...');
                    }, 800);
                });
            }

            const lainnyaCashboxFilter = document.getElementById('lainnya-cashbox-filter');
            const lainnyaCashboxText = document.getElementById('lainnya-cashbox-text');
            if (lainnyaCashboxFilter && lainnyaCashboxText) {
                lainnyaCashboxFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    lainnyaCashboxText.innerText = val;
                    renderLainnyaAccordion(val);
                    if (btnRefreshLainnya) btnRefreshLainnya.click();
                });
            }

            // Tabs untuk Pendapatan Lainnya
            const btnTabLainnyaTransaksi = document.getElementById('btn-tab-lainnya-transaksi');
            const btnTabLainnyaKategori = document.getElementById('btn-tab-lainnya-kategori');
            const contentLainnyaTransaksi = document.getElementById('lainnya-content-transaksi');
            const contentLainnyaKategori = document.getElementById('lainnya-content-kategori');

            if (btnTabLainnyaTransaksi && btnTabLainnyaKategori && contentLainnyaTransaksi && contentLainnyaKategori) {
                btnTabLainnyaTransaksi.addEventListener('click', () => {
                    btnTabLainnyaTransaksi.style.color = '#0ea5e9';
                    btnTabLainnyaTransaksi.style.borderBottomColor = '#0ea5e9';
                    btnTabLainnyaKategori.style.color = '#64748b';
                    btnTabLainnyaKategori.style.borderBottomColor = 'transparent';

                    contentLainnyaTransaksi.style.display = 'block';
                    contentLainnyaKategori.style.display = 'none';
                });

                btnTabLainnyaKategori.addEventListener('click', () => {
                    btnTabLainnyaKategori.style.color = '#0ea5e9';
                    btnTabLainnyaKategori.style.borderBottomColor = '#0ea5e9';
                    btnTabLainnyaTransaksi.style.color = '#64748b';
                    btnTabLainnyaTransaksi.style.borderBottomColor = 'transparent';

                    contentLainnyaTransaksi.style.display = 'none';
                    contentLainnyaKategori.style.display = 'block';
                });
            }
            const btnBackOmzet = document.getElementById('btn-back-omzet');
            const layoutOmzet = document.getElementById('layout-omzet');
            if (btnBackOmzet && layoutOmzet) {
                btnBackOmzet.addEventListener('click', () => {
                    layoutOmzet.classList.remove('active');
                    setTimeout(() => {
                        layoutOmzet.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExportOmzet = document.getElementById('btn-export-omzet');
            if (btnExportOmzet) {
                btnExportOmzet.addEventListener('click', () => {
                    window.showToast('Mengekspor data Omzet...');
                    let data = window.currentOmzetExportData || [];
                    if (data.length === 0) {
                        window.showToast('Tidak ada data untuk diekspor');
                        return;
                    }
                    window.exportToExcel(data, 'Laporan_Omzet_Manjur');
                });
            }
            const btnRefreshOmzet = document.getElementById('btn-refresh-omzet');
            if (btnRefreshOmzet) {
                btnRefreshOmzet.addEventListener('click', () => {
                    const icon = document.getElementById('omzet-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        showToast('Memperbarui data omzet...');
                    }, 800);
                });
            }

            // Toggle Per Jam / Per Tanggal
            (function() {
                const btnTogglePerjam = document.getElementById('btn-toggle-perjam');
                const btnTogglePertanggal = document.getElementById('btn-toggle-pertanggal');
                const omzetThWaktu = document.getElementById('omzet-th-waktu');
                const omzetTbody = document.getElementById('omzet-tbody');

                let currentOmzetViewMode = 'per-tanggal'; // 'per-jam' or 'per-tanggal'
                
                window.renderOmzetData = function(filterVal) {
                const pemasukan = typeof window.getMergedPemasukan === 'function' ? window.getMergedPemasukan() : (JSON.parse(localStorage.getItem('db_pemasukan')) || []);
                const chartData = generateLast7DaysData(filterVal);
                
                // Get the list of dates from chartData or regenerate it to filter transactions
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                let dateList = [];
                
                if (filterVal === 'hari-ini') { dateList.push(new Date(today)); }
                else if (filterVal === 'kemarin') { let d = new Date(today); d.setDate(today.getDate()-1); dateList.push(d); }
                else if (filterVal === '7-hari') { for(let i=6; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal === '30-hari') { for(let i=29; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal === 'bulan-ini') { for(let i=today.getDate()-1; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); } }
                else if (filterVal === 'CUSTOM_MONTH_-') {
                    let daysInM = new Date(window.currentMonthPickerYear || today.getFullYear(), (window.selectedMonthIndex !== undefined ? window.selectedMonthIndex : today.getMonth()) + 1, 0).getDate();
                    for(let i=1; i<=daysInM; i++) { dateList.push(new Date(window.currentMonthPickerYear || today.getFullYear(), window.selectedMonthIndex !== undefined ? window.selectedMonthIndex : today.getMonth(), i)); }
                }
                else if (filterVal === 'CUSTOM_DATE_RANGE') {
                    let sd = new Date(window.calStartYear, window.calStartMonth, window.calStartDay);
                    let ed = window.calEndDay !== null ? new Date(window.calEndYear, window.calEndMonth, window.calEndDay) : new Date(window.calStartYear, window.calStartMonth, window.calStartDay);
                    if (sd > ed) { let temp = sd; sd = ed; ed = temp; }
                    let d = new Date(sd);
                    while(d <= ed) { dateList.push(new Date(d)); d.setDate(d.getDate()+1); }
                } else {
                    for(let i=6; i>=0; i--){ let d = new Date(today); d.setDate(today.getDate()-i); dateList.push(d); }
                }

                const dateStrings = dateList.map(d => {
                    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                });
                
                let filteredTrx = [];
                let totalNominal = 0;
                
                pemasukan.forEach(trx => {
                    if (trx.status !== 'batal' && trx.status !== 'Batal' && !trx.type) {
                        let trxDateObj = window.parseDateString ? window.parseDateString(trx.date, trx.id, trx.estDate) : new Date(trx.date);
                        if (trxDateObj && !isNaN(trxDateObj.getTime())) {
                            let trxDStr = `${trxDateObj.getFullYear()}-${(trxDateObj.getMonth() + 1).toString().padStart(2, '0')}-${trxDateObj.getDate().toString().padStart(2, '0')}`;
                            if (dateStrings.includes(trxDStr)) {
                                filteredTrx.push(trx);
                                totalNominal += parseFloat(trx.total || 0);
                            }
                        }
                    }
                });

                const totalNominalEl = document.getElementById('omzet-total-nominal');
                if (totalNominalEl) totalNominalEl.innerText = totalNominal.toLocaleString('en-US');

                const emptyState = document.getElementById('omzet-empty-state');
                const dataState = document.getElementById('omzet-data-state');
                
                if (filteredTrx.length === 0) {
                    if (emptyState) emptyState.style.display = 'flex';
                    if (dataState) dataState.style.display = 'none';
                } else {
                    if (emptyState) emptyState.style.display = 'none';
                    if (dataState) dataState.style.display = 'block';
                }

                window.currentOmzetExportData = filteredTrx.map(trx => {
                    let itemsStr = '';
                    if (trx.items && Array.isArray(trx.items)) {
                        itemsStr = trx.items.map(i => `${i.name} (${i.qty})`).join(', ');
                    }
                    
                    let dObj = new Date(trx.date);
                    let formattedDate = `${dObj.getDate().toString().padStart(2, '0')}/${(dObj.getMonth() + 1).toString().padStart(2, '0')}/${dObj.getFullYear()} ${dObj.getHours().toString().padStart(2, '0')}:${dObj.getMinutes().toString().padStart(2, '0')}`;
                    
                    return {
                        'ID Pesanan': trx.id || '-',
                        'Tanggal': formattedDate,
                        'Pelanggan': trx.customerName || 'Umum',
                        'Item': itemsStr || '-',
                        'Total Harga (Rp)': parseFloat(trx.total || 0),
                        'Status': trx.status || '-'
                    };
                });

                let tableHtml = '';
                
                if (currentOmzetViewMode === 'per-tanggal') {
                    if (omzetThWaktu) omzetThWaktu.innerText = 'Tanggal';
                    let grouped = {};
                    dateStrings.reverse().forEach(ds => grouped[ds] = { count: 0, nominal: 0 });
                    filteredTrx.forEach(trx => {
                        let trxDateObj = window.parseDateString ? window.parseDateString(trx.date, trx.id, trx.estDate) : new Date(trx.date);
                        let trxDStr = `${trxDateObj.getFullYear()}-${(trxDateObj.getMonth() + 1).toString().padStart(2, '0')}-${trxDateObj.getDate().toString().padStart(2, '0')}`;
                        if (grouped[trxDStr]) {
                            grouped[trxDStr].count++;
                            grouped[trxDStr].nominal += parseFloat(trx.total || 0);
                        }
                    });
                    
                    for (let ds in grouped) {
                        if (grouped[ds].count > 0 || dateStrings.length <= 7) { // Only show empty if it's a short range
                            let [y, m, d] = ds.split('-');
                            tableHtml += `
                                <tr>
                                    <td style="padding-bottom:15px;">${d}/${m}/${y}</td>
                                    <td style="padding-bottom:15px; text-align:center;">${grouped[ds].count}</td>
                                    <td style="padding-bottom:15px; text-align:right;">${grouped[ds].nominal.toLocaleString('en-US')}</td>
                                </tr>
                            `;
                        }
                    }
                } else {
                    if (omzetThWaktu) omzetThWaktu.innerText = 'Jam';
                    let grouped = {};
                    for (let i = 0; i < 24; i++) {
                        let h = i.toString().padStart(2, '0');
                        grouped[h] = { count: 0, nominal: 0 };
                    }
                    filteredTrx.forEach(trx => {
                        let trxDateObj = new Date(trx.date);
                        let h = trxDateObj.getHours().toString().padStart(2, '0');
                        grouped[h].count++;
                        grouped[h].nominal += parseFloat(trx.total || 0);
                    });
                    
                    for (let i = 0; i < 24; i++) {
                        let h = i.toString().padStart(2, '0');
                        if (grouped[h].count > 0) {
                            let nextH = (i + 1).toString().padStart(2, '0');
                            tableHtml += `
                                <tr>
                                    <td style="padding-bottom:15px;">${h}:00 - ${nextH}:00</td>
                                    <td style="padding-bottom:15px; text-align:center;">${grouped[h].count}</td>
                                    <td style="padding-bottom:15px; text-align:right;">${grouped[h].nominal.toLocaleString('en-US')}</td>
                                </tr>
                            `;
                        }
                    }
                }
                
                if (tableHtml === '') {
                    tableHtml = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#94a3b8;">Tidak ada transaksi</td></tr>`;
                }
                
                if (omzetTbody) omzetTbody.innerHTML = tableHtml;
            }

            if (btnTogglePerjam && btnTogglePertanggal) {
                btnTogglePerjam.addEventListener('click', () => {
                    currentOmzetViewMode = 'per-jam';
                    btnTogglePerjam.style.background = '#3b82f6';
                    btnTogglePerjam.style.color = '#fff';
                    btnTogglePertanggal.style.background = 'transparent';
                    btnTogglePertanggal.style.color = '#3b82f6';
                    const filterVal = document.getElementById('omzet-date-filter').value || '7-hari';
                    renderOmzetData(filterVal);
                });

                btnTogglePertanggal.addEventListener('click', () => {
                    currentOmzetViewMode = 'per-tanggal';
                    btnTogglePertanggal.style.background = '#3b82f6';
                    btnTogglePertanggal.style.color = '#fff';
                    btnTogglePerjam.style.background = 'transparent';
                    btnTogglePerjam.style.color = '#3b82f6';
                    const filterVal = document.getElementById('omzet-date-filter').value || '7-hari';
                    renderOmzetData(filterVal);
                });
            }

            // Filter Tanggal Omzet
            const omzetDateFilter = document.getElementById('omzet-date-filter');
            const omzetDateText = document.getElementById('omzet-date-text');
            
            if (btnRefreshOmzet) {
                btnRefreshOmzet.addEventListener('click', () => {
                    if (omzetDateFilter) {
                        const evt = new Event('change');
                        omzetDateFilter.dispatchEvent(evt);
                    }
                });
            }

            if (omzetDateFilter && omzetDateText) {
                omzetDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    const today = new Date();
                    
                    if (val === 'per-tanggal') {
                        const datePickerModal = document.getElementById('custom-date-picker-modal');
                        if (datePickerModal) window.openDatePicker(omzetDateFilter);
                        return;
                    } else if (val === 'per-bulan') {
                        window.openMonthPicker(omzetDateFilter);
                        return;
                    }
                    
                    let textStr = '';
                    const formatDt = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    
                    if (val) {
                        if (val === 'hari-ini') textStr = formatDt(today);
                        else if (val === 'kemarin') { let d = new Date(today); d.setDate(today.getDate()-1); textStr = formatDt(d); }
                        else if (val === '7-hari') { let past = new Date(today); past.setDate(today.getDate()-6); textStr = `${formatDt(past)} - ${formatDt(today)}`; }
                        else if (val === '30-hari') { let past = new Date(today); past.setDate(today.getDate()-29); textStr = `${formatDt(past)} - ${formatDt(today)}`; }
                        else if (val === 'bulan-ini') {
                            let past = new Date(today.getFullYear(), today.getMonth(), 1);
                            textStr = `${formatDt(past)} - ${formatDt(today)}`;
                        }
                        else if (val === 'CUSTOM_MONTH_-') {
                            const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                            textStr = `${mNames[window.selectedMonthIndex]} ${window.currentMonthPickerYear}`;
                        }
                        else if (val === 'CUSTOM_DATE_RANGE') {
                            const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                            let endStr = '';
                            if (window.calEndDay !== null && (window.calEndDay !== window.calStartDay || window.calEndMonth !== window.calStartMonth || window.calEndYear !== window.calStartYear)) {
                                endStr = ` - ${window.calEndDay.toString().padStart(2, '0')} ${mNames[window.calEndMonth]} ${window.calEndYear}`;
                            }
                            textStr = `${window.calStartDay.toString().padStart(2, '0')} ${mNames[window.calStartMonth]} ${window.calStartYear}${endStr}`;
                        }
                        
                        omzetDateText.innerText = textStr;
                        if (typeof window.initOmzetChart === 'function') window.initOmzetChart(val);
                    }
                });
            }

            window.initOmzetChart = function (filterVal = 'bulan-ini') {
                const ctx = document.getElementById('omzetChart');
                if (!ctx) return;
                
                // Set default initial value if not set
                if (omzetDateFilter && !omzetDateFilter.value) {
                    omzetDateFilter.value = 'bulan-ini';
                    const evt = new Event('change');
                    omzetDateFilter.dispatchEvent(evt);
                    return; // The event will recall initOmzetChart
                }

                // Call the new table render logic
                renderOmzetData(filterVal);

                const chartData = generateLast7DaysData(filterVal);

                const data = {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Total Pemasukan Harian',
                        data: chartData.dataPemasukan,
                        borderColor: '#3b82f6',
                        backgroundColor: (context) => {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return null;
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.0)'); // Transparent at bottom
                            gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)'); // Slight blue
                            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)'); // Stronger blue at top
                            return gradient;
                        },
                        borderWidth: 3, // Thicker line
                        tension: 0.4, // Smooth curve
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#3b82f6',
                        pointBorderWidth: 3,
                        pointRadius: 0, // Hide points by default for a cleaner look
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#3b82f6',
                        pointHoverBorderColor: '#ffffff',
                        pointHoverBorderWidth: 2
                    }]
                };

                const config = {
                    type: 'line',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                            duration: 1000,
                            easing: 'easeOutQuart'
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                titleColor: '#0f172a',
                                bodyColor: '#334155',
                                borderColor: 'rgba(226, 232, 240, 0.8)',
                                borderWidth: 1,
                                padding: 12,
                                cornerRadius: 12,
                                displayColors: false,
                                usePointStyle: true,
                                titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: '700' },
                                bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '500' },
                                boxPadding: 6,
                                callbacks: {
                                    title: function(context) {
                                        return context[0].label;
                                    },
                                    label: function (context) {
                                        return 'Pendapatan: Rp ' + context.parsed.y.toLocaleString('id-ID');
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false },
                                border: { display: false },
                                ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, color: '#94a3b8' }, padding: 10 }
                            },
                            y: {
                                beginAtZero: true,
                                grid: { color: '#f1f5f9', borderDash: [4, 4], drawBorder: false },
                                border: { display: false },
                                ticks: {
                                    padding: 15,
                                    callback: function (value) {
                                        if (value === 0) return '0';
                                        if (value >= 1000000) return (value / 1000000) + 'jt';
                                        return (value / 1000) + 'k';
                                    },
                                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, color: '#94a3b8' }
                                }
                            }
                        }
                    }
                };

                if (window.omzetChartInstance) window.omzetChartInstance.destroy();
                window.omzetChartInstance = new Chart(ctx.getContext('2d'), config);
            };

            })(); // End IIFE for Omzet view logic

            // --- KASIR POS LOGIC (2-STEP REDESIGN) ---
            let orderHistory = (typeof window.getMergedPemasukan === 'function') ? window.getMergedPemasukan() : JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
            let globalCustomers = JSON.parse(localStorage.getItem('db_pelanggan') || '[]');

            window.reloadKasirData = function () {
                orderHistory = (typeof window.getMergedPemasukan === 'function') ? window.getMergedPemasukan() : JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                globalCustomers = JSON.parse(localStorage.getItem('db_pelanggan') || '[]');
                if (typeof renderDashboardPesanan === 'function') renderDashboardPesanan();
                if (typeof renderCustomerSelect === 'function') renderCustomerSelect();
            };

            let cartData = [];
            let selectedService = null;
            const posCustomerSelect = document.getElementById('pos-customer-select');
            function renderCustomerSelect() {
                if (!posCustomerSelect) return;
                const datalist = document.getElementById('pos-customer-datalist');
                if (!datalist) return;

                let html = '';
                // Urutkan pelanggan secara alfabetis (A-Z)
                let sortedCustomers = [...globalCustomers].sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));

                sortedCustomers.forEach(c => {
                    let phoneStr = c.telepon ? ' (' + c.telepon + ')' : '';
                    html += '<option value="' + c.nama + '">' + c.nama + phoneStr + '</option>';
                });
                datalist.innerHTML = html;
            }
            renderCustomerSelect();
            renderCariPelanggan();

            const memberInfoBox = document.getElementById('member-info-box');
            const memberNameDisp = document.getElementById('member-name-disp');
            const memberPhoneDisp = document.getElementById('member-phone-disp');
            const memberBadgeDisp = document.getElementById('member-badge-disp');
            const lblDiskon = document.getElementById('lbl-diskon');

            // Customer selection logic
            // Customer selection logic
            posCustomerSelect?.addEventListener('input', (e) => {
                let val = e.target.value;
                let cust = globalCustomers.find(c => c.nama === val);
                if (cust) {
                    memberNameDisp.innerText = cust.nama;
                    memberPhoneDisp.innerText = cust.telepon || '-';
                    memberBadgeDisp.style.display = 'none'; // Tambahkan badge logika jika perlu
                    lblDiskon.innerText = 'Diskon Member (0%)';
                } else {
                    memberNameDisp.innerText = '-';
                    memberPhoneDisp.innerText = '-';
                    memberBadgeDisp.style.display = 'none';
                    lblDiskon.innerText = 'Diskon Member (0%)';
                }
                updateCartUI(); // re-calc discount
            });

            // Accordion Logic
            const btnExpandAll = document.getElementById('btn-expand-all');
            let allExpanded = false;
            btnExpandAll?.addEventListener('click', () => {
                allExpanded = !allExpanded;
                btnExpandAll.innerHTML = allExpanded ? '<i class="fa-solid fa-folder-minus"></i> Tutup Semua' : '<i class="fa-solid fa-folder-open"></i> Buka Semua';
                document.querySelectorAll('.service-accordion-body').forEach(body => {
                    if (allExpanded) body.classList.add('open');
                    else body.classList.remove('open');
                });
            });

            document.querySelectorAll('.service-accordion-header').forEach(header => {
                header.addEventListener('click', () => {
                    header.nextElementSibling.classList.toggle('open');
                });
            });

            // Filter Chips
            document.querySelectorAll('.service-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    document.querySelectorAll('.service-tab').forEach(t => t.classList.remove('active'));
                    e.target.closest('.service-tab').classList.add('active');

                    let filter = e.target.closest('.service-tab').dataset.filter;
                    document.querySelectorAll('.service-accordion-item').forEach(item => {
                        if (filter === 'all' || item.dataset.category === filter) item.style.display = 'block';
                        else item.style.display = 'none';
                    });
                });
            });

            // Select Service
            const btnSelectServices = document.querySelectorAll('.btn-select-service');
            const inputQty = document.getElementById('input-qty');
            const lblUnit = document.getElementById('lbl-unit');

            // (Logic btn-select-service lama telah dipindah dan diadaptasi di fungsi renderPOSServices)

            // Add to Cart
            document.getElementById('btn-add-to-cart')?.addEventListener('click', () => {
                if (!selectedService) {
                    if (window.Swal) Swal.fire('Perhatian', 'Pilih layanan terlebih dahulu!', 'warning');
                    else alert('Pilih layanan terlebih dahulu!');
                    return;
                }

                let qty = parseFloat(inputQty.value) || 0;
                if (qty <= 0) {
                    if (window.Swal) Swal.fire('Perhatian', 'Masukkan kuantitas yang valid!', 'warning');
                    else alert('Masukkan kuantitas yang valid!');
                    return;
                }

                let isSpotting = document.getElementById('input-spotting').checked;
                let parfum = document.getElementById('input-parfum').value;
                let catatan = document.getElementById('input-catatan').value;

                let total = selectedService.price * qty;
                let extra = 0;
                if (isSpotting) extra += 10000;
                if (parfum === 'Premium') extra += 2000;

                cartData.push({
                    name: selectedService.name,
                    qty: qty,
                    satuan: selectedService.unit,
                    price: selectedService.price,
                    spotting: isSpotting,
                    parfum: parfum,
                    catatan: catatan,
                    extraFee: extra,
                    total: total + extra
                });

                // reset
                selectedService = null;
                inputQty.value = '';
                document.getElementById('input-spotting').checked = false;
                document.getElementById('input-parfum').selectedIndex = 0;
                document.getElementById('input-catatan').value = '';
                btnSelectServices.forEach(b => { b.classList.remove('selected'); b.innerText = 'Pilih'; });
                lblUnit.innerText = 'Kg';

                updateCartUI();
            });

            const cartItemsContainer = document.getElementById('cart-items-container');
            const summSubtotal = document.getElementById('summ-subtotal');
            const summExtras = document.getElementById('summ-extras');
            const summDiskon = document.getElementById('summ-diskon');
            const summTotal = document.getElementById('summ-total');
            const btnClearCart = document.getElementById('btn-clear-cart');

            btnClearCart?.addEventListener('click', () => {
                cartData = [];
                updateCartUI();
            });

            function updateCartUI() {
                if (!cartItemsContainer) return;
                cartItemsContainer.innerHTML = '';
                if (cartData.length === 0) {
                    cartItemsContainer.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">Keranjang masih kosong</div>';
                    summSubtotal.innerText = 'Rp 0';
                    summExtras.innerText = 'Rp 0';
                    summDiskon.innerText = '- Rp 0';
                    summTotal.innerText = 'Rp 0';
                    calculateKembalian();
                    return;
                }

                let subtotalLayanan = 0;
                let totalExtras = 0;

                cartData.forEach((item, index) => {
                    subtotalLayanan += (item.price * item.qty);
                    totalExtras += item.extraFee;

                    let div = document.createElement('div');
                    div.className = 'cart-item-row';
                    div.innerHTML = `
                <div style="flex:1;">
                    <h5 class="cart-item-name">${item.name} (${item.qty} ${item.satuan || ''})</h5>
                    <div class="cart-item-meta">${item.parfum === 'Premium' ? 'Parfum Premium' : ''} ${item.spotting ? '+ Spotting' : ''}</div>
                </div>
                <div class="cart-item-price">${item.total.toLocaleString('id-ID')}</div>
                <button class="btn-del-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
            `;
                    cartItemsContainer.appendChild(div);
                });

                document.querySelectorAll('.btn-del-item').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        let idx = parseInt(e.target.closest('button').dataset.index);
                        cartData.splice(idx, 1);
                        updateCartUI();
                    });
                });

                summSubtotal.innerText = 'Rp ' + subtotalLayanan.toLocaleString('id-ID');
                summExtras.innerText = 'Rp ' + totalExtras.toLocaleString('id-ID');

                let grossTotal = subtotalLayanan + totalExtras;
                let discount = 0;
                if (posCustomerSelect.value === 'Budi Santoso') discount = grossTotal * 0.10; // 10% Gold Member

                summDiskon.innerText = '- Rp ' + discount.toLocaleString('id-ID');

                let finalTotal = grossTotal - discount;
                summTotal.innerText = 'Rp ' + finalTotal.toLocaleString('id-ID');

                window.currentTotalTagihan = finalTotal;
                calculateKembalian();
            }

            // Payment Methods
            document.querySelectorAll('.btn-pay-method').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.btn-pay-method').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });

            const inputUang = document.getElementById('input-uang');
            const statusBadge = document.getElementById('status-badge');

            document.getElementById('btn-uang-pas')?.addEventListener('click', () => {
                if (window.currentTotalTagihan) {
                    inputUang.value = window.currentTotalTagihan;
                    calculateKembalian();
                }
            });

            inputUang?.addEventListener('input', calculateKembalian);

            function calculateKembalian() {
                if (!window.currentTotalTagihan) {
                    if (statusBadge) {
                        statusBadge.innerText = 'Belum Lunas';
                        statusBadge.className = 'status-badge belum-lunas';
                    }
                    return;
                }
                let received = parseFloat(inputUang.value) || 0;
                if (received >= window.currentTotalTagihan) {
                    let kembalian = received - window.currentTotalTagihan;
                    statusBadge.innerText = 'Lunas (Kembali ' + kembalian.toLocaleString('id-ID') + ')';
                    statusBadge.className = 'status-badge lunas';
                } else {
                    statusBadge.innerText = 'Belum Lunas';
                    statusBadge.className = 'status-badge belum-lunas';
                }
            }

            const btnSimpanPesananBaru = document.getElementById('btn-simpan-pesanan-baru');
            const btnSimpanCetakBaru = document.getElementById('btn-simpan-cetak-baru');
            const posNotaBadgeId = document.getElementById('nota-badge-id');

            function generateNota() {
                let orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                let date = new Date();
                let mm = (date.getMonth() + 1).toString().padStart(2, '0');
                let yy = date.getFullYear().toString().slice(-2);
                let prefix = `MJL-${mm}${yy}-`;

                let maxUrut = 0;
                orderHistory.forEach(order => {
                    if (order.id && order.id.startsWith(prefix)) {
                        let parts = order.id.split('-');
                        if (parts.length === 3) {
                            let num = parseInt(parts[2], 10);
                            if (!isNaN(num) && num > maxUrut) {
                                maxUrut = num;
                            }
                        }
                    }
                });

                let nextUrut = (maxUrut + 1).toString().padStart(3, '0');
                return prefix + nextUrut;
            }

            function processSaveOrder(shouldPrint) {
                if (!posCustomerSelect.value) {
                    if (window.Swal) Swal.fire('Perhatian', 'Pilih pelanggan terlebih dahulu!', 'warning');
                    else alert('Pilih pelanggan terlebih dahulu!');
                    return;
                }
                
                const posPegawaiSelect = document.getElementById('pos-pegawai-select');
                if (!window.editingOrderId && (!posPegawaiSelect || !posPegawaiSelect.value)) {
                    if (window.Swal) Swal.fire('Perhatian', 'Pilih pegawai yang mengerjakan terlebih dahulu!', 'warning');
                    else alert('Pilih pegawai yang mengerjakan terlebih dahulu!');
                    return;
                }

                if (cartData.length === 0) {
                    if (window.Swal) Swal.fire('Kosong', 'Tambahkan pesanan ke keranjang dulu!', 'warning');
                    else alert('Tambahkan pesanan ke keranjang dulu!');
                    return;
                }

                let finalTotal = window.currentTotalTagihan || 0;
                let currentDate = new Date();

                const formatDate = (date) => {
                    let pad = (n) => n.toString().padStart(2, '0');
                    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':00';
                };

                let dateStr = formatDate(currentDate);
                let estDate = new Date(currentDate);
                estDate.setDate(estDate.getDate() + 1);

                let dibayar = parseFloat(inputUang.value) || 0;
                let cashbox = document.querySelector('.btn-pay-method.active') ? document.querySelector('.btn-pay-method.active').getAttribute('data-method') : 'Tunai';

                let paymentHistory = [];
                if (dibayar > 0) {
                    paymentHistory.push({
                        date: new Date().toISOString(),
                        amount: dibayar,
                        method: cashbox
                    });
                }

                // Jika sedang edit order dan order sebelumnya punya riwayat, pertahankan (hanya jika riwayat belum diubah lewat menu cicilan). Tapi ini mode POS kasir, jadi kita timpa dengan pembayaran baru jika dibayar diisi, atau kita biarkan. 
                // Untuk amannya, karena ini Kasir (biasanya buat order baru atau replace total), kita pakai paymentHistory baru.

                let newOrder = {
                    id: window.editingOrderId ? window.editingOrderId : (posNotaBadgeId ? posNotaBadgeId.innerText : 'TRX/123'),
                    customerName: posCustomerSelect.value,
                    pegawaiId: posPegawaiSelect ? posPegawaiSelect.value : '',
                    date: window.editingOrderId ? window.editingOrderOriginalDate : dateStr,
                    estDate: formatDate(estDate),
                    items: JSON.parse(JSON.stringify(cartData)), // clone
                    total: finalTotal,
                    cashbox: cashbox,
                    dibayar: dibayar,
                    status: window.editingOrderId ? window.editingOrderStatus : 'validasi',
                    paymentHistory: paymentHistory
                };

                // Hindari double-click bug
                cartData = [];
                updateCartUI();

                if (window.editingOrderId) {
                    let index = orderHistory.findIndex(o => o.id === window.editingOrderId);
                    if (index !== -1) orderHistory[index] = newOrder;
                    else orderHistory.unshift(newOrder); // Fallback
                } else {
                    orderHistory.unshift(newOrder);
                }

                localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));

                const onSaved = () => {
                    cartData = [];
                    updateCartUI();
                    posCustomerSelect.value = '';
                    if (memberNameDisp) memberNameDisp.innerText = '-';
                    if (memberPhoneDisp) memberPhoneDisp.innerText = '-';
                    if (memberBadgeDisp) memberBadgeDisp.style.display = 'none';
                    inputUang.value = '';

                    // CLEAR EDIT STATE
                    window.editingOrderId = null;
                    window.editingOrderOriginalDate = null;
                    window.editingOrderStatus = null;
                    if(posPegawaiSelect) posPegawaiSelect.value = '';

                    if (posNotaBadgeId) posNotaBadgeId.innerText = generateNota();

                    renderDashboardPesanan();
                    if (shouldPrint) {
                        currentActiveOrder = newOrder;
                        if (typeof hideAllLayouts === 'function') hideAllLayouts();
                        if (typeof renderNota === 'function') renderNota(newOrder);

                        const layoutNotaEl = document.getElementById('layout-nota');
                        if (layoutNotaEl) {
                            layoutNotaEl.style.display = 'block';
                            layoutNotaEl.classList.add('active');
                        }

                        // Prioritaskan Bluetooth Printer
                        if (typeof btPrinter !== 'undefined') {
                            btPrinter.print(newOrder);
                        } else if (typeof window.printReceiptBrowser === 'function') {
                            window.printReceiptBrowser(newOrder);
                        }
                    } else {
                        showDetailPesanan(newOrder);
                    }
                };

                if (shouldPrint) {
                    onSaved();
                } else {
                    if (window.Swal) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Pesanan Tersimpan!',
                            text: 'Dialihkan ke detail pesanan...',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(onSaved);
                    } else {
                        alert('Pesanan Tersimpan!');
                        onSaved();
                    }
                }
            }

            if (btnSimpanPesananBaru) {
                btnSimpanPesananBaru.addEventListener('click', () => processSaveOrder(false));
            }
            if (btnSimpanCetakBaru) {
                btnSimpanCetakBaru.addEventListener('click', () => processSaveOrder(true));
            }
            // --- PESANAN & THERMAL PRINTER LOGIC ---
            let currentActiveOrder = null;

            const layoutPesananHariIni = document.getElementById('layout-pesanan-hari-ini');
            const layoutDetailPesanan = document.getElementById('layout-detail-pesanan');
            const layoutNota = document.getElementById('layout-nota');
            const listPesananContainer = document.getElementById('list-pesanan-container');

            // Navigation
            document.getElementById('btn-pesanan-hari-ini')?.addEventListener('click', () => {
                closeBottomSheet();
                hideAllLayouts();
                renderPesananHariIni();
                layoutPesananHariIni.style.display = 'block';
                setTimeout(() => layoutPesananHariIni.classList.add('active'), 10);
            });

            document.getElementById('btn-back-pesanan-hari-ini')?.addEventListener('click', () => {
                layoutPesananHariIni.classList.remove('active');
                setTimeout(() => {
                    layoutPesananHariIni.style.display = 'none';
                    layoutMain.style.display = 'flex';
                    layoutMain.classList.add('active');
                }, 300);
            });

            const goToNotaFromDetail = () => {
                hideAllLayouts();
                renderNota(currentActiveOrder);
                layoutNota.style.display = 'block';
                setTimeout(() => layoutNota.classList.add('active'), 10);
            };

            document.getElementById('btn-detail-to-nota')?.addEventListener('click', goToNotaFromDetail);
            document.getElementById('btn-dp-cetak-nota-besar')?.addEventListener('click', goToNotaFromDetail);

            document.getElementById('btn-back-detail-pesanan')?.addEventListener('click', () => {
                layoutDetailPesanan.classList.remove('active');
                setTimeout(() => {
                    layoutDetailPesanan.style.display = 'none';
                    layoutMain.style.display = 'flex';
                    layoutMain.classList.add('active');
                }, 300);
            });

            document.getElementById('btn-back-nota')?.addEventListener('click', () => {
                layoutNota.classList.remove('active');
                setTimeout(() => {
                    layoutNota.style.display = 'none';
                    layoutDetailPesanan.style.display = 'block';
                    layoutDetailPesanan.classList.add('active');
                }, 300);
            });

            document.getElementById('btn-detail-to-nota')?.addEventListener('click', () => {
                hideAllLayouts();
                renderNota(currentActiveOrder);
                layoutNota.style.display = 'block';
                setTimeout(() => layoutNota.classList.add('active'), 10);
            });

            document.getElementById('btn-dp-detail')?.addEventListener('click', () => {
                hideAllLayouts();
                renderNota(currentActiveOrder);
                layoutNota.style.display = 'block';
                setTimeout(() => layoutNota.classList.add('active'), 10);
            });

            function hideAllLayouts() {
                document.querySelectorAll('.layout').forEach(l => {
                    l.classList.remove('active');
                    l.style.display = 'none';
                });
            }

            function renderPesananHariIni() {
                listPesananContainer.innerHTML = '';
                if (orderHistory.length === 0) {
                    listPesananContainer.innerHTML = '<p style="text-align:center; color:#94a3b8;">Belum ada pesanan hari ini.</p>';
                    return;
                }

                orderHistory.forEach(order => {
                    let card = document.createElement('div');
                    card.className = 'list-pesanan-card';
                    card.innerHTML = `
                <div>
                    <h4 style="margin:0; font-size:1rem; color:var(--text-dark);">${order.customerName}</h4>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">${order.id}</p>
                    <span style="display:inline-block; margin-top:5px; padding:2px 8px; background:#e0f2fe; color:#0ea5e9; border-radius:10px; font-size:0.75rem;">${order.status}</span>
                </div>
                <div style="text-align:right;">
                    <h4 style="margin:0; font-size:1rem; color:var(--primary-color);">${order.total.toLocaleString('id-ID')}</h4>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">${order.date}</p>
                </div>
            `;
                    card.addEventListener('click', () => {
                        hideAllLayouts();
                        showDetailPesanan(order);
                    });
                    listPesananContainer.appendChild(card);
                });
            }

            function showDetailPesanan(order) {
                currentActiveOrder = order;
                document.getElementById('dp-nota-id').innerText = order.id;
                document.getElementById('dp-date').innerText = order.date.split('T')[0];
                document.getElementById('dp-cust-name').innerText = order.customerName;
                document.getElementById('dp-tagihan').innerText = order.total.toLocaleString('id-ID');
                document.getElementById('dp-est-selesai').innerText = order.estDate;

                let itemsContainer = document.getElementById('dp-items-container');
                itemsContainer.innerHTML = '';
                
                let orderItems = order.items;
                if (typeof orderItems === 'string') {
                    try { orderItems = JSON.parse(orderItems); } catch(e) { orderItems = []; }
                }
                if (!orderItems) orderItems = [];
                
                orderItems.forEach(item => {
                    let div = document.createElement('div');
                    div.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid #f1f5f9;';
                    div.innerHTML = `
                <div>
                    <h5 style="margin:0; font-size:0.9rem; color:var(--text-dark);">${item.name}</h5>
                    <p style="margin:0; font-size:0.8rem; color:var(--text-muted);">${item.qty} ${item.satuan || ''} x ${item.price.toLocaleString('id-ID')}</p>
                    ${item.spotting ? '<p style="margin:0; font-size:0.75rem; color:#f59e0b;">+ Spotting (10.000)</p>' : ''}
                </div>
                <div style="font-weight:600; color:var(--text-dark);">
                    ${item.total.toLocaleString('id-ID')}
                </div>
            `;
                    itemsContainer.appendChild(div);
                });

                hideAllLayouts();
                layoutDetailPesanan.style.display = 'block';
                setTimeout(() => layoutDetailPesanan.classList.add('active'), 10);
            }

            window.togglePaymentPanel = function (orderId) {
                const panel = document.getElementById('payment-panel-' + orderId);
                if (panel) {
                    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                }
            };

            window.payCicilan = function (orderId) {
                const input = document.getElementById('cicilan-' + orderId);
                const methodSelect = document.getElementById('cicilan-method-' + orderId);
                if (!input || !input.value) return alert('Masukkan nominal cicilan!');
                let nominal = parseFloat(input.value) || 0;
                if (nominal <= 0) return alert('Nominal tidak valid!');
                let method = methodSelect ? methodSelect.value : 'Tunai';

                if (confirm('Simpan pembayaran sejumlah Rp ' + nominal.toLocaleString('id-ID') + ' (' + method + ')?')) {
                    const orderIdx = orderHistory.findIndex(o => o.id === orderId);
                    if (orderIdx > -1) {
                        let order = orderHistory[orderIdx];
                        order.dibayar = (order.dibayar || 0) + nominal;
                        
                        if (!order.paymentHistory) order.paymentHistory = [];
                        order.paymentHistory.push({
                            date: new Date().toISOString(),
                            amount: nominal,
                            method: method
                        });

                        localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));
                        renderDashboardPesanan();
                        if (window.Swal) Swal.fire('Berhasil', 'Pembayaran tersimpan!', 'success');
                    }
                }
            };

            window.markAsPaid = function (orderId, method = 'Tunai') {
                if (confirm('Tandai transaksi ' + orderId + ' sebagai LUNAS (' + method + ')?')) {
                    const orderIdx = orderHistory.findIndex(o => o.id === orderId);
                    if (orderIdx > -1) {
                        let order = orderHistory[orderIdx];
                        let sisa = order.total - (order.dibayar || 0);
                        
                        if (sisa > 0) {
                            if (!order.paymentHistory) order.paymentHistory = [];
                            order.paymentHistory.push({
                                date: new Date().toISOString(),
                                amount: sisa,
                                method: method
                            });
                        }

                        order.dibayar = order.total;
                        order.metodeBayar = method;
                        localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));
                        renderDashboardPesanan();
                        if (window.Swal) Swal.fire('Berhasil', 'Pesanan ditandai LUNAS!', 'success');
                    }
                }
            };

            window.deleteTransaction = function (orderId) {
                if (confirm('Yakin ingin menghapus pesanan ' + orderId + '? Data tidak bisa dikembalikan.')) {
                    const orderIdx = orderHistory.findIndex(o => o.id === orderId);
                    if (orderIdx !== -1) {
                        orderHistory.splice(orderIdx, 1);
                        localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));

                        window.showToast('Pesanan berhasil dihapus');
                        renderDashboardPesanan();
                        if (typeof window.initFinanceChart === 'function') window.initFinanceChart();
                        if (typeof initOmzetChart === 'function') initOmzetChart();
                    }
                }
            };

            window.editTransaction = function (orderId) {
                let order = orderHistory.find(o => o.id === orderId);
                if (!order) {
                    if (window.Swal) Swal.fire('Error', 'Pesanan tidak ditemukan!', 'error');
                    else alert('Pesanan tidak ditemukan!');
                    return;
                }

                // Set global edit state
                window.editingOrderId = order.id;
                window.editingOrderOriginalDate = order.date;
                window.editingOrderStatus = order.status;

                // Populate cart
                cartData = JSON.parse(JSON.stringify(order.items));
                updateCartUI();

                // Populate customer
                if (posCustomerSelect) {
                    posCustomerSelect.value = order.customerName;
                    // Trigger input event to update display
                    posCustomerSelect.dispatchEvent(new Event('input'));
                }
                
                // Populate pegawai
                if (typeof window.populatePosPegawai === 'function') window.populatePosPegawai();
                const posPegawaiSelect = document.getElementById('pos-pegawai-select');
                if (posPegawaiSelect) {
                    posPegawaiSelect.value = order.pegawaiId || '';
                }

                // Populate dibayar
                const inputUang = document.getElementById('input-uang');
                if (inputUang) {
                    inputUang.value = order.dibayar || '';
                }

                // Keep ID Nota
                const posNotaBadgeId = document.getElementById('pos-nota-badge-id');
                if (posNotaBadgeId) posNotaBadgeId.innerText = order.id;

                // Open POS layout
                if (typeof hideAllLayouts === 'function') hideAllLayouts();
                const layoutPos = document.getElementById('layout-pos');
                if (layoutPos) {
                    if(typeof window.populatePosPegawai === 'function') window.populatePosPegawai(); layoutPos.style.display = 'block';
                    setTimeout(() => layoutPos.classList.add('active'), 10);
                    if (typeof calcTotal === 'function') calcTotal();
                }
            };
            function renderDashboardPesanan() {
                window.renderDashboardPesanan = renderDashboardPesanan;
                const dashContainer = document.getElementById('dashboard-pesanan-list');
                if (!dashContainer) return;
                dashContainer.innerHTML = '';

                if (typeof window.getMergedPemasukan === 'function') {
                    orderHistory = window.getMergedPemasukan();
                } else {
                    try {
                        orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    } catch(e) {}
                }
                if (!Array.isArray(orderHistory)) orderHistory = [];

                if (orderHistory.length === 0) {
                    dashContainer.innerHTML = '<p style="padding:20px; text-align:center; color:var(--text-muted);">Belum ada pesanan.</p>';
                    updateDashboardCounts();
                    return;
                }

                orderHistory.forEach(order => {
                    if (!order || !order.id) return;
                    try {
                    let row = document.createElement('div');
                    row.className = 'pesanan-row';
                    const currentStatus = order.status || 'validasi';
                    row.setAttribute('data-status', currentStatus);
                    
                    let dibayarNum = parseInt((order.dibayar || '').toString().replace(/[^0-9-]/g, '')) || 0;
                    let totalNum = parseInt((order.total || '').toString().replace(/[^0-9-]/g, '')) || 0;
                    row.setAttribute('data-payment-status', dibayarNum >= totalNum ? 'lunas' : 'belum');

                    let isTerlambat = false;
                    let isMasuk = false;
                    let isHarusSelesai = false;
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (order.date && typeof order.date === 'string') {
                        let parts = order.date.split(' ')[0].split(/[\/-]/);
                        if (parts.length === 3) {
                            let y = parts[0].length === 4 ? parseInt(parts[0]) : parseInt(parts[2]);
                            if (y < 100) y += 2000;
                            let m = parseInt(parts[1]);
                            let d = parts[0].length === 4 ? parseInt(parts[2]) : parseInt(parts[0]);
                            let orderDate = new Date(y, m - 1, d);
                            orderDate.setHours(0,0,0,0);
                            
                            if (orderDate.getTime() === today.getTime()) {
                                isMasuk = true;
                            }
                            
                            if (currentStatus !== 'selesai' && currentStatus !== 'diambil') {
                                let estDate = new Date(orderDate);
                                estDate.setDate(estDate.getDate() + 1);
                                if (estDate.getTime() < today.getTime()) isTerlambat = true;
                                if (estDate.getTime() === today.getTime()) isHarusSelesai = true;
                            }
                        }
                    }
                    row.setAttribute('data-terlambat', isTerlambat ? 'true' : 'false');
                    row.setAttribute('data-masuk', isMasuk ? 'true' : 'false');
                    row.setAttribute('data-harus-selesai', isHarusSelesai ? 'true' : 'false');

                    // Format customer
                    let cName = String(order.customerName || 'Anonim');
                    if (cName.includes(' (')) cName = cName.split(' (')[0];

                    // First item as main service
                    let mainService = order.items.length > 0 ? order.items[0].name : 'Layanan';
                    let mainQty = order.items.length > 0 ? order.items[0].qty + (order.items[0].satuan || order.items[0].unit ? ' ' + (order.items[0].satuan || order.items[0].unit) : '') : '-';

                    // Cek lunas berdasarkan uang yang dibayar
                let isLunas = (order.dibayar || 0) >= order.total;

                    // Ubah row menjadi column flex agar accordion bisa ditaruh di bawahnya
                    row.style.flexDirection = 'column';
                    row.style.alignItems = 'stretch';
                    row.style.padding = '0'; // padding dipindah ke inner row

                    row.innerHTML = `
              <div style="display:grid; grid-template-columns: 130px 100px 140px 130px 90px 135px 110px 120px 1fr; align-items:center; gap: 15px; width:100%; padding:15px 20px; box-sizing:border-box;">
                <!-- Col 1: ID -->
                <div class="p-col">
                    <div class="p-id" style="white-space: nowrap; font-weight:700; color:#1e293b; font-size:0.85rem;" title="${order.id}">${order.id}</div>
                </div>
                
                <!-- Col 2: Date -->
                <div class="p-col" style="overflow: hidden;">
                    <div class="p-date" style="font-size:0.85rem; color:#64748b;">${(() => {
                        let dObj = window.parseDateString ? window.parseDateString(order.date, order.id, order.estDate) : new Date(order.date);
                        return dObj && !isNaN(dObj.getTime()) ? `${dObj.getFullYear()}-${(dObj.getMonth() + 1).toString().padStart(2, '0')}-${dObj.getDate().toString().padStart(2, '0')}` : (order.date || '').split('T')[0].split(' ')[0];
                    })()}</div>
                </div>
                
                <!-- Col 3: Customer -->
                <div class="p-col" style="overflow: hidden;">
                    <div class="p-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight:600; color:#3b82f6;" title="${cName}">${cName}</div>
                </div>
                
                <!-- Col 4: Service & Qty -->
                <div class="p-col">
                    <div class="p-service" style="font-size:0.85rem; font-weight:600; color:#334155;">${mainService}</div>
                    <div class="p-qty-group">
                        <span class="p-badge highlight" style="font-size:0.75rem; background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-weight:700;">${mainQty}</span>
                    </div>
                </div>
                
                <!-- Col 5: Price -->
                <div class="p-col">
                    <div class="p-price" style="font-weight:700; color:#10b981;">${parseFloat((parseFloat(order.total || 0) / 1000).toFixed(1))}k</div>
                </div>
                
                <!-- Col 6: Status -->
                <div class="p-col">
                    <select class="status-bayar-dropdown" style="width: 100%; padding:6px 12px; border-radius:12px; border:1px solid #e2e8f0; font-size:0.75rem; font-weight:700; background-color:${isLunas ? '#dcfce7' : '#fee2e2'}; color:${isLunas ? '#166534' : '#991b1b'}; cursor:pointer; outline:none; text-align:center;">
                        <option value="belum" ${!isLunas ? 'selected' : ''}>BELUM BAYAR</option>
                        <option value="lunas" ${isLunas ? 'selected' : ''}>LUNAS</option>
                    </select>
                </div>
                
                <!-- Col 7: Payment Method -->
                <div class="p-col" style="font-size: 0.85rem; font-weight:600; color:#475569;">
                    ${((order.dibayar || 0) > 0) ? (order.metodeBayar || order.cashbox || 'Tunai') : `<span onclick="event.stopPropagation(); togglePaymentPanel('${order.id}')" style="cursor:pointer; background:#fee2e2; color:#ef4444; padding:3px 8px; border-radius:12px; font-size:0.75rem;" title="Klik untuk bayar">- Bayar</span>`}
                </div>
                
                <!-- Col 8: Status Dropdown -->
                <div class="p-col">
                    <select class="status-dropdown" style="width: 100%; border-radius:8px; border:1px solid #cbd5e1; padding:6px 8px; font-size:0.8rem; background:#f8fafc; color:#1e293b; outline:none;">
                        <option value="validasi" ${order.status === 'validasi' ? 'selected' : ''}>Validasi</option>
                        <option value="antrian" ${order.status === 'antrian' ? 'selected' : ''}>Antrian</option>
                        <option value="cuci-jemur" ${order.status === 'cuci-jemur' ? 'selected' : ''}>cuci/Jemur</option>
                        <option value="setrika" ${order.status === 'setrika' ? 'selected' : ''}>Setrika</option>
                        <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>Selesai</option>
                        <option value="diambil" ${order.status === 'diambil' ? 'selected' : ''}>Diambil</option>
                    </select>
                </div>
                
                <!-- Col 9: Actions -->
                <div class="p-col p-actions" style="display:flex; flex-direction:row; justify-content:flex-end; gap:8px;">
                    <button class="btn-action-icon print print-dash" title="Nota" style="color: #3b82f6; border-color: #3b82f6;"><i class="fa-solid fa-receipt"></i></button>
                    <button class="btn-action-icon wa wa-dash" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></button>
                    <button class="btn-action-icon edit-btn" title="Edit" onclick="editTransaction('${order.id}')" style="display: ${localStorage.getItem('activeRole') === 'Admin' ? 'inline-flex' : 'none'}; color: #3b82f6;"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-action-icon del-btn" title="Hapus" onclick="deleteTransaction('${order.id}')" style="display: ${localStorage.getItem('activeRole') === 'Admin' ? 'inline-flex' : 'none'}; color: #ef4444;"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>
              
              <!-- Accordion Payment Panel -->
              <div id="payment-panel-${order.id}" class="payment-accordion" style="display:none; padding:15px 20px; box-sizing: border-box; background:#f8fafc; border-top:1px solid #e2e8f0; border-bottom-left-radius:12px; border-bottom-right-radius:12px;">
                 <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 15px;">
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <span style="font-size:0.9rem; font-weight:600; color:#334155;">Pelunasan:</span>
                        <button onclick="markAsPaid('${order.id}', 'Tunai')" style="padding:6px 12px; background:#3b82f6; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-money-bill"></i> Lunas (Tunai)</button>
                        <button onclick="markAsPaid('${order.id}', 'QRIS')" style="padding:6px 12px; background:#0ea5e9; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-qrcode"></i> Lunas (QRIS)</button>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; border-top:1px dashed #cbd5e1; padding-top:10px;">
                       <span style="font-size:0.85rem; font-weight:600; color:#64748b; margin-right: 5px;">Cicilan/DP:</span>
                       <select id="cicilan-method-${order.id}" style="padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.85rem; outline:none;">
                           <option value="Tunai">Tunai</option>
                           <option value="QRIS">QRIS</option>
                           <option value="Transfer">Transfer</option>
                       </select>
                       <input type="number" id="cicilan-${order.id}" placeholder="Nominal Rp..." style="padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; width:130px; font-size:0.85rem; outline:none;">
                       <button onclick="payCicilan('${order.id}')" style="padding:6px 15px; background:#f59e0b; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.85rem; font-weight:600;">Simpan</button>
                    </div>
                 </div>
                 
                 <!-- Riwayat Pembayaran -->
                 <div class="payment-history-container" style="border-top:1px dashed #cbd5e1; padding-top:10px;">
                    <div style="font-size:0.85rem; font-weight:700; color:#475569; margin-bottom:8px;"><i class="fa-solid fa-clock-rotate-left"></i> Riwayat Pembayaran</div>
                    ${(order.paymentHistory && order.paymentHistory.length > 0) ? 
                        order.paymentHistory.map(ph => `
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:#64748b; margin-bottom:4px; background:#fff; padding:6px 10px; border-radius:6px; border:1px solid #e2e8f0;">
                            <span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i> ${(() => { let ds = String((ph && ph.date) || ''); if (ds.includes('T')) { let p = ds.split('T'); return p[0] + (p[1] ? ' ' + p[1].substring(0, 5) : ''); } return ds.substring(0, 16); })()}</span>
                            <span style="background:#e0e7ff; color:#4f46e5; padding:2px 8px; border-radius:12px; font-weight:600; font-size:0.75rem;">${ph.method || 'Tunai'}</span>
                            <span style="font-weight:700; color:#10b981;">Rp ${(ph.amount).toLocaleString('id-ID')}</span>
                        </div>
                        `).join('') 
                    : '<div style="font-size:0.8rem; color:#94a3b8; font-style:italic;">Belum ada riwayat pembayaran.</div>'}
                 </div>
              </div>
            `;

                    row.querySelector('.print-dash').addEventListener('click', () => {
                        if (typeof renderNota === 'function') {
                            currentActiveOrder = order; // set global context just in case
                            renderNota(order);
                            const layoutNota = document.getElementById('layout-nota');
                            if (layoutNota) {
                                layoutNota.style.display = 'block';
                                setTimeout(() => layoutNota.classList.add('active'), 10);
                                
                                const btnBackNota = document.getElementById('btn-back-nota');
                                if (btnBackNota) {
                                    const oldBack = btnBackNota.onclick;
                                    btnBackNota.onclick = (e) => {
                                        if(e) e.stopPropagation();
                                        layoutNota.classList.remove('active');
                                        setTimeout(() => {
                                            layoutNota.style.display = 'none';
                                        }, 300);
                                        btnBackNota.onclick = oldBack;
                                    };
                                }
                            }
                        }
                    });
                    row.querySelector('.wa-dash').addEventListener('click', () => {
                        const cName = localStorage.getItem('company_name') || 'Manjur Laundry'; let text = `Halo, pesanan laundry Anda di ${cName} telah terdaftar.\nOrder ID: ${order.id}\nTotal: Rp ${order.total.toLocaleString('id-ID')}\nTerima kasih!`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    });
                    row.querySelector('.status-bayar-dropdown').addEventListener('change', (e) => {
                        let isSudah = e.target.value === 'lunas';
                        order.dibayar = isSudah ? order.total : 0;
                        e.target.style.backgroundColor = isSudah ? '#dcfce7' : '#fee2e2';
                        e.target.style.color = isSudah ? '#166534' : '#991b1b';
                        localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));
                        updateDashboardCounts();
                    });

                    row.querySelector('.status-dropdown').addEventListener('change', (e) => {
                        order.status = e.target.value;
                        row.setAttribute('data-status', order.status);
                        localStorage.setItem('db_pemasukan', JSON.stringify(orderHistory));
                        updateDashboardCounts();
                        const activeChip = document.querySelector('.p-tab-btn.active');
                        if (activeChip) filterPesanan(activeChip.getAttribute('data-filter'));
                    });

                    dashContainer.appendChild(row);
                    } catch (errRow) {
                        console.warn('Error rendering order row:', order && order.id, errRow);
                    }
                });

                // Update count setiap kali render selesai
                updateDashboardCounts();

                // Terapkan filter yang sedang aktif
                const activeChip = document.querySelector('.p-tab-btn.active');
                if (activeChip && typeof filterPesanan === 'function') filterPesanan(activeChip.getAttribute('data-filter'));
            }
            window.renderDashboardPesanan = renderDashboardPesanan;

            function updateDashboardCounts() {
                if (typeof window.getMergedPemasukan === 'function') {
                    orderHistory = window.getMergedPemasukan();
                } else {
                    try {
                        orderHistory = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    } catch(e) {}
                }
                if (!Array.isArray(orderHistory)) orderHistory = [];

                let today = new Date();
                today.setHours(0, 0, 0, 0);

                let todayOrderHistory = orderHistory.filter(o => {
                    if (!o || !o.date) return false;
                    let dObj = window.parseDateString ? window.parseDateString(o.date, o.id, o.estDate) : new Date(o.date);
                    if (dObj && !isNaN(dObj.getTime())) {
                        dObj.setHours(0, 0, 0, 0);
                        return dObj.getTime() === today.getTime();
                    }
                    return false;
                });

                let masukCount = todayOrderHistory.length;
                let semuaCount = orderHistory.filter(o => {
                    if (!o) return false;
                    const st = (o.status || 'validasi').toLowerCase();
                    return st !== 'selesai' && st !== 'diambil';
                }).length;
                let validasiCount = orderHistory.filter(o => o && (o.status || 'validasi').toLowerCase() === 'validasi').length;
                let antrianCount = orderHistory.filter(o => o && (o.status || '').toLowerCase() === 'antrian').length;
                let cuciCount = orderHistory.filter(o => {
                    if (!o) return false;
                    const st = (o.status || '').toLowerCase();
                    return st === 'cuci-jemur' || st === 'cuci';
                }).length;
                let setrikaCount = orderHistory.filter(o => o && (o.status || '').toLowerCase() === 'setrika').length;
                let selesaiCount = orderHistory.filter(o => o && (o.status || '').toLowerCase() === 'selesai').length;

                // Hitung Harus Selesai (hari ini) dan Terlambat
                let harusSelesaiCount = 0;
                let terlambatCount = 0;

                orderHistory.forEach(o => {
                    if (!o) return;
                    const st = (o.status || 'validasi').toLowerCase();
                    if (st !== 'selesai' && st !== 'diambil' && o.date) {
                        let orderDate = window.parseDateString ? window.parseDateString(o.date, o.id, o.estDate) : new Date(o.date);
                        if (orderDate && !isNaN(orderDate.getTime())) {
                            orderDate.setHours(0, 0, 0, 0);
                            let estDate;
                            if (o.estDate) {
                                estDate = window.parseDateString ? window.parseDateString(o.estDate) : new Date(o.estDate);
                            }
                            if (!estDate || isNaN(estDate.getTime())) {
                                estDate = new Date(orderDate);
                                estDate.setDate(estDate.getDate() + 1); // asumsikan default 1 hari selesai
                            }
                            estDate.setHours(0, 0, 0, 0);

                            if (estDate.getTime() === today.getTime()) {
                                harusSelesaiCount++;
                            } else if (estDate.getTime() < today.getTime()) {
                                terlambatCount++;
                            }
                        }
                    }
                });

                const updateEl = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = val;
                };

                let topupPaketCount = 0;
                let topupDepositCount = 0;
                let penjualanCount = 0;
                
                try {
                    const dbPem = typeof window.getMergedPemasukan === 'function' ? window.getMergedPemasukan() : JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    dbPem.forEach(item => {
                        if (item && item.date) {
                            let itemDate = window.parseDateString ? window.parseDateString(item.date, item.id) : new Date(item.date);
                            if (itemDate && !isNaN(itemDate.getTime())) {
                                itemDate.setHours(0, 0, 0, 0);
                                if (itemDate.getTime() === today.getTime()) {
                                    let cat = (item.category || item.kategori || item.type || '').toLowerCase();
                                    if (cat.includes('topup paket') || cat.includes('top up paket') || cat.includes('paket')) topupPaketCount++;
                                    else if (cat.includes('topup deposit') || cat.includes('top up deposit') || cat.includes('deposit')) topupDepositCount++;
                                    else if (cat.includes('penjualan') || cat.includes('jual produk') || cat.includes('produk')) penjualanCount++;
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error calculating dashboard counts:', e);
                }

                updateEl('count-masuk', masukCount);
                updateEl('count-harus-selesai', harusSelesaiCount);
                updateEl('count-terlambat', terlambatCount);
                updateEl('count-topup-paket', topupPaketCount);
                updateEl('count-topup-deposit', topupDepositCount);
                updateEl('count-penjualan', penjualanCount);

                updateEl('badge-semua', semuaCount);
                updateEl('badge-validasi', validasiCount);
                updateEl('badge-antrian', antrianCount);
                updateEl('badge-cuci', cuciCount);
                updateEl('badge-setrika', setrikaCount);
                updateEl('badge-selesai', selesaiCount);
            }
            window.updateDashboardCounts = updateDashboardCounts;

            function renderPesananMasukHariIni() {
                const listContainer = document.getElementById('list-pesanan-container');
                if (!listContainer) return;
                listContainer.innerHTML = '';

                // Cek pesanan hari ini (asumsikan semua order history untuk demo)
                if (orderHistory.length === 0) {
                    listContainer.innerHTML = '<p style="padding:20px; text-align:center; color:var(--text-muted);">Belum ada pesanan masuk hari ini.</p>';
                    return;
                }

                // Tampilkan daftar pesanan dengan UI card yang rapi
                orderHistory.forEach(order => {
                    let card = document.createElement('div');
                    card.className = 'pesanan-row'; // Kita bisa pinjam style pesanan-row
                    card.style.margin = '0 20px 10px 20px';
                    card.style.borderRadius = '12px';
                    card.style.border = '1px solid #e2e8f0';

                    let cName = String(order.customerName || 'Anonim');
                    if (cName.includes(' (')) cName = cName.split(' (')[0];
                    let mainService = order.items.length > 0 ? order.items[0].name : 'Layanan';
                    let mainQty = order.items.length > 0 ? order.items[0].qty + (order.items[0].satuan || order.items[0].unit ? ' ' + (order.items[0].satuan || order.items[0].unit) : '') : '-';

                    card.innerHTML = `
                <!-- Col 1: ID & Date -->
                <div class="p-col" style="flex: 0 0 130px; width: 130px;">
                    <div class="p-id" style="white-space: nowrap;">${order.id}</div>
                    <div class="p-date">${order.date.split('T')[0].split(' ')[0]}</div>
                </div>
                
                <!-- Col 2: Customer -->
                <div class="p-col" style="flex: 1;">
                    <div class="p-name">${cName}</div>
                    <div class="p-service" style="margin-top:4px;">${mainService} <span class="p-badge highlight">${mainQty}</span></div>
                </div>
                
                <!-- Col 4: Price -->
                <div class="p-col" style="flex: 0 0 90px; width: 90px; text-align:right;">
                    <div class="p-price">Rp ${order.total.toLocaleString('id-ID')}</div>
                </div>
            `;
                    listContainer.appendChild(card);
                });
            }

            let qrcodeInstance = null;

            function renderNota(order) {
                document.getElementById('nota-id').innerText = order.id;
                document.getElementById('nota-cust').innerText = order.customerName;
                // Format date short
                document.getElementById('nota-date').innerText = order.date.split(' ')[0];

                let notaItemsTable = document.getElementById('nota-items');
                notaItemsTable.innerHTML = '';
                let orderItems = order.items; if (typeof orderItems === 'string') { try { orderItems = JSON.parse(orderItems); } catch(e) { orderItems = []; } } if (!orderItems) orderItems = []; orderItems.forEach(item => {
                    let tr1 = document.createElement('tr');
                    tr1.innerHTML = `<td colspan="2"><strong>${item.name}</strong></td>`;
                    notaItemsTable.appendChild(tr1);

                    let tr2 = document.createElement('tr');
                    let itemDesc = `${item.qty} ${item.satuan || ''} x ${item.price.toLocaleString('id-ID')}`;
                    let itemTotal = item.total;
                    if (item.spotting) {
                        // If spotting is true, price without spotting was item.price, spotting is +10000 per qty or total?
                        // In cart logic it's added to total.
                        itemDesc += '<br><small>+ Spotting</small>';
                    }
                    tr2.innerHTML = `<td>${itemDesc}</td><td style="text-align:right; vertical-align:top;">${itemTotal.toLocaleString('id-ID')}</td>`;
                    notaItemsTable.appendChild(tr2);
                });

                document.getElementById('nota-total').innerText = order.total.toLocaleString('id-ID');
                let dibayar = order.dibayar || 0;
                let kurang = order.total - dibayar;
                if (kurang < 0) kurang = 0;
                let elDibayar = document.getElementById('nota-dibayar');
                if (elDibayar) elDibayar.innerText = dibayar.toLocaleString('id-ID');
                let elKurang = document.getElementById('nota-kurang');
                if (elKurang) elKurang.innerText = kurang.toLocaleString('id-ID');

                let elStatus = document.getElementById('nota-status');
                if (elStatus) {
                    if (kurang <= 0) {
                        elStatus.innerText = 'LUNAS (SUDAH DIBAYAR)';
                    } else {
                        elStatus.innerText = 'BELUM DIBAYAR';
                    }
                }

                // Generate QR Code
                let qrContainer = document.getElementById('qrcode-container');
                qrContainer.innerHTML = '';
                if (window.QRCode) {
                    qrcodeInstance = new QRCode(qrContainer, {
                        text: order.id,
                        width: 120,
                        height: 120,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                }
            }

            // --- BLUETOOTH THERMAL PRINTER DRIVER (58MM) ---
            class ThermalPrinter {
                constructor() {
                    this.device = null;
                    this.server = null;
                    this.characteristic = null;
                }

                async connect() {
                    try {
                        this.device = await navigator.bluetooth.requestDevice({
                            filters: [{
                                services: ['000018f0-0000-1000-8000-00805f9b34fb']
                            }],
                            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                        });

                        this.server = await this.device.gatt.connect();
                        const service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
                        this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

                        // Listen to disconnect
                        this.device.addEventListener('gattserverdisconnected', () => {
                            console.log('Printer disconnected');
                            this.characteristic = null;
                        });

                        return true;
                    } catch (error) {
                        console.error('Koneksi printer gagal:', error);
                        if (window.Swal) Swal.fire('Error', 'Gagal menghubungkan ke printer: ' + error.message, 'error');
                        else alert('Gagal menghubungkan ke printer: ' + error.message);
                        return false;
                    }
                }

                async print(orderData) {
                    if (!this.characteristic) {
                        let connected = await this.connect();
                        if (!connected) return;
                    }

                    try {
                        let encoder = new TextEncoder();
                        let commands = [];

                        // Init printer
                        commands.push(new Uint8Array([0x1B, 0x40]));

                        // Format functions
                        const text = (str) => commands.push(encoder.encode(str + '\n'));
                        const center = () => commands.push(new Uint8Array([0x1B, 0x61, 1]));
                        const left = () => commands.push(new Uint8Array([0x1B, 0x61, 0]));
                        const boldOn = () => commands.push(new Uint8Array([0x1B, 0x45, 1]));
                        const boldOff = () => commands.push(new Uint8Array([0x1B, 0x45, 0]));
                        const feed = (lines = 1) => commands.push(new Uint8Array([0x1B, 0x64, lines]));
                        const line = () => text('-'.repeat(32));
                        // Helper for left-right text
                        const row = (leftText, rightText) => {
                            let strLeft = String(leftText);
                            let strRight = String(rightText);
                            let spaces = 32 - strLeft.length - strRight.length;
                            if (spaces < 1) spaces = 1;
                            text(strLeft + ' '.repeat(spaces) + strRight);
                        };

                        // Build receipt
                        center();

                        // QR Code (GS ( k)
                        try {
                            let qrData = encoder.encode(orderData.id);
                            let len = qrData.length + 3;
                            let pL = len % 256;
                            let pH = Math.floor(len / 256);
                            commands.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 6])); // Size
                            commands.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 48])); // Error correction L
                            let storeCmd = new Uint8Array(8 + qrData.length);
                            storeCmd.set([0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30], 0);
                            storeCmd.set(qrData, 8);
                            commands.push(storeCmd); // Store data
                            commands.push(new Uint8Array([0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30])); // Print
                        } catch (e) {
                            console.error('QR Print error', e);
                        }
                        feed(1);

                        boldOn();
                        const companyNameStr = localStorage.getItem('company_name') || 'MANJUR LAUNDRY';
                        text(companyNameStr.toUpperCase());
                        boldOff();
                        text(localStorage.getItem('company_address') || 'Jalan tanjung lobam, Tlk');
                        text('HP. ' + (localStorage.getItem('company_phone') || '082377178107'));
                        feed(1);

                        left();
                        line();

                        let cName = String(orderData.customerName || 'Anonim');
                        if (cName.includes(' (')) { cName = cName.split(' (')[0]; }

                        row('Order ID', orderData.id);
                        row('Pelanggan', cName);
                        row('Kasir', localStorage.getItem('owner_name') || 'Admin');
                        row('Tgl Pesan', orderData.date.split(' ')[0]);
                        line();

                        orderData.items.forEach(item => {
                            boldOn();
                            text(`${item.name}`);
                            boldOff();
                            let qtyPrice = `${item.qty} ${item.satuan || ''} x ${item.price.toLocaleString('id-ID')}`;
                            let subtotal = item.total.toLocaleString('id-ID');

                            if (item.spotting) {
                                text(qtyPrice);
                                row('+ Spotting', subtotal);
                            } else {
                                row(qtyPrice, subtotal);
                            }
                        });
                        line();

                        boldOn();
                        row('Total Harga', orderData.total.toLocaleString('id-ID'));
                        boldOff();

                        let dibayar = orderData.dibayar || 0;
                        row('Dibayar', dibayar.toLocaleString('id-ID'));

                        let kurang = orderData.total - dibayar;
                        if (kurang < 0) kurang = 0;
                        row('Kurang', kurang.toLocaleString('id-ID'));

                        boldOn();
                        row('Status', kurang > 0 ? 'BELUM DIBAYAR' : 'LUNAS');
                        boldOff();

                        line();

                        feed(1);
                        center();
                        text('Terimakasih');
                        text('Semoga hari Anda menyenangkan!');
                        feed(3);

                        // Cut command (optional)
                        // commands.push(new Uint8Array([0x1D, 0x56, 0x41, 0x00]));

                        // Send chunks (some devices fail if too large)
                        for (let cmd of commands) {
                            await this.characteristic.writeValue(cmd);
                        }

                        if (window.Swal) Swal.fire('Berhasil', 'Mencetak ke printer...', 'success');
                    } catch (err) {
                        console.error('Print Error:', err);
                        if (window.Swal) Swal.fire('Print Error', err.message, 'error');
                    }
                }
            }
            const btPrinter = new ThermalPrinter();

            document.getElementById('btn-cetak-nota')?.addEventListener('click', () => {
                if (currentActiveOrder && typeof btPrinter !== 'undefined') {
                    btPrinter.print(currentActiveOrder);
                }
            });

            // --- FUNGSI CETAK BROWSER ---
            window.printReceiptBrowser = function (order) {
                // Tampilan struk (Nota) sudah disiapkan oleh fungsi renderNota() di dalam #print-area.
                // Timeout sedikit (50ms) untuk memastikan DOM dirender sebelum print dipanggil
                setTimeout(() => {
                    window.print();
                }, 50);
            };

            document.getElementById('btn-kirim-nota')?.addEventListener('click', () => {
                if (currentActiveOrder) {
                    const cName = localStorage.getItem('company_name') || 'Manjur Laundry'; let text = `Halo, pesanan laundry Anda di ${cName} telah terdaftar.\nOrder ID: ${currentActiveOrder.id}\nTotal: Rp ${currentActiveOrder.total.toLocaleString('id-ID')}\nTerima kasih!`;
                    let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                }
            });

            // PWA Service Worker telah dinonaktifkan untuk mendukung mode Online-Only

            // --- TOP PELANGGAN SCRIPT ---
            const btnBackTopPelanggan = document.getElementById('btn-back-top-pelanggan');
            if (btnBackTopPelanggan) {
                btnBackTopPelanggan.addEventListener('click', () => {
                    const lTop = document.getElementById('layout-top-pelanggan');
                    if (lTop) {
                        lTop.classList.remove('active');
                        lTop.style.display = 'none';
                    }
                    const main = document.getElementById('layout-main');
                    if (main) {
                        main.classList.add('active');
                        main.style.display = 'flex';
                    }
                });
            }

            window.renderTopPelanggan = function() {
                const listContainer = document.getElementById('top-pelanggan-list');
                if (!listContainer) return;
                listContainer.innerHTML = '';

                let activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                let dataPelanggan = JSON.parse(localStorage.getItem('db_pelanggan_' + activeOutlet) || '[]');
                if (activeOutlet === 'PUSAT') {
                    dataPelanggan = JSON.parse(localStorage.getItem('db_pelanggan') || '[]');
                }

                // Kalkulasi trx
                let orderHistory = [];
                try {
                    const dbPemasukanStr = localStorage.getItem(activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet);
                    if (dbPemasukanStr) orderHistory = JSON.parse(dbPemasukanStr);
                } catch(e){}

                dataPelanggan.forEach(p => {
                    const phone = p.telepon || p.hp || 'Tanpa nomor';
                    const totalTrx = orderHistory.filter(o => o.customerName === p.nama || o.customerName === p.nama + ' (' + phone + ')' || o.customerName === p.nama + ' (Tanpa nomor)').length;
                    p.trxCount = totalTrx;
                });

                // Sort by trxCount desc, then nama asc
                dataPelanggan.sort((a, b) => {
                    if (b.trxCount !== a.trxCount) return b.trxCount - a.trxCount;
                    return String(a.nama || '').localeCompare(String(b.nama || ''));
                });

                // Take top 20
                const top20 = dataPelanggan.slice(0, 20);

                if (top20.length === 0) {
                    listContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: #64748b;">Belum ada data pelanggan.</p>';
                    return;
                }

                top20.forEach((p, index) => {
                    let card = document.createElement('div');
                    card.style.background = '#ffffff';
                    card.style.borderRadius = '12px';
                    card.style.padding = '15px';
                    card.style.border = '1px solid #e2e8f0';
                    card.style.display = 'flex';
                    card.style.alignItems = 'center';
                    card.style.gap = '15px';
                    card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';

                    // Rank Badge
                    let rankColor = '#94a3b8'; // Default grey
                    if (index === 0) rankColor = '#f59e0b'; // Gold
                    else if (index === 1) rankColor = '#94a3b8'; // Silver
                    else if (index === 2) rankColor = '#b45309'; // Bronze

                    card.innerHTML = `
                        <div style="width: 35px; height: 35px; border-radius: 50%; background: ${rankColor}20; color: ${rankColor}; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1rem;">
                            #${index + 1}
                        </div>
                        <div style="flex: 1; cursor: pointer;" onclick="
                            window.riwayatOrigin = 'top-pelanggan';
                            document.getElementById('layout-top-pelanggan').style.display = 'none';
                            document.getElementById('layout-riwayat-pelanggan').style.display = 'block';
                            if (typeof window.renderRiwayatPelanggan === 'function') {
                                window.renderRiwayatPelanggan('${p.nama}', '${p.telepon || p.hp || ''}');
                            }
                        ">
                            <h4 style="margin: 0; font-size: 1rem; color: #1e293b; font-weight: 600;">${p.nama}</h4>
                            <p style="margin: 3px 0 0; font-size: 0.8rem; color: #64748b;"><i class="fa-solid fa-phone" style="font-size:0.75rem; color:#94a3b8; margin-right:3px;"></i> ${p.telp || '-'}</p>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; font-size: 1.2rem; font-weight: 700; color: #0ea5e9;">${p.trxCount}</span>
                            <span style="font-size: 0.7rem; color: #64748b;">Transaksi</span>
                        </div>
                    `;
                    listContainer.appendChild(card);
                });
            };

            // --- KELOLA PELANGGAN LAYOUT SCRIPT ---
            const btnBackKelolaPelanggan = document.getElementById('btn-back-kelola-pelanggan');
            if (btnBackKelolaPelanggan) {
                btnBackKelolaPelanggan.addEventListener('click', () => {
                    document.getElementById('tab-kelola-pelanggan').style.display = 'none';
                    document.getElementById('tab-akun').style.display = 'flex';
                    window.scrollTo(0, 0);
                });
            }

            const btnAddKelolaPelanggan = document.getElementById('btn-add-kelola-pelanggan');
            if (btnAddKelolaPelanggan) {
                btnAddKelolaPelanggan.addEventListener('click', () => {
                    const layoutTambahPelanggan = document.getElementById('layout-tambah-pelanggan');
                    if (layoutTambahPelanggan) {
                        window.editingCustomerIndex = null;
                        const title = document.querySelector('.tp-title');
                        if (title) title.innerText = 'Tambah Pelanggan';
                        const inputNama = document.getElementById('tp-input-nama');
                        const inputTelepon = document.getElementById('tp-input-telepon');
                        const inputEmail = document.getElementById('tp-input-email');
                        const inputAlamat = document.getElementById('tp-input-alamat');
                        if (inputNama) inputNama.value = '';
                        if (inputTelepon) inputTelepon.value = '';
                        if (inputEmail) inputEmail.value = '';
                        if (inputAlamat) inputAlamat.value = '';

                        layoutKelolaPelanggan.classList.remove('active');
                        layoutKelolaPelanggan.style.display = 'none';
                        layoutTambahPelanggan.style.display = 'block';
                        setTimeout(() => layoutTambahPelanggan.classList.add('active'), 10);

                        // Override back button behavior temporarily for this session
                        const btnBackTp = document.getElementById('btn-back-tp');
                        const oldBackTp = btnBackTp.onclick;
                        btnBackTp.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            layoutTambahPelanggan.classList.remove('active');
                            setTimeout(() => {
                                layoutTambahPelanggan.style.display = 'none';
                                layoutKelolaPelanggan.style.display = 'block';
                                setTimeout(() => layoutKelolaPelanggan.classList.add('active'), 10);
                            }, 300);
                            btnBackTp.onclick = oldBackTp; // restore
                        };
                    }
                });
            }

            // --- IMPORT KONTAK LOGIC ---
            const btnImportKontakForm = document.getElementById('btn-import-kontak-form');
            const btnImportKontakHp = document.getElementById('btn-import-kontak-hp'); // from bottom sheet

            async function handleImportKontak() {
                const supported = ('contacts' in navigator && 'ContactsManager' in window);
                if (!supported) {
                    window.showToast('Browser/HP Anda tidak mendukung fitur ini (Gunakan Chrome Android).');
                    return;
                }

                const props = ['name', 'tel'];
                const opts = { multiple: false };
                try {
                    const contacts = await navigator.contacts.select(props, opts);
                    if (contacts.length > 0) {
                        const contact = contacts[0];
                        if (contact.name && contact.name.length > 0) {
                            const inputNama = document.getElementById('tp-input-nama');
                            if (inputNama) inputNama.value = contact.name[0];
                        }
                        if (contact.tel && contact.tel.length > 0) {
                            let phone = contact.tel[0].replace(/\D/g, '');
                            if (phone.startsWith('62')) phone = phone.substring(2);
                            if (phone.startsWith('0')) phone = phone.substring(1);
                            const inputTelepon = document.getElementById('tp-input-telepon');
                            if (inputTelepon) inputTelepon.value = phone;
                        }
                        window.showToast('Kontak berhasil diimpor!');

                        // If it was called from bottom sheet, open the form layout
                        if (btnImportKontakHp && arguments[0] === 'from_bs') {
                            closeBottomSheet();
                            const layoutMain = document.getElementById('layout-main');
                            if (layoutMain) {
                                layoutMain.classList.remove('active');
                                layoutMain.style.display = 'none';
                            }
                            const layoutTambahPelanggan = document.getElementById('layout-tambah-pelanggan');
                            if (layoutTambahPelanggan) {
                                layoutTambahPelanggan.style.display = 'block';
                                setTimeout(() => layoutTambahPelanggan.classList.add('active'), 10);
                            }
                        }
                    }
                } catch (ex) {
                    console.error(ex);
                    window.showToast('Batal/Gagal mengimpor kontak.');
                }
            }

            if (btnImportKontakForm) {
                btnImportKontakForm.addEventListener('click', handleImportKontak);
            }

            if (btnImportKontakHp) {
                btnImportKontakHp.addEventListener('click', () => handleImportKontak('from_bs'));
            }

            // --- PENGELUARAN LAYOUT SCRIPT ---
            const btnBackPengeluaran = document.getElementById('btn-back-pengeluaran');
            const layoutPengeluaran = document.getElementById('layout-pengeluaran');
            if (btnBackPengeluaran && layoutPengeluaran) {
                btnBackPengeluaran.addEventListener('click', () => {
                    layoutPengeluaran.classList.remove('active');
                    setTimeout(() => {
                        layoutPengeluaran.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExportPengeluaran = document.getElementById('btn-export-pengeluaran');
            if (btnExportPengeluaran) {
                btnExportPengeluaran.addEventListener('click', () => {
                    window.showToast('Mengekspor data Pengeluaran...');
                    const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                    const key = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;
                    const db = JSON.parse(localStorage.getItem(key) || '[]');
                    const data = db.map(p => ({
                        Tanggal: p.date,
                        Keterangan: p.keterangan || '-',
                        Kategori: p.category || 'Biaya Operasional',
                        Cashbox: p.cashbox || 'Tunai',
                        Nominal: parseFloat(p.nominal) || 0
                    }));
                    window.exportToExcel(data, 'Laporan_Pengeluaran_Manjur');
                });
            }

            const pengeluaranDateFilter = document.getElementById('pengeluaran-date-filter');
            const pengeluaranDateText = document.getElementById('pengeluaran-date-text');
            const btnRefreshPengeluaran = document.getElementById('btn-refresh-pengeluaran');
            const pengeluaranEmptyState = document.getElementById('pengeluaran-empty-state');
            const pengeluaranDataState = document.getElementById('pengeluaran-data-state');
            const pengeluaranAccordionContainer = document.getElementById('pengeluaran-accordion-container');

            window.renderPengeluaranAccordion = function (cashboxFilter = 'Semua') {
                if (!pengeluaranAccordionContainer) return;

                const groupedDataRaw = getPengeluaranGroupedData();

                let html = '';
                let globalTotal = 0;

                const filteredGroups = groupedDataRaw.map(group => {
                    const filteredItems = group.items.filter(item => {
                        if (cashboxFilter === 'Semua') return true;
                        return item.cashbox === cashboxFilter;
                    });

                    const groupTotal = filteredItems.reduce((sum, it) => sum + it.total, 0);
                    return {
                        ...group,
                        items: filteredItems,
                        groupTotal
                    };
                }).filter(group => group.items.length > 0);

                if (filteredGroups.length === 0) {
                    pengeluaranAccordionContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Tidak ada data pengeluaran untuk filter ini.</div>';
                    const totalEl = document.querySelector('#pengeluaran-data-state div > span[style*="font-size:1.8rem"]');
                    if (totalEl) totalEl.innerText = '0';
                    return;
                }

                filteredGroups.forEach((g, index) => {
                    globalTotal += g.groupTotal;
                    const isActive = index === 0 ? 'active' : '';

                    let itemsHtml = '';
                    g.items.forEach(it => {
                        itemsHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="font-size:0.9rem; color:#1e293b;">
                        <div style="margin-bottom:3px;">${it.title}</div>
                        <div style="margin-bottom:3px;">${it.itemsDesc}</div>
                        <div style="margin-bottom:3px; color:#64748b; font-size:0.85rem;">Kode : ${it.code} <span style="color:#ef4444; font-weight:500;">(${it.cashbox})</span></div>
                        <div style="color:#64748b; font-size:0.85rem;">Kategori : ${it.category}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:#1e293b; font-weight:500; font-size:0.95rem;">${it.total.toLocaleString('en-US')}</div>
                    </div>
                </div>`;
                    });

                    html += `
            <div class="accordion-item ${isActive}" style="background:#fff; margin-bottom: 5px;">
                <div class="accordion-header" style="padding:15px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#f8fafc;" onclick="this.parentElement.classList.toggle('active')">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-chevron-down text-slate-400 transition-transform" style="color:#0ea5e9;"></i>
                        <div style="font-weight:600; color:#0ea5e9; font-size:0.9rem;">${g.dateText}</div>
                    </div>
                    <div style="font-weight:600; color:#0ea5e9; font-size:0.95rem;">${g.groupTotal.toLocaleString('en-US')}</div>
                </div>
                <div class="accordion-content" style="padding: 0 20px; background:#ffffff; display:${isActive ? 'block' : 'none'};">
                    ${itemsHtml}
                </div>
            </div>`;
                });

                pengeluaranAccordionContainer.innerHTML = html;

                // Add inline style if not exists
                if (!document.getElementById('pengeluaran-accordion-style')) {
                    const style = document.createElement('style');
                    style.id = 'pengeluaran-accordion-style';
                    style.innerHTML = `
                #pengeluaran-accordion-container .accordion-item.active .accordion-content { display: block !important; }
                #pengeluaran-accordion-container .accordion-item.active .fa-chevron-down { transform: rotate(180deg); }
            `;
                    document.head.appendChild(style);
                }

                const totalTextElement = document.querySelector('#pengeluaran-data-state div > span[style*="font-size:1.8rem"]');
                if (totalTextElement) {
                    totalTextElement.innerText = globalTotal.toLocaleString('en-US');
                }
            };

            if (pengeluaranDateFilter && pengeluaranDateText && btnRefreshPengeluaran && pengeluaranEmptyState && pengeluaranDataState) {
                pengeluaranDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val === 'per-tanggal') {
                        const datePickerModal = document.getElementById('custom-date-picker-modal');
                        if (datePickerModal) datePickerModal.style.display = 'flex';
                    } else if (val) {
                        if (val === 'hari-ini') pengeluaranDateText.innerText = '24/07/2026';
                        else if (val === 'kemarin') pengeluaranDateText.innerText = '23/07/2026';
                        else if (val === '7-hari') pengeluaranDateText.innerText = '18/07/2026 - 24/07/2026';
                        else if (val === '30-hari') pengeluaranDateText.innerText = '25/06/2026 - 24/07/2026';
                        
                        

                        pengeluaranDateText.style.display = 'block';
                        btnRefreshPengeluaran.style.display = 'flex';
                        pengeluaranEmptyState.style.display = 'none';
                        pengeluaranDataState.style.display = 'flex';

                        renderPengeluaranAccordion();
                        btnRefreshPengeluaran.click();
                    }
                });

                btnRefreshPengeluaran.addEventListener('click', () => {
                    const icon = document.getElementById('pengeluaran-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        showToast('Memperbarui data pengeluaran...');
                    }, 800);
                });
            }

            const pengeluaranCashboxFilter = document.getElementById('pengeluaran-cashbox-filter');
            const pengeluaranCashboxText = document.getElementById('pengeluaran-cashbox-text');
            if (pengeluaranCashboxFilter && pengeluaranCashboxText) {
                pengeluaranCashboxFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    pengeluaranCashboxText.innerText = val;
                    renderPengeluaranAccordion(val);
                    if (btnRefreshPengeluaran) btnRefreshPengeluaran.click();
                });
            }

            const btnTabPengeluaranTransaksi = document.getElementById('btn-tab-pengeluaran-transaksi');
            const btnTabPengeluaranKategori = document.getElementById('btn-tab-pengeluaran-kategori');
            const contentPengeluaranTransaksi = document.getElementById('pengeluaran-content-transaksi');
            const contentPengeluaranKategori = document.getElementById('pengeluaran-content-kategori');

            if (btnTabPengeluaranTransaksi && btnTabPengeluaranKategori) {
                btnTabPengeluaranTransaksi.addEventListener('click', () => {
                    btnTabPengeluaranTransaksi.style.borderBottom = '2px solid #0ea5e9';
                    btnTabPengeluaranTransaksi.style.color = '#0ea5e9';
                    btnTabPengeluaranTransaksi.style.fontWeight = '600';

                    btnTabPengeluaranKategori.style.borderBottom = '2px solid transparent';
                    btnTabPengeluaranKategori.style.color = '#64748b';
                    btnTabPengeluaranKategori.style.fontWeight = '500';

                    contentPengeluaranTransaksi.style.display = 'block';
                    contentPengeluaranKategori.style.display = 'none';
                });

                btnTabPengeluaranKategori.addEventListener('click', () => {
                    btnTabPengeluaranKategori.style.borderBottom = '2px solid #0ea5e9';
                    btnTabPengeluaranKategori.style.color = '#0ea5e9';
                    btnTabPengeluaranKategori.style.fontWeight = '600';

                    btnTabPengeluaranTransaksi.style.borderBottom = '2px solid transparent';
                    btnTabPengeluaranTransaksi.style.color = '#64748b';
                    btnTabPengeluaranTransaksi.style.fontWeight = '500';

                    contentPengeluaranKategori.style.display = 'block';
                    contentPengeluaranTransaksi.style.display = 'none';
                });
            }

            // --- hutang LAYOUT SCRIPT ---
            const btnBackhutang = document.getElementById('btn-back-hutang');
            const layouthutang = document.getElementById('layout-hutang');
            if (btnBackhutang && layouthutang) {
                btnBackhutang.addEventListener('click', () => {
                    layouthutang.classList.remove('active');
                    setTimeout(() => {
                        layouthutang.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const btnExporthutang = document.getElementById('btn-export-hutang');
            if (btnExporthutang) {
                btnExporthutang.addEventListener('click', () => {
                    window.showToast('Mengekspor data Biaya Usaha...');
                    const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                    const key = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;
                    const db = JSON.parse(localStorage.getItem(key) || '[]');
                    const data = db.map(p => ({
                        Tanggal: p.date,
                        Keterangan: p.keterangan || '-',
                        Kategori: p.category || 'Biaya Operasional',
                        Cashbox: p.cashbox || 'Tunai',
                        Nominal: parseFloat(p.nominal) || 0
                    }));
                    window.exportToExcel(data, 'Laporan_Biaya_Usaha_Manjur');
                });
            }

            const hutangDateFilter = document.getElementById('hutang-date-filter');
            const hutangDateText = document.getElementById('hutang-date-text');
            const btnRefreshhutang = document.getElementById('btn-refresh-hutang');
            const hutangEmptyState = document.getElementById('hutang-empty-state');
            const hutangDataState = document.getElementById('hutang-data-state');
            const hutangAccordionContainer = document.getElementById('hutang-accordion-container');

            function formatAppDate(isoDate) {
                if (!isoDate) return '1970-01-01';
                let p = isoDate.split('-');
                if (p.length === 3) return p[2] + '-' + p[1] + '-' + p[0];
                return isoDate;
            }

            function getPengeluaranGroupedData() {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;
                const db = JSON.parse(localStorage.getItem(key) || '[]');

                let grouped = {};
                db.forEach(p => {
                    let d = formatAppDate(p.date);
                    if (!grouped[d]) grouped[d] = [];
                    grouped[d].push({
                        title: p.category || 'Biaya Usaha',
                        itemsDesc: p.keterangan || '-',
                        code: p.id || '-',
                        cashbox: p.cashbox || 'Tunai',
                        category: p.category || 'Biaya Operasional',
                        total: parseFloat(p.nominal) || 0,
                        originalDateStr: p.date
                    });
                });

                return Object.keys(grouped).map(k => {
                    return {
                        dateText: k,
                        originalDateStr: grouped[k][0].originalDateStr,
                        items: grouped[k]
                    };
                }).sort((a, b) => String(b.originalDateStr || '').localeCompare(String(a.originalDateStr || '')));
            }

            window.renderHutangAccordion = function (cashboxFilter = 'Semua') {
                if (!hutangAccordionContainer) return;

                const groupedDataRaw = getPengeluaranGroupedData();

                let html = '';
                let globalTotal = 0;

                const filteredGroups = groupedDataRaw.map(group => {
                    const filteredItems = group.items.filter(item => {
                        if (cashboxFilter === 'Semua') return true;
                        return item.cashbox === cashboxFilter;
                    });

                    const groupTotal = filteredItems.reduce((sum, it) => sum + it.total, 0);
                    return {
                        ...group,
                        items: filteredItems,
                        groupTotal
                    };
                }).filter(group => group.items.length > 0);

                if (filteredGroups.length === 0) {
                    hutangAccordionContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">Tidak ada data biaya untuk filter ini.</div>';
                    const totalEl = document.querySelector('#hutang-data-state div > span[style*="font-size:1.8rem"]');
                    if (totalEl) totalEl.innerText = '0';
                    return;
                }

                filteredGroups.forEach((g, index) => {
                    globalTotal += g.groupTotal;
                    const isActive = index === 0 ? 'active' : '';

                    let itemsHtml = '';
                    g.items.forEach(it => {
                        itemsHtml += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="font-size:0.9rem; color:#1e293b;">
                        <div style="margin-bottom:3px;">${it.title}</div>
                        <div style="margin-bottom:3px;">${it.itemsDesc}</div>
                        <div style="margin-bottom:3px; color:#64748b; font-size:0.85rem;">Kode : ${it.code} <span style="color:#ef4444; font-weight:500;">(${it.cashbox})</span></div>
                        <div style="color:#64748b; font-size:0.85rem;">Kategori : ${it.category}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="color:#1e293b; font-weight:500; font-size:0.95rem;">${it.total.toLocaleString('en-US')}</div>
                    </div>
                </div>`;
                    });

                    html += `
            <div class="accordion-item ${isActive}" style="background:#fff; margin-bottom: 5px;">
                <div class="accordion-header" style="padding:15px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#f8fafc;" onclick="this.parentElement.classList.toggle('active')">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-chevron-down text-slate-400 transition-transform" style="color:#0ea5e9;"></i>
                        <div style="font-weight:600; color:#0ea5e9; font-size:0.9rem;">${g.dateText}</div>
                    </div>
                    <div style="font-weight:600; color:#0ea5e9; font-size:0.95rem;">${g.groupTotal.toLocaleString('en-US')}</div>
                </div>
                <div class="accordion-content" style="padding: 0 20px; background:#ffffff; display:${isActive ? 'block' : 'none'};">
                    ${itemsHtml}
                </div>
            </div>`;
                });

                hutangAccordionContainer.innerHTML = html;

                // Add inline style if not exists
                if (!document.getElementById('hutang-accordion-style')) {
                    const style = document.createElement('style');
                    style.id = 'hutang-accordion-style';
                    style.innerHTML = `
                #hutang-accordion-container .accordion-item.active .accordion-content { display: block !important; }
                #hutang-accordion-container .accordion-item.active .fa-chevron-down { transform: rotate(180deg); }
            `;
                    document.head.appendChild(style);
                }

                const totalTextElement = document.querySelector('#hutang-data-state div > span[style*="font-size:1.8rem"]');
                if (totalTextElement) {
                    totalTextElement.innerText = globalTotal.toLocaleString('en-US');
                }
            };

            if (hutangDateFilter && hutangDateText && btnRefreshhutang && hutangEmptyState && hutangDataState) {
                hutangDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val === 'per-tanggal') {
                        const datePickerModal = document.getElementById('custom-date-picker-modal');
                        if (datePickerModal) datePickerModal.style.display = 'flex';
                    } else if (val) {
                        if (val === 'hari-ini') hutangDateText.innerText = '24/07/2026';
                        else if (val === 'kemarin') hutangDateText.innerText = '23/07/2026';
                        else if (val === '7-hari') hutangDateText.innerText = '18/07/2026 - 24/07/2026';
                        else if (val === '30-hari') hutangDateText.innerText = '25/06/2026 - 24/07/2026';
                        
                        

                        hutangDateText.style.display = 'block';
                        btnRefreshhutang.style.display = 'flex';
                        hutangEmptyState.style.display = 'none';
                        hutangDataState.style.display = 'flex';

                        renderHutangAccordion();
                        btnRefreshhutang.click();
                    }
                });

                btnRefreshhutang.addEventListener('click', () => {
                    const icon = document.getElementById('hutang-refresh-icon');
                    if (icon) icon.classList.add('fa-spin');
                    setTimeout(() => {
                        if (icon) icon.classList.remove('fa-spin');
                        showToast('Memperbarui data biaya...');
                    }, 800);
                });
            }

            const hutangCashboxFilter = document.getElementById('hutang-cashbox-filter');
            const hutangCashboxText = document.getElementById('hutang-cashbox-text');
            if (hutangCashboxFilter && hutangCashboxText) {
                hutangCashboxFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    hutangCashboxText.innerText = val;
                    renderHutangAccordion(val);
                    if (btnRefreshhutang) btnRefreshhutang.click();
                });
            }

            const btnTabhutangTransaksi = document.getElementById('btn-tab-hutang-transaksi');
            const btnTabhutangKategori = document.getElementById('btn-tab-hutang-kategori');
            const contenthutangTransaksi = document.getElementById('hutang-content-transaksi');
            const contenthutangKategori = document.getElementById('hutang-content-kategori');

            if (btnTabhutangTransaksi && btnTabhutangKategori) {
                btnTabhutangTransaksi.addEventListener('click', () => {
                    btnTabhutangTransaksi.style.borderBottom = '2px solid #0ea5e9';
                    btnTabhutangTransaksi.style.color = '#0ea5e9';
                    btnTabhutangTransaksi.style.fontWeight = '600';

                    btnTabhutangKategori.style.borderBottom = '2px solid transparent';
                    btnTabhutangKategori.style.color = '#64748b';
                    btnTabhutangKategori.style.fontWeight = '500';

                    contenthutangTransaksi.style.display = 'block';
                    contenthutangKategori.style.display = 'none';
                });

                btnTabhutangKategori.addEventListener('click', () => {
                    btnTabhutangKategori.style.borderBottom = '2px solid #0ea5e9';
                    btnTabhutangKategori.style.color = '#0ea5e9';
                    btnTabhutangKategori.style.fontWeight = '600';

                    btnTabhutangTransaksi.style.borderBottom = '2px solid transparent';
                    btnTabhutangTransaksi.style.color = '#64748b';
                    btnTabhutangTransaksi.style.fontWeight = '500';

                    contenthutangKategori.style.display = 'block';
                    contenthutangTransaksi.style.display = 'none';
                });
            }
            // --- LAPORAN TRANSAKSI LAYOUT SCRIPT ---
            const btnBackLapTransaksi = document.getElementById('btn-back-lap-transaksi');
            const layoutLapTransaksi = document.getElementById('layout-laporan-transaksi');
            if (btnBackLapTransaksi && layoutLapTransaksi) {
                btnBackLapTransaksi.addEventListener('click', () => {
                    layoutLapTransaksi.classList.remove('active');
                    setTimeout(() => {
                        layoutLapTransaksi.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            // lap-transaksi-date-filter handled by laporan.js

            // window.renderLaporanTransaksiAccordion is now defined in laporan.js

            const btnExportLapTransaksi = document.getElementById('btn-export-lap-transaksi');
            if (btnExportLapTransaksi) {
                btnExportLapTransaksi.addEventListener('click', () => {
                    window.showToast('Mengekspor Laporan Transaksi...');

                    const data = window.currentLaporanTransaksiExportData || [];
                    if (data.length === 0) {
                        window.showToast('Tidak ada data untuk diekspor.');
                        return;
                    }

                    const type = window.currentLaporanTransaksiType || 'Semua Transaksi';
                    const filename = 'Laporan_' + type.replace(/ /g, '_');

                    window.exportToExcel(data, filename);
                });
            }
            // --- LABA RUGI LAYOUT SCRIPT ---
            const btnBackLabaRugi = document.getElementById('btn-back-laba-rugi');
            const layoutLabaRugi = document.getElementById('layout-laba-rugi');
            if (btnBackLabaRugi && layoutLabaRugi) {
                btnBackLabaRugi.addEventListener('click', () => {
                    layoutLabaRugi.classList.remove('active');
                    setTimeout(() => {
                        layoutLabaRugi.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            const labaRugiDateFilter = document.getElementById('laba-rugi-date-filter');
            const labaRugiDateText = document.getElementById('laba-rugi-date-text');
            const btnRefreshLabaRugi = document.getElementById('btn-refresh-laba-rugi');

            if (labaRugiDateFilter && labaRugiDateText) {
                labaRugiDateFilter.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val === 'per-tanggal') {
                        const datePickerModal = document.getElementById('custom-date-picker-modal');
                        if (datePickerModal) datePickerModal.style.display = 'flex';
                    } else if (val) {
                        if (val === 'hari-ini') labaRugiDateText.innerText = '24/07/2026';
                        else if (val === 'kemarin') labaRugiDateText.innerText = '23/07/2026';
                        else if (val === '7-hari') labaRugiDateText.innerText = '18/07/2026 - 24/07/2026';
                        else if (val === '30-hari') labaRugiDateText.innerText = '25/06/2026 - 24/07/2026';
                        
                        

                        if (btnRefreshLabaRugi) btnRefreshLabaRugi.click();
                    }
                });
            }

            if (btnRefreshLabaRugi) {
                btnRefreshLabaRugi.addEventListener('click', () => {
                    window.showToast('Memperbarui laporan laba rugi...');
                    if (typeof window.renderLabaRugi === 'function') {
                        window.renderLabaRugi();
                    }
                });
            }

            window.renderLabaRugi = function () {
                // Format to Indonesian Rupiah
                const formatRp = (num) => {
                    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                };

                // Dummy data values
                const d_kiloan = 150000;
                const d_satuan = 75000;
                const d_cuci = 20000;
                const d_setrika = 15000;
                const d_esd = 5000;

                const totalPendapatan = d_kiloan + d_satuan + d_cuci + d_setrika + d_esd;
                const totalPengeluaran = 85000; // dummy
                const labaBersih = totalPendapatan - totalPengeluaran;

                document.getElementById('lr-pendapatan-kiloan').innerText = formatRp(d_kiloan);
                document.getElementById('lr-pendapatan-satuan').innerText = formatRp(d_satuan);
                document.getElementById('lr-pendapatan-cuci').innerText = formatRp(d_cuci);
                document.getElementById('lr-pendapatan-setrika').innerText = formatRp(d_setrika);
                document.getElementById('lr-pendapatan-esd').innerText = formatRp(d_esd);

                document.getElementById('lr-total-pendapatan').innerText = formatRp(totalPendapatan);
                document.getElementById('lr-total-pengeluaran').innerText = formatRp(totalPengeluaran);

                const lrAmount = document.getElementById('lr-laba-amount');
                const lrIconContainer = document.getElementById('lr-laba-icon-container');
                const lrIcon = document.getElementById('lr-laba-icon');
                const lrHeader = document.getElementById('lr-laba-header');
                const lrTitle = document.getElementById('lr-laba-title');

                if (labaBersih >= 0) {
                    lrAmount.innerText = 'Rp ' + formatRp(labaBersih);
                    lrAmount.style.color = '#16a34a'; // green-600

                    lrHeader.style.background = '#dcfce7'; // green-100
                    lrIconContainer.style.background = '#bbf7d0'; // green-200
                    lrIconContainer.style.color = '#15803d'; // green-700
                    lrTitle.style.color = '#15803d'; // green-700
                    lrIcon.className = 'fa-solid fa-sack-dollar';
                } else {
                    lrAmount.innerText = '-Rp ' + formatRp(Math.abs(labaBersih));
                    lrAmount.style.color = '#dc2626'; // red-600

                    lrHeader.style.background = '#fee2e2'; // red-100
                    lrIconContainer.style.background = '#fecaca'; // red-200
                    lrIconContainer.style.color = '#b91c1c'; // red-700
                    lrTitle.style.color = '#b91c1c'; // red-700
                    lrIcon.className = 'fa-solid fa-arrow-trend-down';
                }

                // Save to window for export
                window.currentLabaRugiData = {
                    'Pendapatan Kiloan': d_kiloan,
                    'Pendapatan Satuan': d_satuan,
                    'Pendapatan Cuci Saja': d_cuci,
                    'Pendapatan Setrika Saja': d_setrika,
                    'Pendapatan Khusus ESD': d_esd,
                    'Total Pendapatan': totalPendapatan,
                    'Total Pengeluaran': totalPengeluaran,
                    'Laba Bersih': labaBersih
                };
            };

            const btnExportLabaRugi = document.getElementById('btn-export-laba-rugi');
            if (btnExportLabaRugi) {
                btnExportLabaRugi.addEventListener('click', () => {
                    window.showToast('Mengekspor Laporan Laba Rugi...');

                    const dataObj = window.currentLabaRugiData || {
                        'Pendapatan Kiloan': 150000,
                        'Pendapatan Satuan': 75000,
                        'Pendapatan Cuci Saja': 20000,
                        'Pendapatan Setrika Saja': 15000,
                        'Pendapatan Khusus ESD': 5000,
                        'Total Pendapatan': 265000,
                        'Total Pengeluaran': 85000,
                        'Laba Bersih': 180000
                    };

                    const data = [
                        { 'Kategori': 'Pendapatan Kiloan', 'Nominal (Rp)': dataObj['Pendapatan Kiloan'] },
                        { 'Kategori': 'Pendapatan Satuan', 'Nominal (Rp)': dataObj['Pendapatan Satuan'] },
                        { 'Kategori': 'Pendapatan Cuci Saja', 'Nominal (Rp)': dataObj['Pendapatan Cuci Saja'] },
                        { 'Kategori': 'Pendapatan Setrika Saja', 'Nominal (Rp)': dataObj['Pendapatan Setrika Saja'] },
                        { 'Kategori': 'Pendapatan Khusus ESD', 'Nominal (Rp)': dataObj['Pendapatan Khusus ESD'] },
                        { 'Kategori': 'Total Pendapatan', 'Nominal (Rp)': dataObj['Total Pendapatan'] },
                        { 'Kategori': 'Total Pengeluaran', 'Nominal (Rp)': dataObj['Total Pengeluaran'] },
                        { 'Kategori': 'Laba Bersih', 'Nominal (Rp)': dataObj['Laba Bersih'] }
                    ];

                    window.exportToExcel(data, 'Laporan_Laba_Rugi');
                });
            }


            // --- KELOLA LAYANAN LOGIC ---
            const layoutLayanan = document.getElementById('layout-layanan');
            const btnMenuKelolaLayanan = document.getElementById('btn-menu-kelola-layanan');
            const btnBackLayanan = document.getElementById('btn-back-layanan');
            const btnTambahLayanan = document.getElementById('btn-tambah-layanan');
            const modalLayanan = document.getElementById('modal-layanan');
            const btnCloseModalLayanan = document.getElementById('btn-close-modal-layanan');
            const btnSimpanLayanan = document.getElementById('btn-simpan-layanan');
            const btnHapusLayanan = document.getElementById('btn-hapus-layanan');
            const layananListContainer = document.getElementById('layanan-list-container');

            const inLayId = document.getElementById('input-layanan-id');
            const inLayNama = document.getElementById('input-layanan-nama');
            const inLayKat = document.getElementById('input-layanan-kategori');
            const inLaySat = document.getElementById('input-layanan-satuan');
            const inLayHarga = document.getElementById('input-layanan-harga');
            const modalLayTitle = document.getElementById('modal-layanan-title');

            function getDbLayanan() {
                return JSON.parse(localStorage.getItem('db_layanan') || '[]');
            }

            function setDbLayanan(data) {
                localStorage.setItem('db_layanan', JSON.stringify(data));
            }

            function renderLayananList() {
                const db = getDbLayanan();
                layananListContainer.innerHTML = '';
                if (db.length === 0) {
                    layananListContainer.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">Belum ada layanan. Klik Tambah untuk membuat baru.</div>';
                    return;
                }

                db.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #f1f5f9;';
                    div.innerHTML = `
                  <div>
                      <div style="font-weight:600; font-size:0.95rem; color:#1e293b;">${item.NamaLayanan || item.name || 'Layanan'}</div>
                      <div style="font-size:0.75rem; color:#64748b;">${item.Kategori || item.kategori || 'Kiloan'} ï¿½ Rp ${parseInt(item.Harga || item.harga || 0).toLocaleString('id-ID')} / ${item.Satuan || item.satuan || 'Kg'}</div>
                  </div>
                  <button class="btn-edit-layanan" data-idx="${index}" style="background:#f1f5f9; color:#475569; border:none; padding:8px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.8rem;">Edit</button>
              `;
                    layananListContainer.appendChild(div);
                });

                document.querySelectorAll('.btn-edit-layanan').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = e.target.getAttribute('data-idx');
                        bukaModalLayanan(idx);
                    });
                });
            }

            function bukaModalLayanan(idx = null) {
                if (idx !== null) {
                    const db = getDbLayanan();
                    const item = db[idx];
                    modalLayTitle.innerText = 'Edit Layanan';
                    inLayId.value = idx;
                    inLayNama.value = item.NamaLayanan || item.name || '';
                    inLayKat.value = (item.Kategori || item.kategori || 'kiloan').toLowerCase();
                    inLaySat.value = item.Satuan || item.satuan || 'Kg';
                    inLayHarga.value = item.Harga || item.harga || 0;
                    btnHapusLayanan.style.display = 'block';
                } else {
                    modalLayTitle.innerText = 'Tambah Layanan';
                    inLayId.value = '';
                    inLayNama.value = '';
                    inLayKat.value = 'kiloan';
                    inLaySat.value = 'Kg';
                    inLayHarga.value = '';
                    btnHapusLayanan.style.display = 'none';
                }
                modalLayanan.style.display = 'flex';
            }

            if (btnMenuKelolaLayanan) {
                btnMenuKelolaLayanan.addEventListener('click', () => {
                    renderLayananList();
                    layoutMain.classList.remove('active');
                    layoutMain.style.display = 'none';
                    layoutLayanan.style.display = 'block';
                    setTimeout(() => layoutLayanan.classList.add('active'), 10);
                });
            }

            if (btnBackLayanan) {
                btnBackLayanan.addEventListener('click', () => {
                    layoutLayanan.classList.remove('active');
                    setTimeout(() => {
                        layoutLayanan.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            if (btnTambahLayanan) {
                btnTambahLayanan.addEventListener('click', () => {
                    bukaModalLayanan(null);
                });
            }

            if (btnCloseModalLayanan) {
                btnCloseModalLayanan.addEventListener('click', () => {
                    modalLayanan.style.display = 'none';
                });
            }

            if (btnSimpanLayanan) {
                btnSimpanLayanan.addEventListener('click', () => {
                    const nama = inLayNama.value.trim();
                    const harga = parseInt(inLayHarga.value) || 0;
                    const kategori = inLayKat.value;
                    const satuan = inLaySat.value;

                    if (!nama || harga <= 0) return window.showToast('Nama dan harga layanan harus diisi valid');

                    const db = getDbLayanan();
                    const newItem = {
                        Kategori: kategori,
                        NamaLayanan: nama,
                        Harga: harga,
                        Satuan: satuan
                    };

                    const idx = inLayId.value;
                    if (idx !== '') {
                        db[idx] = newItem;
                        window.showToast('Layanan berhasil diperbarui');
                    } else {
                        db.push(newItem);
                        window.showToast('Layanan berhasil ditambahkan');
                    }

                    setDbLayanan(db);
                    modalLayanan.style.display = 'none';
                    renderLayananList();
                    if (typeof renderPOSServices === 'function') renderPOSServices();
                });
            }

            if (btnHapusLayanan) {
                btnHapusLayanan.addEventListener('click', () => {
                    if (confirm('Yakin ingin menghapus layanan ini?')) {
                        const idx = inLayId.value;
                        if (idx !== '') {
                            const db = getDbLayanan();
                            db.splice(idx, 1);
                            setDbLayanan(db);
                            window.showToast('Layanan berhasil dihapus');
                            modalLayanan.style.display = 'none';
                            renderLayananList();
                            if (typeof renderPOSServices === 'function') renderPOSServices();
                        }
                    }
                });
            }

            function renderPOSServices() {
                const container = document.getElementById('service-accordion-container');
                if (!container) return;
                const db = getDbLayanan();

                const groups = { kiloan: [], satuan: [], meter: [] };
                db.forEach(item => {
                    const kat = (item.Kategori || item.kategori || 'kiloan').toLowerCase();
                    if (groups[kat]) groups[kat].push(item);
                    else groups['kiloan'].push(item);
                });

                let html = '';
                const configs = [
                    { key: 'kiloan', title: 'KILOAN', icon: 'fa-scale-balanced' },
                    { key: 'satuan', title: 'SATUAN', icon: 'fa-shirt' },
                    { key: 'meter', title: 'KARPET / METER', icon: 'fa-ruler' }
                ];

                configs.forEach(cfg => {
                    const items = groups[cfg.key];
                    html += `<div class="service-accordion-item acc-item" data-category="${cfg.key}">
                  <div class="service-accordion-header">
                      <div class="left-col">
                          <div class="service-accordion-icon"><i class="fa-solid ${cfg.icon}"></i></div>
                          <div>
                              <div class="service-accordion-title">${cfg.title}</div>
                              <div style="font-size:0.75rem; color:#64748b;">${items.length} Layanan</div>
                          </div>
                      </div>
                      <i class="fa-solid fa-chevron-down acc-icon"></i>
                  </div>
                  <div class="service-accordion-body">`;

                    if (items.length === 0) {
                        html += `<div style="padding:15px; text-align:center; color:#94a3b8; font-size:0.85rem;">Belum ada layanan</div>`;
                    } else {
                        items.forEach(svc => {
                            const name = svc.NamaLayanan || svc.name || 'Layanan';
                            const price = parseInt(svc.Harga || svc.harga || 0);
                            const unit = svc.Satuan || svc.satuan || 'Kg';
                            html += `<div class="service-option-row btn-select-service" data-name="${name}" data-price="${price}" data-unit="${unit}" style="cursor: pointer; transition: all 0.2s;">
                          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                              <div>
                                  <div style="font-weight:600; font-size:0.9rem; color:#1e293b;">${name}</div>
                                  <div style="font-size:0.75rem; color:#64748b;">Rp ${price.toLocaleString('id-ID')} / ${unit}</div>
                              </div>
                              <i class="fa-solid fa-check check-icon" style="color: #0ea5e9; display: none;"></i>
                          </div>
                      </div>`;
                        });
                    }
                    html += `</div></div>`;
                });

                container.innerHTML = html;

                // Re-attach accordion toggle logic
                document.querySelectorAll('#service-accordion-container .service-accordion-header').forEach(header => {
                    header.addEventListener('click', () => {
                        header.nextElementSibling.classList.toggle('open');
                    });
                });

                // Re-attach select service logic
                const btnSelectServices = document.querySelectorAll('#service-accordion-container .btn-select-service');
                const inputQty = document.getElementById('input-qty');
                const lblUnit = document.getElementById('lbl-unit');

                btnSelectServices.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        btnSelectServices.forEach(b => {
                            b.classList.remove('selected');
                            b.style.background = '';
                            const icon = b.querySelector('.check-icon');
                            if (icon) icon.style.display = 'none';
                        });
                        const currentBtn = e.currentTarget;
                        currentBtn.classList.add('selected');
                        currentBtn.style.background = '#f0f9ff';
                        const activeIcon = currentBtn.querySelector('.check-icon');
                        if (activeIcon) activeIcon.style.display = 'block';

                        const name = currentBtn.dataset.name;
                        const price = parseInt(currentBtn.dataset.price);
                        const unit = currentBtn.dataset.unit;

                        selectedService = { name, price, unit };
                        lblUnit.innerText = unit;
                        inputQty.value = 1; // reset qty to 1
                    });
                });
            }

            // Call once to initialize
            renderPOSServices();

            // --- PENGATURAN PROFIL PERUSAHAAN LOGIC ---
            const layoutPengaturan = document.getElementById('layout-pengaturan');
            const btnBackPengaturan = document.getElementById('btn-back-pengaturan');
            const inputCompanyName = document.getElementById('input-company-name');
            const inputCompanyLogo = document.getElementById('input-company-logo');
            const btnUploadLogo = document.getElementById('btn-upload-logo');
            const previewCompanyLogo = document.getElementById('preview-company-logo');
            const btnSavePengaturan = document.getElementById('btn-save-pengaturan');
            let tempLogoBase64 = '';

            // Initialize values on open
            function initPengaturanLainnya() {
                const savedName = localStorage.getItem('company_name') || '';
                const savedLogo = localStorage.getItem('company_logo') || '';
                if (savedName) inputCompanyName.value = savedName;
                if (savedLogo) {
                    previewCompanyLogo.src = savedLogo;
                    tempLogoBase64 = savedLogo;
                } else {
                    previewCompanyLogo.src = 'logo_manjur.png';
                    tempLogoBase64 = '';
                }
            }

            if (btnBackPengaturan && layoutPengaturan) {
                btnBackPengaturan.addEventListener('click', () => {
                    layoutPengaturan.classList.remove('active');
                    setTimeout(() => {
                        layoutPengaturan.style.display = 'none';
                        layoutMain.style.display = 'flex';
                        setTimeout(() => layoutMain.classList.add('active'), 10);
                    }, 300);
                });
            }

            if (btnUploadLogo) {
                btnUploadLogo.addEventListener('click', () => inputCompanyLogo.click());
            }

            if (inputCompanyLogo) {
                inputCompanyLogo.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (file.size > 1024 * 1024) {
                            window.showToast('Ukuran file maksimal 1MB');
                            return;
                        }
                        const reader = new FileReader();
                        reader.onload = function (evt) {
                            tempLogoBase64 = evt.target.result;
                            previewCompanyLogo.src = tempLogoBase64;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            if (btnSavePengaturan) {
                btnSavePengaturan.addEventListener('click', () => {
                    const newName = inputCompanyName.value.trim();
                    if (newName) localStorage.setItem('company_name', newName);
                    if (tempLogoBase64) localStorage.setItem('company_logo', tempLogoBase64);

                    applyCompanyProfile();
                    window.showToast('Pengaturan berhasil disimpan');
                    btnBackPengaturan.click();
                });
            }

            // Apply globally
            function applyCompanyProfile() {
                const savedName = localStorage.getItem('company_name');
                const savedLogo = localStorage.getItem('company_logo');
                const savedAddress = localStorage.getItem('company_address') || 'Jalan tanjung lobam, Tlk';
                const savedPhone = localStorage.getItem('company_phone') || '082377178107';

                if (savedName) {
                    document.querySelectorAll('.dynamic-company-name').forEach(el => el.innerText = savedName);
                    document.title = savedName;
                }
                document.querySelectorAll('.dynamic-company-address').forEach(el => el.innerText = savedAddress);
                document.querySelectorAll('.dynamic-company-phone').forEach(el => el.innerText = savedPhone);

                if (savedLogo) {
                    const sidebarLogo = document.getElementById('sidebar-logo');
                    if (sidebarLogo) sidebarLogo.src = savedLogo;
                    document.querySelectorAll('.dynamic-logo').forEach(el => el.src = savedLogo);
                }
            }

            // Call on app load
            applyCompanyProfile();

            // Bind click to "Pengaturan Lainnya" row
            const btnMenuPengaturan = document.getElementById('btn-menu-pengaturan-lainnya') || Array.from(document.querySelectorAll('.clickable-menu')).find(el => el.innerText.includes('Pengaturan Lainnya') || el.querySelector('div')?.innerText.includes('Pengaturan Lainnya'));
            if (btnMenuPengaturan) {
                btnMenuPengaturan.addEventListener('click', () => {
                    initPengaturanLainnya();
                    layoutMain.classList.remove('active');
                    layoutMain.style.display = 'none';
                    layoutPengaturan.style.display = 'block';
                    setTimeout(() => layoutPengaturan.classList.add('active'), 10);
                });
            }

            // Bind click to "Pengaturan Printer" row
            const btnMenuPrinter = document.getElementById('btn-menu-pengaturan-printer');
            if (btnMenuPrinter) {
                btnMenuPrinter.addEventListener('click', () => {
                    if (typeof btPrinter !== 'undefined' && btPrinter.connect) {
                        btPrinter.connect();
                    } else {
                        alert('Menyiapkan koneksi Printer Bluetooth Thermal 58mm...');
                    }
                });
            }


            // Initialize Dashboard Pesanan
            renderDashboardPesanan();

            // --- KELOLA KEUANGAN MAIN LOGIC ---
            const btnMenuKelolaKeuangan = document.getElementById('btn-menu-kelola-keuangan');
            const layoutKelolaKeuangan = document.getElementById('layout-kelola-keuangan');
            const btnBackKelolaKeuangan = document.getElementById('btn-back-kelola-keuangan');

            if (btnMenuKelolaKeuangan && layoutKelolaKeuangan) {
                btnMenuKelolaKeuangan.addEventListener('click', () => {
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) {
                        layoutMain.classList.remove('active');
                        layoutMain.style.display = 'none';
                    }
                    layoutKelolaKeuangan.classList.add('active');
                    layoutKelolaKeuangan.style.display = 'block';
                });
            }

            if (btnBackKelolaKeuangan) {
                btnBackKelolaKeuangan.addEventListener('click', () => {
                    layoutKelolaKeuangan.classList.remove('active');
                    layoutKelolaKeuangan.style.display = 'none';
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) {
                        layoutMain.classList.add('active');
                        layoutMain.style.display = 'block';
                    }
                });
            }
            const btnExportExcelDetail = document.getElementById('btn-export-excel-detail');
            if (btnExportExcelDetail) {
                btnExportExcelDetail.addEventListener('click', () => {
                    if (!window.currentDetailData || window.currentDetailData.length === 0) {
                        alert('Tidak ada data untuk di-export');
                        return;
                    }
                    
                    // Create CSV
                    let csvContent = "data:text/csv;charset=utf-8,";
                    // Tambahkan instruksi separator untuk memaksa Excel memisahkan kolom dengan titik koma
                    csvContent += "sep=;\r\n";
                    // Headers
                    if (window.currentDetailTipe === 'Detail Pendapatan Transaksi') {
                        csvContent += "Tanggal Transaksi;No. Nota;Nama/Keterangan;Tanggal Pembayaran;Metode Pembayaran;Nominal (Rp);Tipe\r\n";
                    } else {
                        csvContent += "Tanggal;No. Nota;Nama/Keterangan;Nominal (Rp);Tipe\r\n";
                    }
                    
                    window.currentDetailData.forEach(item => {
                        let d = window.parseDateString ? window.parseDateString(item.date) : new Date(item.date);
                        let dateStr = (d && !isNaN(d)) ? d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : item.date;
                        let rawNominal = parseFloat(item.nominal || 0);
                        let nominalFormatted = rawNominal.toLocaleString('id-ID'); // Format dengan titik
                        let tipeStr = item.isOut ? 'Keluar' : 'Masuk';
                        let desc = (item.desc || '').replace(/;/g, ' ').replace(/\n/g, ' '); // avoid CSV break
                        
                        if (window.currentDetailTipe === 'Detail Pendapatan Transaksi') {
                            let pd = window.parseDateString ? window.parseDateString(item.paymentDate) : new Date(item.paymentDate);
                            let pdStr = (pd && !isNaN(pd)) ? pd.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : (item.paymentDate ? item.paymentDate.substring(0,10) : dateStr);
                            let method = (item.paymentMethod || 'Tunai').replace(/;/g, ' ').replace(/\n/g, ' ');
                            csvContent += `${dateStr};${item.id || '-'};${desc};${pdStr};${method};${nominalFormatted};${tipeStr}\r\n`;
                        } else {
                            csvContent += `${dateStr};${item.id || '-'};${desc};${nominalFormatted};${tipeStr}\r\n`;
                        }
                    });
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    
                    let filename = (window.currentDetailTipe || 'Export').replace(/ /g, '_') + '.csv';
                    link.setAttribute("download", filename);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            }

            // --- KELOLA KEUANGAN 7 SUBMENUS NAVIGATION ---
            const layoutKelolaKeuanganList = [
                'layout-atur-cashbox', 'layout-atur-kategori', 'layout-tambah-pendapatan',
                'layout-tambah-pengeluaran', 'layout-pemindahan-saldo', 'layout-koreksi-keuangan', 'layout-koreksi-pembayaran'
            ];

            function showKkSubmenu(layoutId) {
                layoutKelolaKeuangan.classList.remove('active');
                layoutKelolaKeuangan.style.display = 'none';

                const target = document.getElementById(layoutId);
                if (target) {
                    target.classList.add('active');
                    target.style.display = 'block';
                }
            }

            function hideKkSubmenu(layoutId) {
                const target = document.getElementById(layoutId);
                if (target) {
                    target.classList.remove('active');
                    target.style.display = 'none';
                }

                layoutKelolaKeuangan.classList.add('active');
                layoutKelolaKeuangan.style.display = 'block';
            }

            // Attach click listeners to menu buttons
            document.getElementById('btn-kk-atur-cashbox')?.addEventListener('click', () => { showKkSubmenu('layout-atur-cashbox'); renderAturCashbox(); });
            document.getElementById('btn-kk-atur-kategori')?.addEventListener('click', () => { showKkSubmenu('layout-atur-kategori'); renderAturKategori(); });
            document.getElementById('btn-kk-tambah-pendapatan')?.addEventListener('click', () => { showKkSubmenu('layout-tambah-pendapatan'); initFormPendapatan(); });
            document.getElementById('btn-kk-tambah-pengeluaran')?.addEventListener('click', () => { showKkSubmenu('layout-tambah-pengeluaran'); initFormPengeluaran(); });
            document.getElementById('btn-kk-pemindahan-saldo')?.addEventListener('click', () => { showKkSubmenu('layout-pemindahan-saldo'); initFormPemindahan(); });
            document.getElementById('btn-kk-koreksi-keuangan')?.addEventListener('click', () => { showKkSubmenu('layout-koreksi-keuangan'); initFormKoreksiKeuangan(); });
            document.getElementById('btn-kk-koreksi-pembayaran')?.addEventListener('click', () => { showKkSubmenu('layout-koreksi-pembayaran'); renderKoreksiPembayaran(); });

            // Attach click listeners to back buttons
            document.getElementById('btn-back-atur-cashbox')?.addEventListener('click', () => hideKkSubmenu('layout-atur-cashbox'));
            document.getElementById('btn-back-atur-kategori')?.addEventListener('click', () => hideKkSubmenu('layout-atur-kategori'));
            document.getElementById('btn-back-tambah-pendapatan')?.addEventListener('click', () => hideKkSubmenu('layout-tambah-pendapatan'));
            document.getElementById('btn-back-tambah-pengeluaran')?.addEventListener('click', () => hideKkSubmenu('layout-tambah-pengeluaran'));
            document.getElementById('btn-back-pemindahan-saldo')?.addEventListener('click', () => hideKkSubmenu('layout-pemindahan-saldo'));
            document.getElementById('btn-back-koreksi-keuangan')?.addEventListener('click', () => hideKkSubmenu('layout-koreksi-keuangan'));
            document.getElementById('btn-back-koreksi-pembayaran')?.addEventListener('click', () => hideKkSubmenu('layout-koreksi-pembayaran'));

            // DB Helpers for Finance
            // LocalStorage keys: db_cashbox, db_kategori_pemasukan, db_kategori_pengeluaran

            function getDbCashbox() {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_cashbox' : 'db_cashbox_' + activeOutlet;
                let data = localStorage.getItem(key);
                if (!data) {
                    // Default cashbox
                    data = JSON.stringify(['Tunai', 'BCA', 'Mandiri', 'Kasir Utama']);
                    localStorage.setItem(key, data);
                }
                return JSON.parse(data);
            }

            function saveDbCashbox(arr) {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_cashbox' : 'db_cashbox_' + activeOutlet;
                localStorage.setItem(key, JSON.stringify(arr));
            }

            function getDbKategoriPemasukan() {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_kategori_pemasukan' : 'db_kategori_pemasukan_' + activeOutlet;
                let data = localStorage.getItem(key);
                if (!data) {
                    data = JSON.stringify(['Pendapatan Usaha', 'Pemasukan Lainnya']);
                    localStorage.setItem(key, data);
                }
                return JSON.parse(data);
            }

            function saveDbKategoriPemasukan(arr) {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_kategori_pemasukan' : 'db_kategori_pemasukan_' + activeOutlet;
                localStorage.setItem(key, JSON.stringify(arr));
            }

            function getDbKategoriPengeluaran() {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_kategori_pengeluaran' : 'db_kategori_pengeluaran_' + activeOutlet;
                let data = localStorage.getItem(key);
                if (!data) {
                    data = JSON.stringify(['Biaya Operasional', 'Gaji Karyawan', 'Kas Bon', 'Pembelian Inventory']);
                    localStorage.setItem(key, data);
                }
                return JSON.parse(data);
            }

            function saveDbKategoriPengeluaran(arr) {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_kategori_pengeluaran' : 'db_kategori_pengeluaran_' + activeOutlet;
                localStorage.setItem(key, JSON.stringify(arr));
            }


            // --- 1. ATUR CASHBOX LOGIC ---
            let cashboxList = [];
            let editCashboxIndex = -1;

            function renderAturCashbox() {
                cashboxList = getDbCashbox();
                const container = document.getElementById('cashbox-list-container');
                if (!container) return;

                container.innerHTML = '';
                cashboxList.forEach((c, index) => {
                    const div = document.createElement('div');
                    div.style.padding = '15px';
                    div.style.background = '#ffffff';
                    div.style.borderRadius = '8px';
                    div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';

                    const nameDiv = document.createElement('div');
                    nameDiv.innerText = c;
                    nameDiv.style.fontWeight = '600';
                    nameDiv.style.color = '#334155';

                    const actionDiv = document.createElement('div');
                    actionDiv.style.display = 'flex';
                    actionDiv.style.gap = '15px';

                    const editBtn = document.createElement('i');
                    editBtn.className = 'fa-solid fa-pen';
                    editBtn.style.color = '#3b82f6';
                    editBtn.style.cursor = 'pointer';
                    editBtn.onclick = () => { editCashboxIndex = index; openModalCashbox(c); };

                    const delBtn = document.createElement('i');
                    delBtn.className = 'fa-solid fa-trash';
                    delBtn.style.color = '#ef4444';
                    delBtn.style.cursor = 'pointer';
                    delBtn.onclick = () => { deleteCashbox(index); };

                    actionDiv.appendChild(editBtn);
                    actionDiv.appendChild(delBtn);

                    div.appendChild(nameDiv);
                    div.appendChild(actionDiv);
                    container.appendChild(div);
                });
            }

            const modalCashbox = document.getElementById('modal-tambah-cashbox');
            const inputCashboxName = document.getElementById('input-cashbox-nama');

            function openModalCashbox(existingName = '') {
                inputCashboxName.value = existingName;
                document.getElementById('modal-cashbox-title').innerText = existingName ? 'Edit Cashbox' : 'Tambah Cashbox';
                modalCashbox.style.display = 'flex';
            }

            document.getElementById('btn-tambah-cashbox')?.addEventListener('click', () => {
                editCashboxIndex = -1;
                openModalCashbox();
            });

            document.getElementById('btn-batal-cashbox')?.addEventListener('click', () => {
                modalCashbox.style.display = 'none';
            });

            document.getElementById('btn-simpan-cashbox')?.addEventListener('click', () => {
                const val = inputCashboxName.value.trim();
                if (!val) return alert('Nama Cashbox tidak boleh kosong');

                if (editCashboxIndex === -1) {
                    cashboxList.push(val);
                } else {
                    cashboxList[editCashboxIndex] = val;
                }
                saveDbCashbox(cashboxList);
                modalCashbox.style.display = 'none';
                renderAturCashbox();
            });

            function deleteCashbox(index) {
                if (confirm('Hapus cashbox ini?')) {
                    cashboxList.splice(index, 1);
                    saveDbCashbox(cashboxList);
                    renderAturCashbox();
                }
            }


            // --- 2. ATUR KATEGORI LOGIC ---
            let kategoriTabActive = 'Pemasukan';
            let kategoriList = [];
            let editKategoriIndex = -1;

            function renderAturKategori() {
                if (kategoriTabActive === 'Pemasukan') {
                    kategoriList = getDbKategoriPemasukan();
                    document.getElementById('tab-kat-pemasukan').style.background = '#ffffff';
                    document.getElementById('tab-kat-pemasukan').style.color = '#1e293b';
                    document.getElementById('tab-kat-pemasukan').style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    document.getElementById('tab-kat-pengeluaran').style.background = 'transparent';
                    document.getElementById('tab-kat-pengeluaran').style.color = '#64748b';
                    document.getElementById('tab-kat-pengeluaran').style.boxShadow = 'none';
                } else {
                    kategoriList = getDbKategoriPengeluaran();
                    document.getElementById('tab-kat-pengeluaran').style.background = '#ffffff';
                    document.getElementById('tab-kat-pengeluaran').style.color = '#1e293b';
                    document.getElementById('tab-kat-pengeluaran').style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    document.getElementById('tab-kat-pemasukan').style.background = 'transparent';
                    document.getElementById('tab-kat-pemasukan').style.color = '#64748b';
                    document.getElementById('tab-kat-pemasukan').style.boxShadow = 'none';
                }

                const container = document.getElementById('kategori-list-container');
                if (!container) return;

                container.innerHTML = '';
                kategoriList.forEach((k, index) => {
                    const div = document.createElement('div');
                    div.style.padding = '15px';
                    div.style.background = '#ffffff';
                    div.style.borderRadius = '8px';
                    div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';

                    const nameDiv = document.createElement('div');
                    nameDiv.innerText = k;
                    nameDiv.style.fontWeight = '600';
                    nameDiv.style.color = '#334155';

                    const actionDiv = document.createElement('div');
                    actionDiv.style.display = 'flex';
                    actionDiv.style.gap = '15px';

                    const editBtn = document.createElement('i');
                    editBtn.className = 'fa-solid fa-pen';
                    editBtn.style.color = '#3b82f6';
                    editBtn.style.cursor = 'pointer';
                    editBtn.onclick = () => { editKategoriIndex = index; openModalKategori(k); };

                    const delBtn = document.createElement('i');
                    delBtn.className = 'fa-solid fa-trash';
                    delBtn.style.color = '#ef4444';
                    delBtn.style.cursor = 'pointer';
                    delBtn.onclick = () => { deleteKategori(index); };

                    actionDiv.appendChild(editBtn);
                    actionDiv.appendChild(delBtn);

                    div.appendChild(nameDiv);
                    div.appendChild(actionDiv);
                    container.appendChild(div);
                });
            }

            document.getElementById('tab-kat-pemasukan')?.addEventListener('click', () => { kategoriTabActive = 'Pemasukan'; renderAturKategori(); });
            document.getElementById('tab-kat-pengeluaran')?.addEventListener('click', () => { kategoriTabActive = 'Pengeluaran'; renderAturKategori(); });

            const modalKategori = document.getElementById('modal-tambah-kategori');
            const inputKategoriName = document.getElementById('input-kategori-nama');

            function openModalKategori(existingName = '') {
                inputKategoriName.value = existingName;
                document.getElementById('modal-kategori-title').innerText = existingName ? 'Edit Kategori' : 'Tambah Kategori';
                modalKategori.style.display = 'flex';
            }

            document.getElementById('btn-tambah-kategori')?.addEventListener('click', () => {
                editKategoriIndex = -1;
                openModalKategori();
            });

            document.getElementById('btn-batal-kategori')?.addEventListener('click', () => {
                modalKategori.style.display = 'none';
            });

            document.getElementById('btn-simpan-kategori')?.addEventListener('click', () => {
                const val = inputKategoriName.value.trim();
                if (!val) return alert('Nama Kategori tidak boleh kosong');

                if (editKategoriIndex === -1) {
                    kategoriList.push(val);
                } else {
                    kategoriList[editKategoriIndex] = val;
                }

                if (kategoriTabActive === 'Pemasukan') {
                    saveDbKategoriPemasukan(kategoriList);
                } else {
                    saveDbKategoriPengeluaran(kategoriList);
                }

                modalKategori.style.display = 'none';
                renderAturKategori();
            });

            function deleteKategori(index) {
                if (confirm('Hapus kategori ini?')) {
                    kategoriList.splice(index, 1);
                    if (kategoriTabActive === 'Pemasukan') saveDbKategoriPemasukan(kategoriList);
                    else saveDbKategoriPengeluaran(kategoriList);
                    renderAturKategori();
                }
            }


            // --- 3. TAMBAH PENDAPATAN LOGIC ---
            function initFormPendapatan() {
                const cashboxSelect = document.getElementById('input-pdk-cashbox');
                const katSelect = document.getElementById('input-pdk-kategori');

                cashboxSelect.innerHTML = '';
                getDbCashbox().forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c; opt.innerText = c;
                    cashboxSelect.appendChild(opt);
                });

                katSelect.innerHTML = '';
                getDbKategoriPemasukan().forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k; opt.innerText = k;
                    katSelect.appendChild(opt);
                });

                document.getElementById('input-pdk-tanggal').value = new Date().toISOString().split('T')[0];
                document.getElementById('input-pdk-nominal').value = '';
                document.getElementById('input-pdk-keterangan').value = '';
            }

            document.getElementById('btn-simpan-pendapatan')?.addEventListener('click', () => {
                const tgl = document.getElementById('input-pdk-tanggal').value;
                const nom = parseFloat(document.getElementById('input-pdk-nominal').value);
                const cb = document.getElementById('input-pdk-cashbox').value;
                const kat = document.getElementById('input-pdk-kategori').value;
                const ket = document.getElementById('input-pdk-keterangan').value;

                if (!tgl || isNaN(nom) || nom <= 0 || !cb || !kat) {
                    return alert('Harap lengkapi form dengan benar.');
                }

                const data = {
                    id: 'INC-' + Date.now(),
                    type: 'pendapatan_lain',
                    date: tgl,
                    nominal: nom,
                    cashbox: cb,
                    category: kat,
                    keterangan: ket,
                    timestamp: Date.now()
                };

                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet;
                const history = JSON.parse(localStorage.getItem(key) || '[]');
                history.unshift(data);
                localStorage.setItem(key, JSON.stringify(history));

                if (window.Swal) Swal.fire('Berhasil', 'Pendapatan berhasil disimpan', 'success');
                else alert('Berhasil disimpan');

                hideKkSubmenu('layout-tambah-pendapatan');
            });


            // --- 4. TAMBAH PENGELUARAN LOGIC ---
            function initFormPengeluaran() {
                const cashboxSelect = document.getElementById('input-pgk-cashbox');
                const katSelect = document.getElementById('input-pgk-kategori');

                cashboxSelect.innerHTML = '';
                getDbCashbox().forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c; opt.innerText = c;
                    cashboxSelect.appendChild(opt);
                });

                katSelect.innerHTML = '';
                getDbKategoriPengeluaran().forEach(k => {
                    const opt = document.createElement('option');
                    opt.value = k; opt.innerText = k;
                    katSelect.appendChild(opt);
                });

                document.getElementById('input-pgk-tanggal').value = new Date().toISOString().split('T')[0];
                document.getElementById('input-pgk-nominal').value = '';
                document.getElementById('input-pgk-keterangan').value = '';
            }

            document.getElementById('btn-simpan-pengeluaran')?.addEventListener('click', () => {
                const tgl = document.getElementById('input-pgk-tanggal').value;
                const nom = parseFloat(document.getElementById('input-pgk-nominal').value);
                const cb = document.getElementById('input-pgk-cashbox').value;
                const kat = document.getElementById('input-pgk-kategori').value;
                const ket = document.getElementById('input-pgk-keterangan').value;

                if (!tgl || isNaN(nom) || nom <= 0 || !cb || !kat) {
                    return alert('Harap lengkapi form dengan benar.');
                }

                const data = {
                    id: 'EXP-' + Date.now(),
                    type: 'pengeluaran',
                    date: tgl,
                    nominal: nom,
                    cashbox: cb,
                    category: kat,
                    keterangan: ket,
                    timestamp: Date.now()
                };

                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;
                const history = JSON.parse(localStorage.getItem(key) || '[]');
                history.unshift(data);
                localStorage.setItem(key, JSON.stringify(history));

                if (window.Swal) Swal.fire('Berhasil', 'Pengeluaran berhasil disimpan', 'success');
                else alert('Berhasil disimpan');

                hideKkSubmenu('layout-tambah-pengeluaran');
            });


            // --- 5. PEMINDAHAN SALDO LOGIC ---
            function initFormPemindahan() {
                const dariSelect = document.getElementById('input-ps-dari');
                const keSelect = document.getElementById('input-ps-ke');

                const cashboxList = getDbCashbox();
                dariSelect.innerHTML = ''; keSelect.innerHTML = '';
                cashboxList.forEach(c => {
                    const opt1 = document.createElement('option'); opt1.value = c; opt1.innerText = c;
                    const opt2 = document.createElement('option'); opt2.value = c; opt2.innerText = c;
                    dariSelect.appendChild(opt1);
                    keSelect.appendChild(opt2);
                });

                document.getElementById('input-ps-tanggal').value = new Date().toISOString().split('T')[0];
                document.getElementById('input-ps-nominal').value = '';
                document.getElementById('input-ps-keterangan').value = '';
            }

            document.getElementById('btn-simpan-pemindahan')?.addEventListener('click', () => {
                const tgl = document.getElementById('input-ps-tanggal').value;
                const nom = parseFloat(document.getElementById('input-ps-nominal').value);
                const dari = document.getElementById('input-ps-dari').value;
                const ke = document.getElementById('input-ps-ke').value;
                const ket = document.getElementById('input-ps-keterangan').value || `Transfer dari ${dari} ke ${ke}`;

                if (!tgl || isNaN(nom) || nom <= 0 || !dari || !ke) {
                    return alert('Harap lengkapi form dengan benar.');
                }
                if (dari === ke) {
                    return alert('Cashbox sumber dan tujuan tidak boleh sama.');
                }

                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const keyIn = activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet;
                const keyOut = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;

                const pengeluaranArr = JSON.parse(localStorage.getItem(keyOut) || '[]');
                pengeluaranArr.unshift({
                    id: 'TRF-OUT-' + Date.now(), type: 'pengeluaran', date: tgl,
                    nominal: nom, cashbox: dari, category: 'Pemindahan Saldo', keterangan: ket, timestamp: Date.now()
                });
                localStorage.setItem(keyOut, JSON.stringify(pengeluaranArr));

                const pemasukanArr = JSON.parse(localStorage.getItem(keyIn) || '[]');
                pemasukanArr.unshift({
                    id: 'TRF-IN-' + Date.now(), type: 'pendapatan_lain', date: tgl,
                    nominal: nom, cashbox: ke, category: 'Pemindahan Saldo', keterangan: ket, timestamp: Date.now()
                });
                localStorage.setItem(keyIn, JSON.stringify(pemasukanArr));

                if (window.Swal) Swal.fire('Berhasil', 'Saldo berhasil dipindahkan', 'success');
                else alert('Berhasil dipindahkan');

                hideKkSubmenu('layout-pemindahan-saldo');
            });


            // --- 6. KOREKSI KEUANGAN LOGIC ---
            function hitungSaldoSistem(cashboxName) {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const keyIn = activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet;
                const keyOut = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;

                let inData = JSON.parse(localStorage.getItem(keyIn) || '[]');
                let outData = JSON.parse(localStorage.getItem(keyOut) || '[]');

                let total = 0;

                // Tambah Pemasukan
                inData.forEach(p => {
                    // Jika transaksi laundry (tidak ada p.type) atau pendapatan_lain
                    // Catatan: Transaksi lama yang belum punya cashbox akan dianggap 'Tunai'
                    let cb = p.cashbox || 'Tunai';
                    if (cb === cashboxName) {
                        if (p.type === 'pendapatan_lain' || p.type === 'koreksi') {
                            total += parseFloat(p.nominal || 0);
                        } else if (!p.type) {
                            // Transaksi laundry
                            total += parseFloat(p.dibayar || 0);
                        }
                    }
                });

                // Kurangi Pengeluaran
                outData.forEach(p => {
                    let cb = p.cashbox || 'Tunai';
                    if (cb === cashboxName) {
                        total -= parseFloat(p.nominal || 0);
                    }
                });

                return total;
            }

            function initFormKoreksiKeuangan() {
                const cbSelect = document.getElementById('input-kk-cashbox');
                cbSelect.innerHTML = '';
                getDbCashbox().forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c; opt.innerText = c;
                    cbSelect.appendChild(opt);
                });

                document.getElementById('input-kk-aktual').value = '';
                document.getElementById('input-kk-keterangan').value = '';
                document.getElementById('kk-selisih-container').style.display = 'none';

                function updateDisplay() {
                    let cb = cbSelect.value;
                    let currentSaldo = hitungSaldoSistem(cb);
                    document.getElementById('kk-saldo-sistem').innerText = 'Rp ' + currentSaldo.toLocaleString('id-ID');

                    let valAktual = document.getElementById('input-kk-aktual').value;
                    if (valAktual !== '') {
                        let aktual = parseFloat(valAktual);
                        let diff = aktual - currentSaldo;
                        document.getElementById('kk-selisih-container').style.display = 'block';
                        let elDiff = document.getElementById('kk-selisih-nominal');
                        elDiff.innerText = 'Rp ' + diff.toLocaleString('id-ID');
                        if (diff > 0) {
                            elDiff.style.color = '#10b981'; // Plus
                            document.getElementById('kk-selisih-info').innerText = 'Sistem akan mencatat Penambahan Saldo.';
                        } else if (diff < 0) {
                            elDiff.style.color = '#ef4444'; // Minus
                            document.getElementById('kk-selisih-info').innerText = 'Sistem akan mencatat Pengurangan Saldo.';
                        } else {
                            elDiff.style.color = '#64748b'; // Sama
                            document.getElementById('kk-selisih-info').innerText = 'Saldo sudah balance.';
                        }
                    } else {
                        document.getElementById('kk-selisih-container').style.display = 'none';
                    }
                }

                cbSelect.addEventListener('change', updateDisplay);
                document.getElementById('input-kk-aktual').addEventListener('input', updateDisplay);

                // Init trigger
                if (cbSelect.options.length > 0) updateDisplay();
            }

            document.getElementById('btn-simpan-koreksi')?.addEventListener('click', () => {
                let cb = document.getElementById('input-kk-cashbox').value;
                let valAktual = document.getElementById('input-kk-aktual').value;
                let ket = document.getElementById('input-kk-keterangan').value || 'Koreksi Saldo Manual';

                if (valAktual === '') return alert('Masukkan saldo aktual');
                let aktual = parseFloat(valAktual);
                let current = hitungSaldoSistem(cb);
                let diff = aktual - current;

                if (diff === 0) return alert('Saldo sudah sesuai, tidak ada selisih yang perlu dikoreksi.');

                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const tgl = new Date().toISOString().split('T')[0];

                if (diff > 0) {
                    // Penambahan -> Masuk ke db_pemasukan
                    const keyIn = activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet;
                    let arr = JSON.parse(localStorage.getItem(keyIn) || '[]');
                    arr.unshift({
                        id: 'KOR-IN-' + Date.now(), type: 'koreksi', date: tgl,
                        nominal: diff, cashbox: cb, category: 'Koreksi Keuangan', keterangan: ket, timestamp: Date.now()
                    });
                    localStorage.setItem(keyIn, JSON.stringify(arr));
                } else {
                    // Pengurangan -> Masuk ke db_pengeluaran
                    const keyOut = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;
                    let arr = JSON.parse(localStorage.getItem(keyOut) || '[]');
                    arr.unshift({
                        id: 'KOR-OUT-' + Date.now(), type: 'pengeluaran', date: tgl,
                        nominal: Math.abs(diff), cashbox: cb, category: 'Koreksi Keuangan', keterangan: ket, timestamp: Date.now()
                    });
                    localStorage.setItem(keyOut, JSON.stringify(arr));
                }

                if (window.Swal) Swal.fire('Berhasil', 'Koreksi Keuangan berhasil dicatat', 'success');
                else alert('Koreksi berhasil');

                hideKkSubmenu('layout-koreksi-keuangan');
            });


            // --- 7. KOREKSI PEMBAYARAN LOGIC ---
            let riwayatKoreksiList = []; // store combined list of in/out/laundry
            let riwayatKoreksiActiveItem = null;

            function renderKoreksiPembayaran() {
                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const keyIn = activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet;
                const keyOut = activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet;

                let inData = JSON.parse(localStorage.getItem(keyIn) || '[]');
                let outData = JSON.parse(localStorage.getItem(keyOut) || '[]');

                riwayatKoreksiList = [];

                inData.forEach((p, idx) => {
                    if (!p.type) {
                        // Laundry
                        riwayatKoreksiList.push({
                            originalType: 'pemasukan', originalIndex: idx,
                            id: p.id, desc: p.customerName ? `Pesanan: ${p.customerName}` : 'Transaksi Laundry',
                            date: p.date || '-', nominal: p.dibayar || p.total || 0,
                            cashbox: p.cashbox || 'Tunai', timestamp: p.timestamp || Date.now(),
                            keterangan: 'Laundry', dataRef: p
                        });
                    } else {
                        riwayatKoreksiList.push({
                            originalType: 'pemasukan', originalIndex: idx,
                            id: p.id, desc: p.keterangan || p.category || 'Pemasukan Lain',
                            date: p.date || '-', nominal: p.nominal || 0,
                            cashbox: p.cashbox || 'Tunai', timestamp: p.timestamp || Date.now(),
                            keterangan: p.type, dataRef: p
                        });
                    }
                });

                outData.forEach((p, idx) => {
                    riwayatKoreksiList.push({
                        originalType: 'pengeluaran', originalIndex: idx,
                        id: p.id, desc: p.keterangan || p.category || 'Pengeluaran',
                        date: p.date || '-', nominal: p.nominal || 0,
                        cashbox: p.cashbox || 'Tunai', timestamp: p.timestamp || Date.now(),
                        keterangan: 'pengeluaran', dataRef: p
                    });
                });

                // Sort newest first
                riwayatKoreksiList.sort((a, b) => b.timestamp - a.timestamp);

                // Tampilkan 30 terakhir
                const container = document.getElementById('koreksi-pembayaran-list');
                container.innerHTML = '';

                riwayatKoreksiList.slice(0, 30).forEach((item, idx) => {
                    const div = document.createElement('div');
                    div.style.padding = '15px';
                    div.style.background = '#ffffff';
                    div.style.borderRadius = '8px';
                    div.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                    div.style.display = 'flex';
                    div.style.justifyContent = 'space-between';
                    div.style.alignItems = 'center';

                    const left = document.createElement('div');
                    left.innerHTML = `
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:4px;">${item.date} | ${item.id}</div>
                <div style="font-weight:600; color:#1e293b;">${item.desc}</div>
                <div style="font-size:0.85rem; color:#3b82f6; font-weight:500; margin-top:4px;">Rp ${parseFloat(item.nominal).toLocaleString('id-ID')} <span style="color:#64748b;">( ${item.cashbox} )</span></div>
            `;

                    const right = document.createElement('button');
                    right.innerText = 'Ubah';
                    right.style.padding = '6px 12px';
                    right.style.background = '#f0f9ff';
                    right.style.color = '#0ea5e9';
                    right.style.border = 'none';
                    right.style.borderRadius = '6px';
                    right.style.fontWeight = '600';
                    right.style.cursor = 'pointer';

                    right.onclick = () => { openModalUbahPembayaran(item); };

                    div.appendChild(left);
                    div.appendChild(right);
                    container.appendChild(div);
                });
            }

            const modalUbahPembayaran = document.getElementById('modal-ubah-pembayaran');

            function openModalUbahPembayaran(item) {
                riwayatKoreksiActiveItem = item;
                document.getElementById('modal-up-info').innerHTML = `Ubah metode bayar (cashbox) untuk transaksi <b>${item.id}</b> senilai <b>Rp ${parseFloat(item.nominal).toLocaleString('id-ID')}</b>.`;

                const sel = document.getElementById('modal-up-cashbox');
                sel.innerHTML = '';
                getDbCashbox().forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c; opt.innerText = c;
                    if (c === item.cashbox) opt.selected = true;
                    sel.appendChild(opt);
                });

                modalUbahPembayaran.style.display = 'flex';
            }

            document.getElementById('btn-batal-up')?.addEventListener('click', () => {
                modalUbahPembayaran.style.display = 'none';
            });

            document.getElementById('btn-simpan-up')?.addEventListener('click', () => {
                if (!riwayatKoreksiActiveItem) return;
                const newCb = document.getElementById('modal-up-cashbox').value;
                const item = riwayatKoreksiActiveItem;

                const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
                const key = item.originalType === 'pemasukan' ? (activeOutlet === 'PUSAT' ? 'db_pemasukan' : 'db_pemasukan_' + activeOutlet) : (activeOutlet === 'PUSAT' ? 'db_pengeluaran' : 'db_pengeluaran_' + activeOutlet);

                let db = JSON.parse(localStorage.getItem(key) || '[]');
                if (db[item.originalIndex]) {
                    db[item.originalIndex].cashbox = newCb;
                    localStorage.setItem(key, JSON.stringify(db));

                    if (window.Swal) Swal.fire('Berhasil', 'Cashbox transaksi berhasil diubah.', 'success');
                    else alert('Berhasil diubah');

                    modalUbahPembayaran.style.display = 'none';
                    renderKoreksiPembayaran();
                } else {
                    alert('Gagal menemukan data transaksi.');
                }
            });


            // --- FITUR KELOLA OUTLET ---
            const btnMenuKelolaOutlet = document.getElementById('btn-menu-kelola-outlet');
            const layoutKelolaOutlet = document.getElementById('layout-kelola-outlet');
            const layoutTambahOutlet = document.getElementById('layout-tambah-outlet');
            const btnBackKelolaOutlet = document.getElementById('btn-back-kelola-outlet');
            const btnBackTambahOutlet = document.getElementById('btn-back-tambah-outlet');
            const btnTambahOutlet = document.getElementById('btn-tambah-outlet');
            const btnSimpanOutlet = document.getElementById('btn-simpan-outlet');
            const outletListContainer = document.getElementById('outlet-list-container');

            let currentEditOutletId = null;

            if (btnMenuKelolaOutlet) {
                btnMenuKelolaOutlet.addEventListener('click', () => {
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) {
                        layoutMain.classList.remove('active');
                        layoutMain.style.display = 'none';
                    }
                    layoutKelolaOutlet.classList.add('active');
                    layoutKelolaOutlet.style.display = 'block';
                    renderOutletList();
                });
            }

            if (btnBackKelolaOutlet) {
                btnBackKelolaOutlet.addEventListener('click', () => {
                    layoutKelolaOutlet.classList.remove('active');
                    layoutKelolaOutlet.style.display = 'none';
                    const layoutMain = document.getElementById('layout-main');
                    if (layoutMain) {
                        layoutMain.classList.add('active');
                        layoutMain.style.display = 'block';
                    }
                });
            }

            if (btnTambahOutlet) {
                btnTambahOutlet.addEventListener('click', () => {
                    currentEditOutletId = null;
                    document.getElementById('tambah-outlet-title').innerText = 'Tambah Outlet';
                    document.getElementById('input-outlet-nama').value = '';
                    document.getElementById('input-outlet-telepon').value = '';
                    document.getElementById('input-outlet-alamat').value = '';

                    layoutKelolaOutlet.classList.remove('active');
                    layoutKelolaOutlet.style.display = 'none';
                    layoutTambahOutlet.classList.add('active');
                    layoutTambahOutlet.style.display = 'block';
                });
            }

            if (btnBackTambahOutlet) {
                btnBackTambahOutlet.addEventListener('click', () => {
                    layoutTambahOutlet.classList.remove('active');
                    layoutTambahOutlet.style.display = 'none';
                    layoutKelolaOutlet.classList.add('active');
                    layoutKelolaOutlet.style.display = 'block';
                });
            }

            if (btnSimpanOutlet) {
                btnSimpanOutlet.addEventListener('click', () => {
                    const nama = document.getElementById('input-outlet-nama').value.trim();
                    const telepon = document.getElementById('input-outlet-telepon').value.trim();
                    const alamat = document.getElementById('input-outlet-alamat').value.trim();

                    if (!nama) {
                        alert('Nama Outlet harus diisi!');
                        return;
                    }

                    let dbOutlets = JSON.parse(originalGetItem('db_outlets') || '[]');

                    if (currentEditOutletId) {
                        const idx = dbOutlets.findIndex(o => o.id === currentEditOutletId);
                        if (idx !== -1) {
                            dbOutlets[idx].nama = nama;
                            dbOutlets[idx].telepon = telepon;
                            dbOutlets[idx].alamat = alamat;
                        }
                    } else {
                        dbOutlets.push({
                            id: 'OUTLET-' + Date.now(),
                            nama: nama,
                            telepon: telepon,
                            alamat: alamat
                        });
                    }

                    originalSetItem('db_outlets', JSON.stringify(dbOutlets));
                    alert('Outlet berhasil disimpan!');

                    layoutTambahOutlet.classList.remove('active');
                    layoutTambahOutlet.style.display = 'none';
                    layoutKelolaOutlet.classList.add('active');
                    layoutKelolaOutlet.style.display = 'block';
                    renderOutletList();
                });
            }

            window.editOutlet = function (id) {
                let dbOutlets = JSON.parse(originalGetItem('db_outlets') || '[]');
                let outlet = dbOutlets.find(o => o.id === id);
                if (!outlet) {
                    if (id === 'PUSAT') {
                        outlet = { id: 'PUSAT', nama: 'Cabang Utama (Pusat)', telepon: '', alamat: '' };
                    } else return;
                }

                currentEditOutletId = id;
                document.getElementById('tambah-outlet-title').innerText = 'Edit Outlet';
                document.getElementById('input-outlet-nama').value = outlet.nama || '';
                document.getElementById('input-outlet-telepon').value = outlet.telepon || '';
                document.getElementById('input-outlet-alamat').value = outlet.alamat || '';

                layoutKelolaOutlet.classList.remove('active');
                layoutKelolaOutlet.style.display = 'none';
                layoutTambahOutlet.classList.add('active');
                layoutTambahOutlet.style.display = 'block';
            }

            window.setAktifOutlet = function (id, namaOutlet) {
                if (confirm(`Yakin ingin beralih ke cabang: ${namaOutlet}?\nSistem akan memuat ulang data sesuai cabang yang dipilih.`)) {
                    originalSetItem('active_outlet_id', id);
                    alert(`Berhasil beralih ke cabang: ${namaOutlet}`);
                    location.reload();
                }
            }

            window.hapusOutlet = function (id) {
                if (id === 'PUSAT') {
                    alert('Cabang Pusat tidak dapat dihapus!');
                    return;
                }
                if (confirm('Yakin ingin menghapus cabang ini? Data transaksi dan pelanggan untuk cabang ini akan tetap ada di database, namun cabang tidak akan muncul di daftar.')) {
                    let dbOutlets = JSON.parse(originalGetItem('db_outlets') || '[]');
                    dbOutlets = dbOutlets.filter(o => o.id !== id);
                    originalSetItem('db_outlets', JSON.stringify(dbOutlets));

                    // If they deleted the active outlet, switch to PUSAT
                    if (originalGetItem('active_outlet_id') === id) {
                        originalSetItem('active_outlet_id', 'PUSAT');
                        alert('Cabang yang sedang aktif dihapus. Sistem akan kembali ke Cabang Pusat.');
                        location.reload();
                    } else {
                        renderOutletList();
                    }
                }
            }

            function renderOutletList() {
                if (!outletListContainer) return;
                let dbOutlets = JSON.parse(originalGetItem('db_outlets') || '[]');
                let activeId = originalGetItem('active_outlet_id') || 'PUSAT';

                // Selalu tampilkan cabang pusat
                let html = `
            <div style="background: white; border-radius: 12px; padding: 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: ${activeId === 'PUSAT' ? '2px solid #3b82f6' : '1px solid #e2e8f0'};">
                <div style="flex-grow: 1;">
                    <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem;">Cabang Utama (Pusat) ${activeId === 'PUSAT' ? '<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 5px;">AKTIF</span>' : ''}</div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Cabang default utama</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    ${activeId !== 'PUSAT' ? `<button onclick="setAktifOutlet('PUSAT', 'Cabang Utama')" style="background: #f0f9ff; color: #3b82f6; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">Pilih</button>` : ''}
                </div>
            </div>
        `;

                dbOutlets.forEach(outlet => {
                    let isActive = activeId === outlet.id;
                    html += `
                <div style="background: white; border-radius: 12px; padding: 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: ${isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0'}; mt-2">
                    <div style="flex-grow: 1;">
                        <div style="font-weight: 700; color: #1e293b; font-size: 1.05rem;">${outlet.nama} ${isActive ? '<span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 5px;">AKTIF</span>' : ''}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">${outlet.alamat || '-'}</div>
                        <div style="font-size: 0.8rem; color: #64748b;"><i class="fa-solid fa-phone" style="font-size: 0.7rem;"></i> ${outlet.telepon || '-'}</div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-direction: column;">
                        ${!isActive ? `<button onclick="setAktifOutlet('${outlet.id}', '${outlet.nama.replace(/'/g, "\\'")}')" style="background: #f0f9ff; color: #3b82f6; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Pilih</button>` : ''}
                        <button onclick="editOutlet('${outlet.id}')" style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Edit</button>
                        <button onclick="hapusOutlet('${outlet.id}')" style="background: #fef2f2; color: #ef4444; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Hapus</button>
                    </div>
                </div>
            `;
                });

                outletListContainer.innerHTML = html;

                // Update label on menu akun
                const activeName = activeId === 'PUSAT' ? 'Cabang Utama (Pusat)' : (dbOutlets.find(o => o.id === activeId)?.nama || 'Tidak Diketahui');
                const outletLabel = document.getElementById('active-outlet-label');
                if (outletLabel) outletLabel.innerText = activeName;
            }

            // Initial call to set the label
            setTimeout(renderOutletList, 500);

            // Initialize charts safely after all variables and functions are declared
            if (typeof prosesFilterKeuangan === 'function') {
                prosesFilterKeuangan('bulan-ini');
            } else {
                if (typeof window.initFinanceChart === 'function') window.initFinanceChart('bulan-ini');
                if (typeof initOmzetChart === 'function') initOmzetChart('bulan-ini');
            }

            // --- APP ZOOM SCALING LOGIC FOR TABLET ---
            window.adjustAppZoom = function (delta) {
                let current = parseFloat(localStorage.getItem('app_zoom_level') || '1');
                current = Math.min(Math.max(current + delta, 0.65), 1.6);
                current = Math.round(current * 100) / 100;
                localStorage.setItem('app_zoom_level', current);
                window.applyAppZoom(current);
                if (typeof window.showToast === 'function') {
                    window.showToast('Skala Tampilan: ' + Math.round(current * 100) + '%');
                }
            };

            window.resetAppZoom = function () {
                localStorage.setItem('app_zoom_level', '1');
                window.applyAppZoom(1);
                if (typeof window.showToast === 'function') {
                    window.showToast('Skala Tampilan Normal (100%)');
                }
            };

            window.applyAppZoom = function (level) {
                const appEl = document.getElementById('app');
                if (appEl) {
                    appEl.style.zoom = level;
                }
            };

            const savedZoom = localStorage.getItem('app_zoom_level');
            if (savedZoom) {
                window.applyAppZoom(parseFloat(savedZoom));
            }

            });
    
