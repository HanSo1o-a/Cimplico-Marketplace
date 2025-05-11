// 测试删除订单的 API
const testDeleteOrder = async () => {
  try {
    // 替换为实际的供应商 ID 和订单 ID
    const vendorId = 1;
    const orderId = 1;
    
    const response = await fetch(`http://localhost:5000/api/vendors/${vendorId}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // 添加认证头（如果需要）
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    const data = await response.json();
    console.log('API 响应:', data);
    
    if (response.ok) {
      console.log('订单删除成功!');
    } else {
      console.log('订单删除失败:', data.message || '未知错误');
    }
  } catch (error) {
    console.error('API 调用出错:', error);
  }
};

// 运行测试
testDeleteOrder();
