import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('https://local-services-api.onrender.com/api/users/transactions', config);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [userInfo.token]);

  if (loading) return <p>Loading transaction history...</p>;

  return (
    <div className="transactions-container">
      <h1>My Transactions</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Service</th>
            <th>Amount</th>
            <th>Transaction ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              <td>{tx.booking?.service?.title || 'N/A'}</td>
              <td>${tx.amount.toFixed(2)}</td>
              <td>{tx.stripePaymentId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTransactionsPage;