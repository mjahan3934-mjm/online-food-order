(function() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const DELIVERY_FEE = 50;

    document.addEventListener('DOMContentLoaded', function() {
        initMenuToggle();
        initCartCount();
        initCategoryFilters();
        initAddToCart();
        initCartPage();
        initCheckout();
        initOrderTracking();
    });

    function initMenuToggle() {
        const toggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (toggle && navLinks) {
            toggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    }

    function initCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            countEl.textContent = count;
        }
    }

    function initCategoryFilters() {
        const filters = document.querySelectorAll('.category-filter');
        const items = document.querySelectorAll('.menu-item');
        
        filters.forEach(filter => {
            filter.addEventListener('click', () => {
                filters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                
                const category = filter.dataset.category;
                items.forEach(item => {
                    if (category === 'all' || item.dataset.category === category) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    function initAddToCart() {
        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const name = btn.dataset.name;
                const price = parseFloat(btn.dataset.price);
                
                const existing = cart.find(item => item.id === id);
                if (existing) {
                    existing.quantity++;
                } else {
                    cart.push({ id, name, price, quantity: 1 });
                }
                
                saveCart();
                updateCartCount();
                showNotification(`${name} added to cart!`);
            });
        });
    }

    function initCartPage() {
        const cartItemsEl = document.getElementById('cart-items');
        if (!cartItemsEl) return;
        
        renderCartItems();
    }

    function renderCartItems() {
        const cartItemsEl = document.getElementById('cart-items');
        if (!cartItemsEl) return;
        
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            updateSummary(0);
            return;
        }
        
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">${item.name[0]}</div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="price">৳${item.price.toFixed(0)}</p>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                        <button class="remove-item" data-id="${item.id}">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <span>৳${(item.price * item.quantity).toFixed(0)}</span>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                const item = cart.find(i => i.id === id);
                
                if (action === 'increase') {
                    item.quantity++;
                } else if (action === 'decrease') {
                    item.quantity--;
                    if (item.quantity <= 0) {
                        cart = cart.filter(i => i.id !== id);
                    }
                }
                
                saveCart();
                renderCartItems();
                updateCartCount();
            });
        });
        
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                cart = cart.filter(i => i.id !== id);
                saveCart();
                renderCartItems();
                updateCartCount();
            });
        });
        
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        updateSummary(subtotal);
    }

    function updateSummary(subtotal) {
        const subtotalEl = document.getElementById('subtotal');
        const totalEl = document.getElementById('total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (subtotalEl) subtotalEl.textContent = `৳${subtotal.toFixed(0)}`;
        
        const total = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0);
        if (totalEl) totalEl.textContent = `৳${total.toFixed(0)}`;
        
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
    }

    function initCheckout() {
        const checkoutBtn = document.getElementById('checkout-btn');
        const modal = document.getElementById('checkout-modal');
        const modalClose = document.querySelector('.modal-close');
        const form = document.getElementById('checkout-form');
        
        if (!checkoutBtn || !modal) return;
        
        checkoutBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const orderData = {
                customer_name: formData.get('customer_name'),
                customer_email: formData.get('customer_email'),
                customer_phone: formData.get('customer_phone'),
                customer_address: formData.get('customer_address'),
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            };
            
            try {
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    cart = [];
                    saveCart();
                    updateCartCount();
                    modal.classList.remove('active');
                    form.reset();
                    showNotification(`Order #${result.order_id} placed successfully!`);
                    window.location.href = '/orders';
                } else {
                    alert('Error placing order: ' + result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to place order. Please try again.');
            }
        });
    }

    function initOrderTracking() {
        const searchBtn = document.getElementById('search-order-btn');
        const searchInput = document.getElementById('order-search');
        const modal = document.getElementById('order-modal');
        const modalClose = modal ? modal.querySelector('.modal-close') : null;
        
        if (!searchBtn || !searchInput) return;
        
        searchBtn.addEventListener('click', () => searchOrder());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchOrder();
        });
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        async function searchOrder() {
            const orderId = parseInt(searchInput.value);
            if (!orderId) return;
            
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                const order = await response.json();
                
                if (response.ok) {
                    showOrderDetails(order);
                } else {
                    document.getElementById('order-not-found').classList.remove('hidden');
                    document.getElementById('order-details').classList.add('hidden');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }

    function showOrderDetails(order) {
        const modal = document.getElementById('order-modal');
        const details = document.getElementById('order-details');
        const notFound = document.getElementById('order-not-found');
        
        document.getElementById('detail-order-id').textContent = order.id;
        document.getElementById('detail-status').textContent = order.status;
        document.getElementById('detail-date').textContent = order.created_at;
        document.getElementById('detail-name').textContent = order.customer_name;
        document.getElementById('detail-email').textContent = order.customer_email;
        document.getElementById('detail-phone').textContent = order.customer_phone;
        document.getElementById('detail-address').textContent = order.customer_address;
        document.getElementById('detail-total').textContent = `৳${order.total_amount.toFixed(0)}`;
        
        const itemsList = document.getElementById('detail-items');
        itemsList.innerHTML = order.items.map(item => `
            <li>${item.menu_item_name} x${item.quantity} - ৳${(item.price * item.quantity).toFixed(0)}</li>
        `).join('');
        
        details.classList.remove('hidden');
        notFound.classList.add('hidden');
        modal.classList.add('active');
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            countEl.textContent = count;
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
})();