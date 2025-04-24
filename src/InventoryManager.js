import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { CheckCircle } from "lucide-react";

const SHEETDB_API_URL = "https://sheetdb.io/api/v1/1g2o5huoe0dew";

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
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleScannerInput = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const rawScan = scannedCodeRef.current;
      const cleanedScan = rawScan.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      console.log("All SKUs in inventory:", inventory.map(i => i.sku));

      const matchedItem = inventory.find(item =>
        (item.sku || "").toString().replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanedScan
      );

      if (matchedItem) {
        setSelectedProduct(matchedItem);
        setShowModal(true);
      } else {
        alert(`SKU ${cleanedScan} not found.`);
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
          onInput={(e) => {
            scannedCodeRef.current = e.target.value;
            setScanInput(e.target.value);
          }}
          onKeyDown={handleScannerInput}
        />
        <p style={{ textAlign: "center", marginTop: "8px", fontSize: "16px", color: "blue" }}>
          Scanned Input: [{scanInput}]
        </p>

        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button onClick={handleOrderItem}>Order Item</button>
          <button onClick={handlePrintBarcodes}>Print Barcode Sheet</button>
        </div>
      </div>

      <div style={{ overflowX: "auto", marginTop: "24px" }}>
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
