import { useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // <--- PERUBAHAN 1: Import seperti ini
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scannedList, setScannedList] = useState([]) 

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setError('')
    }
  }

  const handleScan = async () => {
    if (!file) return alert("Pilih gambar struk dulu!")
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.status === 'success') {
        const newData = response.data.data;
        setScannedList([...scannedList, newData]);
        setFile(null);
        setPreview(null);
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err)
      setError('Gagal memproses struk. Cek backend.')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = (index) => {
    if(window.confirm("Hapus struk ini?")) {
        const newList = [...scannedList];
        newList.splice(index, 1);
        setScannedList(newList);
    }
  }

  // --- FUNGSI PDF YANG SUDAH DIPERBAIKI ---
  const generatePDF = () => {
    // Inisialisasi PDF
    const doc = new jsPDF();

    // Judul Header
    doc.setFontSize(18);
    doc.text("Laporan Rekapitulasi Pengeluaran", 105, 20, null, null, "center");
    
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 105, 28, null, null, "center");
    doc.line(14, 32, 196, 32); 

    let finalY = 40;

    // Loop data struk
    scannedList.forEach((struk, index) => {
      // Judul per Struk
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229); 
      doc.text(`Struk #${index + 1}: ${struk.merchant_name} (${struk.date})`, 14, finalY);
      
      const tableRows = [];

      // Masukkan item belanja
      struk.items.forEach(item => {
        tableRows.push([
          item.name,
          item.qty,
          formatRupiah(item.unit_price),
          formatRupiah(item.price)
        ]);
      });

      // Baris Total per Struk
      tableRows.push([
        { content: "TOTAL STRUK INI", colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatRupiah(struk.total), styles: { fontStyle: 'bold' } }
      ]);

      // <--- PERUBAHAN 2: Panggil autoTable sebagai fungsi, bukan method doc
      autoTable(doc, {
        startY: finalY + 5,
        head: [["Nama Barang", "Qty", "Harga Satuan", "Subtotal"]],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 20, halign: 'center' },
            2: { cellWidth: 35, halign: 'right' },
            3: { cellWidth: 35, halign: 'right' }
        }
      });

      // Update posisi Y untuk tabel berikutnya
      // Kita pakai doc.lastAutoTable.finalY (syntax baru jspdf-autotable)
      finalY = doc.lastAutoTable.finalY + 15;
      
      // Cek ganti halaman
      if (finalY > 270) { 
        doc.addPage(); 
        finalY = 20; 
      }
    });

    // --- Bagian Grand Total ---
    const grandTotal = scannedList.reduce((acc, curr) => acc + parseInt(curr.total), 0);
    
    // Kotak Abu-abu
    doc.setFillColor(243, 244, 246); 
    doc.roundedRect(14, finalY, 182, 25, 3, 3, 'F');
    
    // Teks Grand Total
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL:", 20, finalY + 16);
    
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38); 
    doc.text(formatRupiah(grandTotal), 190, finalY + 16, null, null, "right");

    // Simpan File
    doc.save(`Laporan_Struk_${new Date().getTime()}.pdf`);
  }

  return (
    <div className="app-container">
      <div className="main-content">
        {/* KIRI: SCANNER */}
        <div className="scan-section">
            <div className="header-section">
                <h1>🧾 AI Scanner Pro</h1>
                <p>Scan struk unlimited, rekap otomatis.</p>
            </div>

            <div className="card scan-card">
                <div className="upload-area">
                <input type="file" id="file-upload" onChange={handleFileChange} accept="image/*" />
                <label htmlFor="file-upload" className="upload-label">
                    <span className="upload-icon">{file ? '📄' : '📸'}</span>
                    <span className="upload-text">{file ? file.name : "Klik untuk Upload Struk"}</span>
                </label>
                </div>

                {preview && (
                <div className="preview-box">
                    <img src={preview} alt="Preview" />
                    <p className="preview-hint">Pastikan gambar jelas</p>
                </div>
                )}
                {error && <div className="error-message">⚠️ {error}</div>}
                <button className="btn-scan" onClick={handleScan} disabled={loading || !file}>
                {loading ? <><div className="spinner"></div> Memproses...</> : '➕ Scan & Tambah ke Daftar'}
                </button>
            </div>
        </div>

        {/* KANAN: HASIL LIST */}
        {scannedList.length > 0 && (
            <div className="results-section">
                <div className="section-title">
                    <h2>📋 Daftar Struk ({scannedList.length})</h2>
                </div>
                
                <div className="scanned-grid">
                    {scannedList.map((data, index) => (
                    <div key={index} className="mini-receipt-card">
                        <div className="mini-header">
                            <span className="receipt-index">#{index + 1}</span>
                            <button className="btn-delete" onClick={() => removeItem(index)}>🗑️</button>
                        </div>
                        <h3 className="merchant-title">{data.merchant_name}</h3>
                        <div className="mini-date">📅 {data.date}</div>
                        <div className="mini-total-box">Total: {formatRupiah(data.total)}</div>
                        <details className="mini-details">
                            <summary>Lihat Item</summary>
                            <ul className="mini-items-list">
                                {data.items.map((item, idx) => (
                                    <li key={idx}><span>{item.qty}x {item.name}</span><strong>{formatRupiah(item.price)}</strong></li>
                                ))}
                            </ul>
                        </details>
                    </div>
                    ))}
                </div>

                <div className="action-card">
                    <div className="grand-total-box">
                        <span className="grand-total-label">Total Semua</span>
                        <span className="grand-total-value">
                            {formatRupiah(scannedList.reduce((acc, curr) => acc + parseInt(curr.total), 0))}
                        </span>
                    </div>
                    <button className="btn-pdf" onClick={generatePDF}>
                        📄 Download Laporan PDF
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}

export default App