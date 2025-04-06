const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

// Konfigurasi URL layanan
const ORDER_SERVICE_URL = 'http://localhost:3001';
const PAYMENT_SERVICE_URL = 'http://localhost:3002';
const SHIPPING_SERVICE_URL = 'http://localhost:3003';

// Endpoint utama Saga untuk membuat order
app.post('/create-order-saga', async (req, res) => {
    const orderData = req.body;
    console.log('Memulai Create Order Saga');
    
    try {
        // Langkah 1: Membuat Order
        console.log('Langkah 1: Membuat order');
        const orderResponse = await axios.post(`${ORDER_SERVICE_URL}/create-order`, orderData);
        const orderId = orderResponse.data.orderId;
        
        try {
            // Langkah 2: Memproses Pembayaran
            console.log('Langkah 2: Memproses pembayaran');
            const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/process-payment`, {
                orderId,
                amount: orderData.totalAmount
            });
            
            try {
                // Langkah 3: Memulai Pengiriman
                console.log('Langkah 3: Memulai pengiriman');
                const shippingResponse = await axios.post(`${SHIPPING_SERVICE_URL}/start-shipping`, {
                    orderId,
                    address: orderData.shippingAddress
                });
                
                // Semua langkah berhasil
                console.log('Saga berhasil selesai');
                return res.status(200).json({
                    success: true,
                    message: 'Order berhasil dibuat',
                    data: {
                        orderId,
                        orderStatus: 'COMPLETED',
                        paymentStatus: paymentResponse.data.status,
                        shippingStatus: shippingResponse.data.status
                    }
                });
                
            } catch (shippingError) {
                // Kompensasi untuk kegagalan Shipping
                console.error('Pengiriman gagal, memulai kompensasi', shippingError.message);
                
                // 1. Batalkan Pengiriman (walaupun gagal, kita tetap memanggil ini untuk memastikan pembersihan)
                await axios.post(`${SHIPPING_SERVICE_URL}/cancel-shipping`, { orderId });
                
                // 2. Kembalikan Pembayaran
                await axios.post(`${PAYMENT_SERVICE_URL}/refund-payment`, { orderId });
                
                // 3. Batalkan Order
                await axios.post(`${ORDER_SERVICE_URL}/cancel-order`, { orderId });
                
                return res.status(500).json({
                    success: false,
                    message: 'Order gagal pada langkah pengiriman. Semua transaksi telah dikembalikan.',
                    error: shippingError.message
                });
            }
            
        } catch (paymentError) {
            // Kompensasi untuk kegagalan Payment
            console.error('Pembayaran gagal, memulai kompensasi', paymentError.message);
            
            // 1. Batalkan Order
            await axios.post(`${ORDER_SERVICE_URL}/cancel-order`, { orderId });
            
            return res.status(500).json({
                success: false,
                message: 'Order gagal pada langkah pembayaran. Semua transaksi telah dikembalikan.',
                error: paymentError.message
            });
        }
        
    } catch (orderError) {
        // Pembuatan order gagal, tidak perlu kompensasi
        console.error('Pembuatan order gagal', orderError.message);
        return res.status(500).json({
            success: false,
            message: 'Gagal membuat order.',
            error: orderError.message
        });
    }
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Saga Orchestrator berjalan di port ${PORT}`);
});