'use client';

import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerUser, clearError } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Yup validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .max(20, 'Name must be at most 20 characters')
      .required('Full name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const handleSubmit = async (values: any) => {
    dispatch(clearError());

    try {
      const result = await dispatch(registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      }));

      if (registerUser.fulfilled.match(result)) {
        const user = result.payload.data;
        if (user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role === 'seller') {
          router.push('/seller/dashboard');
        } else {
          router.push('/login');
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your existing account
            </a>
          </p>
        </div>

        <Formik
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'customer',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    maxLength={20}
                    className="mt-1 block w-full px-3 py-2 text-black border border-gray-300 rounded-md 
                               focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md 
                               focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md 
                               focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="mt-1 block w-full px-3 py-2 border text-black border-gray-300 rounded-md 
                               focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <ErrorMessage name="confirmPassword" component="p" className="mt-1 text-sm text-red-600" />
                </div>
              </div>


              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent 
                             text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 
                             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
