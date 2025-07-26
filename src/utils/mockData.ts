export const generateMockData = (endpoint: string, count: number) => {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    if (endpoint === '/listings') {
      data.push({
        id: `prop_${i + 1}`,
        name: `Property ${i + 1}`,
        city: ['Miami', 'New York', 'Los Angeles'][Math.floor(Math.random() * 3)],
        bedrooms: Math.floor(Math.random() * 4) + 1,
        status: ['Active', 'Inactive'][Math.floor(Math.random() * 2)],
        price: `$${Math.floor(Math.random() * 300) + 100}/night`
      });
    } else if (endpoint === '/reservations') {
      data.push({
        id: `res_${i + 1}`,
        guestName: `Guest ${i + 1}`,
        checkIn: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        checkOut: new Date(Date.now() + (Math.random() * 30 + 3) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        status: ['Confirmed', 'Pending', 'Cancelled'][Math.floor(Math.random() * 3)],
        total: `$${Math.floor(Math.random() * 2000) + 500}`
      });
    } else if (endpoint === '/guests') {
      data.push({
        id: `guest_${i + 1}`,
        name: `Guest ${i + 1}`,
        email: `guest${i + 1}@example.com`,
        phone: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        bookings: Math.floor(Math.random() * 10) + 1
      });
    } else if (endpoint === '/calendar') {
      data.push({
        id: `cal_${i + 1}`,
        propertyId: `prop_${Math.floor(Math.random() * 10) + 1}`,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        available: Math.random() > 0.3,
        price: `$${Math.floor(Math.random() * 200) + 100}`,
        minStay: Math.floor(Math.random() * 3) + 1
      });
    } else {
      data.push({
        id: `item_${i + 1}`,
        name: `Item ${i + 1}`,
        type: endpoint ? endpoint.slice(1) : 'unknown',
        status: 'Active',
        created: new Date().toLocaleDateString()
      });
    }
  }
  
  return data;
};