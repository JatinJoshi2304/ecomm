import Cart from "@/models/cart.model";
import CartItem from "@/models/cartItem.model";
import Product from "@/models/product.model";

// Helper function to get or create cart
export async function getOrCreateCart(userId?: string, sessionId?: string) {
  let cart;

  if (userId) {
    // User cart
    cart = await Cart.findOne({ userId });
    if (!cart) {
      try {
        cart = await Cart.create({ userId, sessionId: null });
      } catch (error: any) {
        // Handle duplicate key error
       
          throw error;
        
      }
    }
  } else if (sessionId) {
    // Guest cart
    cart = await Cart.findOne({ sessionId });
    if (!cart) {
      try {

        cart = await Cart.create({ sessionId, userId: null });
        console.log("Cart created ::",cart);
      } catch (error: any) {
        // Handle duplicate key error
        console.log("Failed to create Cart",error);
          throw error;
      }
    }
  } else {
    throw new Error("Either userId or sessionId must be provided");
  }

  if (!cart) {
    throw new Error("Failed to get or create cart");
  }

  return cart;
}

// Helper function to update cart totals
export async function updateCartTotals(cartId: string) {
  const cart = await Cart.findById(cartId);
  if (!cart) return;

  const cartItems = await CartItem.find({ cartId }).populate("productId");
  
  let totalItems = 0;
  let totalPrice = 0;

  for (const item of cartItems) {
    totalItems += item.quantity;
    totalPrice += item.price * item.quantity;
  }

  cart.totalItems = totalItems;
  cart.totalPrice = totalPrice;
  await cart.save();

  return cart;
}

// Helper function to format cart response
export async function formatCartResponse(cart: any) {
  const cartItems = await CartItem.find({ cartId: cart._id })
    .populate("productId", "name price images stock")
    .populate("size", "name type")
    .populate("color", "name hexCode");

  // Clean up cart items with deleted products
  const itemsWithDeletedProducts = cartItems.filter(item => !item.productId);
  if (itemsWithDeletedProducts.length > 0) {
    console.log(`Removing ${itemsWithDeletedProducts.length} cart items with deleted products`);
    await CartItem.deleteMany({
      _id: { $in: itemsWithDeletedProducts.map(item => item._id) }
    });
  }

  const formattedItems = cartItems
    .filter(item => item.productId) // Filter out items with deleted products
    .map(item => ({
      id: item._id,
      product: {
        id: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        images: item.productId.images,
        stock: item.productId.stock,
      },
      quantity: item.quantity,
      price: item.price, // price when added to cart
      size: item.size,
      color: item.color,
      subtotal: item.price * item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

  return {
    id: cart._id,
    userId: cart.userId,
    sessionId: cart.sessionId,
    items: formattedItems,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

// Helper function to merge guest cart with user cart
export async function mergeGuestCartWithUserCart(guestSessionId: string, userId: string) {
  const guestCart = await Cart.findOne({ sessionId: guestSessionId });
  const userCart = await Cart.findOne({ userId });

  if (!guestCart) return userCart;

  if (!userCart) {
    // Convert guest cart to user cart
    guestCart.userId = userId;
    guestCart.sessionId = null;
    await guestCart.save();
    return guestCart;
  }

  // Merge guest cart items into user cart
  const guestItems = await CartItem.find({ cartId: guestCart._id });
  
  for (const guestItem of guestItems) {
    const existingItem = await CartItem.findOne({
      cartId: userCart._id,
      productId: guestItem.productId,
      size: guestItem.size,
      color: guestItem.color,
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += guestItem.quantity;
      await existingItem.save();
    } else {
      // Create new item
      guestItem.cartId = userCart._id;
      await guestItem.save();
    }
  }

  // Update user cart totals
  await updateCartTotals(userCart._id);

  // Delete guest cart
  await CartItem.deleteMany({ cartId: guestCart._id });
  await Cart.findByIdAndDelete(guestCart._id);

  return await Cart.findById(userCart._id);
}
