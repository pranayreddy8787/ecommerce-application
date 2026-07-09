export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id?: string;
  userId: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
}
