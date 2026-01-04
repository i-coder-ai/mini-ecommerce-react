import React, { useMemo, useState } from "react";
import { PRODUCTS } from "./data";
import "./App.css";


function App() {
  // filter/search/sort state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("none");

  // cart: { [id]: { product, qty } }
  const [cart, setCart] = useState({});

  // categories for filter dropdown
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category)))],
    []
  );

  // derived products with search + filter + sort
  const filteredProducts = useMemo(() => {
    let list = PRODUCTS;

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s));
    }

    if (category !== "All") {
      list = list.filter(p => p.category === category);
    }

    if (sort === "asc") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "desc") {
      list = [...list].sort((a, b) => b.price - a.price);
    }

    return list;
  }, [search, category, sort]);

  // cart helpers
  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );
  const totalPrice = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.qty * item.product.price, 0),
    [cart]
  );

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev[product.id];
      const currentQty = existing ? existing.qty : 0;
      const nextQty = Math.min(product.stock, currentQty + 1);
      if (nextQty === 0) return prev;
      return {
        ...prev,
        [product.id]: { product, qty: nextQty }
      };
    });
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleUpdateQty = (id, qty) => {
    setCart(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const clamped = Math.max(1, Math.min(existing.product.stock, qty));
      return {
        ...prev,
        [id]: { ...existing, qty: clamped }
      };
    });
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Mini E-Commerce</h1>
        <div className="cart-summary">
          <span>Items: {totalItems}</span>
          <span>Total: ₹{totalPrice}</span>
        </div>
      </header>

      <main className="layout">
        <section className="products-section">
          <Filters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sort={sort}
            onSortChange={setSort}
            categories={categories}
          />
          <ProductList
            products={filteredProducts}
            onAddToCart={handleAddToCart}
          />
        </section>

        <section className="cart-section">
          <Cart
            cart={cart}
            onRemove={handleRemoveFromCart}
            onUpdateQty={handleUpdateQty}
            totalItems={totalItems}
            totalPrice={totalPrice}
          />
        </section>
      </main>
    </div>
  );
}

function Filters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  categories
}) {
  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />

      <select
        value={category}
        onChange={e => onCategoryChange(e.target.value)}
      >
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={sort}
        onChange={e => onSortChange(e.target.value)}
      >
        <option value="none">Sort by price</option>
        <option value="asc">Low → High</option>
        <option value="desc">High → Low</option>
      </select>
    </div>
  );
}

const ProductList = React.memo(function ProductList({ products, onAddToCart }) {
  if (products.length === 0) {
    return <p className="empty">No products found</p>;
  }

  return (
    <div className="product-grid">
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
});

const ProductCard = React.memo(function ProductCard({ product, onAddToCart }) {
  const outOfStock = product.stock === 0;

  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p className="category">{product.category}</p>
      <p className="price">₹{product.price}</p>
      <p className={`stock ${outOfStock ? "oos" : ""}`}>
        {outOfStock ? "Out of stock" : `In stock: ${product.stock}`}
      </p>
      <button
        disabled={outOfStock}
        onClick={() => onAddToCart(product)}
      >
        {outOfStock ? "Unavailable" : "Add to cart"}
      </button>
    </div>
  );
});

function Cart({ cart, onRemove, onUpdateQty, totalItems, totalPrice }) {
  const items = Object.values(cart);

  if (items.length === 0) {
    return (
      <div className="cart">
        <h2>Cart</h2>
        <p className="empty">Empty cart</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <h2>Cart</h2>
      <ul className="cart-items">
        {items.map(({ product, qty }) => (
          <li key={product.id} className="cart-item">
            <div>
              <strong>{product.name}</strong>
              <div className="cart-meta">
                <span>₹{product.price}</span>
                <span>Stock: {product.stock}</span>
              </div>
            </div>

            <div className="cart-actions">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qty}
                onChange={e => onUpdateQty(product.id, Number(e.target.value))}
              />
              <button onClick={() => onRemove(product.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-footer">
        <span>Total items: {totalItems}</span>
        <span>Total price: ₹{totalPrice}</span>
      </div>
    </div>
  );
}

export default App;
