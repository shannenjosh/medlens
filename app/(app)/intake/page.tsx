"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import PageShell from "@/components/PageShell";
import { Label, Input, Textarea, Select, FieldGroup } from "@/components/FormFields";
import { Check, User, Heart, ShieldCheck, Sparkles } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const DEMO_PATIENT_ID = "demo-patient-1";
const SAVE_TIMEOUT_MS = 10000; // 10s timeout to prevent hanging UI on production

// ── Types ─────────────────────────────────────────────────────────────────────
type Sex = "male" | "female" | "other" | "prefer_not_to_say" | "";

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

const COMMON_SYMPTOMS = [
  "Fatigue",
  "Headache",
  "Fever",
  "Cough",
  "Shortness of breath",
  "Chest tightness",
  "Nausea",
  "Dizziness",
  "Joint pain",
  "Abdominal pain",
  "Brain fog",
  "Sleep disruption",
];

// ── Firestore save (merge updates demo-patient-1) ────────────────────────────
async function savePatientToFirestore(data: PatientFormData): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase configuration missing. Please verify NEXT_PUBLIC_FIREBASE_* variables in your environment."
    );
  }

  const docRef = doc(db, "patients", DEMO_PATIENT_ID);

  const savePromise = setDoc(
    docRef,
    {
      name:               data.name.trim(),
      age:                data.age,
      sex:                data.sex,
      symptoms:           data.symptomsSelected,
      additionalSymptoms: data.symptomsCustom.trim(),
      conditions:         data.existingConditions.trim(),
      allergies:          data.allergies.trim(),
      medications:        data.medications.trim(),
      source:             "user",
      updatedAt:          serverTimestamp(),
    },
    { merge: true }
  );

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "Save operation timed out. Please check your network connection or Firebase credentials."
          )
        ),
      SAVE_TIMEOUT_MS
    )
  );

  await Promise.race([savePromise, timeoutPromise]);
}

export default function IntakePage() {
  const [form, setForm] = useState<PatientFormData>({
    name: "",
    age: "",
    sex: "",
    symptomsSelected: [],
    symptomsCustom: "",
    existingConditions: "",
    allergies: "",
    medications: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    async function loadPatient() {
      try {
        const docRef = doc(db, "patients", DEMO_PATIENT_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            name: data.name || "",
            age: data.age ? String(data.age) : "",
            sex: (data.sex as Sex) || "",
            symptomsSelected: Array.isArray(data.symptoms) ? data.symptoms : [],
            symptomsCustom: data.additionalSymptoms || "",
            existingConditions: data.conditions || "",
            allergies: data.allergies || "",
            medications: data.medications || "",
          });
        }
      } catch (err) {
        console.warn("[IntakePage] Could not load saved patient profile:", err);
      }
    }
    loadPatient();
  }, []);

  const toggleSymptom = (symptom: string) => {
    setForm((prev) => ({
      ...prev,
      symptomsSelected: prev.symptomsSelected.includes(symptom)
        ? prev.symptomsSelected.filter((s) => s !== symptom)
        : [...prev.symptomsSelected, symptom],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (!form.name.trim() || !form.age || !form.sex) {
      setError("Couldn't save. Please fill in required fields.");
      return;
    }

    setSaving(true);
    try {
      await savePatientToFirestore(form);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error("[IntakePage] Firestore save failed:", err);
      setSaved(false);
      const msg = err instanceof Error ? err.message : "Couldn't save. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="" subtitle="">
      <form onSubmit={handleSubmit} className="flex flex-col gap-7 pb-20 max-w-3xl -mt-6">

        {/* ── 2. HERO / TOP AREA: Large Soft MINT Coloured Background Section ── */}
        <div className="bg-[#DBF0E7] border border-[#BFDFD1] rounded-[26px] p-7 sm:p-9 shadow-xs animate-fadein">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F6857] text-white text-[11px] font-bold tracking-wider uppercase mb-3">
            <Sparkles size={12} />
            <span>PATIENT PROFILE</span>
          </div>

          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#0F6857] tracking-tight leading-tight">
            Let&apos;s get to know you 👋
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#244E43] font-medium leading-relaxed max-w-xl">
            Keep your health information organised and ready when you need it.
          </p>
        </div>

        {/* ── 3. ABOUT YOU CARD: Visible PALE MINT Background (#DBF0E7) ── */}
        <div className="bg-[#DBF0E7] border border-[#BFDFD1] rounded-[24px] p-6 sm:p-8 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#0F6857] text-white flex items-center justify-center shrink-0 shadow-xs">
              <User size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F6857] tracking-tight">
                About you
              </h2>
              <p className="text-xs sm:text-[13px] text-[#2F544A] font-medium mt-0.5">
                Tell us a few basics to calibrate medical ranges.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <FieldGroup>
              <Label htmlFor="name" required className="text-[#142521]">
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white border-[#B4D7C7] text-[#142521]"
              />
            </FieldGroup>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup>
                <Label htmlFor="age" required className="text-[#142521]">
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={130}
                  placeholder="Enter age"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="bg-white border-[#B4D7C7] text-[#142521]"
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="sex" required className="text-[#142521]">
                  Biological sex
                </Label>
                <Select
                  id="sex"
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value as Sex })}
                  className="bg-white border-[#B4D7C7] text-[#142521]"
                >
                  <option value="">Select…</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </FieldGroup>
            </div>
          </div>
        </div>

        {/* ── 4. SYMPTOMS CARD: Visible PALE PEACH / CORAL Background (#FCE4DE) ── */}
        <div className="bg-[#FCE4DE] border border-[#F8C8BF] rounded-[24px] p-6 sm:p-8 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#E05345] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Heart size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#A8372B] tracking-tight">
                Symptoms
              </h2>
              <p className="text-xs sm:text-[13px] text-[#7A362E] font-medium mt-0.5">
                Select any symptoms you&apos;re currently experiencing.
              </p>
            </div>
          </div>

          {/* Selected pills = DEEP TEAL; Unselected pills = WHITE */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {COMMON_SYMPTOMS.map((s) => {
              const active = form.symptomsSelected.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-[13px] font-semibold border
                    transition-all duration-150 cursor-pointer select-none active:scale-[0.97]
                    ${active
                      ? "bg-[#0F6857] text-white border-[#0F6857] shadow-xs"
                      : "bg-white text-[#4A302A] border-[#F2BDB3] hover:border-[#E05345] hover:shadow-xs"
                    }
                  `}
                >
                  {active && (
                    <span className="w-4 h-4 rounded-full bg-white/25 text-white flex items-center justify-center shrink-0 animate-fadein">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>

          <FieldGroup>
            <Label htmlFor="symptomsCustom" hint="Optional" className="text-[#4A302A]">
              Describe additional symptoms or notes
            </Label>
            <Textarea
              id="symptomsCustom"
              rows={3}
              placeholder="Describe any additional symptoms or notes (optional)…"
              value={form.symptomsCustom}
              onChange={(e) => setForm({ ...form, symptomsCustom: e.target.value })}
              className="bg-white border-[#F0BCB2] text-[#142521] focus:ring-4 focus:ring-[#E05345]/15 focus:border-[#E05345]"
            />
          </FieldGroup>
        </div>

        {/* ── 5. MEDICAL BACKGROUND CARD: Visible PALE LAVENDER Background (#EDE7FA) ── */}
        <div className="bg-[#EDE7FA] border border-[#D7CDF5] rounded-[24px] p-6 sm:p-8 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#6B52B5] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#4F3699] tracking-tight">
                Medical background
              </h2>
              <p className="text-xs sm:text-[13px] text-[#47367B] font-medium mt-0.5">
                Anything we should know about your health history?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <FieldGroup>
              <Label htmlFor="existingConditions" hint="Chronic diagnoses" className="text-[#32235E]">
                Existing conditions
              </Label>
              <Input
                id="existingConditions"
                placeholder="e.g. Type 2 diabetes, asthma (optional)"
                value={form.existingConditions}
                onChange={(e) => setForm({ ...form, existingConditions: e.target.value })}
                className="bg-white border-[#D2C5F0] text-[#142521] focus:ring-4 focus:ring-[#6B52B5]/15 focus:border-[#6B52B5]"
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="allergies" hint="Medications or environmental" className="text-[#32235E]">
                Allergies
              </Label>
              <Input
                id="allergies"
                placeholder="e.g. Peanuts, pollen (optional)"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                className="bg-white border-[#D2C5F0] text-[#142521] focus:ring-4 focus:ring-[#6B52B5]/15 focus:border-[#6B52B5]"
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="medications" hint="Daily prescriptions and supplements" className="text-[#32235E]">
                Current medications
              </Label>
              <Textarea
                id="medications"
                rows={2}
                placeholder="List any current medications or supplements (optional)"
                value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
                className="bg-white border-[#D2C5F0] text-[#142521] focus:ring-4 focus:ring-[#6B52B5]/15 focus:border-[#6B52B5]"
              />
            </FieldGroup>
          </div>
        </div>

        {/* ── 6. BUTTON: Strong DEEP TEAL Button with hover animation & shadow ── */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`
              inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-base text-white
              transition-all duration-200 cursor-pointer select-none shadow-md hover:shadow-lg
              hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]
              bg-[#0F6857] hover:bg-[#0A4D40]
              ${saving ? "opacity-80 cursor-not-allowed" : ""}
            `}
          >
            {saving && (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saved && (
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center animate-fadein">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
            <span>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Profile"}
            </span>
          </button>

          {/* Small Success Message */}
          {saved && (
            <p className="text-sm font-bold text-[#0F6857] mt-3 animate-fadein">
              Patient information saved successfully.
            </p>
          )}

          {/* Small Error Message */}
          {error && (
            <p className="text-sm font-bold text-[#A8372B] mt-3 animate-fadein">
              {error}
            </p>
          )}
        </div>

      </form>
    </PageShell>
  );
}
