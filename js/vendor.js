// Vendor Dashboard Functions
function initVendorDashboard() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is a vendor
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (!doc.exists || doc.data().userType !== 'seller' || doc.data().sellerStatus !== 'approved') {
                window.location.href = 'index.html';
                return;
            }

            // Load vendor stats
            loadVendorStats(user.uid);

            // Load recent orders
            loadVendorOrders(user.uid);

            // Load products
            loadVendorProducts(user.uid);

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
        })
        .catch((error) => {
            console.error('Error loading vendor data:', error);
            window.location.href = 'index.html';
        });
}

// Load vendor stats
function loadVendorStats(vendorId) {
    // Today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate start of week
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    // Calculate start of month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get today's sales
    db.collection('vendorOrders')
        .where('vendorId', '==', vendorId)
        .where('orderDate', '>=', today)
        .where('paymentStatus', '==', 'paid')
        .get()
        .then((querySnapshot) => {
            const todaySales = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
            document.getElementById('todaySales').textContent = `ETB ${todaySales.toFixed(2)}`;
        });
    
    // Get weekly sales
    db.collection('vendorOrders')
        .where('vendorId', '==', vendorId)
        .where('orderDate', '>=', weekStart)
        .where('paymentStatus', '==', 'paid')
        .get()
        .then((querySnapshot) => {
            const weekSales = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
            document.getElementById('weekSales').textContent = `ETB ${weekSales.toFixed(2)}`;
        });
    
    // Get monthly sales
    db.collection('vendorOrders')
        .where('vendorId', '==', vendorId)
        .where('orderDate', '>=', monthStart)
        .where('paymentStatus', '==', 'paid')
        .get()
        .then((querySnapshot) => {
            const monthSales = querySnapshot.docs.reduce((sum, doc) => sum + doc.data().total, 0);
            document.getElementById('monthSales').textContent = `ETB ${monthSales.toFixed(2)}`;
        });
    
    // Get total products
    db.collection('products')
        .where('vendorId', '==', vendorId)
        .where('status', '!=', 'deleted')
        .get()
        .then((querySnapshot) => {
            document.getElementById('totalProducts').textContent = querySnapshot.size;
        });
}

// Load vendor orders for dashboard
function loadVendorOrders(vendorId) {
    const ordersTable = document.getElementById('vendorOrdersTable');
    if (!ordersTable) return;
    
    db.collection('vendorOrders')
        .where('vendorId', '==', vendorId)
        .orderBy('orderDate', 'desc')
        .limit(5)
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
                        <td>ETB ${order.total.toFixed(2)}</td>
                        <td><span class="status-badge ${order.status}">${order.status}</span></td>
                        <td>
                            <a href="vendor-order.html?id=${doc.id}" class="btn-view">View</a>
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

// Load vendor products for dashboard
function loadVendorProducts(vendorId) {
    const productsTable = document.getElementById('vendorProductsTable');
    if (!productsTable) return;
    
    db.collection('products')
        .where('vendorId', '==', vendorId)
        .where('status', '!=', 'deleted')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .then((querySnapshot) => {
            const tbody = productsTable.querySelector('tbody');
            tbody.innerHTML = '';
            
            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6">No products found</td></tr>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${product.images[0] || 'images/default-product.jpg'}" alt="${product.name}" class="product-thumb"></td>
                        <td>${product.name}</td>
                        <td>ETB ${product.price.toFixed(2)}</td>
                        <td>${product.stock}</td>
                        <td><span class="status-badge ${product.status}">${product.status}</span></td>
                        <td>
                            <a href="vendor-edit-product.html?id=${doc.id}" class="btn-edit">Edit</a>
                            <button class="btn-delete" data-id="${doc.id}">Delete</button>
                        </td>
                    </tr>
                `;
            });
            
            // Initialize delete buttons
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => {
                    if (confirm('Are you sure you want to delete this product?')) {
                        deleteProduct(e.target.dataset.id);
                    }
                });
            });
        })
        .catch((error) => {
            console.error('Error loading products:', error);
            productsTable.querySelector('tbody').innerHTML = '<tr><td colspan="6">Error loading products</td></tr>';
        });
}

// Delete product
function deleteProduct(productId) {
    db.collection('products').doc(productId).update({
        status: 'deleted',
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Product deleted successfully');
        loadVendorProducts(auth.currentUser.uid);
    })
    .catch((error) => {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
    });
}

// Initialize vendor pages
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('vendor-dashboard.html') || 
        window.location.pathname.includes('vendor-products.html') ||
        window.location.pathname.includes('vendor-orders.html') ||
        window.location.pathname.includes('vendor-add-product.html')) {
        initVendorDashboard();
    }
});
