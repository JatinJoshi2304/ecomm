"use client";

import { useState, useEffect } from "react";

type Option = {
  _id: string;
  name: string;
};

export default function CreateProductPage() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [sizes, setSizes] = useState<Option[]>([]);
  const [colors, setColors] = useState<Option[]>([]);
  const [materials, setMaterials] = useState<Option[]>([]);
  const [message, setMessage] = useState("");

  // 🔹 Fetch options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2QxMWRlOTY2ZDQ2ZTI4M2UyN2U5ZCIsInJvbGUiOiJzZWxsZXIiLCJpYXQiOjE3NTgyODc5MDgsImV4cCI6MTc1ODI5MTUwOH0.BGfFLKMddqDPlkcpx0LI9dCMA-rOq49OwYcdDJvQSlk";

        const [catRes, brandRes, sizeRes, colorRes, materialRes] =
          await Promise.all([
            fetch("/api/admin/categories", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/admin/brands", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/admin/sizes", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/admin/colors", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/admin/materials", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const [cats, brands, sizes, colors, materials] = await Promise.all([
          catRes.json(),
          brandRes.json(),
          sizeRes.json(),
          colorRes.json(),
          materialRes.json(),
        ]);

        setCategories(cats.data || []);
        setBrands(brands.data || []);
        setSizes(sizes.data || []);
        setColors(colors.data || []);
        setMaterials(materials.data || []);
      } catch (err) {
        console.error("Failed to fetch dropdown options", err);
      }
    };

    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      categoryId: formData.get("categoryId"),
      brandId: formData.get("brandId"),
      sizeId: formData.get("sizeId"),
      colorId: formData.get("colorId"),
      materialId: formData.get("materialId"),
      image: formData.get("image"),
    };

    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2QxMWRlOTY2ZDQ2ZTI4M2UyN2U5ZCIsInJvbGUiOiJzZWxsZXIiLCJpYXQiOjE3NTgyODc5MDgsImV4cCI6MTc1ODI5MTUwOH0.BGfFLKMddqDPlkcpx0LI9dCMA-rOq49OwYcdDJvQSlk`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Product created successfully!");
        e.currentTarget.reset();
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      console.log(err)
      setMessage("⚠️ Something went wrong!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Create Product</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Product Name" required /> <br />
        <textarea name="description" placeholder="Description" required /> <br />
        <input type="number" name="price" placeholder="Price" required /> <br />
        <input type="number" name="stock" placeholder="Stock" required /> <br />

        {/* Category Dropdown */}
        <select name="categoryId" required>
          <option value="">-- Select Category --</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <br />

        {/* Brand Dropdown */}
        <select name="brandId" required>
          <option value="">-- Select Brand --</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
        <br />

        {/* Size Dropdown */}
        <select name="sizeId">
          <option value="">-- Select Size --</option>
          {sizes.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <br />

        {/* Color Dropdown */}
        <select name="colorId">
          <option value="">-- Select Color --</option>
          {colors.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <br />

        {/* Material Dropdown */}
        <select name="materialId">
          <option value="">-- Select Material --</option>
          {materials.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>
        <br />

        <input name="image" placeholder="Image URL" /> <br />

        <button type="submit">Create Product</button>
      </form>

      <p>{message}</p>
    </div>
  );
}
