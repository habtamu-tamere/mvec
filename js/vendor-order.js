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
                                <
