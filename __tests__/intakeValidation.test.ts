import { describe, it, expect } from 'vitest';

type Sex = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';

interface PatientFormData {
  name: string;
  age: string;
  sex: Sex;
  symptomsSelected: string[];
  symptomsCustom: string;
  existingConditions: string;
  allergies: string;
  medications: string;
}

export function validatePatientIntake(form: PatientFormData) {
  if (!form.name.trim() || !form.age || !form.sex) {
    return { valid: false, error: "Couldn't save. Please fill in required fields." };
  }
  return { valid: true };
}

export function toggleSymptomSelection(selected: string[], symptom: string) {
  return selected.includes(symptom)
    ? selected.filter((s) => s !== symptom)
    : [...selected, symptom];
}

describe('Patient Intake Form Validation', () => {
  const validForm: PatientFormData = {
    name: 'Jane Doe',
    age: '32',
    sex: 'female',
    symptomsSelected: ['Headache', 'Fatigue'],
    symptomsCustom: 'Mild nausea in mornings',
    existingConditions: 'Hypertension',
    allergies: 'Penicillin',
    medications: 'Lisinopril 10mg',
  };

  it('passes validation when all required fields are populated', () => {
    const result = validatePatientIntake(validForm);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('fails validation when name is completely empty', () => {
    const result = validatePatientIntake({ ...validForm, name: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Couldn't save. Please fill in required fields.");
  });

  it('fails validation when name contains only whitespace', () => {
    const result = validatePatientIntake({ ...validForm, name: '     ' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Couldn't save. Please fill in required fields.");
  });

  it('fails validation when age is missing', () => {
    const result = validatePatientIntake({ ...validForm, age: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Couldn't save. Please fill in required fields.");
  });

  it('fails validation when sex is missing or empty', () => {
    const result = validatePatientIntake({ ...validForm, sex: '' });
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Couldn't save. Please fill in required fields.");
  });

  it('passes when optional fields are empty', () => {
    const minimalForm: PatientFormData = {
      name: 'John Smith',
      age: '45',
      sex: 'male',
      symptomsSelected: [],
      symptomsCustom: '',
      existingConditions: '',
      allergies: '',
      medications: '',
    };
    const result = validatePatientIntake(minimalForm);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  describe('Symptom toggling logic', () => {
    it('adds a symptom when not currently selected', () => {
      const initial = ['Headache'];
      const updated = toggleSymptomSelection(initial, 'Fever');
      expect(updated).toEqual(['Headache', 'Fever']);
    });

    it('removes a symptom when already selected', () => {
      const initial = ['Headache', 'Fever'];
      const updated = toggleSymptomSelection(initial, 'Headache');
      expect(updated).toEqual(['Fever']);
    });

    it('handles toggling multiple times cleanly', () => {
      let list: string[] = [];
      list = toggleSymptomSelection(list, 'Dizziness');
      expect(list).toEqual(['Dizziness']);
      list = toggleSymptomSelection(list, 'Dizziness');
      expect(list).toEqual([]);
    });
  });
});
