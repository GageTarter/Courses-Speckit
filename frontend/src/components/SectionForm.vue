<script setup>
import { computed, ref } from "vue";
import { offeredSemesters } from "../utils/semesters.js";

const props = defineProps({
  modelValue: { type: Object, required: true },
  courses: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const formRef = ref(null);

const dayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const updateField = (field, value) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const sectionNumberRules = [
  (value) =>
    (value !== "" && value !== null && value !== undefined) || "Required",
  (value) =>
    (Number.isInteger(Number(value)) &&
      Number(value) >= 1 &&
      Number(value) <= 99) ||
    "Section number must be from 01 to 99.",
];

const semesterRules = [
  (value) => !!value || "Required",
];

const courseOptions = computed(() =>
  props.courses.map((course) => ({
    id: course.id,
    label: course.name
      ? `${course.courseID} — ${course.name}`
      : course.courseID,
  })),
);

const courseRules = [
  (value) => !!value || "Required",
];

const facultyRules = [
  (value) => !!value || "Required",
];

const daysRules = [
  (value) =>
    (value?.length ?? 0) > 0 || "At least one day is required.",
];

const startTimeRules = [
  (value) => !!value || "Required",
];

const endTimeRules = [
  (value) => !!value || "Required",
];

const validate = () => formRef.value.validate();

defineExpose({ validate });
</script>

<template>
  <v-form
    ref="formRef"
    @submit.prevent="emit('submit')"
  >
    <v-text-field
      :model-value="modelValue.sectionNumber"
      label="Section Number"
      inputmode="numeric"
      density="comfortable"
      :rules="sectionNumberRules"
      @update:model-value="updateField('sectionNumber', $event)"
    />

    <v-select
      :model-value="modelValue.semesterId"
      label="Semester"
      :items="offeredSemesters"
      item-title="name"
      item-value="id"
      density="comfortable"
      :rules="semesterRules"
      @update:model-value="updateField('semesterId', $event)"
    />

    <v-select
      :model-value="modelValue.courseId"
      label="Course"
      :items="courseOptions"
      item-title="label"
      item-value="id"
      density="comfortable"
      no-data-text="No courses yet. Create one on the Courses page."
      :rules="courseRules"
      @update:model-value="updateField('courseId', $event)"
    />

    <v-text-field
      :model-value="modelValue.facultyId"
      label="Faculty ID"
      type="number"
      density="comfortable"
      :rules="facultyRules"
      @update:model-value="updateField('facultyId', $event)"
    />

    <v-select
      :model-value="modelValue.daysOfWeek"
      label="Days of the Week"
      :items="dayOptions"
      multiple
      density="comfortable"
      :rules="daysRules"
      @update:model-value="updateField('daysOfWeek', $event)"
    />

    <v-text-field
      :model-value="modelValue.startTime"
      label="Start Time"
      type="time"
      density="comfortable"
      :rules="startTimeRules"
      @update:model-value="updateField('startTime', $event)"
    />

    <v-text-field
      :model-value="modelValue.endTime"
      label="End Time"
      type="time"
      density="comfortable"
      :rules="endTimeRules"
      @update:model-value="updateField('endTime', $event)"
    />
  </v-form>
</template>