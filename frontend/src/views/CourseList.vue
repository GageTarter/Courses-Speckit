<script setup>
import { computed, onMounted, ref } from "vue";
import CourseServices from "../services/courseServices.js";
import Utils from "../config/utils.js";

const courses = ref([]);
const loading = ref(false);
const error = ref("");

const addOpen = ref(false);
const addForm = ref(null);
const newName = ref("");
const newCourseID = ref("");
const newDescription = ref("");
const newSemester = ref("");
const newFrequency = ref("");
const newHours = ref("");
const newDept = ref("");
const editOpen = ref(false);
const deleteOpen = ref(false);
const editForm = ref(null);
const editName = ref("");
const editCourseID = ref("");
const editDescription = ref("");
const editSemester = ref("");
const editFrequency = ref("");
const editHours = ref("");
const editDept = ref("");
const activeCourse = ref(null);

const isAdmin = computed(() => {
  const role = Utils.getStore("user")?.role;
  return role === "admin" || role === "superadmin";
});

const duplicateNameMessage = "Course name is in use. Enter a different course name.";

function nameTaken(value, ignoreId) {
  const name = value?.trim().toLowerCase();
  if (!name) {
    return false;
  }
  return courses.value.some(
    (course) => course.id !== ignoreId && course.name.trim().toLowerCase() === name,
  );
}

const addNameRules = [
  (value) => !!value?.trim() || "Course name is required.",
  (value) => !nameTaken(value) || duplicateNameMessage,
];

const editNameRules = [
  (value) => !!value?.trim() || "Course name is required.",
  (value) => !nameTaken(value, activeCourse.value?.id) || duplicateNameMessage,
];

const courseIdRules = [(value) => !!value?.trim() || "Course ID is required."];

const isEmpty = computed(() => !loading.value && courses.value.length === 0);

function sortCourses(rows) {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadCourses() {
  loading.value = true;
  error.value = "";
  try {
    const res = await CourseServices.getAll();
    courses.value = [...(res.data || [])].sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load courses.";
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  newName.value = "";
  newCourseID.value = "";
  newDescription.value = "";
  newSemester.value = "";
  newFrequency.value = "";
  newHours.value = "";
  newDept.value = "";
  error.value = "";
  addOpen.value = true;
}

async function createCourse() {
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  error.value = "";
  try {
    await CourseServices.create({
      name: newName.value.trim(),
      courseID: newCourseID.value.trim(),
      description: newDescription.value.trim(),
      semesterOffered: newSemester.value ? newSemester.value.trim() : "",
      courseFrequency: newFrequency.value.trim(),
      courseHours: String(newHours.value ?? "").trim(),
      courseDept: newDept.value.trim(),
    });
    addOpen.value = false;
    await loadCourses();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to create course.";
  }
}

function openEdit(course) {
  activeCourse.value = course;
  editName.value = course.name;
  editCourseID.value = course.courseID;
  editDescription.value = course.description || "";
  editSemester.value = course.semesterOffered || "";
  editFrequency.value = course.courseFrequency || "";
  editHours.value = course.courseHours ?? "";
  editDept.value = course.courseDept || "";
  error.value = "";
  editOpen.value = true;
}

async function saveEdit() {
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  error.value = "";
  try {
    await CourseServices.update(activeCourse.value.id, {
      name: editName.value.trim(),
      courseID: editCourseID.value.trim(),
      description: editDescription.value.trim(),
      semesterOffered: editSemester.value ? editSemester.value.trim() : "",
      courseFrequency: editFrequency.value.trim(),
      courseHours: String(editHours.value ?? "").trim(),
      courseDept: editDept.value.trim(),
    });
    editOpen.value = false;
    await loadCourses();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to update course.";
  }
}

function openDelete(course) {
  activeCourse.value = course;
  error.value = "";
  deleteOpen.value = true;
}

async function confirmDelete() {
  error.value = "";
  try {
    await CourseServices.remove(activeCourse.value.id);
    courses.value = courses.value.filter((course) => course.id !== activeCourse.value.id);
    deleteOpen.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete course.";
  }
}

onMounted(loadCourses);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">Courses</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" v-if="isAdmin" @click="openAdd">
          + New Course
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading" type="list-item-two-line@3" />

    <p v-else-if="isEmpty" class="text-body-1">No courses yet. Create the first course.</p>

    <v-list v-else>
      <v-list-item v-for="course in courses" :key="course.id">
        <v-list-item-title>{{ course.name }}</v-list-item-title>
          <v-list-item-subtitle>
          {{ course.courseID }}
          <span v-if="course.description"> — {{ course.description }}</span>
          <span v-if="course.semesterOffered"> — {{ course.semesterOffered }}</span>
          <span v-if="course.courseFrequency"> — {{ course.courseFrequency }}</span>
          <span v-if="course.courseHours"> — {{ course.courseHours }}</span>
          <span v-if="course.courseDept"> — {{ course.courseDept }}</span>
          </v-list-item-subtitle>
        <template #append>
          <v-btn
            icon
            size="small"
            aria-label="Edit Course"
            variant="text"
             v-if="isAdmin" @click="openEdit(course)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            aria-label="Delete Course"
            variant="text"
             v-if="isAdmin" @click="openDelete(course)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="addOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>New Course</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="addForm">
            <v-text-field v-model="newName" label="Name" :rules="addNameRules" />
            <v-text-field v-model="newCourseID" label="CourseID" :rules="courseIdRules" />
            <v-text-field v-model="newDescription" label="Description" />
            <v-select v-model="newSemester" label="Semester Offered" :items="['Fall', 'Spring', 'Summer', 'Winter']" clearable />
            <v-text-field v-model="newFrequency" label="Course Frequency" />
            <v-text-field v-model="newHours" label="Course Hours" />
            <v-text-field v-model="newDept" label="Course Department" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="createCourse">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Edit Course</v-card-title>
        </v-card-item>
        <v-card-text>
          <v-form ref="editForm">
            <v-text-field v-model="editName" label="Name" :rules="editNameRules" />
            <v-text-field v-model="editCourseID" label="CourseID" :rules="courseIdRules" />
            <v-text-field v-model="editDescription" label="Description" />
            <v-select v-model="editSemester" label="Semester Offered" :items="['Fall', 'Spring', 'Summer', 'Winter']" clearable />
            <v-text-field v-model="editFrequency" label="Course Frequency" />
            <v-text-field v-model="editHours" label="Course Hours" />
            <v-text-field v-model="editDept" label="Course Department" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="480">
      <v-card>
        <v-card-item>
          <v-card-title>Delete Course</v-card-title>
        </v-card-item>
        <v-card-text>
          Delete {{ activeCourse?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="primary" class="oc-cta" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>
