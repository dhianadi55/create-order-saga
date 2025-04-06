const express = require('express');
const app = express();
const PORT = 3002;

app.use(express.json());

// In-memory database untuk menyimpan data pembayaran
const payments = {};

// Endpoint untuk memproses pembayaran
app.post('/process-payment', (req, res) => {
    const { orderId, amount } = req.body;
    
    // Generate ID pembayaran
    const paymentId = 'PAY-' + Math.floor(Math.random() * 10000);
    
    // Simulasi proses pembayaran dengan kemungkinan gagal 30%
    const simulateFailure = Math.random() < 0.3;
    
    if (simulateFailure) {
        console.log(`Pembayaran untuk order ${orderId} gagal`);
        return res.status(500).json({
            success: false,
            message: 'Proses pembayaran gagal',
            status: 'FAILED'
        });
    }
    
    // Simpan detail pembayaran dengan status SUCCESS
    payments[orderId] = {
        paymentId,
        orderId,
        amount,
        status: 'SUCCESS',
        processedAt: new Date()
    };
    
    console.log(`Pembayaran untuk order ${orderId} berhasil diproses`);
    
    res.status(200).json({
        success: true,
        paymentId,
        orderId,
        status: 'SUCCESS'
    });
});

// Endpoint kompensasi untuk mengembalikan pembayaran
app.post('/refund-payment', (req, res) => {
    const { orderId } = req.body;
    
    // Cek apakah pembayaran ada
    if (!payments[orderId]) {
        return res.status(404).json({
            success: false,
            message: `Pembayaran untuk order ${orderId} tidak ditemukan`
        });
    }
    
    // Update status pembayaran menjadi REFUNDED
    payments[orderId].status = 'REFUNDED';
    
    console.log(`Pembayaran untuk order ${orderId} dikembalikan`);
    
    res.status(200).json({
        success: true,
        paymentId: payments[orderId].paymentId,
        orderId,
        status: 'REFUNDED'
    });
});

// Endpoint untuk mendapatkan detail pembayaran
app.get('/payment/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    
    if (!payments[orderId]) {
        return res.status(404).json({
            success: false,
            message: `Pembayaran untuk order ${orderId} tidak ditemukan`
        });
    }
    
    res.status(200).json({
        success: true,
        payment: payments[orderId]
    });
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Payment Service berjalan di port ${PORT}`);
});