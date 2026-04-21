import { expect, test } from '@playwright/test';

const staffUser = {
  _id: 'u-staff-1',
  name: 'Main Staff',
  email: 'staff@gmail.com',
  role: 'staff',
  token: 'token-staff',
  assignedCanteen: {
    _id: 'can-1',
    name: 'Main Canteen',
    location: 'Block A',
  },
};

const studentUser = {
  _id: 'u-student-1',
  name: 'Student One',
  email: 'student@example.com',
  role: 'student',
  token: 'token-student',
};

const canteens = [
  {
    _id: 'can-1',
    name: 'Main Canteen',
    location: 'Block A',
    openTime: '08:00',
    closeTime: '17:00',
    contactNumber: '0111111111',
    status: 'Open',
    queue: 'Medium',
  },
  {
    _id: 'can-2',
    name: 'New Canteen',
    location: 'Block B',
    openTime: '08:30',
    closeTime: '18:00',
    contactNumber: '0222222222',
    status: 'Closed',
    queue: 'Low',
  },
  {
    _id: 'can-3',
    name: 'Basement Canteen',
    location: 'Basement',
    openTime: '07:30',
    closeTime: '16:30',
    contactNumber: '0333333333',
    status: 'Open',
    queue: 'High',
  },
  {
    _id: 'can-4',
    name: 'Anohana Canteen',
    location: 'Hostel Wing',
    openTime: '09:00',
    closeTime: '20:00',
    contactNumber: '0444444444',
    status: 'Closed',
    queue: 'Low',
  },
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

test.describe('Member 1 flows', () => {
  test('register, browse canteens, view details, open menu, and logout', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => jsonResponse(route, studentUser, 201));

    await page.route('**/api/canteens**', (route) => {
      const url = new URL(route.request().url());
      const parts = url.pathname.split('/').filter(Boolean);

      if (parts[parts.length - 1] === 'canteens') {
        return jsonResponse(route, canteens);
      }

      const canteenId = parts[parts.length - 1];
      const selected = canteens.find((canteen) => canteen._id === canteenId) || null;
      return jsonResponse(route, selected || {}, selected ? 200 : 404);
    });

    await page.route('**/api/canteens/**/queue-status', (route) => jsonResponse(route, {
      estimatedPrepTime: 14,
      activeOrders: 11,
      queueLoad: 'Medium',
    }));

    await page.route('**/api/categories**', (route) => jsonResponse(route, [
      { _id: 'cat-1', name: 'Rice', canteen: 'can-1' },
      { _id: 'cat-2', name: 'Snacks', canteen: 'can-1' },
    ]));

    await page.route('**/api/menu-items**', (route) => {
      const url = new URL(route.request().url());

      if (url.pathname.endsWith('/menu-items/specials')) {
        return jsonResponse(route, [
          {
            _id: 'item-special-1',
            name: 'Special Rice',
            price: 650,
            description: 'Today special',
            available: true,
            isSpecial: true,
            category: { _id: 'cat-1', name: 'Rice' },
          },
        ]);
      }

      return jsonResponse(route, {
        items: [
          {
            _id: 'item-1',
            name: 'Chicken Rice',
            price: 620,
            description: 'Daily favorite',
            available: true,
            category: { _id: 'cat-1', name: 'Rice' },
          },
        ],
        foodOver: false,
        message: null,
      });
    });

    await page.route('**/api/announcements/canteen/**', (route) => jsonResponse(route, [
      {
        _id: 'ann-1',
        message: 'Lunch specials available now',
        createdAt: new Date().toISOString(),
      },
    ]));

    await page.goto('/register');

    await page.getByPlaceholder('Enter your full name').fill('Student One');
    await page.getByPlaceholder('Enter your email').fill('student@example.com');
    await page.getByPlaceholder('Create a password (min 6 chars)').fill('secret123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/canteens$/);
    await expect(page.locator('.canteen-card-pressable')).toHaveCount(4);
    await expect(page.getByText('Queue: High')).toBeVisible();
    await expect(page.getByText('Queue: Medium')).toBeVisible();

    await page.getByRole('button', { name: /Main Canteen/i }).click();

    await expect(page).toHaveURL(/\/canteen\/can-1$/);
    await expect(page.locator('h1', { hasText: 'Main Canteen' })).toBeVisible();
    await expect(page.getByText('Medium Wait Time')).toBeVisible();

    await page.getByRole('button', { name: 'View Menu' }).click();

    await expect(page).toHaveURL(/\/menu\/can-1$/);
    await expect(page.getByRole('heading', { name: /Discover today/i })).toBeVisible();
    await expect(page.getByText('Canteen Announcement')).toBeVisible();
    await expect(page.getByText('Medium Queue')).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('route protection sends student to unauthorized for staff-only page', async ({ page }) => {
    await setAuthSession(page, studentUser);
    await mockAuthProfile(page, studentUser);

    await page.goto('/staff/category-management');

    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: 'Unauthorized access' })).toBeVisible();
  });

  test('staff login redirects to dashboard overview', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => jsonResponse(route, staffUser));
    await page.route('**/api/auth/profile', (route) => jsonResponse(route, staffUser));

    await page.route('**/api/staff-admin/orders**', (route) => jsonResponse(route, []));
    await page.route('**/api/staff-admin/feedback**', (route) => jsonResponse(route, []));
    await page.route('**/api/staff-admin/dashboard/metrics**', (route) => jsonResponse(route, {
      stats: {
        totalOrders: 5,
        pending: 1,
        preparing: 2,
        ready: 1,
        feedbackCount: 2,
      },
    }));

    await page.route('**/api/canteens**', (route) => jsonResponse(route, canteens));

    await page.goto('/login');

    await page.getByPlaceholder('Enter your email').fill('staff@gmail.com');
    await page.getByPlaceholder('Enter your password').fill('secret123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    await expect(page.getByText(/Dashboard/i).first()).toBeVisible();
  });
});
