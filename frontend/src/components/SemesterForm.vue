<script setup>
import { ref } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const updateField = (field, value) => {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
};

const isValidDateOnly = (value) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 11 ||
    "Semester name must be 11 characters or fewer.",
];

const startDateRules = [
  (value) => !!value || "Required",
  (value) => isValidDateOnly(value) || "Start date must be a valid date.",
];
const endDateRules = [
  (value) => !!value || "Required",
  (value) => isValidDateOnly(value) || "End date must be a valid date.",
  (value) =>
    !props.modelValue.startDate ||
    value >= props.modelValue.startDate ||
    "End date must be after start date.",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form ref="formRef" @submit.prevent="emit('submit')">
    <v-text-field
      :model-value="modelValue.name"
      label="Name"
      density="comfortable"
      :rules="nameRules"
      @update:model-value="updateField('name', $event)"
    />
    <v-text-field
      :model-value="modelValue.startDate"
      label="Start Date"
      type="date"
      density="comfortable"
      :rules="startDateRules"
      @update:model-value="updateField('startDate', $event)"
    />
    <v-text-field
      :model-value="modelValue.endDate"
      label="End Date"
      type="date"
      density="comfortable"
      :rules="endDateRules"
      @update:model-value="updateField('endDate', $event)"
    />
  </v-form>
</template>
