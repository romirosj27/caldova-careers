import { test, expect } from '@playwright/test';

const departmentOption = (page: import('@playwright/test').Page, name: string) =>
    page.getByTestId('department-filter').getByRole('checkbox', { name, exact: true });
const locationOption = (page: import('@playwright/test').Page, name: string) =>
    page.getByTestId('location-filter').getByRole('checkbox', { name, exact: true });

test.describe('Role filters', () => {
    test('filters by department and resets', async ({ page }) => {
        await page.goto('/');
        const total = await page.getByTestId('role-card').count();

        await test.step('select a department', async () => {
            await departmentOption(page, 'Finance').check();
            const cards = page.locator('[data-role-item]:not([hidden]) [data-testid="role-card"]');
            await expect(cards).toHaveCount(2);
            await expect(cards.first().getByTestId('role-department')).toHaveText('Finance');
            await expect(page).toHaveURL(/department=Finance/);
        });

        await test.step('reset restores all roles', async () => {
            await page.getByTestId('filter-reset').click();
            await expect(page.locator('[data-role-item]:not([hidden])')).toHaveCount(total);
            await expect(departmentOption(page, 'Finance')).not.toBeChecked();
            await expect(page).not.toHaveURL(/department=/);
        });
    });

    test('filters by location', async ({ page }) => {
        await page.goto('/');
        await locationOption(page, 'Woodinville, WA, USA').check();
        const cards = page.locator('[data-role-item]:not([hidden]) [data-testid="role-card"]');
        await expect(cards).toHaveCount(3);
        await expect(cards.first().getByTestId('role-location')).toHaveText('Woodinville, WA, USA');
    });

    test('combines department and location with OR, and allows several values', async ({ page }) => {
        await page.goto('/');
        const visible = page.locator('[data-role-item]:not([hidden])');

        await departmentOption(page, 'Finance').check();
        await locationOption(page, 'London, United Kingdom').check();
        await expect(visible).toHaveCount(3);

        await departmentOption(page, 'Security').check();
        await expect(visible).toHaveCount(4);
    });

    test('restores selections from the URL on load', async ({ page }) => {
        await page.goto('/?department=Finance');
        await expect(departmentOption(page, 'Finance')).toBeChecked();
        await expect(page.locator('[data-role-item]:not([hidden])')).toHaveCount(2);
    });

    test('shows an empty state when nothing matches', async ({ page }) => {
        await page.goto('/?department=Legal');
        await expect(page.getByTestId('roles-grid')).toBeHidden();
        await expect(page.getByTestId('empty-state')).toBeVisible();

        await page.getByTestId('filter-reset').click();
        await expect(page.getByTestId('roles-grid')).toBeVisible();
        await expect(page.getByTestId('empty-state')).toBeHidden();
    });
});
