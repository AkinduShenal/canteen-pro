import { expect, test } from '@playwright/test';

const studentUser = {
  _id: 'user-student-3',
  name: 'Order Student',
  email: 'order.student@example.com',
  role: 'student',
  token: 'token-student-3',
};

const jsonResponse = (route, data, status = 200) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });

const setAuthSession = async (page, user) => {
  await page.addInitScript((storedUser) => {
    const raw = JSON.stringify(storedUser);
    window.localStorage.setItem('user', raw);
    window.sessionStorage.setItem('user', raw);
  }, user);
};

const mockAuthProfile = async (page, user) => {
  await page.route('**/api/auth/profile', (route) => jsonResponse(route, user));
};

const withTotal = (cart) => ({
  ...cart,
  totalAmount: (cart.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  ),
});

test.describe('Member 3 flows', () => {
  test('cart management and checkout with suggested slot retry', async ({ page }) => {
    let orderCreateAttempts = 0;

    let cart = withTotal({
      canteenId: 'can-1',
      items: [
        {
          menuItemId: 'item-1',
          name: 'Chicken Kottu',
          price: 600,
          quantity: 1,
          image: '',
        },
        {
          menuItemId: 'item-2',
          name: 'Lime Juice',
          price: 200,
          quantity: 2,
          image: '',
        },
      ],
    });

    const orders = [];

    await setAuthSession(page, studentUser);
    await mockAuthProfile(page, studentUser);

    await page.route('**/api/canteens/can-1', (route) => jsonResponse(route, {
      _id: 'can-1',
      name: 'Main Canteen',
      openTime: '08:00',
      closeTime: '17:00',
      location: 'Block A',
    }));

    await page.route('**/api/cart/mine/clear', (route) => {
      cart = withTotal({ canteenId: null, items: [] });
      return jsonResponse(route, { message: 'Cart cleared' });
    });

    await page.route('**/api/cart/items/**', async (route) => {
      const method = route.request().method();
      const menuItemId = route.request().url().split('/').pop();

      if (method === 'PATCH') {
        const payload = route.request().postDataJSON();
        cart = withTotal({
          ...cart,
          items: cart.items.map((item) => (
            item.menuItemId === menuItemId
              ? { ...item, quantity: Math.max(1, Number(payload.quantity || 1)) }
              : item
          )),
        });
        return jsonResponse(route, { message: 'Quantity updated' });
      }

      if (method === 'DELETE') {
        cart = withTotal({
          ...cart,
          items: cart.items.filter((item) => item.menuItemId !== menuItemId),
        });
        return jsonResponse(route, { message: 'Item removed' });
      }

      return route.continue();
    });

    await page.route('**/api/cart/mine', (route) => jsonResponse(route, cart));

    await page.route('**/api/orders', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return jsonResponse(route, orders);
      }

      if (method === 'POST') {
        orderCreateAttempts += 1;
        if (orderCreateAttempts === 1) {
          return jsonResponse(route, {
            message: 'Selected slot is full. Please choose next slot.',
            suggestedPickupTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
          }, 400);
        }

        const created = {
          _id: 'order-1',
          token: 'C2-00045',
          status: 'pending',
          canteenId: { _id: 'can-1', name: 'Main Canteen' },
          pickupTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          totalAmount: cart.totalAmount,
        };
        orders.unshift(created);
        cart = withTotal({ canteenId: null, items: [] });
        return jsonResponse(route, created, 201);
      }

      return route.continue();
    });

    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: 'Your Cart Control Room' })).toBeVisible();
    await expect(page.locator('.student-checkout-canteen-lock').getByText('Main Canteen')).toBeVisible();

    const chickenRow = page.locator('.student-order-item-row', { hasText: 'Chicken Kottu' });
    await chickenRow.getByRole('button', { name: '+' }).click();
    await expect(chickenRow.getByText('Line total: LKR 1200.00')).toBeVisible();

    const juiceRow = page.locator('.student-order-item-row', { hasText: 'Lime Juice' });
    await juiceRow.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.student-order-item-row', { hasText: 'Lime Juice' })).toHaveCount(0);

    await page.getByRole('button', { name: '+15 min' }).click();

    await page.getByRole('button', { name: 'Confirm & Place Order' }).click();

    await expect(page.getByText('Selected slot is full. Please choose next slot.')).toBeVisible();
    await expect(page.getByText('Next available slot:')).toBeVisible();

    await page.getByRole('button', { name: 'Use suggested slot' }).click();
    await page.getByRole('button', { name: 'Confirm & Place Order' }).click();

    await expect(page.getByText('Order placed successfully. Token: C2-00045')).toBeVisible();
    await expect(page).toHaveURL(/\/orders$/, { timeout: 5000 });
  });

  test('order history supports cancel and canteen-lock reorder flow', async ({ page }) => {
    let orders = [
      {
        _id: 'order-pending',
        token: 'C2-01000',
        status: 'pending',
        canteenId: { _id: 'can-1', name: 'Main Canteen' },
        pickupTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        totalAmount: 780,
      },
      {
        _id: 'order-completed',
        token: 'C2-00900',
        status: 'completed',
        canteenId: { _id: 'can-1', name: 'Main Canteen' },
        pickupTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        totalAmount: 920,
      },
    ];

    let reorderAttempts = 0;

    await setAuthSession(page, studentUser);
    await mockAuthProfile(page, studentUser);

    await page.route('**/api/orders**', (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());
      const path = url.pathname;

      if (method === 'GET') {
        return jsonResponse(route, orders);
      }

      if (method === 'PATCH' && path.endsWith('/cancel')) {
        const parts = path.split('/').filter(Boolean);
        const orderId = parts[parts.length - 2];
        orders = orders.map((order) => (
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        return jsonResponse(route, { message: 'Order cancelled' });
      }

      if (method === 'POST' && path.endsWith('/reorder')) {
        reorderAttempts += 1;
        const payload = req.postDataJSON();

        if (!payload.forceClear && reorderAttempts === 1) {
          return jsonResponse(route, { message: 'Cart contains items from another canteen' }, 409);
        }

        return jsonResponse(route, { message: 'Reorder added' }, 201);
      }

      return route.continue();
    });

    await page.route('**/api/cart/mine', (route) => jsonResponse(route, {
      canteenId: 'can-1',
      items: [
        { menuItemId: 'item-9', name: 'Reorder Item', price: 500, quantity: 1, image: '' },
      ],
      totalAmount: 500,
    }));

    await page.route('**/api/canteens/can-1', (route) => jsonResponse(route, {
      _id: 'can-1',
      name: 'Main Canteen',
    }));

    await page.goto('/orders');

    await expect(page.getByRole('heading', { name: 'Order Tracking + History' })).toBeVisible();

    const pendingRow = page.locator('.student-order-history-row', { hasText: 'C2-01000' });
    await pendingRow.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Order cancelled successfully')).toBeVisible();
    await expect(pendingRow.getByRole('button', { name: 'Cancel' })).toHaveCount(0);

    page.once('dialog', (dialog) => dialog.accept());

    const completedRow = page.locator('.student-order-history-row', { hasText: 'C2-00900' });
    await completedRow.getByRole('button', { name: 'Re-order' }).click();

    await expect(page.getByText('Cart cleared and re-order items added')).toBeVisible();
    await expect(page).toHaveURL(/\/cart$/, { timeout: 5000 });
  });
});
