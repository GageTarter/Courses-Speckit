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

const nameRules = [
  (value) => !!value?.trim() || "Required",
  (value) =>
    (value?.trim().length ?? 0) <= 11 ||
    "Semester name must be 11 characters or fewer.",
];
const isValidDate = (value) => {
  if (!value) {
    return false;
  }

  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return false;
  }

  const time = Date.parse(`${text}T00:00:00Z`);
  if (Number.isNaN(time)) {
    return false;
  }

  return new Date(time).toISOString().slice(0, 10) === text;
};

const startDateRules = [
  (value) => !!value || "Required",
  (value) => isValidDate(value) || "Start date must be a valid date.",
];
const endDateRules = [
  (value) => !!value || "Required",
  (value) => isValidDate(value) || "End date must be a valid date.",
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
