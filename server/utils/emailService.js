const nodemailer = require('nodemailer');
require('dotenv').config();

const BRAND_COLOR = '#F0A84E';
const BRAND_DARK = '#1A1F35';
const LOGO_URL = './logo.png'; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailWrapper = (content) => `
  <div style="font-family: 'Poppins', Arial, sans-serif; background: #f4f4f4; padding: 0; margin: 0;">
    <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); overflow: hidden;">
      <div style="background: linear-gradient(90deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); padding: 24px 0; text-align: center;">
        <img src="${LOGO_URL}" alt="NPC Store" style="height: 48px; margin-bottom: 8px;" />
      </div>
      <div style="padding: 32px 24px;">
        ${content}
      </div>
      <div style="background: #fafafa; color: #888; font-size: 12px; text-align: center; padding: 18px 0; border-top: 1px solid #eee;">
        &copy; ${new Date().getFullYear()} NPC Store. All rights reserved.
      </div>
    </div>
  </div>
`;

const button = (text, url) => `
  <a href="${url}" style="display: inline-block; background: ${BRAND_COLOR}; color: #fff; text-decoration: none; font-weight: 600; padding: 12px 32px; border-radius: 8px; margin: 16px 0; font-size: 16px;">
    ${text}
  </a>
`;

const sendVerificationEmail = async (email, code, name) => {
  try {
    const html = emailWrapper(`
      <h2 style="color: ${BRAND_DARK}; margin-bottom: 8px;">Hello ${name || 'there'},</h2>
      <p style="color: #444; font-size: 16px;">Thank you for registering at <b>NPC Store</b>! Please use the code below to verify your email address:</p>
      <div style="background: ${BRAND_COLOR}; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; padding: 18px 0; text-align: center; margin: 32px 0;">
        ${code}
      </div>
      <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p style="color: #888; font-size: 13px;">If you did not request this, please ignore this email.</p>
      <p style="margin-top: 32px; color: ${BRAND_DARK}; font-weight: 500;">Best regards,<br>NPC Store Team</p>
    `);

    const mailOptions = {
      from: `"NPC Store" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Verify Your Email - NPC Store',
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

const sendPasswordResetEmail = async (email, token, name) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  try {
    const html = emailWrapper(`
      <h2 style="color: ${BRAND_DARK}; margin-bottom: 8px;">Hello ${name || 'there'},</h2>
      <p style="color: #444; font-size: 16px;">We received a request to reset your password for your <b>NPC Store</b> account.</p>
      <p style="color: #444; font-size: 15px;">Click the button below to reset your password:</p>
      ${button('Reset Password', resetUrl)}
      <p style="color: #666; font-size: 14px;">This link will expire in 10 minutes.</p>
      <p style="color: #888; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      <p style="margin-top: 32px; color: ${BRAND_DARK}; font-weight: 500;">Best regards,<br>NPC Store Team</p>
    `);

    const mailOptions = {
      from: `"NPC Store" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: 'Password Reset Request - NPC Store',
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

const sendOrderConfirmationEmail = async (email, orderDetails) => {
  try {
    const { orderNumber, items, totalAmount, shippingAddress } = orderDetails;

    let itemsHtml = '';
    items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; color: #222;">${item.productName}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; color: #222;">${item.quantity}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; color: #222;">Rp ${item.price.toLocaleString()}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; color: #222;">Rp ${item.totalPrice.toLocaleString()}</td>
        </tr>
      `;
    });

    const html = emailWrapper(`
      <h2 style="color: ${BRAND_DARK}; margin-bottom: 8px;">Thank You for Your Order!</h2>
      <p style="color: #444; font-size: 16px;">Your order <b>#${orderNumber}</b> has been received and is being processed.</p>
      <h3 style="margin-top: 24px; color: ${BRAND_COLOR}; font-size: 18px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 18px 0 8px 0;">
        <thead>
          <tr style="background: ${BRAND_COLOR}; color: #fff;">
            <th style="padding: 10px 8px; text-align: left;">Item</th>
            <th style="padding: 10px 8px; text-align: center;">Qty</th>
            <th style="padding: 10px 8px; text-align: right;">Price</th>
            <th style="padding: 10px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: bold; color: ${BRAND_DARK};">Grand Total:</td>
            <td style="padding: 10px 8px; text-align: right; font-weight: bold; color: ${BRAND_COLOR};">Rp ${totalAmount.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <h3 style="margin-top: 24px; color: ${BRAND_COLOR}; font-size: 17px;">Shipping Address</h3>
      <div style="background: #f8f8f8; border-radius: 8px; padding: 14px 18px; margin-bottom: 18px; color: #333;">
        ${shippingAddress}
      </div>
      <p style="color: #444; font-size: 15px;">You can track your order status in the <b>My Orders</b> section of your account.</p>
      <p style="margin-top: 32px; color: ${BRAND_DARK}; font-weight: 500;">Thank you for shopping with us!<br>NPC Store Team</p>
    `);

    const mailOptions = {
      from: `"NPC Store" <${process.env.EMAIL_USERNAME}>`,
      to: email,
      subject: `Order Confirmation - #${orderNumber} | NPC Store`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
};