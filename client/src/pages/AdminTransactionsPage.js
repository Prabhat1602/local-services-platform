import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        // Fetching from the admin's endpoint
        const { data } = await axios.get('${process.env.REACT_APP_API_URL}/admin/transactions', config);
        setTransactions(data);
      } catch (err) {
        setError("Failed to fetch platform transactions.");
      } finally {
        setLoading(false);
      }
    };
    if (userInfo?.token) {
        fetchAllTransactions();
    }
  }, [userInfo?.token]);

  if (loading) return <p>Loading all platform transactions...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="transactions-container">
      <h1>All Platform Transactions</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>User</th>
            <th>Provider</th>
            <th>Amount</th>
            <th>Transaction ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              <td>{tx.user?.name || 'N/A'}</td>
              <td>{tx.provider?.name || 'N/A'}</td>
              <td>${tx.amount.toFixed(2)}</td>
              <td>{tx.stripePaymentId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTransactionsPage;