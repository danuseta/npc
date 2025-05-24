import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import Logo from '../../assets/logo.png';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 65,
    backgroundColor: '#FFFFFF',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 50,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    color: '#F0A84E',
  },
  invoiceDate: {
    marginBottom: 30,
    color: '#333333',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    color: '#555555',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0A84E',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E09A40',
    borderBottomStyle: 'solid',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    borderBottomStyle: 'solid',
  },
  tableColItem: {
    flex: 5,
    paddingRight: 10,
  },
  tableColQuantity: {
    flex: 2,
    textAlign: 'center',
  },
  tableColPrice: {
    flex: 2,
    textAlign: 'right',
  },
  tableColTotal: {
    flex: 2,
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableCellText: {
    fontSize: 10,
    color: '#333333',
  },
  totalSection: {
    marginTop: 20,
    borderTopWidth: 1,
        borderTopColor: '#F0A84E',    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 30,
    width: 80,
    textAlign: 'right',
    color: '#333333',
  },
  totalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    color: '#333333',
  },
  grandTotal: {
    color: '#F0A84E',
    fontWeight: 'bold',
  },
  note: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  noteText: {
    fontSize: 9,
    color: '#555555',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#F0A84E',
  },
  footerText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  }
});


const InvoiceTemplate = ({ order, storeInfo }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {

    return `Rp${Number(amount).toLocaleString('id-ID')}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15
        }}>
          <Text style={[styles.invoiceTitle, { marginTop: 0, marginBottom: 0 }]}>INVOICE</Text>
          <Image src={Logo} style={styles.logo} />
        </View>
        

        <View style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F0A84E',
          borderBottomStyle: 'solid',
          marginBottom: 15
        }} />


        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.label, { marginRight: 5 }]}>Date:</Text>
            <Text style={styles.text}>{formatDate(order.date)}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.label, { marginRight: 5 }]}>NO:</Text>
            <Text style={styles.text}>{order.orderNumber.toString().padStart(6, '0')}</Text>
          </View>
        </View>


        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.label}>Billed To:</Text>
            {order.shippingAddress && (
              <>
                <Text style={styles.text}>{order.shippingAddress.fullName || 'Customer'}</Text>
                <Text style={styles.text}>{order.shippingAddress.address || ''}</Text>
                <Text style={styles.text}>
                  {order.shippingAddress.city || ''}, {order.shippingAddress.province || ''}
                </Text>
                <Text style={styles.text}>{order.shippingAddress.phoneNumber || ''}</Text>
                <Text style={styles.text}>{order.shippingAddress.email || ''}</Text>
              </>
            )}
          </View>
          
          <View style={styles.column}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.text}>{storeInfo?.storeName || 'NPC Nusantara Computer'}</Text>
            <Text style={styles.text}>{storeInfo?.address || '123 Anywhere St'}</Text>
            <Text style={styles.text}>
              {storeInfo?.city || 'Any City'}, {storeInfo?.province || ''}
            </Text>
            <Text style={styles.text}>{storeInfo?.phoneNumber || ''}</Text>
            <Text style={styles.text}>{storeInfo?.email || 'customer@npccomputer.com'}</Text>
          </View>
        </View>


        <View style={styles.table}>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableColItem]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.tableColQuantity]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableColPrice]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.tableColTotal]}>Amount</Text>
          </View>
          

          {order.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={[styles.tableCellText, styles.tableColItem]}>
                {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name}
              </Text>
              <Text style={[styles.tableCellText, styles.tableColQuantity]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCellText, styles.tableColPrice]}>
                {formatCurrency(item.price)}
              </Text>
              <Text style={[styles.tableCellText, styles.tableColTotal]}>
                {formatCurrency(item.quantity * item.price)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.total - (order.shippingFee || 0))}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.shippingFee || 0)}</Text>
          </View>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total</Text>
            <Text style={[styles.totalAmount, styles.grandTotal]}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={styles.note}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.noteLabel, { marginBottom: 0, marginRight: 5 }]}>Payment Status:</Text>
            <Text style={{ 
              fontSize: 10,
              fontWeight: 'bold',
              color: order.paymentStatus === 'paid' ? '#22c55e' : 
                    order.paymentStatus === 'pending' ? '#f59e0b' : '#ef4444'
            }}>
              {(order.paymentStatus || 'Unknown').toUpperCase()}
              {order.paymentStatus === 'paid' && order.paymentMethod ? 
                ` (${order.paymentMethod.toUpperCase()})` : ''}
            </Text>
          </View>
          
          <View style={{
            borderBottomWidth: 1,
            borderBottomColor: '#e5e5e5',
            borderBottomStyle: 'solid',
            marginBottom: 8
          }} />
          
          <Text style={styles.noteLabel}>NOTE:</Text>
          <Text style={styles.noteText}>Thank you for shopping with us!</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>
            For any questions regarding this invoice, please contact our customer service.
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {storeInfo?.storeName || 'NPC Nusantara Computer'}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;
