import React, { useState, useEffect } from 'react';
import './OrderTracking.css';

const OrderTracking = ({ orderDetails, onReturnToMenu }) => {
    // 0: Pending, 1: Accepted, 2: Preparing, 3: Ready
    const [currentStep, setCurrentStep] = useState(0);
    const [isCancelled, setIsCancelled] = useState(false);

    const steps = [
        { label: "Pending", icon: "⌛" },
        { label: "Accepted", icon: "✅" },
        { label: "Preparing", icon: "🍳" },
        { label: "Ready", icon: "🎉" }
    ];

    // Simulate progress for the demo
    useEffect(() => {
        if (currentStep < 3 && !isCancelled) {
            const timer = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 5000); // Advance every 5 seconds

            return () => clearTimeout(timer);
        }
    }, [currentStep, isCancelled]);

    const handleCancelOrder = () => {
        if (currentStep === 0) {
            setIsCancelled(true);
        }
    };

    const calculateProgressWidth = () => {
        // -1 to account for 0 index, /3 because there are 3 segments connecting 4 steps
        return `${(currentStep / (steps.length - 1)) * 100}%`;
    };

    return (
        <div className="order-tracking-container">
            <div className="tracking-card">
                <div className="tracking-header">
                    <h2>Track Your Order</h2>
                    <div className="tracking-token-box">
                        <span className="tracking-token-label">Token</span>
                        <span className="tracking-token-value">{orderDetails?.token || 'C2-00000'}</span>
                    </div>
                </div>

                <div className="tracking-progress-wrapper">
                    <div className="progress-bar-background">
                        <div
                            className="progress-bar-fill"
                            style={{ width: calculateProgressWidth() }}
                        />
                    </div>

                    <div className="progress-steps">
                        {steps.map((step, index) => {
                            const isCompleted = index <= currentStep;
                            const isActive = index === currentStep;

                            return (
                                <div
                                    key={index}
                                    className={`progress-step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                                >
                                    <div className="step-icon-circle">
                                        <span className="step-icon">{step.icon}</span>
                                    </div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isCancelled ? (
                    <div className="tracking-status-message error-state">
                        <div className="cancelled-message">
                            <h3>Order Cancelled</h3>
                            <p>Your order has been successfully cancelled.</p>
                        </div>
                    </div>
                ) : (
                    <div className="tracking-status-message">
                        {currentStep === 0 && <p>Your order has been sent to the kitchen. You can cancel now.</p>}
                        {currentStep === 1 && <p>The kitchen has accepted your order!</p>}
                        {currentStep === 2 && <p>Our chefs are cooking up something delicious.</p>}
                        {currentStep === 3 && (
                            <div className="ready-message">
                                <h3>Your food is ready!</h3>
                                <p>Please head to the counter and present your token.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="tracking-actions">
                    {currentStep === 0 && !isCancelled && (
                        <button className="cancel-order-btn" onClick={handleCancelOrder}>
                            Cancel Order
                        </button>
                    )}
                    <button className="return-menu-btn" onClick={onReturnToMenu}>
                        Return to Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
