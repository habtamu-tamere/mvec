// Vendor Add Product
let uploadedImages = [];

function initAddProductPage() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Load categories
    loadCategories();

    // Initialize image upload
    initImageUpload();

    // Save draft button
    document.getElementById('saveDraft').addEventListener('click', () => {
        saveProduct('draft');
    });

    // Form submission
    document.getElementById('addProductForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveProduct('active');
    });
}

function loadCategories() {
    db.collection('categories').get()
        .then((querySnapshot) => {
            const categorySelect = document.getElementById('productCategory');
            querySnapshot.forEach((doc) => {
                const category = doc.data();
                categorySelect.innerHTML += `<option value="${doc.id}">${category.name}</option>`;
            });
        });
}

function initImageUpload() {
    const uploadBox = document.getElementById('imageUploadBox');
    const fileInput = document.getElementById('productImages');
    const previewContainer = document.getElementById('imagePreview');

    // Click handler
    uploadBox.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    // File input change
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });

    // Handle selected files
    function handleFiles(files) {
        if (uploadedImages.length + files.length > 5) {
            alert('You can upload a maximum of 5 images');
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.match('image.*')) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const image = {
                    file: file,
                    preview: e.target.result,
                    name: file.name
                };
                uploadedImages.push(image);
                updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    // Update preview container
    function updatePreview() {
        previewContainer.innerHTML = '';
        
        uploadedImages.forEach((image, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${image.preview}" alt="Preview">
                <button class="remove-image" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewContainer.appendChild(previewItem);
        });

        // Add remove button handlers
        document.querySelectorAll('.remove-image').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.closest('button').dataset.index);
                uploadedImages.splice(index, 1);
                updatePreview();
            });
        });
    }
}

async function saveProduct(status) {
    const user = auth.currentUser;
    if (!user) return;

    // Get form values
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const fullDescription = document.getElementById('fullDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const comparePrice = parseFloat(document.getElementById('comparePrice').value) || 0;
    const stock = parseInt(document.getElementById('productStock').value);
    const sku = document.getElementById('productSKU').value;
    const categoryId = document.getElementById('productCategory').value;
    const tags = document.getElementById('productTags').value.split(',').map(tag => tag.trim());
    const weight = parseFloat(document.getElementById('productWeight').value) || 0;
    const shippingInfo = document.getElementById('shippingInfo').value;
    const returnPolicy = document.getElementById('returnPolicy').value;

    // Validate required fields
    if (!name || !description || !price || isNaN(stock) || !categoryId) {
        alert('Please fill in all required fields');
        return;
    }

    if (uploadedImages.length === 0) {
        alert('Please upload at least one product image');
        return;
    }

    // Get category name
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
        alert('Invalid category selected');
        return;
    }
    const categoryName = categoryDoc.data().name;

    // Get vendor info
    const vendorDoc = await db.collection('users').doc(user.uid).get();
    const vendorName = vendorDoc.data().storeName || vendorDoc.data().name;

    // Upload images to Firebase Storage
    const imageUrls = await uploadImages();

    // Create product data
    const productData = {
        name: name,
        description: description,
        fullDescription: fullDescription || description,
        price: price,
        comparePrice: comparePrice > price ? comparePrice : 0,
        stock: stock,
        sku: sku,
        status: status,
        images: imageUrls,
        categoryId: categoryId,
        category: categoryName,
        tags: tags,
        vendorId: user.uid,
        vendorName: vendorName,
        weight: weight,
        shippingInfo: shippingInfo,
        returnPolicy: returnPolicy,
        rating: 0,
        reviewCount: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    db.collection('products').add(productData)
        .then(() => {
            alert('Product saved successfully!');
            window.location.href = 'vendor-products.html';
        })
        .catch((error) => {
            console.error('Error saving product:', error);
            alert('Error saving product. Please try again.');
        });
}

async function uploadImages() {
    const storageRef = firebase.storage().ref();
    const uploadPromises = [];
    
    for (let i = 0; i < uploadedImages.length; i++) {
        const image = uploadedImages[i];
        const fileRef = storageRef.child(`products/${Date.now()}_${image.name}`);
        const uploadTask = fileRef.put(image.file);
        
        uploadPromises.push(
            new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve(downloadURL);
                    }
                );
            })
        );
    }
    
    return Promise.all(uploadPromises);
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('vendor-add-product.html')) {
        initAddProductPage();
    }
});
