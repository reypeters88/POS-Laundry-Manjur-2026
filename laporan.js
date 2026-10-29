// Laporan Module
// Handles data fetching and rendering for all Laporan layouts

(function() {
    window.formatRupiah = function(angka) {
        if (angka === undefined || angka === null || isNaN(angka)) return '0';
        return Number(angka).toLocaleString('id-ID');
    };
    const formatRupiah = window.formatRupiah;window.globalApiData = {
        pemasukan: [],
        pengeluaran: [],
        isLoaded: false
    };

    window.getDB = function(key) {
        const activeOutlet = localStorage.getItem('active_outlet_id') || 'PUSAT';
        const finalKey = activeOutlet === 'PUSAT' ? key : key + '_' + activeOutlet;
        return JSON.parse(localStorage.getItem(finalKey) || '[]');
    };

    window.getMergedPemasukan = function() {
        const localPem = window.getDB('db_pemasukan');
        if (typeof window.sanitizeAndMergePemasukan === 'function') {
            return window.sanitizeAndMergePemasukan(window.globalApiData && window.globalApiData.pemasukan, localPem);
        }
        const dbPemMap = new Map();
        if (window.RECOVERED_PEMASUKAN && Array.isArray(window.RECOVERED_PEMASUKAN)) {
            window.RECOVERED_PEMASUKAN.forEach(x => { if(x && x.id) dbPemMap.set(x.id, x); });
        }
        (window.globalApiData.pemasukan || []).forEach(x => { if(x && x.id) dbPemMap.set(x.id, x); });
        localPem.forEach(x => { if(x && x.id) dbPemMap.set(x.id, x); });
        return Array.from(dbPemMap.values());
    };

    window.getMergedPengeluaran = function() {
        const localPeng = window.getDB('db_pengeluaran');
        if (typeof window.sanitizeAndMergePengeluaran === 'function') {
            return window.sanitizeAndMergePengeluaran(window.globalApiData && window.globalApiData.pengeluaran, localPeng);
        }
        const dbPengMap = new Map();
        if (window.RECOVERED_PENGELUARAN && Array.isArray(window.RECOVERED_PENGELUARAN)) {
            window.RECOVERED_PENGELUARAN.forEach(x => { if(x && x.id) dbPengMap.set(x.id, x); });
        }
        (window.globalApiData.pengeluaran || []).forEach(x => { if(x.id) dbPengMap.set(x.id, x); });
        localPeng.forEach(x => { if(x.id) dbPengMap.set(x.id, x); });
        return Array.from(dbPengMap.values());
    };

    const API_URL = 'https://script.google.com/macros/s/AKfycbyUtbsr0GX4NfEZxtHCzPvonj3qHIjLpZhHtuMmrEDjVieMoWVTJPu94997FP-HQGtw/exec';

    async function fetchApiData(silent = true) {
        try {
            if (!silent && typeof window.showToast === 'function') window.showToast('Menarik data dari server...');
            const activeUrl = localStorage.getItem('webapp_url') || API_URL;
            const response = await fetch(activeUrl);
            const result = await response.json();
            if (result.status === 'success' && result.data) {
                // --- FIX: Google Sheets US Locale Date Swapping (MM/DD vs DD/MM) & Date Recovery ---
                const fixDateData = (arrPem, arrPeng) => {
                    const pad = (n) => n.toString().padStart(2, '0');
                    if (arrPem && Array.isArray(arrPem)) {
                        arrPem.forEach(item => {
                            if (!item || !item.id) return;
                            const parts = String(item.id).split('-');
                            if (parts.length >= 3 && parts[1].length === 4) {
                                let expMonth, expYear;
                                if (parts[1].substring(2, 4) === '26') {
                                    expMonth = parseInt(parts[1].substring(0, 2), 10);
                                    expYear = 2026;
                                } else if (parts[1].substring(0, 2) === '26') {
                                    expMonth = parseInt(parts[1].substring(2, 4), 10);
                                    expYear = 2026;
                                } else {
                                    expMonth = parseInt(parts[1].substring(0, 2), 10);
                                    expYear = 2000 + parseInt(parts[1].substring(2, 4), 10);
                                }

                                const d = item.date ? new Date(item.date) : null;
                                const est = item.estDate ? new Date(item.estDate) : null;
                                const needsRepair = !d || isNaN(d.getTime()) || d.getFullYear() !== expYear || (d.getMonth() + 1) !== expMonth;

                                if (needsRepair) {
                                    if (est && !isNaN(est.getTime()) && est.getFullYear() === expYear) {
                                        const orderTime = new Date(est.getTime() - 24 * 3600 * 1000);
                                        item.date = `${orderTime.getFullYear()}-${pad(orderTime.getMonth() + 1)}-${pad(orderTime.getDate())} ${pad(est.getHours())}:${pad(est.getMinutes())}:${pad(est.getSeconds())}`;
                                    } else if (d && !isNaN(d.getTime())) {
                                        let day = d.getDate();
                                        if (day === expMonth && (d.getMonth() + 1) <= 31) {
                                            day = d.getMonth() + 1;
                                        }
                                        item.date = `${expYear}-${pad(expMonth)}-${pad(Math.min(Math.max(day, 1), 28))} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                                    }
                                }
                            }
                        });
                    }
                    if (arrPeng && Array.isArray(arrPeng)) {
                        arrPeng.forEach(item => {
                            if (!item || !item.id) return;
                            if (item.id.match(/^(EXP|INC|TRF-OUT|TRF-IN|KOR-IN|KOR-OUT)-/)) {
                                const idParts = item.id.split('-');
                                const epoch = parseInt(idParts[idParts.length - 1], 10);
                                if (!isNaN(epoch) && epoch > 1500000000000) {
                                    const ed = new Date(epoch);
                                    const dateStr = `${ed.getFullYear()}-${pad(ed.getMonth() + 1)}-${pad(ed.getDate())} ${pad(ed.getHours())}:${pad(ed.getMinutes())}:${pad(ed.getSeconds())}`;
                                    item.date = dateStr;
                                    item.tanggal = dateStr;
                                }
                            }
                        });
                    }
                };
                fixDateData(result.data.pemasukan, result.data.pengeluaran);
                try {
                    const localPem = JSON.parse(localStorage.getItem('db_pemasukan') || '[]');
                    const localPeng = JSON.parse(localStorage.getItem('db_pengeluaran') || '[]');
                    if (typeof window.sanitizeAndMergePemasukan === 'function') {
                        result.data.pemasukan = window.sanitizeAndMergePemasukan(result.data.pemasukan, localPem);
                    }
                    if (typeof window.sanitizeAndMergePengeluaran === 'function') {
                        result.data.pengeluaran = window.sanitizeAndMergePengeluaran(result.data.pengeluaran, localPeng);
                    }
                    window.globalApiData = result.data;
                    window.globalApiData.isLoaded = true;
                    localStorage.setItem('db_pemasukan', JSON.stringify(result.data.pemasukan));
                    localStorage.setItem('db_pengeluaran', JSON.stringify(result.data.pengeluaran));
                    if (result.data.pelanggan && JSON.parse(localStorage.getItem('db_pelanggan') || '[]').length === 0) localStorage.setItem('db_pelanggan', JSON.stringify(result.data.pelanggan));
                    if (result.data.inventory && JSON.parse(localStorage.getItem('db_inventory') || '[]').length === 0) localStorage.setItem('db_inventory', JSON.stringify(result.data.inventory));
                    if (result.data.Layanan && JSON.parse(localStorage.getItem('db_layanan') || '[]').length === 0) localStorage.setItem('db_layanan', JSON.stringify(result.data.Layanan));
                    if (result.data.user && JSON.parse(localStorage.getItem('db_users') || '[]').length === 0) localStorage.setItem('db_users', JSON.stringify(result.data.user));
                    if (result.data.Bank && JSON.parse(localStorage.getItem('db_bank') || '[]').length === 0) localStorage.setItem('db_bank', JSON.stringify(result.data.Bank));
                    if (typeof window.cleanDatabaseDates === 'function') window.cleanDatabaseDates();
                    if (typeof window.reloadKasirData === 'function') window.reloadKasirData();
                } catch(e) { console.warn('Sync to local db error:', e); }

                if (typeof window.initFinanceChart === 'function') {
                    let curFilter = 'bulan-ini';
                    const activeFilterOpt = document.querySelector('#date-filter-options .filter-opt.active');
                    if (activeFilterOpt) curFilter = activeFilterOpt.getAttribute('data-val') || 'bulan-ini';
                    window.initFinanceChart(curFilter);
                }
                
                if(window.renderLaporanPendapatan) window.renderLaporanPendapatan();
                if(window.renderLaporanPengeluaran) window.renderLaporanPengeluaran();
                if(window.renderLaporanLabaRugi) window.renderLaporanLabaRugi();
                if(window.renderLaporanTransaksiAccordion) window.renderLaporanTransaksiAccordion();
            }

        } catch (err) {
            console.error('Failed to fetch data:', err);
            if (!silent && typeof window.showToast === 'function') window.showToast('Gagal menarik data dari server.');
        }
    }

    // Utilities
    window.isDateInRange = function(dateObj, filterVal, startStr = null, endStr = null) {
        if (!filterVal || filterVal === 'semua') return true;
        if (!dateObj || isNaN(dateObj)) return false;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
        
        if (filterVal === 'hari-ini') {
            return dDate.getTime() === today.getTime();
        } else if (filterVal === 'kemarin') {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return dDate.getTime() === yesterday.getTime();
        } else if (filterVal === '7-hari') {
            const past7 = new Date(today);
            past7.setDate(past7.getDate() - 6);
            return dDate >= past7 && dDate <= today;
        } else if (filterVal === '30-hari') {
            const past30 = new Date(today);
            past30.setDate(past30.getDate() - 29);
            return dDate >= past30 && dDate <= today;
        } else if (filterVal === 'bulan-ini') {
            return dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth();
        } else if (filterVal.startsWith('CUSTOM_MONTH_')) {
            const parts = filterVal.split('_')[2].split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            return dateObj.getFullYear() === year && dateObj.getMonth() === month;
        } else if (filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') {
            if (!startStr) return true;
            const startD = window.parseDateString(startStr);
            if (startD) startD.setHours(0,0,0,0);
            const endD = endStr ? window.parseDateString(endStr) : window.parseDateString(startStr);
            if (endD) endD.setHours(23,59,59,999);
            if (!startD || !endD || isNaN(startD) || isNaN(endD)) return false;
            return dateObj >= startD && dateObj <= endD;
        }
        return true;
    };

    window.parseDateString = function(dateStr, notaId, estDateStr) {
        if (!dateStr && !notaId) return null;
        if (typeof dateStr === 'number') return new Date(dateStr);
        if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

        // Priority 1: Exact timestamp in transaction ID for expenses, transfers, corrections
        if (notaId && notaId.match(/^(EXP|INC|TRF-OUT|TRF-IN|KOR-IN|KOR-OUT)-/)) {
            let ts = parseInt(notaId.split('-').pop(), 10);
            if (!isNaN(ts) && ts > 1500000000000) {
                return new Date(ts);
            }
        }

        let d = null;
        let s = dateStr ? String(dateStr).trim() : '';

        if (s) {
            try {
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
                            // DD-MM-YYYY or DD/MM/YYYY
                            day = parseInt(dateParts[0], 10);
                            month = parseInt(dateParts[1], 10) - 1;
                            year = parseInt(dateParts[2], 10);
                        } else {
                            // DD-MM-YY
                            day = parseInt(dateParts[0], 10);
                            month = parseInt(dateParts[1], 10) - 1;
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
            } catch (err) {
                d = new Date(s);
            }
        }

        // Priority 2: Pemasukan ID matching MJL-MMYY- or MJL-YYMM-
        if (notaId && notaId.startsWith('MJL-')) {
            let parts = notaId.split('-');
            if (parts.length >= 3 && parts[1].length === 4) {
                let expMonth, expYear;
                if (parts[1].substring(2, 4) === '26') {
                    expMonth = parseInt(parts[1].substring(0, 2), 10);
                    expYear = 2026;
                } else if (parts[1].substring(0, 2) === '26') {
                    expMonth = parseInt(parts[1].substring(2, 4), 10);
                    expYear = 2026;
                } else {
                    expMonth = parseInt(parts[1].substring(0, 2), 10);
                    expYear = 2000 + parseInt(parts[1].substring(2, 4), 10);
                }

                // If estDate is provided, it is the most reliable anchor (order date = estDate - 1 day)
                if (estDateStr) {
                    let estD = new Date(estDateStr);
                    if (!isNaN(estD.getTime()) && estD.getFullYear() === expYear) {
                        return new Date(estD.getTime() - 24 * 3600 * 1000);
                    }
                }

                if (d && !isNaN(d.getTime())) {
                    let py = d.getFullYear();
                    let pm = d.getMonth() + 1;
                    let pd = d.getDate();

                    if (py === expYear) {
                        if (pm === expMonth || !estDateStr) {
                            return d;
                        }
                    }
                    if (pd === expMonth && pm <= 31) {
                        return new Date(expYear, expMonth - 1, pm, d.getHours(), d.getMinutes(), d.getSeconds());
                    }
                    // Fix year and month
                    return new Date(expYear, expMonth - 1, Math.min(Math.max(pd, 1), 28), d.getHours(), d.getMinutes(), d.getSeconds());
                }
            }
        }

        let valid = d && !isNaN(d.getTime());
        return valid ? d : null;
    };
    function formatDateDisplay(dateObj) {
        if (!dateObj || isNaN(dateObj)) return '-';
        return dateObj.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'});
    }
    window.formatDateDisplay = formatDateDisplay;

    function formatTimeDisplay(dateObj) {
        const pad = (n) => n.toString().padStart(2, '0');
        return pad(dateObj.getHours()) + ':' + pad(dateObj.getMinutes());
    }

    function hookFilterEvents(prefix, renderFn) {
        const filterSel = document.getElementById(prefix + '-date-filter');
        const dateTxt = document.getElementById(prefix + '-date-text');
        const cashboxSel = document.getElementById(prefix + '-cashbox-filter');

        if (cashboxSel) {
            const cloneCb = cashboxSel.cloneNode(true);
            cashboxSel.parentNode.replaceChild(cloneCb, cashboxSel);
            const newCashboxSel = document.getElementById(prefix + '-cashbox-filter');
            const cbTxt = document.getElementById(prefix + '-cashbox-text');
            if (newCashboxSel && cbTxt) {
                newCashboxSel.addEventListener('change', (e) => {
                    cbTxt.innerText = e.target.value;
                    if (typeof renderFn === 'function') {
                        renderFn(document.getElementById(prefix + '-date-filter').value);
                    }
                });
            }
        }

        if (filterSel && dateTxt) {
            const clone = filterSel.cloneNode(true);
            filterSel.parentNode.replaceChild(clone, filterSel);
            const newFilterSel = document.getElementById(prefix + '-date-filter');
            newFilterSel.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val === 'per-tanggal') {
                    const datePickerModal = document.getElementById('custom-date-picker-modal');
                    if (datePickerModal) {
                        datePickerModal.style.display = 'flex';
                        window.activeCustomDatePickerFilter = newFilterSel;
                        window.activeCustomDatePickerText = dateTxt;
                        window.activeCustomDatePickerRender = renderFn;
                    }
                } else if (val === 'per-bulan') {
                    if (typeof window.openMonthPicker === 'function') {
                        window.openMonthPicker(e.target);
                    }
                    return;
                } else if (val) {
                    if (val === 'hari-ini') dateTxt.innerText = formatDateDisplay(new Date());
                    else if (val === 'kemarin') {
                        let d = new Date(); d.setDate(d.getDate() - 1);
                        dateTxt.innerText = formatDateDisplay(d);
                    }
                    else if (val === '7-hari') dateTxt.innerText = '7 Hari Terakhir';
                    else if (val === '30-hari') dateTxt.innerText = '30 Hari Terakhir';
                    else if (val === 'bulan-ini') {
                        let d = new Date();
                        dateTxt.innerText = `01/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} - ${new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
                    }
                    else if (val.startsWith('CUSTOM_MONTH_')) {
                        const parts = val.split('_')[2].split('-');
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        dateTxt.innerText = `${monthNames[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                    }

                    if (typeof window.showToast === 'function') window.showToast('Memperbarui data laporan...');
                    if (renderFn) renderFn(val);
                }
            });
        }
    }

        // --- 1. LAPORAN TRANSAKSI ---
    window.renderLaporanTransaksiAccordion = function () {
        const container = document.getElementById('lap-transaksi-accordion-container');
        const emptyState = document.getElementById('lap-transaksi-empty-state');
        const dataState = document.getElementById('lap-transaksi-data-state');
        const totalCount = document.getElementById('lap-transaksi-total-count');
        const totalSub = document.getElementById('lap-transaksi-total-sub');
        const filterSel = document.getElementById('lap-transaksi-date-filter');

        if (!container) return;

        let dbPemasukan = window.getMergedPemasukan();
        const type = window.currentLaporanTransaksiType || 'Semua Transaksi';
        
        let filterVal = filterSel ? filterSel.value : '';
        if (filterVal === 'per-bulan') filterVal = 'bulan-ini';

        let filtered = dbPemasukan.filter(item => {
            if (item.type) return false; // Exclude pendapatan manual
            const dateObj = parseDateString(item.date);
            if (!dateObj) return false;

            if (filterVal && filterVal !== 'semua') {
                if (filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') {
                    const start = filterSel ? filterSel.getAttribute('data-start') : null;
                    const end = filterSel ? filterSel.getAttribute('data-end') : null;
                    if (!window.isDateInRange(dateObj, filterVal, start, end)) return false;
                } else {
                    if (!window.isDateInRange(dateObj, filterVal)) return false;
                }
            }
            const secondaryFilterSel = document.getElementById('lap-transaksi-filter-select');
            const secondaryFilterVal = secondaryFilterSel ? secondaryFilterSel.value : 'Semua';
            const isBatal = item.status === 'batal' || item.status === 'Batal';
            const dibayar = parseFloat(item.dibayar) || 0;
            const total = parseFloat(item.total) || 0;
            const isLunas = dibayar >= total;
            
            if (secondaryFilterVal === 'Lunas') return !isBatal && isLunas;
            if (secondaryFilterVal === 'Belum Lunas') return !isBatal && !isLunas;
            if (secondaryFilterVal === 'Batal') return isBatal;
            return !isBatal;
        });

        if (filtered.length === 0) {
            window.currentLaporanTransaksiExportData = [];
            if(dataState) dataState.style.display = 'flex';
            if(emptyState) emptyState.style.display = 'flex';
            if(container) container.style.display = 'none';
            if(totalCount) totalCount.innerText = '0';
            if(totalSub) totalSub.innerText = '(0 Total Qty)';
            return;
        }

        let exportData = [];
        const dbLayanan = JSON.parse(localStorage.getItem('db_layanan') || '[]');

        filtered.forEach(trx => {
            const isLunas = (trx.dibayar || 0) >= (trx.total || 0);
            const statusStr = trx.status === 'batal' ? 'Batal' : (isLunas ? 'Lunas' : 'Belum Lunas');
            
            let d = new Date(trx.date);
            const dateStr = (!isNaN(d.getTime())) ? `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}` : (trx.date || '').split('T')[0].split(' ')[0];
            
            const customerStr = trx.customerName || trx.customer || 'Guest';

            let paymentMethod = trx.metode_pembayaran || trx.cashbox || trx.payment_method || trx.metode || 'Tunai';
            let paymentDateRaw = trx.tanggalBayar || trx.paymentDate || trx.date || '';
            let pd = new Date(paymentDateRaw);
            let paymentDateStr = (!isNaN(pd.getTime())) ? `${String(pd.getDate()).padStart(2, '0')}-${String(pd.getMonth() + 1).padStart(2, '0')}-${pd.getFullYear()}` : (paymentDateRaw || '').split('T')[0].split(' ')[0];

            if (statusStr === 'Belum Lunas' || (trx.dibayar || 0) === 0) {
                paymentMethod = '-';
                paymentDateStr = '-';
            }

            if (trx.items && trx.items.length > 0) {
                trx.items.forEach(it => {
                    const itemTotal = it.total !== undefined ? it.total : ((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0));
                    
                    let kategori = it.category || it.satuan || it.unit || '';
                    if (!kategori || kategori === '-') {
                        const matchedSvc = dbLayanan.find(svc => {
                            const svcName = svc.Layanan || svc.NamaLayanan || svc.nama || svc.name || '';
                            return svcName.toLowerCase() === (it.name || '').toLowerCase();
                        });
                        if (matchedSvc) {
                            kategori = matchedSvc.Kategori || matchedSvc.kategori || matchedSvc.Satuan || matchedSvc.satuan || '-';
                        } else {
                            kategori = '-';
                        }
                    }

                    exportData.push({
                        "ID": trx.id,
                        "Tanggal": dateStr,
                        "Pelanggan": customerStr,
                        "Layanan": it.name || '-',
                        "Kategori": kategori,
                        "Qty": parseFloat(it.qty) || 0,
                        "Total": itemTotal,
                        "Dibayar": trx.dibayar || 0,
                        "Status Bayar": statusStr,
                        "Tanggal Pembayaran": paymentDateStr,
                        "Metode Pembayaran": paymentMethod,
                        "Status Order": trx.status || 'Baru'
                    });
                });
            } else {
                exportData.push({
                    "ID": trx.id,
                    "Tanggal": dateStr,
                    "Pelanggan": customerStr,
                    "Layanan": '-',
                    "Kategori": '-',
                    "Qty": 0,
                    "Total": trx.total || 0,
                    "Dibayar": trx.dibayar || 0,
                    "Status Bayar": statusStr,
                    "Tanggal Pembayaran": paymentDateStr,
                    "Metode Pembayaran": paymentMethod,
                    "Status Order": trx.status || 'Baru'
                });
            }
        });
        window.currentLaporanTransaksiExportData = exportData;

        if(emptyState) emptyState.style.display = 'none';
        if(container) container.style.display = 'flex';
        if(dataState) dataState.style.display = 'flex';

        const grouped = {};
        filtered.forEach(trx => {
            const d = parseDateString(trx.date);
            const dStr = formatDateDisplay(d);
            if (!grouped[dStr]) grouped[dStr] = [];
            grouped[dStr].push(trx);
        });

        let html = '';
        let totalQty = 0;
        let totalItems = 0;

        Object.keys(grouped).sort((a, b) => parseDateString(b) - parseDateString(a)).forEach((dateStr, index) => {
            let rowHtml = '';
            grouped[dateStr].forEach(trx => {
                totalItems++;
                const isLunas = (trx.dibayar || 0) >= (trx.total || 0);
                const statusStr = trx.status === 'batal' ? 'Batal' : (isLunas ? 'Lunas' : 'Belum Lunas');
                const pillStyle = statusStr === 'Lunas' ? 'background:#dcfce7; color:#16a34a;' : (statusStr === 'Batal' ? 'background:#fee2e2; color:#ef4444;' : 'background:#fee2e2; color:#991b1b;');
                const icon = trx.items && trx.items.length > 0 && trx.items[0].category === 'Satuan' ? 'https://cdn-icons-png.flaticon.com/512/3133/3133391.png' : 'https://cdn-icons-png.flaticon.com/512/8205/8205166.png';
                
                trx.items && trx.items.forEach(it => {
                    totalQty += (parseFloat(it.qty) || 0);
                });

                let detailsHtml = '';
                if (trx.items && trx.items.length > 0) {
                    detailsHtml += `<div style="margin-top: 12px; margin-left: 57px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px 12px; display:flex; flex-direction:column; gap:6px;">`;
                    trx.items.forEach(it => {
                        const itemTotal = it.total !== undefined ? it.total : ((parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0));
                        detailsHtml += `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <div style="width:4px; height:4px; border-radius:50%; background:#94a3b8;"></div>
                                    <span style="color:#334155; font-weight:500;">${it.name}</span>
                                    <span style="color:#94a3b8; font-size:0.75rem;">(x${parseFloat(it.qty) || 0})</span>
                                </div>
                                <span style="font-weight:600; color:#0f172a;">Rp ${itemTotal.toLocaleString('id-ID')}</span>
                            </div>
                        `;
                    });
                    detailsHtml += `</div>`;
                }

                rowHtml += `
                    <div style="display:flex; flex-direction:column; padding:15px; border-bottom:1px solid #f1f5f9;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:45px; height:45px; border:1px solid #e2e8f0; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#f8fafc; flex-shrink:0;">
                                    <img src="${icon}" style="width:30px; object-fit:contain;" alt="item">
                                </div>
                                <div style="display:flex; flex-direction:column; gap:3px;">
                                    <div style="font-size:0.95rem; color:#1e293b; font-weight:600;">${trx.id}</div>
                                    <div style="font-size:0.75rem; color:#64748b;">Pelanggan : ${trx.customerName || trx.customer || 'Guest'}</div>
                                    <div style="font-size:0.75rem; color:#64748b;">Status : <span style="color:#0ea5e9;">${trx.status || 'Baru'}</span></div>
                                </div>
                            </div>
                            <div style="padding:4px 10px; border-radius:12px; font-size:0.65rem; font-weight:700; ${pillStyle}; white-space:nowrap;">
                                ${statusStr}
                            </div>
                        </div>
                        ${detailsHtml}
                    </div>
                `;
            });

            html += `
                <div class="acc-item ${index === 0 ? 'active' : ''}" style="border-bottom:1px solid #f1f5f9; background:#fff; border-radius:0; border:none; margin:0;">
                    <div class="acc-header" style="background:#f8fafc; padding:10px 20px; font-size:0.85rem; font-weight:600; color:#3b82f6; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-chevron-down acc-arrow" style="font-size:0.75rem; transition:transform 0.3s;"></i> ${dateStr}
                        </div>
                        <span style="color:#64748b; font-weight:500;">${grouped[dateStr].length} Transaksi</span>
                    </div>
                    <div class="acc-content" style="padding:0; max-height:none; overflow:visible; ${index === 0 ? 'display:block;' : 'display:none;'}">
                        ${rowHtml}
                    </div>
                </div>
            `;
        });

        if (totalCount) totalCount.innerText = totalItems.toString();
        if (totalSub) totalSub.innerText = '(' + (Math.round(totalQty * 100) / 100) + ' Total Qty)';

        container.innerHTML = html;

        const accItems = container.querySelectorAll('.acc-item');
        accItems.forEach(item => {
            const header = item.querySelector('.acc-header');
            if (header) {
                header.addEventListener('click', () => {
                    item.classList.toggle('active');
                    const content = item.querySelector('.acc-content');
                    const arrow = item.querySelector('.acc-arrow');
                    const isActive = item.classList.contains('active');
                    if (content) content.style.display = isActive ? 'block' : 'none';
                    if (arrow) arrow.style.transform = isActive ? 'rotate(-180deg)' : 'rotate(0deg)';
                });
            }
        });

        const btnExpandAll = document.getElementById('btn-lap-transaksi-expand-all');
        const btnCollapseAll = document.getElementById('btn-lap-transaksi-collapse-all');
        
        if (btnExpandAll) {
            const newBtnE = btnExpandAll.cloneNode(true);
            btnExpandAll.parentNode.replaceChild(newBtnE, btnExpandAll);
            newBtnE.addEventListener('click', () => {
                accItems.forEach(item => {
                    item.classList.add('active');
                    const content = item.querySelector('.acc-content');
                    if (content) content.style.display = 'block';
                    const arrow = item.querySelector('.acc-arrow');
                    if (arrow) arrow.style.transform = 'rotate(-180deg)';
                });
            });
        }
        if (btnCollapseAll) {
            const newBtnC = btnCollapseAll.cloneNode(true);
            btnCollapseAll.parentNode.replaceChild(newBtnC, btnCollapseAll);
            newBtnC.addEventListener('click', () => {
                accItems.forEach(item => {
                    item.classList.remove('active');
                    const content = item.querySelector('.acc-content');
                    if (content) content.style.display = 'none';
                    const arrow = item.querySelector('.acc-arrow');
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                });
            });
        }
    }

    window.renderLaporanPendapatan = function (filterVal = 'hari-ini', type = 'transaksi') {
        const layout = document.getElementById(type === 'transaksi' ? 'layout-pendapatan-transaksi' : 'layout-pendapatan-lainnya');
        if (!layout) return;

        const emptyState = document.getElementById(type === 'transaksi' ? 'pendapatan-empty-state' : 'lainnya-empty-state');
        const dataState = document.getElementById(type === 'transaksi' ? 'pendapatan-data-state' : 'lainnya-data-state');
        const filterSel = document.getElementById(type === 'transaksi' ? 'pendapatan-date-filter' : 'lainnya-date-filter');
        
        let dbPemasukan = window.getMergedPemasukan();
        let globalTotal = 0;
        let isTransaksi = (type === 'transaksi');

        const renderFunc = function() {
            let start = null, end = null;
            if (filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') {
                start = filterSel ? filterSel.getAttribute('data-start') : null;
                end = filterSel ? filterSel.getAttribute('data-end') : null;
            }

            const cashboxFilterEl = document.getElementById(isTransaksi ? 'pendapatan-cashbox-filter' : 'lainnya-cashbox-filter');
            const cashboxVal = cashboxFilterEl ? cashboxFilterEl.value : 'Semua';

            let itemsToDisplay = [];

            if (isTransaksi) {
                dbPemasukan.forEach(item => {
                    if (item.status === 'batal' || item.status === 'Batal' || item.type) return;

                    let phList = item.paymentHistory;
                    if (typeof phList === 'string') {
                        try { phList = JSON.parse(phList); } catch(e) { phList = []; }
                    }

                    if (phList && Array.isArray(phList) && phList.length > 0) {
                        phList.forEach(ph => {
                            let phDate = parseDateString(ph.date);
                            if (window.isDateInRange(phDate, filterVal, start, end)) {
                                let method = ph.method || 'Tunai';
                                if (cashboxVal !== 'Semua' && method.toUpperCase() !== cashboxVal.toUpperCase()) return;

                                let amt = parseFloat(ph.amount || 0);
                                if (amt > 0) {
                                    itemsToDisplay.push({
                                        id: item.id,
                                        customerName: item.customerName || item.customer || 'Guest',
                                        date: ph.date,
                                        orderDate: item.date,
                                        metode_pembayaran: method,
                                        itemNominal: amt
                                    });
                                }
                            }
                        });
                    } else {
                        let dibayar = parseFloat(item.dibayar || 0);
                        if (dibayar > 0) {
                            let payDateRaw = item.tanggalBayar || item.paymentDate || item.date;
                            let payDate = parseDateString(payDateRaw, item.id, item.estDate);
                            if (window.isDateInRange(payDate, filterVal, start, end)) {
                                let method = item.metode_pembayaran || item.cashbox || 'Tunai';
                                if (cashboxVal !== 'Semua' && method.toUpperCase() !== cashboxVal.toUpperCase()) return;

                                itemsToDisplay.push({
                                    id: item.id,
                                    customerName: item.customerName || item.customer || 'Guest',
                                    date: payDateRaw,
                                    orderDate: item.date,
                                    metode_pembayaran: method,
                                    itemNominal: dibayar
                                });
                            }
                        }
                    }
                });
            } else {
                dbPemasukan.forEach(item => {
                    if (!item.type) return;
                    let d = parseDateString(item.date);
                    if (window.isDateInRange(d, filterVal, start, end)) {
                        let method = item.metode_pembayaran || item.cashbox || 'Tunai';
                        if (cashboxVal !== 'Semua' && method.toUpperCase() !== cashboxVal.toUpperCase()) return;

                        itemsToDisplay.push({
                            id: item.id || '-',
                            customerName: item.customerName || item.customer || 'Guest',
                            date: item.date,
                            metode_pembayaran: method,
                            itemNominal: parseFloat(item.nominal || 0)
                        });
                    }
                });
            }

            if (isTransaksi) {
                window.currentPendapatanTransaksiExportData = [];
            }

            if (itemsToDisplay.length === 0) {
                if (emptyState) emptyState.style.display = 'flex';
                if (dataState) dataState.style.display = 'none';
                return;
            }

            if (emptyState) emptyState.style.display = 'none';
            if (dataState) dataState.style.display = 'block';

            globalTotal = 0;
            const grouped = {};
            let exportData = [];
            itemsToDisplay.forEach(item => {
                const itemNominal = item.itemNominal;
                globalTotal += itemNominal;
                const d = parseDateString(item.date);
                const dStr = formatDateDisplay(d);
                if (!grouped[dStr]) grouped[dStr] = [];
                grouped[dStr].push(item);
                
                if (isTransaksi) {
                    exportData.push({
                        'Tanggal Pembayaran': item.date ? item.date.substring(0, 10) : dStr,
                        'No. Nota': item.id || '-',
                        'Pelanggan': item.customerName,
                        'Metode': item.metode_pembayaran || 'Tunai',
                        'Nominal': itemNominal
                    });
                }
            });

            if (isTransaksi) {
                window.currentPendapatanTransaksiExportData = exportData;
            }

            const container = document.getElementById(isTransaksi ? 'pendapatan-accordion-container' : 'lainnya-accordion-container');
            if (!container) return;
            
            let html = '';
            Object.keys(grouped).sort((a, b) => parseDateString(b) - parseDateString(a)).forEach((dateStr, index) => {
                let rowHtml = '';
                let dailyTotal = 0;
                grouped[dateStr].forEach(item => {
                    const itemNominal = item.itemNominal;
                    dailyTotal += itemNominal;
                    rowHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #f1f5f9;">
                            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                <span style="font-weight:600; color:#1e293b;">${item.id}</span>
                                <span style="font-size:0.8rem; color:#64748b;">- ${item.customerName} ${item.orderDate ? `(Nota tgl ${String(item.orderDate).substring(0,10)})` : ''} - <span style="color:#0284c7; font-weight:500;">${item.metode_pembayaran || 'Tunai'}</span></span>
                            </div>
                            <div style="font-weight:700; color:#10b981;">Rp ${formatRupiah(itemNominal)}</div>
                        </div>
                    `;
                });

                html += `
                    <div class="acc-item ${index === 0 ? 'active' : ''}" style="border-bottom:1px solid #f1f5f9; background:#fff; margin-bottom:10px; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
                        <div class="acc-header" style="background:#f8fafc; padding:15px 20px; font-weight:600; color:#1e293b; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-chevron-down acc-arrow" style="font-size:0.85rem; color:#64748b; transition:transform 0.3s; transform:${index === 0 ? 'rotate(-180deg)' : 'rotate(0deg)'}"></i>
                                ${dateStr}
                            </div>
                            <div style="color:#10b981; font-weight:700;">Rp ${formatRupiah(dailyTotal)}</div>
                        </div>
                        <div class="acc-content" style="padding:0; ${index === 0 ? 'display:block;' : 'display:none;'}">
                            ${rowHtml}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            const accItems = container.querySelectorAll('.acc-item');
            accItems.forEach(item => {
                const header = item.querySelector('.acc-header');
                if (header) {
                    header.addEventListener('click', () => {
                        item.classList.toggle('active');
                        const content = item.querySelector('.acc-content');
                        const arrow = item.querySelector('.acc-arrow');
                        const isActive = item.classList.contains('active');
                        if (content) content.style.display = isActive ? 'block' : 'none';
                        if (arrow) arrow.style.transform = isActive ? 'rotate(-180deg)' : 'rotate(0deg)';
                    });
                }
            });

            const totalTextElement = document.querySelector(isTransaksi ? '#pendapatan-data-state div > span[style*="font-size:1.6rem"]' : '#lainnya-data-state div > span[style*="font-size:1.6rem"]');
            if (totalTextElement) {
                totalTextElement.innerText = globalTotal.toLocaleString('en-US');
            }

            // --- EXPAND ALL / COLLAPSE ALL LOGIC ---
            const prefix = isTransaksi ? 'pendapatan' : 'lainnya';
            const btnExpandAll = document.getElementById('btn-' + prefix + '-expand-all');
            const btnCollapseAll = document.getElementById('btn-' + prefix + '-collapse-all');
            
            if (btnExpandAll) {
                const newBtnE = btnExpandAll.cloneNode(true);
                btnExpandAll.parentNode.replaceChild(newBtnE, btnExpandAll);
                newBtnE.addEventListener('click', () => {
                    accItems.forEach(item => {
                        item.classList.add('active');
                        const content = item.querySelector('.acc-content');
                        if (content) content.style.display = 'block';
                        const arrow = item.querySelector('.acc-arrow');
                        if (arrow) arrow.style.transform = 'rotate(-180deg)';
                    });
                });
            }
            if (btnCollapseAll) {
                const newBtnC = btnCollapseAll.cloneNode(true);
                btnCollapseAll.parentNode.replaceChild(newBtnC, btnCollapseAll);
                newBtnC.addEventListener('click', () => {
                    accItems.forEach(item => {
                        item.classList.remove('active');
                        const content = item.querySelector('.acc-content');
                        if (content) content.style.display = 'none';
                        const arrow = item.querySelector('.acc-arrow');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    });
                });
            }
        };

        if (isTransaksi) {
            window.renderPendapatanAccordion = renderFunc;
            window.renderPendapatanAccordion();
        } else {
            window.renderLainnyaAccordion = renderFunc;
            window.renderLainnyaAccordion();
        }
    };

    window.renderLaporanPengeluaran = function (filterVal = 'hari-ini') {
        const layout = document.getElementById('layout-pengeluaran');
        if (!layout) return;

        const emptyState = document.getElementById('pengeluaran-empty-state');
        const dataState = document.getElementById('pengeluaran-data-state');
        const filterSel = document.getElementById('pengeluaran-date-filter');
        
        let db = window.getMergedPengeluaran();
        let total = 0;
        let filtered = db.filter(item => {
            if (filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') {
                const start = filterSel ? filterSel.getAttribute('data-start') : null;
                const end = filterSel ? filterSel.getAttribute('data-end') : null;
                if (!window.isDateInRange(parseDateString(item.date), filterVal, start, end)) return false;
            } else {
                if (!window.isDateInRange(parseDateString(item.date), filterVal)) return false;
            }
            
            // Check Cashbox filter
            const cashboxFilterEl = document.getElementById('pengeluaran-cashbox-filter');
            const cashboxVal = cashboxFilterEl ? cashboxFilterEl.value : 'Semua';
            if (cashboxVal !== 'Semua') {
                const metode = item.cashbox || item.payment_method || 'Tunai';
                if (metode.toUpperCase() !== cashboxVal.toUpperCase()) return false;
            }
            
            return true;
        });

        if (filtered.length === 0) {
            if(emptyState) emptyState.style.display = 'flex';
            if(dataState) dataState.style.display = 'none';
            return;
        }

        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';

        total = 0;
        const grouped = {};
        filtered.forEach(item => {
            const itemNominal = parseFloat(item.amount || item.nominal) || 0;
            total += itemNominal;
            const d = parseDateString(item.date);
            const dStr = formatDateDisplay(d);
            if (!grouped[dStr]) grouped[dStr] = [];
            grouped[dStr].push({ ...item, itemNominal });
        });

        const spanTotal = layout.querySelector('span[style*="1.8rem"]');
        if (spanTotal) spanTotal.innerText = formatRupiah(total);
        
        const container = document.getElementById('pengeluaran-accordion-container');
        if (container) {
            let html = '';
            Object.keys(grouped).forEach((dateStr, index) => {
                let dailyTotal = 0;
                let rowHtml = '';
                grouped[dateStr].forEach(item => {
                    dailyTotal += item.itemNominal;
                    rowHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid #f1f5f9;">
                            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                <span style="font-weight:600; color:#1e293b;">${item.kategori || item.category || 'Biaya Operasional'}</span>
                                <span style="font-size:0.8rem; color:#64748b;">- ${typeof formatTimeDisplay === 'function' ? formatTimeDisplay(parseDateString(item.date)) : (item.date ? item.date.substring(11,16) : '')} - ${item.keterangan || '-'}</span>
                            </div>
                            <div style="font-weight:700; color:#ef4444;">Rp ${formatRupiah(item.itemNominal)}</div>
                        </div>
                    `;
                });

                html += `
                    <div class="acc-item ${index === 0 ? 'active' : ''}" style="border-bottom:1px solid #f1f5f9; background:#fff; margin-bottom:10px; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
                        <div class="acc-header" style="padding:15px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#f8fafc;">
                            <div style="font-weight:600; color:#0f172a; display:flex; align-items:center; gap:8px;">
                                <i class="fa-solid fa-chevron-down acc-arrow" style="font-size:0.75rem; transition:transform 0.3s;"></i> ${dateStr}
                            </div>
                            <div style="font-weight:700; color:#ef4444;">Rp ${formatRupiah(dailyTotal)}</div>
                        </div>
                        <div class="acc-content" style="padding:0; max-height:none; overflow:visible; ${index === 0 ? 'display:block;' : 'display:none;'}">
                            ${rowHtml}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;

            const accItems = container.querySelectorAll('.acc-item');
            accItems.forEach(item => {
                const header = item.querySelector('.acc-header');
                if (header) {
                    header.addEventListener('click', () => {
                        item.classList.toggle('active');
                        const content = item.querySelector('.acc-content');
                        const arrow = item.querySelector('.acc-arrow');
                        const isActive = item.classList.contains('active');
                        if (content) content.style.display = isActive ? 'block' : 'none';
                        if (arrow) arrow.style.transform = isActive ? 'rotate(-180deg)' : 'rotate(0deg)';
                    });
                }
            });

            // --- EXPAND ALL / COLLAPSE ALL LOGIC ---
            const btnExpandAll = document.getElementById('btn-pengeluaran-expand-all');
            const btnCollapseAll = document.getElementById('btn-pengeluaran-collapse-all');
            
            if (btnExpandAll) {
                const newBtnE = btnExpandAll.cloneNode(true);
                btnExpandAll.parentNode.replaceChild(newBtnE, btnExpandAll);
                newBtnE.addEventListener('click', () => {
                    accItems.forEach(item => {
                        item.classList.add('active');
                        const content = item.querySelector('.acc-content');
                        if (content) content.style.display = 'block';
                        const arrow = item.querySelector('.acc-arrow');
                        if (arrow) arrow.style.transform = 'rotate(-180deg)';
                    });
                });
            }
            if (btnCollapseAll) {
                const newBtnC = btnCollapseAll.cloneNode(true);
                btnCollapseAll.parentNode.replaceChild(newBtnC, btnCollapseAll);
                newBtnC.addEventListener('click', () => {
                    accItems.forEach(item => {
                        item.classList.remove('active');
                        const content = item.querySelector('.acc-content');
                        if (content) content.style.display = 'none';
                        const arrow = item.querySelector('.acc-arrow');
                        if (arrow) arrow.style.transform = 'rotate(0deg)';
                    });
                });
            }
        }
    };

    // --- 6. LABA RUGI ---
    window.renderLaporanLabaRugi = function (filterVal = 'hari-ini') {
        const layout = document.getElementById('layout-laba-rugi');
        if (!layout) return;

        const emptyState = document.getElementById('laba-rugi-empty-state');
        const dataState = document.getElementById('laba-rugi-data-state');
        const filterSel = document.getElementById('laba-rugi-date-filter');
        
        let dbPem = window.getMergedPemasukan();
        let dbPeng = window.getMergedPengeluaran();

        let totalPemasukan = 0;
        let totalPengeluaran = 0;

        let start = null, end = null;
        if (filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') {
            start = filterSel ? filterSel.getAttribute('data-start') : null;
            end = filterSel ? filterSel.getAttribute('data-end') : null;
        }

        dbPem.forEach(item => {
            if (item.status === 'batal' || item.status === 'Batal') return;
            if (item.type) {
                if (window.isDateInRange(parseDateString(item.date), filterVal, start, end)) {
                    totalPemasukan += (parseFloat(item.nominal) || 0);
                }
            } else {
                let phList = item.paymentHistory;
                if (typeof phList === 'string') {
                    try { phList = JSON.parse(phList); } catch(e) { phList = []; }
                }
                if (phList && Array.isArray(phList) && phList.length > 0) {
                    phList.forEach(ph => {
                        if (window.isDateInRange(parseDateString(ph.date), filterVal, start, end)) {
                            totalPemasukan += (parseFloat(ph.amount) || 0);
                        }
                    });
                } else {
                    let dibayar = parseFloat(item.dibayar || 0);
                    if (dibayar > 0) {
                        let pDate = parseDateString(item.tanggalBayar || item.paymentDate || item.date, item.id, item.estDate);
                        if (window.isDateInRange(pDate, filterVal, start, end)) {
                            totalPemasukan += dibayar;
                        }
                    }
                }
            }
        });

        dbPeng.forEach(exp => {
            let expDate = parseDateString(exp.date || exp.tanggal, exp.id);
            if (window.isDateInRange(expDate, filterVal, start, end)) {
                totalPengeluaran += (parseFloat(exp.amount || exp.nominal) || 0);
            }
        });

        if (totalPemasukan === 0 && totalPengeluaran === 0) {
            if(emptyState) emptyState.style.display = 'flex';
            if(dataState) dataState.style.display = 'none';
            return;
        }

        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';

        const lPendapatan = document.getElementById('lr-total-pendapatan');
        const lPengeluaran = document.getElementById('lr-total-pengeluaran');
        if (lPendapatan) lPendapatan.innerText = window.formatRupiah(totalPemasukan);
        if (lPengeluaran) lPengeluaran.innerText = window.formatRupiah(totalPengeluaran);

        // Find Laba Bersih ID, currently missing ID in index, but we can do a selector
        // The Laba Bersih is the last massive span with 1.8rem
        const spans = layout.querySelectorAll('span[style*="1.8rem"]');
        if (spans.length > 0) {
            const laba = totalPemasukan - totalPengeluaran;
            spans[spans.length - 1].innerText = window.formatRupiah(Math.abs(laba));
        }
    };

    window.omzetChartInstance = null;
    window.renderLaporanOmzet = function(filterVal = 'hari-ini') {
        const layout = document.getElementById('layout-omzet');
        if (!layout) return;

        const dbPem = window.getMergedPemasukan();
        const emptyState = document.getElementById('omzet-empty-state');
        const dataState = document.getElementById('omzet-data-state');
        
        let startStr = null, endStr = null;
        const filterSel = document.getElementById('omzet-date-filter');
        if ((filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') && filterSel) {
            startStr = filterSel.getAttribute('data-start');
            endStr = filterSel.getAttribute('data-end');
        }

        const filtered = dbPem.filter(item => {
            if (item.type || item.status === 'batal' || item.status === 'Batal') return false;
            return window.isDateInRange(window.parseDateString(item.date, item.id, item.estDate), filterVal, startStr, endStr);
        });

        if (filtered.length === 0) {
            if(emptyState) emptyState.style.display = 'flex';
            if(dataState) dataState.style.display = 'none';
            return;
        }

        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';

        let totalOmzet = 0;
        filtered.forEach(x => totalOmzet += (parseFloat(x.total || x.nominal) || 0));

        const spans = layout.querySelectorAll('span[style*="1.8rem"]');
        if (spans.length > 0) {
            spans[0].innerText = window.formatRupiah(totalOmzet);
        }

        const chartData = { labels: [], data: [] };
        const grouped = {};
        filtered.forEach(item => {
            const d = window.parseDateString(item.date, item.id, item.estDate);
            const dStr = window.formatDateDisplay(d);
            if (!grouped[dStr]) grouped[dStr] = { nominal: 0, count: 0 };
            grouped[dStr].nominal += (parseFloat(item.total || item.nominal) || 0);
            grouped[dStr].count += 1;
        });

        const tbody = document.getElementById('omzet-tbody');
        if (tbody) {
            let html = '';
            Object.keys(grouped).sort((a,b) => window.parseDateString(b) - window.parseDateString(a)).forEach(dStr => {
                const g = grouped[dStr];
                html += `
                <tr>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px;">${dStr}</td>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; text-align:center;">${g.count}</td>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; text-align:right;">${window.formatRupiah(g.nominal)}</td>
                </tr>`;
                chartData.labels.unshift(dStr);
                chartData.data.unshift(g.nominal);
            });
            tbody.innerHTML = html;
        }

        const ctx = document.getElementById('omzetChart');
        if (ctx) {
            if (window.omzetChartInstance) {
                window.omzetChartInstance.destroy();
            }
            if (window.Chart) {
                window.omzetChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.labels,
                        datasets: [{
                            label: 'Omzet',
                            data: chartData.data,
                            borderColor: '#0ea5e9',
                            backgroundColor: 'rgba(14, 165, 233, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true }
                        }
                    }
                });
            }
        }
    };

    window.renderLaporanArusKeuangan = function(filterVal = 'hari-ini') {
        const layout = document.getElementById('layout-arus-keuangan');
        if (!layout) return;

        const dbPem = window.getMergedPemasukan();
        const dbPeng = window.getMergedPengeluaran();
        const emptyState = document.getElementById('arus-empty-state');
        const dataState = document.getElementById('arus-data-state');
        
        let startStr = null, endStr = null;
        const filterSel = document.getElementById('arus-date-filter');
        if ((filterVal === 'per-tanggal' || filterVal === 'CUSTOM_DATE_RANGE') && filterSel) {
            startStr = filterSel.getAttribute('data-start');
            endStr = filterSel.getAttribute('data-end');
        }

        const cashboxSel = document.getElementById('arus-cashbox-filter');
        const cashboxVal = cashboxSel ? cashboxSel.value : 'Semua';

        const filteredPem = dbPem.filter(item => {
            if (!window.isDateInRange(window.parseDateString(item.date), filterVal, startStr, endStr)) return false;
            if (cashboxVal !== 'Semua') {
                const cat = item.category || 'Tunai';
                return cat.toUpperCase().includes(cashboxVal.toUpperCase());
            }
            return true;
        });
        const filteredPeng = dbPeng.filter(item => {
            if (!window.isDateInRange(window.parseDateString(item.date), filterVal, startStr, endStr)) return false;
            if (cashboxVal !== 'Semua') {
                const cat = item.category || 'Tunai';
                return cat.toUpperCase().includes(cashboxVal.toUpperCase());
            }
            return true;
        });

        if (filteredPem.length === 0 && filteredPeng.length === 0) {
            if(emptyState) emptyState.style.display = 'flex';
            if(dataState) dataState.style.display = 'none';
            return;
        }

        if(emptyState) emptyState.style.display = 'none';
        if(dataState) dataState.style.display = 'flex';

        let totalMasuk = 0;
        let totalKeluar = 0;
        const combined = [];

        filteredPem.forEach(x => {
            const nom = parseFloat(x.type ? x.nominal : x.dibayar) || 0;
            if (nom > 0) {
                totalMasuk += nom;
                combined.push({
                    date: window.parseDateString(x.date),
                    ket: x.type ? (x.category || 'Pendapatan Lain') : 'Pendapatan Transaksi',
                    debit: nom,
                    kredit: 0
                });
            }
        });

        filteredPeng.forEach(x => {
            const nom = parseFloat(x.nominal) || 0;
            if (nom > 0) {
                totalKeluar += nom;
                combined.push({
                    date: window.parseDateString(x.date),
                    ket: (x.category || 'Pengeluaran') + (x.keterangan ? '<br><span style="color:#94a3b8;">'+x.keterangan+'</span>' : ''),
                    debit: 0,
                    kredit: nom
                });
            }
        });

        const masukSpan = layout.querySelector('div[style*="eab308"]')?.parentElement?.nextElementSibling?.querySelector('span');
        const keluarSpan = layout.querySelector('div[style*="0ea5e9"]')?.parentElement?.nextElementSibling?.querySelector('span');
        if (masukSpan) masukSpan.innerText = window.formatRupiah(totalMasuk);
        if (keluarSpan) keluarSpan.innerText = window.formatRupiah(totalKeluar);

        combined.sort((a,b) => b.date - a.date);
        const tbody = document.getElementById('arus-tbody');
        if (tbody) {
            let html = '';
            combined.forEach(item => {
                html += `
                <tr>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; vertical-align:top;">${window.formatDateDisplay(item.date)}</td>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; vertical-align:top;">${item.ket}</td>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; text-align:right; vertical-align:top; color:#eab308;">${item.debit > 0 ? window.formatRupiah(item.debit) : '0'}</td>
                    <td style="padding-bottom:15px; border-bottom:1px solid #f1f5f9; padding-top:10px; text-align:right; vertical-align:top; color:#0ea5e9;">${item.kredit > 0 ? window.formatRupiah(item.kredit) : '0'}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
        }
        
        const elTotalKas = document.getElementById('arus-total-kas-text');
        if (elTotalKas) {
            elTotalKas.innerText = (totalMasuk - totalKeluar).toLocaleString('id-ID');
        }
        
        window.currentArusData = combined;
    };

    // --- BIND EVENT LISTENERS ---
    setTimeout(() => {
        // Global hook for custom date picker apply
        const btnModalOkeGlobal = document.getElementById('btn-modal-oke');
        if (btnModalOkeGlobal) {
            btnModalOkeGlobal.addEventListener('click', () => {
            if (window.activeCustomDatePickerFilter) {
                setTimeout(() => {
                    const filterSel = window.activeCustomDatePickerFilter;
                    const txtEl = window.activeCustomDatePickerText;
                    
                    if (window.calStartDay !== undefined && window.calStartDay !== null) {
                        const pad = (n) => String(n).padStart(2, '0');
                        let startStr = `${pad(window.calStartDay)}/${pad(window.calStartMonth + 1)}/${window.calStartYear}`;
                        let endStr = startStr;
                        if (window.calEndDay !== undefined && window.calEndDay !== null) {
                            endStr = `${pad(window.calEndDay)}/${pad(window.calEndMonth + 1)}/${window.calEndYear}`;
                        }
                        const finalTxt = startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                        if (txtEl) txtEl.innerText = finalTxt;
                        
                        filterSel.setAttribute('data-start', startStr);
                        filterSel.setAttribute('data-end', endStr);
                    }

                    if (typeof window.activeCustomDatePickerRender === 'function') {
                        window.activeCustomDatePickerRender('per-tanggal');
                    }
                }, 50);
            }
        });
        }

        hookFilterEvents('omzet', window.renderLaporanOmzet);
        hookFilterEvents('arus', window.renderLaporanArusKeuangan);
        hookFilterEvents('pendapatan', (val) => window.renderLaporanPendapatan(val, 'transaksi'));
        hookFilterEvents('lainnya', (val) => window.renderLaporanPendapatan(val, 'lainnya'));
        hookFilterEvents('pengeluaran', window.renderLaporanPengeluaran);
        hookFilterEvents('laba-rugi', window.renderLaporanLabaRugi);
        hookFilterEvents('lap-transaksi', (val) => { window.renderLaporanTransaksiAccordion(val); });
        
        const lapSecondaryFilter = document.getElementById('lap-transaksi-filter-select');
        if (lapSecondaryFilter) {
            lapSecondaryFilter.addEventListener('change', (e) => {
                const textEl = document.getElementById('lap-transaksi-filter-text');
                if (textEl) textEl.innerText = e.target.options[e.target.selectedIndex].text;
                if (typeof window.renderLaporanTransaksiAccordion === 'function') window.renderLaporanTransaksiAccordion();
            });
        }
        
        // Initial Fetch which triggers renders - run in background after UI is active
        setTimeout(() => {
            fetchApiData(true);
        }, 4000);
    }, 300);

})();





