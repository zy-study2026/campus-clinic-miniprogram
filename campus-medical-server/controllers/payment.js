/**
 * 模拟支付控制器
 */

const APPOINTMENT_FEE = 10.00;

async function simulatePay(amount, userId) {
  console.log(`[模拟支付] 用户 ${userId} 支付 ${amount} 元`);
  return true;
}

async function simulateRefund(amount, userId) {
  console.log(`[模拟退款] 用户 ${userId} 退款 ${amount} 元`);
  return true;
}

function getAppointmentFee() {
  return APPOINTMENT_FEE;
}

module.exports = {
  simulatePay,
  simulateRefund,
  getAppointmentFee
};