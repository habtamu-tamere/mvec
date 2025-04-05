// Load categories
function loadCategories() {
    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) return;
    
    db.collection('categories').limit(8).get()
        .then((querySnapshot) => {
            categoryGrid.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const category = doc.data();
                categoryGrid.innerHTML += `
                    <div class="category-card" onclick="window.location.href='shop.html?category=${doc.id}'">
                        <img src="${category.image || 'images/default-category.jpg'}" alt="${category.name}">
                        <h3>${category.name}</h3>
                    </div>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading categories:', error);
        });
}

// Load featured products
function loadFeaturedProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;
    
    db.collection('products')
        .where('isFeatured', '==', true)
        .limit(8)
        .get()
        .then((querySnapshot) => {
            productGrid.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                displayProductCard(productGrid, doc.id, product);
            });
        })
        .catch((error) => {
            console.error('Error loading featured products:', error);
        });
}

// Load top vendors
function loadTopVendors() {
    const vendorGrid = document.getElementById('vendorGrid');
    if (!vendorGrid) return;
    
    db.collection('users')
        .where('userType', '==', 'seller')
        .where('sellerStatus', '==', 'approved')
        .orderBy('rating', 'desc')
        .limit(4)
        .get()
        .then((querySnapshot) => {
            vendorGrid.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const vendor = doc.data();
                vendorGrid.innerHTML += `
                    <div class="vendor-card" onclick="window.location.href='shop.html?vendor=${doc.id}'">
                        <img src="${vendor.storeImage || 'images/default-store.jpg'}" alt="${vendor.storeName || 'Vendor'}">
                        <h3>${vendor.storeName || 'Vendor'}</h3>
                        <div class="rating">${renderRating(vendor.rating || 0)}</div>
                    </div>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading vendors:', error);
        });
}

// Display product card
function displayProductCard(container, productId, product) {
    container.innerHTML += `
        <div class="product-card" onclick="window.location.href='product.html?id=${productId}'">
            <img src="${product.images[0] || 'images/default-product.jpg'}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="vendor">Sold by ${product.vendorName}</div>
            <div class="rating">${renderRating(product.rating || 0)} (${product.reviewCount || 0})</div>
            <div class="price">ETB ${product.price.toFixed(2)}</div>
            <button class="btn-add-to-cart" data-id="${productId}">Add to Cart</button>
        </div>
    `;
}

// Render rating stars
function renderRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

// Initialize product page
function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }
    
    const productContainer = document.getElementById('productContainer');
    if (!productContainer) return;
    
    db.collection('products').doc(productId).get()
        .then((doc) => {
            if (!doc.exists) {
                window.location.href = 'index.html';
                return;
            }
            
            const product = doc.data();
            displayProductDetails(productContainer, doc.id, product);
        })
        .catch((error) => {
            console.error('Error loading product:', error);
        });
}

// Display product details
function displayProductDetails(container, productId, product) {
    // Main product info
    container.innerHTML = `
        <div class="product-main">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${product.images[0] || 'images/default-product.jpg'}" alt="${product.name}">
                </div>
                <div class="thumbnail-grid">
                    ${product.images.map(img => `
                        <img src="${img}" alt="${product.name}">
                    `).join('')}
                </div>
            </div>
            <div class="product-info">
                <h1>${product.name}</h1>
                <div class="rating">${renderRating(product.rating || 0)} (${product.reviewCount || 0} reviews)</div>
                <div class="price">ETB ${product.price.toFixed(2)}</div>
                <div class="vendor">Sold by <a href="shop.html?vendor=${product.vendorId}">${product.vendorName}</a></div>
                <div class="description">${product.description}</div>
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <button class="btn-quantity minus">-</button>
                        <input type="number" value="1" min="1" max="10">
                        <button class="btn-quantity plus">+</button>
                    </div>
                    <button class="btn-primary btn-add-to-cart" data-id="${productId}">Add to Cart</button>
                    <button class="btn-secondary btn-wishlist" data-id="${productId}">
                        <i class="far fa-heart"></i> Save
                    </button>
                </div>
                
                <div class="product-meta">
                    <div><strong>Category:</strong> ${product.category}</div>
                    <div><strong>Stock:</strong> ${product.stock} available</div>
                </div>
            </div>
        </div>
        
        <div class="product-tabs">
            <div class="tab-header">
                <button class="tab-btn active" data-tab="description">Description</button>
                <button class="tab-btn" data-tab="reviews">Reviews (${product.reviewCount || 0})</button>
                <button class="tab-btn" data-tab="shipping">Shipping & Returns</button>
            </div>
            
            <div class="tab-content active" id="description">
                ${product.fullDescription || 'No detailed description available.'}
            </div>
            
            <div class="tab-content" id="reviews">
                <div class="review-form">
                    <h3>Write a Review</h3>
                    <form id="reviewForm">
                        <div class="rating-input">
                            <label>Rating:</label>
                            <div class="star-rating">
                                ${[1,2,3,4,5].map(i => `
                                    <i class="far fa-star" data-rating="${i}"></i>
                                `).join('')}
                            </div>
                            <input type="hidden" id="reviewRating" name="rating" required>
                        </div>
                        <div class="form-group">
                            <label for="reviewTitle">Title</label>
                            <input type="text" id="reviewTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="reviewText">Review</label>
                            <textarea id="reviewText" required></textarea>
                        </div>
                        <button type="submit" class="btn-primary">Submit Review</button>
                    </form>
                </div>
                
                <div class="reviews-list" id="reviewsList">
                    <!-- Reviews will be loaded here -->
                </div>
            </div>
            
            <div class="tab-content" id="shipping">
                <h3>Shipping Information</h3>
                <p>${product.shippingInfo || 'Standard shipping applies. Delivery times vary by location.'}</p>
                
                <h3>Return Policy</h3>
                <p>${product.returnPolicy || 'Contact the seller for return information.'}</p>
            </div>
        </div>
    `;
    
    // Load reviews
    loadProductReviews(productId);
    
    // Initialize tab functionality
    initTabs();
    
    // Initialize review form
    initReviewForm(productId);
}

// Load product reviews
function loadProductReviews(productId) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    db.collection('reviews')
        .where('productId', '==', productId)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                reviewsList.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
                return;
            }
            
            reviewsList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const review = doc.data();
                reviewsList.innerHTML += `
                    <div class="review">
                        <div class="review-header">
                            <div class="review-author">${review.authorName}</div>
                            <div class="review-rating">${renderRating(review.rating)}</div>
                            <div class="review-date">${new Date(review.createdAt.seconds * 1000).toLocaleDateString()}</div>
                        </div>
                        <h4 class="review-title">${review.title}</h4>
                        <p class="review-text">${review.text}</p>
                    </div>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = '<p>Error loading reviews. Please try again later.</p>';
        });
}

// Initialize review form
function initReviewForm(productId) {
    const reviewForm = document.getElementById('reviewForm');
    if (!reviewForm) return;
    
    // Star rating interaction
    const stars = document.querySelectorAll('.star-rating .fa-star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            document.getElementById('reviewRating').value = rating;
            
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });
    
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Please sign in to leave a review.');
            window.location.href = 'login.html';
            return;
        }
        
        const rating = parseInt(document.getElementById('reviewRating').value);
        const title = document.getElementById('reviewTitle').value;
        const text = document.getElementById('reviewText').value;
        
        // Get user info
        db.collection('users').doc(user.uid).get()
            .then((userDoc) => {
                if (!userDoc.exists) {
                    throw new Error('User data not found');
                }
                
                const userData = userDoc.data();
                
                // Create review
                return db.collection('reviews').add({
                    productId: productId,
                    userId: user.uid,
                    authorName: userData.name,
                    rating: rating,
                    title: title,
                    text: text,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert('Thank you for your review!');
                reviewForm.reset();
                loadProductReviews(productId);
                
                // Update product rating stats
                updateProductRating(productId);
            })
            .catch((error) => {
                console.error('Error submitting review:', error);
                alert('Error submitting review. Please try again.');
            });
    });
}

// Update product rating stats
function updateProductRating(productId) {
    // Get all reviews for this product
    db.collection('reviews')
        .where('productId', '==', productId)
        .get()
        .then((querySnapshot) => {
            let totalRating = 0;
            let reviewCount = querySnapshot.size;
            
            querySnapshot.forEach((doc) => {
                totalRating += doc.data().rating;
            });
            
            const averageRating = totalRating / reviewCount;
            
            // Update product document
            return db.collection('products').doc(productId).update({
                rating: averageRating,
                reviewCount: reviewCount
            });
        })
        .then(() => {
            console.log('Product rating updated');
        })
        .catch((error) => {
            console.error('Error updating product rating:', error);
        });
}

// Initialize tabs
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Update buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Initialize shop page
function initShopPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const vendorId = urlParams.get('vendor');
    
    const productGrid = document.getElementById('shopProductGrid');
    if (!productGrid) return;
    
    let query = db.collection('products').where('status', '==', 'active');
    
    if (categoryId) {
        query = query.where('categoryId', '==', categoryId);
        // Load category info
        db.collection('categories').doc(categoryId).get()
            .then((doc) => {
                if (doc.exists) {
                    document.getElementById('shopTitle').textContent = doc.data().name;
                }
            });
    } else if (vendorId) {
        query = query.where('vendorId', '==', vendorId);
        // Load vendor info
        db.collection('users').doc(vendorId).get()
            .then((doc) => {
                if (doc.exists) {
                    const vendor = doc.data();
                    document.getElementById('shopTitle').textContent = vendor.storeName;
                    document.getElementById('vendorInfo').innerHTML = `
                        <div class="vendor-header">
                            <img src="${vendor.storeImage || 'images/default-store.jpg'}" alt="${vendor.storeName}">
                            <div>
                                <h2>${vendor.storeName}</h2>
                                <div class="rating">${renderRating(vendor.rating || 0)} (${vendor.reviewCount || 0} reviews)</div>
                                <p>${vendor.storeDescription || ''}</p>
                            </div>
                        </div>
                    `;
                }
            });
    }
    
    // Apply filters
    const priceFilter = urlParams.get('price');
    if (priceFilter) {
        const [min, max] = priceFilter.split('-');
        if (min) query = query.where('price', '>=', parseFloat(min));
        if (max) query = query.where('price', '<=', parseFloat(max));
    }
    
    const ratingFilter = urlParams.get('rating');
    if (ratingFilter) {
        query = query.where('rating', '>=', parseInt(ratingFilter));
    }
    
    // Execute query
    query.get()
        .then((querySnapshot) => {
            productGrid.innerHTML = '';
            if (querySnapshot.empty) {
                productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                displayProductCard(productGrid, doc.id, product);
            });
        })
        .catch((error) => {
            console.error('Error loading products:', error);
            productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
        });
}

// Initialize cart functionality
function initCart() {
    updateCartCount();
    
    // Add to cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-to-cart')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = e.target.dataset.id;
            const quantity = e.target.closest('.product-actions') ? 
                parseInt(e.target.closest('.product-actions').querySelector('input').value) : 1;
            
            addToCart(productId, quantity);
        }
    });
}

// Add item to cart
function addToCart(productId, quantity = 1) {
    const user = auth.currentUser;
    
    // Get product info
    db.collection('products').doc(productId).get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('Product not found');
            }
            
            const product = doc.data();
            const cartItem = {
                productId: productId,
                name: product.name,
                price: product.price,
                image: product.images[0] || 'images/default-product.jpg',
                vendorId: product.vendorId,
                vendorName: product.vendorName,
                quantity: quantity,
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (user) {
                // User is logged in - save to Firestore
                return db.collection('users').doc(user.uid).collection('cart').doc(productId).set(cartItem);
            } else {
                // User is not logged in - save to localStorage
                let cart = JSON.parse(localStorage.getItem('cart')) || {};
                cart[productId] = cartItem;
                localStorage.setItem('cart', JSON.stringify(cart));
                return Promise.resolve();
            }
        })
        .then(() => {
            updateCartCount();
            alert('Product added to cart!');
        })
        .catch((error) => {
            console.error('Error adding to cart:', error);
            alert('Error adding product to cart. Please try again.');
        });
}

// Update cart count in header
function updateCartCount() {
    const cartCountElements = document.querySelectorAll('#cartCount');
    if (!cartCountElements.length) return;
    
    const user = auth.currentUser;
    
    if (user) {
        // Get cart from Firestore
        db.collection('users').doc(user.uid).collection('cart').get()
            .then((querySnapshot) => {
                const count = querySnapshot.size;
                cartCountElements.forEach(el => el.textContent = count);
            })
            .catch((error) => {
                console.error('Error loading cart:', error);
            });
    } else {
        // Get cart from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        const count = Object.keys(cart).length;
        cartCountElements.forEach(el => el.textContent = count);
    }
}

// Initialize cart page
function initCartPage() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (!cartItemsContainer) return;
    
    loadCartItems();
    
    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            
            if (!user) {
                alert('Please sign in to proceed to checkout.');
                window.location.href = 'login.html?redirect=checkout.html';
                return;
            }
            
            // Check if cart has items
            db.collection('users').doc(user.uid).collection('cart').get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        alert('Your cart is empty.');
                        return;
                    }
                    
                    window.location.href = 'checkout.html';
                });
        });
    }
}

// Load cart items
function loadCartItems() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    if (!cartItemsContainer) return;
    
    const user = auth.currentUser;
    
    if (user) {
        // Load from Firestore
        db.collection('users').doc(user.uid).collection('cart').get()
            .then((querySnapshot) => {
                displayCartItems(cartItemsContainer, cartSummary, querySnapshot);
            })
            .catch((error) => {
                console.error('Error loading cart:', error);
                cartItemsContainer.innerHTML = '<p>Error loading cart. Please try again later.</p>';
            });
    } else {
        // Load from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        const items = Object.values(cart);
        
        if (items.length === 0) {
            displayEmptyCart(cartItemsContainer, cartSummary);
            return;
        }
        
        // Convert to Firestore-like format for display
        const fakeQuerySnapshot = {
            forEach: (callback) => {
                items.forEach(item => {
                    callback({
                        id: item.productId,
                        data: () => item
                    });
                });
            },
            size: items.length,
            empty: items.length === 0
        };
        
        displayCartItems(cartItemsContainer, cartSummary, fakeQuerySnapshot);
    }
}

// Display cart items
function displayCartItems(container, summaryContainer, querySnapshot) {
    if (querySnapshot.empty) {
        displayEmptyCart(container, summaryContainer);
        return;
    }
    
    container.innerHTML = '';
    let subtotal = 0;
    let itemsByVendor = {};
    
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        subtotal += item.price * item.quantity;
        
        // Group by vendor
        if (!itemsByVendor[item.vendorId]) {
            itemsByVendor[item.vendorId] = {
                vendorName: item.vendorName,
                items: []
            };
        }
        itemsByVendor[item.vendorId].items.push(item);
    });
    
    // Display items grouped by vendor
    Object.keys(itemsByVendor).forEach(vendorId => {
        const vendorGroup = itemsByVendor[vendorId];
        
        container.innerHTML += `
            <div class="vendor-group">
                <div class="vendor-header">
                    <h3>${vendorGroup.vendorName}</h3>
                </div>
                <div class="vendor-items">
                    ${vendorGroup.items.map(item => `
                        <div class="cart-item" data-id="${item.productId}">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <div class="price">ETB ${item.price.toFixed(2)}</div>
                                <div class="quantity-controls">
                                    <button class="btn-quantity minus">-</button>
                                    <input type="number" value="${item.quantity}" min="1">
                                    <button class="btn-quantity plus">+</button>
                                </div>
                                <button class="btn-remove">Remove</button>
                            </div>
                            <div class="item-total">ETB ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    // Display summary
    const shipping = 50; // Flat rate for example
    const total = subtotal + shipping;
    
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>ETB ${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>ETB ${shipping.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>ETB ${total.toFixed(2)}</span>
            </div>
        `;
    }
    
    // Initialize quantity controls
    initCartItemControls();
}

// Display empty cart
function displayEmptyCart(container, summaryContainer) {
    container.innerHTML = `
        <div class="empty-cart">
            <img src="images/empty-cart.png" alt="Empty cart">
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet</p>
            <a href="index.html" class="btn-primary">Continue Shopping</a>
        </div>
    `;
    
    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span>Subtotal</span>
                <span>ETB 0.00</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>ETB 0.00</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>ETB 0.00</span>
            </div>
        `;
    }
}

// Initialize cart item controls
function initCartItemControls() {
    // Quantity controls
    document.querySelectorAll('.btn-quantity').forEach(button => {
        button.addEventListener('click', (e) => {
            const input = e.target.parentElement.querySelector('input');
            let quantity = parseInt(input.value);
            
            if (e.target.classList.contains('minus')) {
                if (quantity > 1) {
                    quantity--;
                }
            } else if (e.target.classList.contains('plus')) {
                quantity++;
            }
            
            input.value = quantity;
            updateCartItemQuantity(e.target.closest('.cart-item').dataset.id, quantity);
        });
    });
    
    // Input changes
    document.querySelectorAll('.cart-item input').forEach(input => {
        input.addEventListener('change', (e) => {
            const quantity = parseInt(e.target.value);
            if (isNaN(quantity) || quantity < 1) {
                e.target.value = 1;
                return;
            }
            
            updateCartItemQuantity(e.target.closest('.cart-item').dataset.id, quantity);
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.btn-remove').forEach(button => {
        button.addEventListener('click', (e) => {
            removeCartItem(e.target.closest('.cart-item').dataset.id);
        });
    });
}

// Update cart item quantity
function updateCartItemQuantity(productId, quantity) {
    const user = auth.currentUser;
    
    if (user) {
        // Update in Firestore
        db.collection('users').doc(user.uid).collection('cart').doc(productId).update({
            quantity: quantity
        })
        .then(() => {
            loadCartItems();
        })
        .catch((error) => {
            console.error('Error updating cart:', error);
        });
    } else {
        // Update in localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        if (cart[productId]) {
            cart[productId].quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCartItems();
        }
    }
}

// Remove cart item
function removeCartItem(productId) {
    const user = auth.currentUser;
    
    if (user) {
        // Remove from Firestore
        db.collection('users').doc(user.uid).collection('cart').doc(productId).delete()
            .then(() => {
                loadCartItems();
                updateCartCount();
            })
            .catch((error) => {
                console.error('Error removing from cart:', error);
            });
    } else {
        // Remove from localStorage
        const cart = JSON.parse(localStorage.getItem('cart')) || {};
        delete cart[productId];
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartItems();
        updateCartCount();
    }
}

// Initialize checkout page
function initCheckoutPage() {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;
    
    // Load user addresses
    loadUserAddresses();
    
    // Load payment methods
    loadPaymentMethods();
    
    // Load cart items
    loadCheckoutCart();
    
    // Form submission
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processCheckout();
    });
}

// Load user addresses
function loadUserAddresses() {
    const user = auth.currentUser;
    if (!user) return;
    
    const addressSelect = document.getElementById('shippingAddress');
    if (!addressSelect) return;
    
    db.collection('users').doc(user.uid).collection('addresses').get()
        .then((querySnapshot) => {
            addressSelect.innerHTML = '';
            
            if (querySnapshot.empty) {
                addressSelect.innerHTML = '<option value="">No addresses saved</option>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const address = doc.data();
                addressSelect.innerHTML += `
                    <option value="${doc.id}">
                        ${address.name}, ${address.address}, ${address.city}
                    </option>
                `;
            });
            
            // Add "New Address" option
            addressSelect.innerHTML += '<option value="new">+ Add New Address</option>';
        })
        .catch((error) => {
            console.error('Error loading addresses:', error);
        });
}

// Load payment methods
function loadPaymentMethods() {
    const user = auth.currentUser;
    if (!user) return;
    
    const paymentSelect = document.getElementById('paymentMethod');
    if (!paymentSelect) return;
    
    db.collection('users').doc(user.uid).collection('paymentMethods').get()
        .then((querySnapshot) => {
            paymentSelect.innerHTML = '';
            
            // Add standard payment options
            paymentSelect.innerHTML = `
                <option value="telebirr">Telebirr</option>
                <option value="cbebirr">CBE Birr</option>
            `;
            
            // Add saved cards if any
            querySnapshot.forEach((doc) => {
                const method = doc.data();
                if (method.type === 'card') {
                    paymentSelect.innerHTML += `
                        <option value="card_${doc.id}">
                            Card ending in ${method.last4}
                        </option>
                    `;
                }
            });
        })
        .catch((error) => {
            console.error('Error loading payment methods:', error);
        });
}

// Load cart items for checkout
function loadCheckoutCart() {
    const checkoutItemsContainer = document.getElementById('checkoutItems');
    if (!checkoutItemsContainer) return;
    
    const user = auth.currentUser;
    
    if (user) {
        // Load from Firestore
        db.collection('users').doc(user.uid).collection('cart').get()
            .then((querySnapshot) => {
                displayCheckoutItems(checkoutItemsContainer, querySnapshot);
            })
            .catch((error) => {
                console.error('Error loading cart:', error);
                checkoutItemsContainer.innerHTML = '<p>Error loading cart. Please try again later.</p>';
            });
    } else {
        // Shouldn't happen as checkout requires login
        window.location.href = 'login.html?redirect=checkout.html';
    }
}

// Display checkout items
function displayCheckoutItems(container, querySnapshot) {
    if (querySnapshot.empty) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }
    
    container.innerHTML = '';
    let subtotal = 0;
    let itemsByVendor = {};
    
    querySnapshot.forEach((doc) => {
        const item = doc.data();
        subtotal += item.price * item.quantity;
        
        // Group by vendor
        if (!itemsByVendor[item.vendorId]) {
            itemsByVendor[item.vendorId] = {
                vendorName: item.vendorName,
                items: []
            };
        }
        itemsByVendor[item.vendorId].items.push(item);
    });
    
    // Display items grouped by vendor
    Object.keys(itemsByVendor).forEach(vendorId => {
        const vendorGroup = itemsByVendor[vendorId];
        
        container.innerHTML += `
            <div class="checkout-vendor-group">
                <h3>${vendorGroup.vendorName}</h3>
                <div class="checkout-items">
                    ${vendorGroup.items.map(item => `
                        <div class="checkout-item">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <div class="price">ETB ${item.price.toFixed(2)} × ${item.quantity}</div>
                            </div>
                            <div class="item-total">ETB ${(item.price * item.quantity).toFixed(2)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    // Update summary
    const shipping = 50; // Flat rate for example
    const total = subtotal + shipping;
    
    document.getElementById('checkoutSubtotal').textContent = `ETB ${subtotal.toFixed(2)}`;
    document.getElementById('checkoutShipping').textContent = `ETB ${shipping.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `ETB ${total.toFixed(2)}`;
}

// Process checkout
function processCheckout() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html?redirect=checkout.html';
        return;
    }
    
    const shippingAddressId = document.getElementById('shippingAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('orderNotes').value;
    
    if (!shippingAddressId || shippingAddressId === 'new') {
        alert('Please select a shipping address');
        return;
    }
    
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }
    
    // Get cart items
    db.collection('users').doc(user.uid).collection('cart').get()
        .then((cartSnapshot) => {
            if (cartSnapshot.empty) {
                alert('Your cart is empty');
                return;
            }
            
            // Group items by vendor
            const vendorOrders = {};
            let totalAmount = 0;
            
            cartSnapshot.forEach((doc) => {
                const item = doc.data();
                totalAmount += item.price * item.quantity;
                
                if (!vendorOrders[item.vendorId]) {
                    vendorOrders[item.vendorId] = {
                        vendorId: item.vendorId,
                        vendorName: item.vendorName,
                        items: [],
                        subtotal: 0,
                        shipping: 0,
                        total: 0
                    };
                }
                
                vendorOrders[item.vendorId].items.push({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image
                });
                
                vendorOrders[item.vendorId].subtotal += item.price * item.quantity;
            });
            
            // Calculate shipping and totals per vendor
            Object.keys(vendorOrders).forEach(vendorId => {
                vendorOrders[vendorId].shipping = 50; // Flat rate per vendor
                vendorOrders[vendorId].total = vendorOrders[vendorId].subtotal + vendorOrders[vendorId].shipping;
            });
            
            // Get shipping address
            return Promise.all([
                db.collection('users').doc(user.uid).collection('addresses').doc(shippingAddressId).get(),
                vendorOrders
            ]);
        })
        .then(([addressDoc, vendorOrders]) => {
            if (!addressDoc.exists) {
                throw new Error('Shipping address not found');
            }
            
            const shippingAddress = addressDoc.data();
            const orderDate = firebase.firestore.FieldValue.serverTimestamp();
            const orderId = db.collection('orders').doc().id;
            
            // Create master order
            const masterOrder = {
                orderId: orderId,
                userId: user.uid,
                userName: shippingAddress.name,
                userPhone: user.phoneNumber || '',
                orderDate: orderDate,
                status: 'pending',
                paymentMethod: paymentMethod,
                paymentStatus: 'pending',
                shippingAddress: shippingAddress,
                notes: notes,
                totalAmount: Object.values(vendorOrders).reduce((sum, vendor) => sum + vendor.total, 0),
                vendorOrders: Object.keys(vendorOrders)
            };
            
            // Create vendor sub-orders
            const vendorPromises = Object.keys(vendorOrders).map(vendorId => {
                const vendorOrder = vendorOrders[vendorId];
                const vendorOrderId = db.collection('vendorOrders').doc().id;
                
                const orderData = {
                    orderId: vendorOrderId,
                    masterOrderId: orderId,
                    userId: user.uid,
                    vendorId: vendorId,
                    userName: shippingAddress.name,
                    userPhone: user.phoneNumber || '',
                    orderDate: orderDate,
                    status: 'pending',
                    items: vendorOrder.items,
                    subtotal: vendorOrder.subtotal,
                    shipping: vendorOrder.shipping,
                    total: vendorOrder.total,
                    shippingAddress: shippingAddress,
                    paymentStatus: 'pending',
                    commission: vendorOrder.total * 0.1 // 10% commission example
                };
                
                return db.collection('vendorOrders').doc(vendorOrderId).set(orderData);
            });
            
            return Promise.all([
                db.collection('orders').doc(orderId).set(masterOrder),
                ...vendorPromises
            ]);
        })
        .then(() => {
            // Clear cart
            return clearCart();
        })
        .then(() => {
            // Redirect to order confirmation
            window.location.href = 'order-confirmation.html';
        })
        .catch((error) => {
            console.error('Error during checkout:', error);
            alert('Error processing your order. Please try again.');
        });
}

// Clear cart after checkout
function clearCart() {
    const user = auth.currentUser;
    if (!user) return Promise.resolve();
    
    // Delete all cart items
    return db.collection('users').doc(user.uid).collection('cart').get()
        .then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            updateCartCount();
        });
}

// Initialize vendor dashboard
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
    
    // Get pending orders count
    db.collection('vendorOrders')
        .where('vendorId', '==', vendorId)
        .where('status', '==', 'pending')
        .get()
        .then((querySnapshot) => {
            document.getElementById('pendingOrders').textContent = querySnapshot.size;
        });
}

// Load vendor orders
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

// Load vendor products
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
                            <a href="vendor-product.html?id=${doc.id}" class="btn-edit">Edit</a>
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

// Initialize admin dashboard
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Common initializations
    initCart();
    
    // Page-specific initializations
    if (window.location.pathname.includes('index.html')) {
        loadCategories();
        loadFeaturedProducts();
        loadTopVendors();
    } else if (window.location.pathname.includes('product.html')) {
        initProductPage();
    } else if (window.location.pathname.includes('shop.html')) {
        initShopPage();
    } else if (window.location.pathname.includes('cart.html')) {
        initCartPage();
    } else if (window.location.pathname.includes('checkout.html')) {
        initCheckoutPage();
    } else if (window.location.pathname.includes('vendor-dashboard.html')) {
        initVendorDashboard();
    } else if (window.location.pathname.includes('admin-dashboard.html')) {
        initAdminDashboard();
    }
});
