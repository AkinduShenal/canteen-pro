import React, { useState } from "react";
import CartDrawer from "./components/Cart/CartDrawer";
import ProductModal from "./components/Cart/ProductModal";
import CheckoutPage from "./components/Checkout/CheckoutPage";
import CheckoutConfirmation from "./components/Checkout/CheckoutConfirmation";
import PaymentMethodModal from "./components/Checkout/PaymentMethodModal";
import OrderTracking from "./components/Tracking/OrderTracking";
import { useCart } from "./store/CartContext";
import "./App.css"; // Basic styles for the app

const DUMMY_PRODUCTS = [
	{ id: '1', name: 'Chicken Burger', price: 5.99, image: '/assets/chicken_burger.png' },
	{ id: '2', name: 'Veggie Wrap', price: 4.50, image: '/assets/veggie_wrap.png' },
	{ id: '3', name: 'French Fries', price: 2.99, image: '/assets/french_fries.png' },
	{ id: '4', name: 'Cola', price: 1.50, image: '/assets/cola_drink.png' },
];

function App() {
	const { cartCount, toggleCart, clearCart, isCartOpen } = useCart();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [isCheckoutPageOpen, setIsCheckoutPageOpen] = useState(false);
	const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
	const [orderDetails, setOrderDetails] = useState(null);
	const [isTrackingOrder, setIsTrackingOrder] = useState(false);
	const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
	// Temporary state to hold the pickup slot between CheckoutPage and PaymentModal
	const [pendingPickupSlot, setPendingPickupSlot] = useState(null);

	const handleOpenModal = (product) => {
		setSelectedProduct(product);
		setIsModalOpen(true);
	};

	React.useEffect(() => {
		document.body.style.backgroundImage = "url('/assets/app_background.png')";
		document.body.style.backgroundSize = "cover";
		document.body.style.backgroundPosition = "center";
		document.body.style.backgroundAttachment = "fixed";
	}, []);

	const handleCheckout = () => {
		if (isCartOpen) {
			toggleCart();
		}
		setIsCheckoutPageOpen(true);
	};

	const handleProceedToPayment = (pickupSlot) => {
		setPendingPickupSlot(pickupSlot);
		setIsPaymentModalOpen(true);
	};

	const handlePaymentConfirm = (method) => {
		setSelectedPaymentMethod(method);
		setIsPaymentModalOpen(false);
		clearCart();

		// Generate random token like C2-45192
		const randomNum = Math.floor(10000 + Math.random() * 90000);
		const token = `C2-${randomNum}`;

		setOrderDetails({
			token,
			pickupSlot: pendingPickupSlot
		});

		setIsOrderConfirmed(true);
	};

	const resetToMenu = () => {
		setIsOrderConfirmed(false);
		setIsCheckoutPageOpen(false);
		setIsTrackingOrder(false);
		setSelectedPaymentMethod(null);
		setOrderDetails(null);
	};

	return (
		<div className="app-container">
			<header className="app-header">
				<h1>Canteen Pro</h1>
				<button className="cart-toggle-btn" onClick={toggleCart}>
					🛒 Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
				</button>
			</header>

			{isTrackingOrder && orderDetails ? (
				<OrderTracking
					orderDetails={orderDetails}
					onReturnToMenu={resetToMenu}
				/>
			) : isOrderConfirmed && orderDetails ? (
				<CheckoutConfirmation
					orderDetails={orderDetails}
					onReturnToMenu={resetToMenu}
					onTrackOrder={() => {
						setIsOrderConfirmed(false);
						setIsTrackingOrder(true);
					}}
				/>
			) : isCheckoutPageOpen ? (
				<CheckoutPage
					onBack={() => setIsCheckoutPageOpen(false)}
					onProceedToPayment={handleProceedToPayment}
				/>
			) : (
				<main className="app-main">
					<h2>Menu</h2>
					<div className="product-grid">
						{DUMMY_PRODUCTS.map((product) => (
							<div key={product.id} className="product-card">
								<div className="product-image-container">
									<img src={product.image} alt={product.name} className="product-image" />
								</div>
								<div className="product-info">
									<h3>{product.name}</h3>
									<p className="price">${product.price.toFixed(2)}</p>
									<button
										className="add-to-cart-btn"
										onClick={() => handleOpenModal(product)}
									>
										Select Options
									</button>
								</div>
							</div>
						))}
					</div>
				</main>
			)}

			<CartDrawer onCheckout={handleCheckout} />

			<ProductModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				product={selectedProduct}
			/>

			<PaymentMethodModal
				isOpen={isPaymentModalOpen}
				onClose={() => setIsPaymentModalOpen(false)}
				onConfirm={handlePaymentConfirm}
			/>
		</div>
	);
}

export default App;
