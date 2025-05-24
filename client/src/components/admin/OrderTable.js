import React from 'react';

const OrderTable = ({ orders, onViewOrder, onUpdateStatus, formatPrice, formatDate }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'processing':
        return <span className="badge badge-warning">Processing</span>;
      case 'shipped':
        return <span className="badge badge-info">Shipped</span>;
      case 'pending':
        return <span className="badge badge-secondary">Pending</span>;
      case 'cancelled':
        return <span className="badge badge-error">Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="hover">
              <td>
                <div className="font-medium">{order.id}</div>
                <div className="text-xs text-gray-500">{order.paymentMethod}</div>
              </td>
              <td>
                <div className="font-medium">{order.customerName}</div>
                <div className="text-xs text-gray-500">{order.customerEmail}</div>
              </td>
              <td>{formatDate(order.date)}</td>
              <td className="font-medium">{formatPrice(order.total)}</td>
              <td>{getStatusBadge(order.status)}</td>
              <td>
                <div className="flex space-x-2">
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => onViewOrder(order)}
                    title="View Details"
                  >
                    <i className="fas fa-eye text-blue-600"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => onUpdateStatus(order)}
                    title="Update Status"
                  >
                    <i className="fas fa-edit text-npc-gold"></i>
                  </button>
                  <button 
                    className="btn btn-sm btn-ghost"
                    onClick={() => {
                      window.Swal.fire({
                        title: 'Print Invoice',
                        text: `Invoice for order ${order.id} will be printed.`,
                        icon: 'info',
                        confirmButtonColor: '#F0A84E'
                      });
                    }}
                    title="Print Invoice"
                  >
                    <i className="fas fa-print text-gray-600"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;