import { test, expect } from '@playwright/test';

test('Admission Login and Register New Patient', async ({ page }) => {

  // ==========================================
  // STEP 1: Open Login Page
  // ==========================================
  await page.goto('http://localhost:5173/login');

  // ==========================================
  // STEP 2: Login as Admission User
  // ==========================================
  await page
    .getByRole('textbox', { name: 'doctor@hospital.com' })
    .fill('admission@sepsisguardian.com');

  await page
    .getByRole('textbox', { name: 'Enter your password' })
    .fill('Admission@12345');

  await page
    .getByRole('button', { name: 'Sign in' })
    .click();

  // ==========================================
  // STEP 3: Verify Admission Dashboard
  // ==========================================
  await expect(
    page.getByRole('button', { name: 'Register Patient' }).first()
  ).toBeVisible();

  // ==========================================
  // STEP 4: Open Register Patient Form
  // ==========================================
  await page
    .getByRole('button', { name: 'Register Patient' })
    .first()
    .click();

  // ==========================================
  // STEP 5: Fill Patient Details
  // ==========================================

  // First Name
  await page
    .locator('input[name="first_name"]')
    .fill('KRISHNA');

  // Last Name
  await page
    .locator('input[name="last_name"]')
    .fill('KUMAR');

  // Date of Birth
  await page
    .locator('input[name="date_of_birth"]')
    .fill('2000-08-15');

  // Gender
  await page
    .locator('select[name="gender"]')
    .selectOption('MALE');

  // Phone
  await page
    .locator('input[name="phone"]')
    .fill('9876543210');

  // Email
  await page
    .locator('input[name="email"]')
    .fill('arun.kumar.test@gmail.com');

  // Blood Group
  await page
    .locator('select[name="blood_group"]')
    .selectOption('A+');

  // Address
  await page
    .locator('textarea[name="address"]')
    .fill('Chennai, Tamil Nadu');

  // Admission Type
  await page
    .locator('select[name="admission_type"]')
    .selectOption('EMERGENCY');

  // Ward / ICU
  await page
    .getByRole('textbox', { name: 'e.g. ICU' })
    .fill('ICU');

  // Emergency Contact Name
  await page
    .locator('input[name="emergency_contact_name"]')
    .fill('RAMESH');

  // Emergency Contact Phone
  await page
    .locator('input[name="emergency_contact_phone"]')
    .fill('9123456789');

  // ==========================================
  // STEP 6: Submit Registration
  // ==========================================
  await page
    .locator('form')
    .getByRole('button', { name: 'Register Patient' })
    .click();

  // ==========================================
  // STEP 7: Verify Registration Success
  // ==========================================

  // Verify newly registered patient appears
  await expect(
    page.getByText('ARUN KUMAR', { exact: true }).first()
  ).toBeVisible();

});