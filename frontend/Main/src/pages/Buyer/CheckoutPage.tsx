import { useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import { useCart } from '../../context/CartContext';
import { createOrder, OrderRequest, OrderResponse } from '../../service/api';
import Toast from '../../components/common/Toast';

interface GuestDetails {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
}

const emptyGuestDetails: GuestDetails = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
};

const CheckoutPage: React.FC = () => {
    const { items, getTotal, clearCart } = useCart();
    const [formData, setFormData] = useState<GuestDetails>(emptyGuestDetails);
    const [placedOrder, setPlacedOrder] = useState<OrderResponse | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const subtotal = getTotal();

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (items.length === 0) return;

        setIsProcessing(true);
        setToast(null);

        const orderRequest: OrderRequest = {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            items: items.map((item) => ({
                productAsin: item.product.asin,
                quantity: item.quantity,
            })),
        };

        try {
            const order = await createOrder(orderRequest);
            setPlacedOrder(order);
            clearCart();
            setToast({ message: 'Your order was placed successfully.', type: 'success' });
        } catch (error: unknown) {
            const responseMessage =
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                typeof error.response === 'object' &&
                error.response !== null &&
                'data' in error.response &&
                typeof error.response.data === 'object' &&
                error.response.data !== null &&
                'message' in error.response.data
                    ? String(error.response.data.message)
                    : 'The order could not be placed. Please try again.';
            setToast({ message: responseMessage, type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const generateReceipt = () => {
        if (!placedOrder) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 22;

        doc.setFillColor(91, 54, 63);
        doc.rect(0, 0, pageWidth, 38, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Irys Store', 18, 24);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Order receipt', pageWidth - 18, 24, { align: 'right' });

        y = 54;
        doc.setTextColor(25, 25, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Order ${placedOrder.orderNumber}`, 18, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        y += 8;
        doc.text(`Status: ${placedOrder.statusDescription || placedOrder.status}`, 18, y);
        y += 6;
        doc.text(`Placed: ${new Date(placedOrder.orderDate || placedOrder.createdAt).toLocaleString()}`, 18, y);

        y += 16;
        doc.setFont('helvetica', 'bold');
        doc.text('Deliver to', 18, y);
        doc.setFont('helvetica', 'normal');
        y += 7;
        doc.text(`${placedOrder.customerFirstName || formData.firstName} ${placedOrder.customerLastName || formData.lastName}`, 18, y);
        y += 6;
        doc.text(placedOrder.customerPhone || formData.phone, 18, y);
        y += 6;
        doc.text(placedOrder.shippingAddress || formData.address, 18, y);
        y += 6;
        doc.text(placedOrder.shippingCity || formData.city, 18, y);

        y += 15;
        doc.setFillColor(245, 241, 242);
        doc.rect(18, y - 5, pageWidth - 36, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('Item', 22, y);
        doc.text('Qty', 130, y);
        doc.text('Amount', pageWidth - 22, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');

        y += 10;
        placedOrder.items.forEach((item) => {
            const name = item.productName.length > 48 ? `${item.productName.slice(0, 45)}...` : item.productName;
            doc.text(name, 22, y);
            doc.text(String(item.quantity), 133, y);
            doc.text(`$${Number(item.subtotal).toFixed(2)}`, pageWidth - 22, y, { align: 'right' });
            y += 8;
        });

        y += 4;
        doc.line(120, y, pageWidth - 18, y);
        y += 9;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Total', 125, y);
        doc.text(`$${Number(placedOrder.totalAmount).toFixed(2)}`, pageWidth - 22, y, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text('Your order was received and will be processed by the Irys Store team.', pageWidth / 2, 278, { align: 'center' });
        doc.save(`Irys-Store-${placedOrder.orderNumber}.pdf`);
    };

    if (placedOrder) {
        return (
            <div className="mx-auto max-w-2xl py-10 text-center">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/25">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 13 4 4L19 7" />
                    </svg>
                </div>
                <h1 className="mt-7 text-3xl font-bold text-gray-900 dark:text-white">Order placed</h1>
                <p className="mx-auto mt-3 max-w-lg leading-7 text-gray-600 dark:text-gray-400">
                    We received your order. An administrator will review and process it shortly. Keep this order number for your records.
                </p>

                <div className="mx-auto mt-7 inline-flex rounded-xl bg-brand-50 px-6 py-4 font-mono text-2xl font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                    {placedOrder.orderNumber}
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-left dark:border-gray-800 dark:bg-gray-900">
                    <div className="space-y-3">
                        {placedOrder.items.map((item) => (
                            <div key={item.id} className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    {item.productName} × {item.quantity}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">${Number(item.subtotal).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 flex justify-between border-t border-gray-200 pt-5 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                        <span>Total</span>
                        <span>${Number(placedOrder.totalAmount).toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={generateReceipt}
                        className="rounded-xl border-2 border-brand-300 px-5 py-3.5 font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-900/20"
                    >
                        Download receipt
                    </button>
                    <Link
                        to="/shop"
                        className="rounded-xl bg-brand-500 px-5 py-3.5 font-bold text-white transition-colors hover:bg-brand-600"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="py-16 text-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Your cart is empty</h1>
                <p className="mt-3 text-gray-500 dark:text-gray-400">Add products before starting checkout.</p>
                <Link to="/shop" className="mt-6 inline-flex rounded-xl bg-brand-500 px-6 py-3 font-bold text-white hover:bg-brand-600">
                    Browse products
                </Link>
            </div>
        );
    }

    const fields: Array<{
        name: keyof GuestDetails;
        label: string;
        type: string;
        autoComplete: string;
        maxLength: number;
        fullWidth?: boolean;
    }> = [
        { name: 'firstName', label: 'First name', type: 'text', autoComplete: 'given-name', maxLength: 100 },
        { name: 'lastName', label: 'Last name', type: 'text', autoComplete: 'family-name', maxLength: 100 },
        { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', maxLength: 30, fullWidth: true },
        { name: 'address', label: 'Delivery address', type: 'text', autoComplete: 'street-address', maxLength: 500, fullWidth: true },
        { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2', maxLength: 100, fullWidth: true },
    ];

    return (
        <div className="mx-auto max-w-5xl">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-500">Guest checkout</p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Where should we deliver your order?</h1>
                <p className="mt-3 text-gray-600 dark:text-gray-400">No account is required. We only ask for the details needed to process and deliver this order.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customer and delivery details</h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        {fields.map((field) => (
                            <label key={field.name} className={field.fullWidth ? 'sm:col-span-2' : ''}>
                                <span className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">{field.label}</span>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleInputChange}
                                    autoComplete={field.autoComplete}
                                    maxLength={field.maxLength}
                                    required
                                    className="w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 text-gray-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-200/40 dark:border-gray-700 dark:text-white dark:focus:border-brand-500"
                                />
                            </label>
                        ))}
                    </div>
                </section>

                <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order summary</h2>
                    <div className="mt-5 space-y-4">
                        {items.map((item) => (
                            <div key={item.product.asin} className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-600 dark:text-gray-300">
                                    {item.product.productName} × {item.quantity}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    ${(item.product.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 space-y-2 border-t border-gray-200 pt-5 dark:border-gray-700">
                        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                            <span>Total</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isProcessing}
                        className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand-500 px-5 py-4 font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
                    >
                        {isProcessing ? 'Placing order...' : 'Place order'}
                    </button>
                    <Link to="/shop/cart" className="mt-4 block text-center text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
                        Back to cart
                    </Link>
                </aside>
            </form>
        </div>
    );
};

export default CheckoutPage;
