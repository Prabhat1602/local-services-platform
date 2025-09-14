import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProviderTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        // Fetching from the provider's endpoint
        const { data } = await axios.get('http://localhost:5001/api/provider/transactions', config);
        setTransactions(data);
      } catch (err) {
        setError("Failed to fetch transaction history.");
      } finally {
        setLoading(false);
      }
    };
    if (userInfo?.token) {
        fetchTransactions();
    }
  }, [userInfo?.token]);

  if (loading) return <p>Loading your transaction history...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div className="transactions-container">
      <h1>My Received Payments</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Service</th>
            <th>User</th>
            <th>Amount</th>
            <th>Transaction ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id}>
              <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
              <td>{tx.booking?.service?.title || 'N/A'}</td>
              <td>{tx.user?.name || 'N/A'}</td>
              <td>${tx.amount.toFixed(2)}</td>
              <td>{tx.stripePaymentId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProviderTransactionsPage;