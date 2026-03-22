import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

const container = document.getElementById("ordersContainer");

async function loadOrders() {

  const querySnapshot = await getDocs(collection(db, "orders"));

  querySnapshot.forEach((doc) => {

    const order = doc.data();

    const div = document.createElement("div");

    div.innerHTML = `
      <h3>Customer: ${order.customerName}</h3>
      <p>Total: $${order.total}</p>
      <p>Address: ${order.address}</p>
    `;

    container.appendChild(div);

  });

}

loadOrders();