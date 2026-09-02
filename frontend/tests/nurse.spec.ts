import { test, expect } from '@playwright/test';

test('Nurse Login - Enter Vitals - Save Clinical Assessment', async ({
  page,
}) => {
  // ==========================================
  // STEP 1: Open Login Page
  // ==========================================
  await page.goto('http://localhost:5173/login');

  // ==========================================
  // STEP 2: Nurse Login
  // ==========================================
  await page
    .getByRole('textbox', { name: 'doctor@hospital.com' })
    .fill('nurse@sepsisguardian.com');

  await page
    .getByRole('textbox', { name: 'Enter your password' })
    .fill('Nurse@12345');

  await page
    .getByRole('button', { name: 'Sign in' })
    .click();

  // ==========================================
  // STEP 3: Verify Nurse Dashboard
  // ==========================================
  await expect(
    page.getByText('View patients and record vital signs.')
  ).toBeVisible();

  // ==========================================
  // STEP 4: Wait for Patient List
  // ==========================================
  await expect(
    page.getByRole('button', { name: 'Enter Vitals' }).first()
  ).toBeVisible();

  // ==========================================
  // STEP 5: Click Enter Vitals
  // ==========================================
  await page
    .getByRole('button', { name: 'Enter Vitals' })
    .first()
    .click();

  // ==========================================
  // STEP 6: Verify Assessment Page
  // ==========================================
  await expect(
    page.getByText('Nurse Patient Assessment')
  ).toBeVisible();

  await expect(
    page.getByText('Patient Information')
  ).toBeVisible();

  // ==========================================
  // STEP 7: ENTER VITAL SIGNS
  // ==========================================

  // Temperature
  await page
    .locator('input[name="temperature"]')
    .fill('39.5');

  // Heart Rate
  await page
    .locator('input[name="heart_rate"]')
    .fill('125');

  // Respiratory Rate
  await page
    .locator('input[name="respiratory_rate"]')
    .fill('30');

  // Systolic Blood Pressure
  await page
    .locator('input[name="systolic_bp"]')
    .fill('85');

  // Diastolic Blood Pressure
  await page
    .locator('input[name="diastolic_bp"]')
    .fill('50');

  // SpO2
  await page
    .locator('input[name="spo2"]')
    .fill('88');

  // Urine Output
  await page
    .locator('input[name="urine_output"]')
    .fill('15');

  // ==========================================
  // STEP 8: NEUROLOGICAL DATA
  // ==========================================

  // GCS
  await page
    .locator('input[name="gcs"]')
    .fill('13');

  // Consciousness Level
  await page
    .locator('select[name="consciousness_level"]')
    .selectOption('Confused');

  // ==========================================
  // STEP 9: LABORATORY RESULTS
  // ==========================================

  // WBC
  await page
    .locator('input[name="wbc"]')
    .fill('15');

  // Platelets
  await page
    .locator('input[name="platelets"]')
    .fill('100');

  // Creatinine
  await page
    .locator('input[name="creatinine"]')
    .fill('2.5');

  // Bilirubin
  await page
    .locator('input[name="bilirubin"]')
    .fill('3.2');

  // Lactate
  await page
    .locator('input[name="lactate"]')
    .fill('5.5');

  // CRP
  await page
    .locator('input[name="crp"]')
    .fill('120');

  // Procalcitonin
  await page
    .locator('input[name="procalcitonin"]')
    .fill('15');

  // Glucose
  await page
    .locator('input[name="glucose"]')
    .fill('180');

  // ==========================================
  // STEP 10: CLINICAL SUPPORT
  // ==========================================

  // Vasopressor
  await page
    .locator('input[name="vasopressor"]')
    .check();

  // Mechanical Ventilation
  await page
    .locator('input[name="mechanical_ventilation"]')
    .check();

  // Antibiotic Given
  await page
    .locator('input[name="antibiotic_given"]')
    .check();

  // Fluid Given
  await page
    .locator('input[name="fluid_given"]')
    .check();

  // ==========================================
  // STEP 11: PATIENT NOTES
  // ==========================================
  await page
    .locator('textarea[name="notes"]')
    .fill(
      'Automated nurse assessment test. Patient clinical values entered successfully.'
    );

  // ==========================================
  // STEP 12: Verify Save Button
  // ==========================================
  const saveButton = page.getByRole('button', {
    name: 'Save Clinical Assessment',
  });

  await expect(saveButton).toBeVisible();
  await expect(saveButton).toBeEnabled();

  // ==========================================
  // STEP 13: SAVE CLINICAL ASSESSMENT
  // ==========================================
  await saveButton.click();

  // ==========================================
  // STEP 14: VERIFY SUCCESS MESSAGE
  // ==========================================
  await expect(
    page.getByText('Clinical assessment saved successfully.')
  ).toBeVisible();
});