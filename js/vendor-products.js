// Vendor Products Management
let currentPage = 1;
const productsPerPage = 10;
let lastVisible = null;
let firstVisible = null;
let totalProducts = 0;

function loadVendorProductsList() {
    const user = auth.currentUser;
    if (!user) return;

    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    let query = db.collection('products')
        .where('vendorId', '==', user.uid)
        .where('status', '!=', 'deleted')
        .orderBy('createdAt', 'desc');

    // Apply status filter
    if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
        query = query.where('categoryId', '==', categoryFilter);
    }

    // Apply pagination
    if (currentPage > 1) {
        query = query.startAfter(lastVisible);
    }

    query = query.limit(productsPerPage);

    query.get()
        .then((querySnapshot) => {
            const productsTable = document.getElementById('productsTable');
            const tbody = productsTable.querySelector('tbody');
            tbody.innerHTML = '';

            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
                updatePaginationControls(0);
                return;
            }

            // Store for pagination
            lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            if (currentPage === 1) {
                firstVisible = querySnapshot.docs[0];
            }

            // Apply search filter client-side
            const filteredDocs = querySnapshot.docs.filter(doc => {
                const product = doc.data();
                return product.name.toLowerCase().includes(searchFilter);
            });

            if (filteredDocs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">No products match your search</td></tr>';
                updatePaginationControls(0);
                return;
            }

            filteredDocs.forEach((doc) => {
                const product = doc.data();
                tbody.innerHTML += `
                    <tr>
                        <td><img src="${product.images[0] || 'images/default-product.jpg'}" alt="${product.name}" class="product-thumb"></td>
                        <td>${product.name}</td>
                        <td>ETB ${product.price.toFixed(2)}</td>
                        <td>${product.stock}</td>
                        <td>${product.category}</td>
                        <td><span class="status-badge ${product.status}">${product.status}</span></td>
                        <td>
                            <a href="vendor-edit-product.html?id=${doc.id}" class="btn-edit">Edit</a>
                            <button class="btn-delete" data-id="${doc.id}">Delete</button>
                        </td>
                    </tr>
                `;
            });

            // Update pagination controls
            updatePaginationControls(filteredDocs.length);

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
            const productsTable = document.getElementById('productsTable');
            productsTable.querySelector('tbody').innerHTML = '<tr><td colspan="7">Error loading products</td></tr>';
        });
}

function updatePaginationControls(visibleCount) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = visibleCount < productsPerPage;

    pageInfo.textContent = `Page ${currentPage}`;

    // Update button event listeners
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            lastVisible = null; // Need to requery from start
            loadVendorProductsList();
        }
    };

    nextBtn.onclick = () => {
        currentPage++;
        loadVendorProductsList();
    };
}

function loadCategoriesForFilter() {
    db.collection('categories').get()
        .then((querySnapshot) => {
            const categoryFilter = document.getElementById('categoryFilter');
            querySnapshot.forEach((doc) => {
                const category = doc.data();
                categoryFilter.innerHTML += `<option value="${doc.id}">${category.name}</option>`;
            });
        });
}

// Initialize vendor products page
function initVendorProductsPage() {
    loadCategoriesForFilter();
    loadVendorProductsList();

    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', () => {
        currentPage = 1;
        lastVisible = null;
        loadVendorProductsList();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('vendor-products.html')) {
        initVendorProductsPage();
    }
});
