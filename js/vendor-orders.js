// Vendor Orders Management
let currentOrderPage = 1;
const ordersPerPage = 10;
let lastOrderVisible = null;
let firstOrderVisible = null;

function loadVendorOrders() {
    const user = auth.currentUser;
    if (!user) return;

    const statusFilter = document.getElementById('orderStatusFilter').value;
    const dateFrom = document.getElementById('orderDateFrom').value;
    const dateTo = document.getElementById('orderDateTo').value;
    
    let query = db.collection('vendorOrders')
        .where('vendorId', '==', user.uid)
        .orderBy('orderDate', 'desc');

    // Apply status filter
    if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
    }

    // Apply date filters
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        query = query.where('orderDate', '>=', fromDate);
    }

    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.where('orderDate', '<=', toDate);
    }

    // Apply pagination
    if (currentOrderPage > 1) {
        query = query.startAfter(lastOrderVisible);
    }

    query = query.limit(ordersPerPage);

    query.get()
        .then((querySnapshot) => {
            const ordersTable = document.getElementById('ordersTable');
            const tbody = ordersTable.querySelector('tbody');
            tbody.innerHTML = '';

            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7">No orders found</td></tr>';
                updateOrderPaginationControls(0);
                return;
            }

            // Store for pagination
            lastOrderVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            if (currentOrderPage === 1) {
                firstOrderVisible = querySnapshot.docs[0];
            }

            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderDate = new Date(order.orderDate.seconds * 1000);
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                
                tbody.innerHTML += `
                    <tr>
                        <td>${doc.id.substring(0, 8)}</td>
                        <td>${orderDate.toLocaleDateString()}</td>
                        <td>${order.userName}</td>
                        <td>${itemCount}</td>
                        <td>ETB ${order.total.toFixed(2)}</td>
                        <td><span class="status-badge ${order.status}">${order.status}</span></td>
                        <td>
                            <a href="vendor-order.html?id=${doc.id}" class="btn-view">View</a>
                            <select class="status-select" data-id="${doc.id}">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                    </tr>
                `;
            });

            // Update pagination controls
            updateOrderPaginationControls(querySnapshot.size);

            // Initialize status selectors
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', (e) => {
                    updateOrderStatus(e.target.dataset.id, e.target.value);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading orders:', error);
            const ordersTable = document.getElementById('ordersTable');
            ordersTable.querySelector('tbody').innerHTML = '<tr><td colspan="7">Error loading orders</td></tr>';
        });
}

function updateOrderPaginationControls(visibleCount) {
    const prevBtn = document.getElementById('prevOrderPage');
    const nextBtn = document.getElementById('nextOrderPage');
    const pageInfo = document.getElementById('orderPageInfo');

    prevBtn.disabled = currentOrderPage === 1;
    nextBtn.disabled = visibleCount < ordersPerPage;

    pageInfo.textContent = `Page ${currentOrderPage}`;

    // Update button event listeners
    prevBtn.onclick = () => {
        if (currentOrderPage > 1) {
            currentOrderPage--;
            lastOrderVisible = null; // Need to requery from start
            loadVendorOrders();
        }
    };

    nextBtn.onclick = () => {
        currentOrderPage++;
        loadVendorOrders();
    };
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
        loadVendorOrders();
    })
    .catch((error) => {
        console.error('Error updating order status:', error);
        alert('Error updating order status. Please try again.');
    });
}

// Initialize vendor orders page
function initVendorOrdersPage() {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    document.getElementById('orderDateFrom').valueAsDate = thirtyDaysAgo;
    document.getElementById('orderDateTo').valueAsDate = today;

    // Load initial orders
    loadVendorOrders();

    // Apply filters button
    document.getElementById('applyOrderFilters').addEventListener('click', () => {
        currentOrderPage = 1;
        lastOrderVisible = null;
        loadVendorOrders();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('vendor-orders.html')) {
        initVendorOrdersPage();
    }
});
