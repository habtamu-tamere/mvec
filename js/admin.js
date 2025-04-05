// Admin Dashboard Functions
function initAdminDashboard() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is admin
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists || doc.data().userType !== 'admin') {
                window.location.href = 'index.html';
                return;
            }

            // Load admin stats
            loadAdminStats();

            // Load pending vendors
            loadPendingVendors();

            // Load recent orders
            loadAdminOrders();

            // Initialize logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut().then(() => {
                        window.location.href = 'index.html';
                    });
                });
            }

            // Refresh data button
            document.getElementById('refreshData').addEventListener('click', () => {
                loadAdminStats();
                loadPendingVendors();
                loadAdminOrders();
            });
        })
        .catch((error) => {
            console.error('Error loading admin data:', error);
            window.location.href = 'index.html';
        });
}

// Load admin stats
function loadAdminStats() {
    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's sales
    db.collection('orders')
        .where('orderDate', '>=', today)
        .where('status', '!=', 'cancelled')
        .get()
        .then((querySnapshot) => {
            const todaySales = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().totalAmount, 0);
            document.getElementById('todaySales').textContent = `ETB ${todaySales.toFixed(2)}`;
        });
    
    // Get total vendors
    db.collection('users')
        .where('userType', '==', 'seller')
        .where('sellerStatus', '==', 'approved')
        .get()
        .then((querySnapshot) => {
            document.getElementById('totalVendors').textContent = querySnapshot.size;
        });
    
    // Get pending vendors
    db.collection('users')
        .where('userType', '==', 'seller')
        .where('sellerStatus', '==', 'pending')
        .get()
        .then((querySnapshot) => {
            document.getElementById('pendingVendors').textContent = querySnapshot.size;
        });
    
    // Get total products
    db.collection('products')
        .where('status', '==', 'active')
        .get()
        .then((querySnapshot) => {
            document.getElementById('totalProducts').textContent = querySnapshot.size;
        });
}

// Load pending vendors
function loadPendingVendors() {
    const vendorsTable = document.getElementById('pendingVendorsTable');
    if (!vendorsTable) return;
    
    db.collection('users')
        .where('userType', '==', 'seller')
        .where('sellerStatus', '==', 'pending')
        .get()
        .then((querySnapshot) => {
            const tbody = vendorsTable.querySelector('tbody');
            tbody.innerHTML = '';
            
            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5">No pending vendors</td></tr>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const vendor = doc.data();
                
                tbody.innerHTML += `
                    <tr>
                        <td>${vendor.name}</td>
                        <td>${vendor.phone}</td>
                        <td>${vendor.storeName || 'N/A'}</td>
                        <td>${new Date(vendor.createdAt.seconds * 1000).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-approve" data-id="${doc.id}">Approve</button>
                            <button class="btn-reject" data-id="${doc.id}">Reject</button>
                        </td>
                    </tr>
                `;
            });
            
            // Initialize approve/reject buttons
            document.querySelectorAll('.btn-approve').forEach(button => {
                button.addEventListener('click', (e) => {
                    approveVendor(e.target.dataset.id);
                });
            });
            
            document.querySelectorAll('.btn-reject').forEach(button => {
                button.addEventListener('click', (e) => {
                    rejectVendor(e.target.dataset.id);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading pending vendors:', error);
            vendorsTable.querySelector('tbody').innerHTML = '<tr><td colspan="5">Error loading vendors</td></tr>';
        });
}

// Approve vendor
function approveVendor(vendorId) {
    db.collection('users').doc(vendorId).update({
        sellerStatus: 'approved',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Vendor approved successfully');
        loadPendingVendors();
        loadAdminStats();
    })
    .catch((error) => {
        console.error('Error approving vendor:', error);
        alert('Error approving vendor. Please try again.');
    });
}

// Reject vendor
function rejectVendor(vendorId) {
    db.collection('users').doc(vendorId).update({
        sellerStatus: 'rejected',
        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Vendor rejected');
        loadPendingVendors();
        loadAdminStats();
    })
    .catch((error) => {
        console.error('Error rejecting vendor:', error);
        alert('Error rejecting vendor. Please try again.');
    });
}

// Load admin orders
function loadAdminOrders() {
    const ordersTable = document.getElementById('adminOrdersTable');
    if (!ordersTable) return;
    
    db.collection('orders')
        .orderBy('orderDate', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            const tbody = ordersTable.querySelector('tbody');
            tbody.innerHTML = '';
            
            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderDate = new Date(order.orderDate.seconds * 1000);
                
                tbody.innerHTML += `
                    <tr>
                        <td>${doc.id.substring(0, 8)}</td>
                        <td>${orderDate.toLocaleDateString()}</td>
                        <td>${order.userName}</td>
                        <td>ETB ${order.totalAmount.toFixed(2)}</td>
                        <td><span class="status-badge ${order.status}">${order.status}</span></td>
                        <td>
                            <a href="admin-order.html?id=${doc.id}" class="btn-view">View</a>
                        </td>
                    </tr>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading orders:', error);
            ordersTable.querySelector('tbody').innerHTML = '<tr><td colspan="6">Error loading orders</td></tr>';
        });
}

// Initialize admin pages
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin-dashboard.html') || 
        window.location.pathname.includes('admin-vendors.html') ||
        window.location.pathname.includes('admin-orders.html') ||
        window.location.pathname.includes('admin-products.html')) {
        initAdminDashboard();
    }
});
