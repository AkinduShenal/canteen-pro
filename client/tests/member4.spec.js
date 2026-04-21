import { expect, test } from '@playwright/test';

const staffUser = {
  _id: 'u-staff-4',
  name: 'Canteen Staff',
  email: 'canteen.staff@gmail.com',
  role: 'staff',
  token: 'token-staff-4',
  assignedCanteen: {
    _id: 'can-1',
    name: 'Main Canteen',
    location: 'Block A',
  },
};

const adminUser = {
  _id: 'u-admin-4',
  name: 'System Admin',
  email: 'admin@example.com',
  role: 'admin',
  token: 'token-admin-4',
};

const canteens = [
  { _id: 'can-1', name: 'Main Canteen', location: 'Block A' },
  { _id: 'can-2', name: 'New Canteen', location: 'Block B' },
];

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

test.describe('Member 4 flows', () => {
  test('staff dashboard shows assigned canteen orders and status workflow', async ({ page }) => {
    let orders = [
      {
        _id: 'ord-staff-1',
        token: 'C1-00011',
        status: 'pending',
        pickupTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        notes: 'Extra spicy',
        canteenId: { _id: 'can-1', name: 'Main Canteen' },
        userId: { _id: 'stu-1', name: 'Student A' },
        items: [{ name: 'Chicken Rice', quantity: 1, price: 700 }],
      },
      {
        _id: 'ord-other-1',
        token: 'C2-00031',
        status: 'pending',
        pickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        notes: '',
        canteenId: { _id: 'can-2', name: 'New Canteen' },
        userId: { _id: 'stu-2', name: 'Student B' },
        items: [{ name: 'Pasta', quantity: 1, price: 800 }],
      },
    ];

    await setAuthSession(page, staffUser);
    await mockAuthProfile(page, staffUser);

    await page.route('**/api/canteens**', (route) => jsonResponse(route, canteens));

    await page.route('**/api/staff-admin/dashboard/metrics**', (route) => jsonResponse(route, {
      stats: {
        totalOrders: 2,
        pending: 2,
        preparing: 0,
        ready: 0,
        feedbackCount: 1,
      },
    }));

    await page.route('**/api/staff-admin/feedback**', (route) => jsonResponse(route, []));

    await page.route('**/api/staff-admin/orders**', (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());
      const statusFilter = url.searchParams.get('status');
      const priorityOnly = url.searchParams.get('priorityOnly') === 'true';

      if (method === 'PATCH' && url.pathname.endsWith('/status')) {
        const match = req.url().match(/\/orders\/([^/]+)\/status/);
        const orderId = match ? match[1] : '';
        const payload = req.postDataJSON();

        orders = orders.map((order) => (
          order._id === orderId ? { ...order, status: payload.status } : order
        ));

        return jsonResponse(route, { message: 'Updated' });
      }

      let filtered = [...orders];
      if (statusFilter) {
        filtered = filtered.filter((order) => order.status === statusFilter);
      }
      if (priorityOnly) {
        filtered = filtered.filter((order) => ['accepted', 'preparing'].includes(order.status));
      }
      return jsonResponse(route, filtered);
    });

    await page.goto('/dashboard/orders');

    await expect(page).toHaveURL(/\/dashboard\/orders$/);
    await expect(page.getByText('C1-00011')).toBeVisible();
    await expect(page.getByText('C2-00031')).toHaveCount(0);

    await page.getByRole('button', { name: 'Accept Order' }).click();
    await expect(page.getByRole('button', { name: 'Start Preparing' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Start Preparing' }).click();
    await expect(page.getByRole('button', { name: 'Mark as Ready' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('link', { name: 'Priority Queue' }).click();
    await expect(page).toHaveURL(/\/dashboard\/priority-queue$/);
    await expect(page.getByText('C1-00011')).toBeVisible();
  });

  test('admin can create staff, moderate feedback, and open reports', async ({ page }) => {
    let staffMembers = [
      {
        _id: 'stf-1',
        name: 'Existing Staff',
        email: 'existing.staff@example.com',
        isActive: true,
        assignedCanteen: { _id: 'can-1', name: 'Main Canteen' },
      },
    ];

    let feedbackItems = [
      {
        orderId: 'order-feedback-1',
        token: 'C1-00440',
        student: { _id: 'stu-4', name: 'Feedback Student' },
        canteen: { _id: 'can-1', name: 'Main Canteen' },
        feedback: {
          rating: 4,
          comment: 'Fast service',
          isHidden: false,
        },
      },
    ];

    const adminOrders = [
      {
        _id: 'adm-order-1',
        token: 'C1-00090',
        status: 'completed',
        totalAmount: 1200,
        createdAt: new Date().toISOString(),
        pickupTime: new Date().toISOString(),
        canteenId: { _id: 'can-1', name: 'Main Canteen' },
      },
    ];

    await setAuthSession(page, adminUser);
    await mockAuthProfile(page, adminUser);

    await page.route('**/api/canteens**', (route) => jsonResponse(route, canteens));

    await page.route('**/api/staff-admin/dashboard/metrics**', (route) => jsonResponse(route, {
      stats: {
        totalOrders: 12,
        pending: 2,
        preparing: 3,
        ready: 2,
        feedbackCount: 4,
      },
    }));

    await page.route('**/api/staff-admin/feedback**', (route) => {
      const method = route.request().method();
      const url = new URL(route.request().url());

      if (method === 'DELETE') {
        const orderId = url.pathname.split('/').pop();
        feedbackItems = feedbackItems.map((entry) => (
          entry.orderId === orderId
            ? { ...entry, feedback: { ...entry.feedback, isHidden: true } }
            : entry
        ));
        return jsonResponse(route, { message: 'Feedback hidden' });
      }

      return jsonResponse(route, feedbackItems);
    });

    await page.route('**/api/staff-admin/staff', (route) => {
      if (route.request().method() === 'GET') {
        return jsonResponse(route, staffMembers);
      }

      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        const canteen = canteens.find((entry) => entry._id === payload.assignedCanteen);
        const created = {
          _id: `stf-${staffMembers.length + 1}`,
          name: payload.name,
          email: payload.email,
          isActive: true,
          assignedCanteen: {
            _id: payload.assignedCanteen,
            name: canteen?.name || 'Unknown',
          },
        };
        staffMembers = [...staffMembers, created];
        return jsonResponse(route, created, 201);
      }

      return route.continue();
    });

    await page.route('**/api/staff-admin/canteens/options', (route) => jsonResponse(route, canteens));

    await page.route('**/api/admin/orders**', (route) => jsonResponse(route, adminOrders));

    await page.goto('/dashboard/staff-members');

    await expect(page).toHaveURL(/\/dashboard\/staff-members$/);
    await expect(page.getByText('Existing Staff')).toBeVisible();

    await page.getByRole('button', { name: 'Add Staff Member' }).click();

    await page.getByPlaceholder('Full name').fill('Created Staff');
    await page.getByPlaceholder('Email address').fill('created.staff@example.com');
    await page.getByRole('combobox').nth(2).selectOption('can-1');
    await page.getByPlaceholder('Password (min 6 characters)').fill('secret123');

    await page.getByRole('button', { name: 'Create Staff Member' }).click();

    await expect(page.getByText('Created Staff')).toBeVisible();

    await page.getByRole('link', { name: 'Feedback' }).click();
    await expect(page).toHaveURL(/\/dashboard\/feedback$/);

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Hide feedback' }).click();

    await expect(page.getByText('Hidden by admin')).toBeVisible();

    await page.getByRole('link', { name: 'Reports' }).click();
    await expect(page).toHaveURL(/\/dashboard\/reports$/);
    await expect(page.getByText('Total Revenue')).toBeVisible();
  });
});
