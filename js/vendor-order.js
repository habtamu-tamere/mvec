// Vendor Order Details
function initVendorOrderPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        window.location.href = 'vendor-orders.html';
        return;
    }

    loadOrderDetails(orderId);
}

function loadOrderDetails(orderId) {
    const orderContainer = document.getElementById('orderContainer');
    
    db.collection('vendorOrders').doc(orderId).get()
        .then((doc) => {
            if (!doc.exists) {
                orderContainer.innerHTML = '<div class="alert alert-danger">Order not found</div>';
                return;
            }

            const order = doc.data();
            const orderDate = new Date(order.orderDate.seconds * 1000);
            const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Format order items
            const itemsHtml = order.items.map(item => `
                <div class="order-item">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <div class="item-price">ETB ${item.price.toFixed(2)} × ${item.quantity}</div>
                        <div class="item-total">ETB ${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                </div>
            `).join('');

            orderContainer.innerHTML = `
                <div class="order-summary">
                    <div class="order-header">
                        <div class="order-id">Order #${doc.id.substring(0, 8)}</div>
                        <div class="order-date">${orderDate.toLocaleString()}</div>
                        <div class="order-status">
                            <span class="status-badge ${order.status}">${order.status}</span>
                        </div>
                    </div>

                    <div class="order-customer">
                        <h3>Customer Information</h3>
                        <div class="customer-details">
                            <div><strong>Name:</strong> ${order.userName}</div>
                            <div><strong>Phone:</strong> ${order.userPhone}</div>
                        </div>
                    </div>

                    <div class="order-shipping">
                        <h3>Shipping Address</h3>
                        <div class="shipping-address">
                            <div><strong>Name:</strong> ${order.shippingAddress.name}</div>
                            <div><strong>Address:</strong> ${order.shippingAddress.address}</div>
                            <div><strong>City:</strong> ${order.shippingAddress.city}</div>
                            <div><strong>Phone:</strong> ${order.shippingAddress.phone}</div>
                        </div>
                    </div>

                    <div class="order-items">
                        <h3>Order Items (${order.items.length})</h3>
                        ${itemsHtml}
                    </div>

                    <div class="order-totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>ETB ${itemsTotal.toFixed(2)}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping:</span>
                            <span>ETB ${order.shipping.toFixed(2)}</span>
                        </div>
                        <div class="total-row grand-total">
                            <span>Total:</span>
                            <span>ETB ${order.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="order-actions">
                        <div class="status-update">
                            <label for="orderStatus">Update Status:</label>
                            <select id="orderStatus">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                            <button id="updateStatusBtn" class="btn-primary">Update</button>
                        </div>
                        <button id="printShippingLabel" class="btn-secondary">
                            <i class="fas fa-print"></i> Print Shipping Label
                        </button>
                    </div>
                </div>
            `;

            // Initialize status update
            document.getElementById('updateStatusBtn').addEventListener('click', () => {
                const newStatus = document.getElementById('orderStatus').value;
                updateOrderStatus(doc.id, newStatus);
            });

            // Initialize print button
            document.getElementById('printShippingLabel').addEventListener('click', () => {
                printShippingLabel(order);
            });
        })
        .catch((error) => {
            console.error('Error loading order:', error);
            orderContainer.innerHTML = '<div class="alert alert-danger">Error loading order details</div>';
        });
}

function updateOrderStatus(orderId, status) {
    if (!confirm(`Are you sure you want to update this order to ${status}?`)) {
        return;
    }

    db.collection('vendorOrders').doc(orderId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Order status updated successfully');
        loadOrderDetails(orderId);
    })
    .catch((error) => {
        console.error('Error updating order status:', error);
        alert('Error updating order status. Please try again.');
    });
}

function printShippingLabel(order) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Shipping Label - Order #${order.orderId.substring(0, 8)}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                .shipping-label { border: 1px dashed #ccc; padding: 20px; max-width: 400px; margin: 0 auto; }
                .label-header { text-align: center; margin-bottom: 20px; }
                .label-header h2 { margin: 0; }
                .label-from, .label-to { margin-bottom: 20px; }
                .label-from h3, .label-to h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                .label-items { margin-top: 20px; }
                .label-items table { width: 100%; border-collapse: collapse; }
                .label-items th, .label-items td { border: 1px solid #eee; padding: 5px; text-align: left; }
                .label-barcode { text-align: center; margin-top: 20px; }
                .label-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            </style>
        </head>
        <body>
            <div class="shipping-label">
                <div class="label-header">
                    <h2>SHIPPING LABEL</h2>
                    <p>Order #${order.orderId.substring(0, 8)}</p>
                </div>
                
                <div class="label-from">
                    <h3>FROM:</h3>
                    <p><strong>${order.vendorName}</strong></p>
                    <p>Marketplace Vendor</p>
                </div>
                
                <div class="label-to">
                    <h3>TO:</h3>
                    <p><strong>${order.shippingAddress.name}</strong></p>
                    <p>${order.shippingAddress.address}</p>
                    <p>${order.shippingAddress.city}</p>
                    <p>Phone: ${order.shippingAddress.phone}</p>
                </div>
                
                <div class="label-items">
                    <h3>ITEMS (${order.items.length})</h3>
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                        </tr>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                
                <div class="label-barcode">
                    <p>Scan to track</p>
                    <div style="font-family: 'Libre Barcode 128', cursive; font-size: 24px;">
                        *${order.orderId.substring(0, 8)}*
                    </div>
                </div>
                
                <div class="label-footer">
                    <p>Thank you for shopping with us!</p>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('vendor-order.html')) {
        initVendorOrderPage();
    }
});
