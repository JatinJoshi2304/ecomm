'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAppSelector } from '@/store/hooks';
import Image from 'next/image';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface Address {
  _id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
  size?: {
    _id: string;
    name: string;
  };
  color?: {
    _id: string;
    name: string;
  };
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

const addressValidationSchema = Yup.object({
  name: Yup.string()
    .required('Full name is required')
    .max(20, 'Name must be at most 20 characters'),
  phone: Yup.string()
    .required('Phone is required')
    .matches(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  street: Yup.string().required('Street address is required'),
  city: Yup.string()
    .required('City is required')
    .max(20, 'City must be at most 20 characters'),
  state: Yup.string()
    .required('State is required')
    .max(20, 'State must be at most 20 characters'),
  zipCode: Yup.string()
    .required('ZIP Code is required')
    .matches(/^[0-9]{6}$/, 'ZIP Code must be 6 digits'),
  country: Yup.string().required('Country is required'),
  isDefault: Yup.boolean(),
});


export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadCart();
    loadAddresses();
  }, [isAuthenticated, router]);

  const loadCart = async () => {
    try {
      const response = await fetch('/api/customer/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCart(result.data);
          if (result.data.items.length === 0) {
            router.push('/cart');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  };

  const loadAddresses = async () => {
    try {
      const response = await fetch('/api/customer/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAddresses(result.data);
          const defaultAddress = result.data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowNewAddressForm(false);
  };

  const handleNewAddressSubmit = async (values: Omit<Address, '_id'>) => {
    try {
      const response = await fetch('/api/customer/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const createdAddress = result.data;
          setAddresses([...addresses, createdAddress]);
          setSelectedAddress(createdAddress);
          setShowNewAddressForm(false);
        }
      }
    } catch (error) {
      console.error('Failed to create address:', error);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress) {
      setError('Please select a delivery address');
      return;
    }

    setCheckoutLoading(true);
    setError('');

    try {
      const response = await fetch('/api/customer/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shippingAddress: selectedAddress
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/customer/orders`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Checkout failed');
      }
    } catch (error) {
      console.log(error);
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some items to your cart before checkout.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and complete your purchase</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
              
              {addresses.length > 0 && (
                <div className="space-y-3 mb-4">
                  {addresses.map((address) => (
                    <div
                      key={address._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAddress?._id === address._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{address.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {address.street}, {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-gray-600 text-sm">{address.country}</p>
                          <p className="text-gray-600 text-sm">Phone: {address.phone}</p>
                        </div>
                        {address.isDefault && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 transition-colors"
              >
                {showNewAddressForm ? 'Cancel' : '+ Add New Address'}
              </button>

              {showNewAddressForm && (
                <Formik
                  initialValues={{
                    name: '',
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India',
                    phone: '',
                    isDefault: false,
                  }}
                  validationSchema={addressValidationSchema}
                  onSubmit={handleNewAddressSubmit}
                >
                  {({ isSubmitting }) => (
                    <Form className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <Field
                            type="text"
                            name="name"
                            className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="name" component="p" className="text-red-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone *
                          </label>
                          <Field
                            type="number"
                            name="phone"
                            className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="phone" component="p" className="text-red-500 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street Address *
                        </label>
                        <Field
                          type="text"
                          name="street"
                          className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <ErrorMessage name="street" component="p" className="text-red-500 text-sm" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <Field
                            type="text"
                            name="city"
                            className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="city" component="p" className="text-red-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State *
                          </label>
                          <Field
                            type="text"
                            name="state"
                            className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="state" component="p" className="text-red-500 text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code *
                          </label>
                          <Field
                            type="number"
                            name="zipCode"
                            className="w-full border text-black border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <ErrorMessage name="zipCode" component="p" className="text-red-500 text-sm" />
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Field
                          type="checkbox"
                          id="isDefault"
                          name="isDefault"
                          className="mr-2"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {isSubmitting ? 'Adding...' : 'Add Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="cod"
                    name="payment"
                    value="COD"
                    checked
                    readOnly
                    className="mr-3"
                  />
                  <label htmlFor="cod" className="flex items-center">
                    <span className="text-lg">💰</span>
                    <span className="ml-2 text-gray-900">Cash on Delivery (COD)</span>
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-8">
                  Pay when your order is delivered
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <Image
                      src={item.product.images[0] || '/placeholder-image.jpg'}
                      alt={item.product.name}
                      width={40}
                      height={40}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                        {item.size && ` • Size: ${item.size.name}`}
                        {item.color && ` • Color: ${item.color.name}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">₹{cart.totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">₹0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">₹{cart.totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={!selectedAddress || checkoutLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-6"
              >
                {checkoutLoading ? 'Processing...' : 'Place Order'}
              </button>

              {!selectedAddress && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Please select a delivery address
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
