import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CheckCircle } from "lucide-react";

const SHEETDB_API_URL = "https://v0-new-project-wohbutex58j.vercel.app/api/proxy";

export default function InventoryManager() {
  const [inventory, setInventory] = useState([]);
  const [scanInput, setScanInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const quantityInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const scannedCodeRef = useRef("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(SHEETDB_API_URL);
      setInventory(response.data);
    } catch (error) {
      console.error("Error fetching inventory:", error.response?.data || error.message);
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedProduct || !quantityInput) {
      alert("Please scan a SKU and enter a quantity.");
      return;
    }

    try {
      await axios.patch(`${SHEETDB_API_URL}/sku/${selectedProduct.sku}`, {
        data: { quantity: quantityInput },
      });
      setScanInput("");
      setQuantityInput("");
      setSelectedProduct(null);
      setShowModal(false);
      fetchInventory();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
          barcodeInputRef.current.value = "";
        }
      }, 1500);
    } catch (error) {
      console.error("Error updating inventory:", error.response?.data || error.message);
      alert("Failed to update inventory.");
    }
  };

  const handleOrderItem = () => {
    if (scanInput) {
      alert(`Order placed for SKU: ${scanInput}`);
    } else {
      alert("Please scan or enter a SKU to order.");
    }
  };

  const handlePrintBarcodes = () => {
    const printWindow = window.open("", "_blank");
    const content = `
      <html>
      <head><title>Print Barcodes</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>Barcode Labels</h1>
        ${inventory.map(item => `
          <div style="margin-bottom: 20px; text-align: center;">
            <div><strong>${item.product}</strong></div>
            <img src="https://barcodeapi.org/api/128/${item.sku}" alt="Barcode for ${item.product}" style="height: 80px; margin-top: 5px;" />
          </div>
        `).join('')}
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const handleScannerInput = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const trimmedScan = scannedCodeRef.current.trim().toUpperCase();
      const matchedItem = inventory.find(item => item.sku.trim().toUpperCase() === trimmedScan);
      if (matchedItem) {
        setSelectedProduct(matchedItem);
        setShowModal(true);
      } else {
        alert(`SKU ${trimmedScan} not found.`);
      }
      scannedCodeRef.current = "";
      setScanInput("");
    } else {
      scannedCodeRef.current += event.key;
      setScanInput(prev => prev + event.key);
    }
  };

  useEffect(() => {
    if (barcodeInputRef.current) barcodeInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (quantityInputRef.current) quantityInputRef.current.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [showModal]);

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px", backgroundColor: "#FEF3C7", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#92400E", textAlign: "center" }}>TAP BELOW TO BEGIN SCANNING</h1>
        <input
          ref={barcodeInputRef}
          autoFocus
          placeholder="Tap here before scanning"
          style={{ width: "100%", fontSize: "20px", padding: "24px", border: "4px solid #F59E0B", borderRadius: "12px", textAlign: "center", marginTop: "12px" }}
          onKeyDown={handleScannerInput}
        />
      </div>

      {showModal && selectedProduct && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.2)", width: "320px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>Update Inventory</h2>
            <p><strong>Product:</strong> {selectedProduct.product}</p>
            <p><strong>SKU:</strong> {selectedProduct.sku}</p>
            <input
              placeholder="Enter New Quantity"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              ref={quantityInputRef}
              style={{ width: "100%", padding: "8px", marginTop: "8px", border: "1px solid #ccc" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleUpdateInventory}>Update</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: "32px", borderRadius: "12px", boxShadow: "0 6px 12px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <CheckCircle color="green" size={64} />
            <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "green", marginTop: "16px" }}>Inventory Updated!</h2>
          </div>
        </div>
      )}

      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginTop: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>Inventory Management</h2>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <button onClick={handleOrderItem}>Order Item</button>
          <button onClick={handlePrintBarcodes}>Print Barcode Sheet</button>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: "16px" }}>
        <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Product</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>SKU</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Barcode</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Quantity</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc", padding: "8px" }}>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "8px" }}>{item.product}</td>
                <td style={{ padding: "8px" }}>{item.sku}</td>
                <td style={{ padding: "8px" }}>
                  <img 
                    src={`https://barcodeapi.org/api/128/${item.sku}`} 
                    alt={`Barcode for ${item.product}`} 
                    style={{ height: "50px" }}
                  />
                </td>
                <td style={{ padding: "8px" }}>{item.quantity}</td>
                <td style={{ padding: "8px" }}>{item.vendor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
