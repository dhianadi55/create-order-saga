const express = require('express');
const app = express();
const PORT = 3003;

app.use(express.json());

// In-memory database untuk menyimpan data pengiriman
const shipments = {};

// Endpoint untuk memulai pengiriman
app.post('/start-shipping', (req, res) => {
    const { orderId, address } = req.body;
    
    // Generate ID pengiriman
    const shippingId = 'SHP-' + Math.floor(Math.random() * 10000);
    
    // Simulasi proses pengiriman dengan kemungkinan gagal 20%
    const simulateFailure = Math.random() < 0.2;
    
    if (simulateFailure) {
        console.log(`Pengiriman untuk order ${orderId} gagal`);
        return res.status(500).json({
            success: false,
            message: 'Proses pengiriman gagal',
            status: 'CANCELLED'
        });
    }
    
    // Simpan detail pengiriman dengan status SHIPPED
    shipments[orderId] = {
        shippingId,
        orderId,
        address,
        status: 'SHIPPED',
        startedAt: new Date()
    };
    
    console.log(`Pengiriman untuk order ${orderId} berhasil dimulai`);
    
    res.status(200).json({
        success: true,
        shippingId,
        orderId,
        status: 'SHIPPED'
    });
});

// Endpoint kompensasi untuk membatalkan pengiriman
app.post('/cancel-shipping', (req, res) => {
    const { orderId } = req.body;
    
    // Cek apakah pengiriman ada
    if (!shipments[orderId]) {
        // Jika pengiriman belum dibuat, kita hanya mengakui pembatalan
        return res.status(200).json({
            success: true,
            message: `Tidak ada pengiriman untuk order ${orderId}, tidak ada yang perlu dibatalkan`,
            status: 'CANCELLED'
        });
    }
    
    // Update status pengiriman menjadi CANCELLED
    shipments[orderId].status = 'CANCELLED';
    
    console.log(`Pengiriman untuk order ${orderId} dibatalkan`);
    
    res.status(200).json({
        success: true,
        shippingId: shipments[orderId].shippingId,
        orderId,
        status: 'CANCELLED'
    });
});

// Endpoint untuk mendapatkan detail pengiriman
app.get('/shipping/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    
    if (!shipments[orderId]) {
        return res.status(404).json({
            success: false,
            message: `Pengiriman untuk order ${orderId} tidak ditemukan`
        });
    }
    
    res.status(200).json({
        success: true,
        shipment: shipments[orderId]
    });
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Shipping Service berjalan di port ${PORT}`);
});