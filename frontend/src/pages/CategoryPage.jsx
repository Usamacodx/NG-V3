import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProductCard } from "../components/ProductCard.jsx";
import { useCart } from "../context/CartContext";

const CategoryPage = () => {
  const { category, subcategory } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/products`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const allProducts = await response.json();
        const filtered = allProducts.filter(
          (p) =>
            p.category.toLowerCase() === category.toLowerCase() &&
            p.subcategory.toLowerCase() === subcategory.toLowerCase()
        );
        setProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, subcategory]);

  const pageTitle = `${category.charAt(0).toUpperCase() + category.slice(1)} - ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}`;

  if (loading) {
    return <div style={styles.loadingContainer}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      <nav style={styles.breadcrumbs}>
        <Link to="/" style={styles.breadcrumbLink}>Home</Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <Link to="/products" style={styles.breadcrumbLink}>{category}</Link>
        <span style={styles.breadcrumbSeparator}>/</span>
        <span style={styles.breadcrumbActive}>{subcategory}</span>
      </nav>
      <h1 style={styles.header}>{pageTitle}</h1>
      {products.length > 0 ? (
        <div style={styles.productList}>
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              addToCart={addToCart}
            />
          ))}
        </div>
      ) : (
        <div style={styles.noProducts}>
            <p>No products found in this category.</p>
            <Link to="/products" style={styles.backButton}>Back to All Products</Link>
        </div>
      )}
    </div>
  );
};

const styles = {
    container: {
        padding: '20px 40px',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f8f9fa',
    },
    header: {
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: '#0a0e27',
        marginBottom: '30px',
        borderBottom: '3px solid #0b84ff',
        paddingBottom: '10px',
    },
    productList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '30px',
    },
    loadingContainer: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2rem',
    },
    noProducts: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '1.2rem',
    },
    backButton: {
        display: 'inline-block',
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#0b84ff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
    },
    breadcrumbs: {
        marginBottom: '20px',
        fontSize: '0.9rem',
        color: '#6c757d',
    },
    breadcrumbLink: {
        color: '#0b84ff',
        textDecoration: 'none',
    },
    breadcrumbSeparator: {
        margin: '0 10px',
    },
    breadcrumbActive: {
        color: '#343a40',
        fontWeight: 'bold',
    }
};

export default CategoryPage;
