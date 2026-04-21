import { expect, test } from '@playwright/test';

const staffUser = {
  _id: 'user-staff-1',
  name: 'Staff User',
  email: 'staff@example.com',
  role: 'staff',
  token: 'staff-token',
};

const studentUser = {
  _id: 'user-student-1',
  name: 'Student User',
  email: 'student@example.com',
  role: 'student',
  token: 'student-token',
};

const canteens = [
  { _id: 'can-1', name: 'Main Canteen' },
  { _id: 'can-2', name: 'New Canteen' },
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

test.describe('Member 2 flows', () => {
  test('staff can perform category CRUD for a canteen', async ({ page }) => {
    let categories = [
      { _id: 'cat-1', name: 'Rice', canteen: 'can-1' },
      { _id: 'cat-2', name: 'Snacks', canteen: 'can-1' },
    ];

    await setAuthSession(page, staffUser);
    await mockAuthProfile(page, staffUser);

    await page.route('**/api/canteens', (route) => jsonResponse(route, canteens));

    await page.route('**/api/categories**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method();
      const pathParts = url.pathname.split('/').filter(Boolean);
      const categoryId = pathParts[pathParts.length - 1] === 'categories' ? null : pathParts[pathParts.length - 1];

      if (method === 'GET') {
        const canteenId = url.searchParams.get('canteenId');
        const filtered = canteenId
          ? categories.filter((category) => String(category.canteen) === String(canteenId))
          : categories;
        return jsonResponse(route, filtered);
      }

      if (method === 'POST') {
        const payload = req.postDataJSON();
        const created = {
          _id: `cat-${categories.length + 1}`,
          name: payload.name,
          canteen: payload.canteenId,
        };
        categories = [...categories, created];
        return jsonResponse(route, created, 201);
      }

      if (method === 'PUT' && categoryId) {
        const payload = req.postDataJSON();
        categories = categories.map((category) => (
          category._id === categoryId
            ? { ...category, name: payload.name }
            : category
        ));
        const updated = categories.find((category) => category._id === categoryId);
        return jsonResponse(route, updated || {});
      }

      if (method === 'DELETE' && categoryId) {
        categories = categories.filter((category) => category._id !== categoryId);
        return jsonResponse(route, { message: 'Category removed' });
      }

      return route.continue();
    });

    await page.goto('/staff/category-management');

    await expect(page.getByRole('heading', { name: 'Category Management' })).toBeVisible();

    await page.getByPlaceholder('Example: Rice').fill('Beverages');
    await page.getByRole('button', { name: 'Create category' }).click();

    await expect(page.getByText('Category created successfully')).toBeVisible();
    await expect(page.locator('.staff-category-row', { hasText: 'Beverages' })).toBeVisible();

    const beveragesRow = page.locator('.staff-category-row', { hasText: 'Beverages' });
    await beveragesRow.getByRole('button', { name: 'Edit' }).click();
    await page.getByPlaceholder('Example: Rice').fill('Cold Drinks');
    await page.getByRole('button', { name: 'Update category' }).click();

    await expect(page.getByText('Category updated successfully')).toBeVisible();
    await expect(page.locator('.staff-category-row', { hasText: 'Cold Drinks' })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('.staff-category-row', { hasText: 'Cold Drinks' }).getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByText('Category deleted')).toBeVisible();
    await expect(page.locator('.staff-category-row', { hasText: 'Cold Drinks' })).toHaveCount(0);
  });

  test('staff can manage menu items, availability, and specials', async ({ page }) => {
    let categories = [
      { _id: 'cat-1', name: 'Rice', canteen: 'can-1' },
      { _id: 'cat-2', name: 'Drinks', canteen: 'can-1' },
    ];

    let items = [
      {
        _id: 'item-1',
        name: 'Chicken Kottu',
        price: 680,
        description: 'Spicy and hot',
        image: '',
        available: true,
        isSpecial: false,
        dailyQuantity: 30,
        category: { _id: 'cat-1', name: 'Rice' },
      },
    ];

    const announcements = [];

    await setAuthSession(page, staffUser);
    await mockAuthProfile(page, staffUser);

    await page.route('**/api/canteens', (route) => jsonResponse(route, canteens));

    await page.route('**/api/categories**', (route) => jsonResponse(route, categories));

    await page.route('**/api/announcements/canteen/**', (route) => jsonResponse(route, announcements));

    await page.route('**/api/announcements', async (route) => {
      const payload = route.request().postDataJSON();
      const created = {
        _id: `ann-${announcements.length + 1}`,
        message: payload.message,
        createdAt: new Date().toISOString(),
      };
      announcements.unshift(created);
      return jsonResponse(route, created, 201);
    });

    await page.route('**/api/menu-items**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const method = req.method();
      const pathParts = url.pathname.split('/').filter(Boolean);
      const marker = pathParts.indexOf('menu-items');
      const next = marker >= 0 ? pathParts[marker + 1] : null;
      const next2 = marker >= 0 ? pathParts[marker + 2] : null;

      if (method === 'GET' && !next) {
        return jsonResponse(route, { items, foodOver: false, message: null });
      }

      if (method === 'POST' && !next) {
        const payload = req.postDataJSON();
        const category = categories.find((entry) => entry._id === payload.categoryId);
        const created = {
          _id: `item-${items.length + 1}`,
          name: payload.name,
          price: payload.price,
          description: payload.description,
          image: payload.image,
          available: Boolean(payload.available),
          isSpecial: Boolean(payload.isSpecial),
          dailyQuantity: payload.dailyQuantity,
          category: category ? { _id: category._id, name: category.name } : { _id: payload.categoryId, name: 'General' },
        };
        items = [...items, created];
        return jsonResponse(route, created, 201);
      }

      if (method === 'PUT' && next) {
        const payload = req.postDataJSON();
        const category = categories.find((entry) => entry._id === payload.categoryId);
        items = items.map((item) => (
          item._id === next
            ? {
              ...item,
              name: payload.name,
              price: payload.price,
              description: payload.description,
              image: payload.image,
              available: Boolean(payload.available),
              isSpecial: Boolean(payload.isSpecial),
              dailyQuantity: payload.dailyQuantity,
              category: category ? { _id: category._id, name: category.name } : item.category,
            }
            : item
        ));
        const updated = items.find((item) => item._id === next);
        return jsonResponse(route, updated || {});
      }

      if (method === 'PATCH' && next && next2 === 'availability') {
        const payload = req.postDataJSON();
        items = items.map((item) => {
          if (item._id !== next) return item;
          const available = Boolean(payload.available);
          return {
            ...item,
            available,
            isSpecial: available ? item.isSpecial : false,
          };
        });
        const updated = items.find((item) => item._id === next);
        return jsonResponse(route, updated || {});
      }

      if (method === 'PATCH' && next && next2 === 'special') {
        const payload = req.postDataJSON();
        const target = items.find((item) => item._id === next);

        if (!target?.available) {
          return jsonResponse(route, { message: 'Out-of-stock items cannot be marked as special' }, 400);
        }

        items = items.map((item) => (
          item._id === next
            ? { ...item, isSpecial: Boolean(payload.isSpecial) }
            : item
        ));

        const updated = items.find((item) => item._id === next);
        return jsonResponse(route, updated || {});
      }

      if (method === 'DELETE' && next) {
        items = items.filter((item) => item._id !== next);
        return jsonResponse(route, { message: 'Menu item removed' });
      }

      return route.continue();
    });

    await page.goto('/staff/menu-management');

    await expect(page.getByRole('heading', { name: 'Menu Item Management' })).toBeVisible();

    await page.getByPlaceholder('Example: Chicken Kottu').fill('Veg Fried Rice');
    await page.locator('input[type="number"]').first().fill('750');
    await page.locator('select').nth(1).selectOption('cat-1');
    await page.getByRole('button', { name: 'Create item' }).click();

    await expect(page.getByText('Menu item created successfully')).toBeVisible();
    await expect(page.locator('.staff-item-row', { hasText: 'Veg Fried Rice' })).toBeVisible();

    const vegRow = page.locator('.staff-item-row', { hasText: 'Veg Fried Rice' });

    await vegRow.getByRole('button', { name: 'Set out of stock' }).click();
    await expect(vegRow.getByText('Out of stock')).toBeVisible();

    await vegRow.getByRole('button', { name: 'Set Special' }).click();
    await expect(page.getByText('Out-of-stock items cannot be marked as special')).toBeVisible();

    await vegRow.getByRole('button', { name: 'Set available' }).click();
    await vegRow.getByRole('button', { name: 'Set Special' }).click();
    await expect(vegRow.getByText('Special')).toBeVisible();
  });

  test('student menu browsing supports filters and food over message', async ({ page }) => {
    const categories = [
      { _id: 'cat-1', name: 'Rice', canteen: 'can-1' },
      { _id: 'cat-2', name: 'Drinks', canteen: 'can-1' },
    ];

    const allItems = [
      {
        _id: 'item-1',
        name: 'Chicken Kottu',
        price: 690,
        description: 'Hot and spicy',
        available: true,
        isSpecial: true,
        image: '',
        category: { _id: 'cat-1', name: 'Rice' },
      },
      {
        _id: 'item-2',
        name: 'Lime Juice',
        price: 220,
        description: 'Fresh juice',
        available: false,
        isSpecial: false,
        image: '',
        category: { _id: 'cat-2', name: 'Drinks' },
      },
    ];

    await setAuthSession(page, studentUser);
    await mockAuthProfile(page, studentUser);

    await page.route('**/api/canteens', (route) => jsonResponse(route, canteens));

    await page.route('**/api/canteens/**/queue-status', (route) => jsonResponse(route, {
      estimatedPrepTime: 12,
      activeOrders: 8,
      queueLoad: 'Medium',
    }));

    await page.route('**/api/categories**', (route) => jsonResponse(route, categories));

    await page.route('**/api/announcements/canteen/**', (route) => jsonResponse(route, [
      {
        _id: 'ann-1',
        message: 'Kitchen delay around 10 minutes',
        createdAt: new Date().toISOString(),
      },
    ]));

    await page.route('**/api/menu-items**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/menu-items/specials')) {
        const specials = allItems.filter((item) => item.isSpecial && item.available);
        return jsonResponse(route, specials);
      }

      const categoryId = url.searchParams.get('categoryId');
      const availableOnly = url.searchParams.get('availableOnly') === 'true';
      const search = (url.searchParams.get('search') || '').toLowerCase();

      let filtered = [...allItems];

      if (categoryId) {
        filtered = filtered.filter((item) => item.category._id === categoryId);
      }

      if (search) {
        filtered = filtered.filter((item) => item.name.toLowerCase().includes(search));
      }

      if (availableOnly) {
        filtered = filtered.filter((item) => item.available);
      }

      const foodOver = Boolean(categoryId) && filtered.length > 0 && filtered.every((item) => !item.available);
      return jsonResponse(route, {
        items: filtered,
        foodOver,
        message: foodOver ? 'Foods are over for this category' : null,
      });
    });

    await page.goto('/menu/can-1');

    await expect(page.getByRole('heading', { name: "Today's Specials" })).toBeVisible();
    await expect(page.getByText('Canteen Announcement')).toBeVisible();

    await page.locator('.menu-category-chips').getByRole('button', { name: 'Drinks', exact: true }).click();
    await expect(page.getByText('Foods are over for this category')).toBeVisible();

    await page.locator('.menu-category-chips').getByRole('button', { name: 'All', exact: true }).click();
    await page.getByText('Lime Juice').click();

    await expect(page.getByRole('button', { name: 'Order Now' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();

    await page.getByLabel('Close item details').click();

    await page.getByLabel('Available only').check();
    await expect(page.getByText('Lime Juice')).toHaveCount(0);
  });
});
