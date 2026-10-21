<script setup>
import { onMounted, ref } from "vue";
import myCourseServices from "../services/myCourseServices.js";

const courses = ref([]);
const loading = ref(true);
const error = ref("");

const loadCourses = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await myCourseServices.listMyCourses();
    courses.value = Array.isArray(data) ? data : [];
  } catch (err) {
    error.value = err.response?.data?.message || "Could not load your courses.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadCourses);
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-6">My Courses</h1>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <p v-else-if="!courses.length" class="text-body-1">
      You are not enrolled in any courses.
    </p>

    <v-table v-else>
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Course ID</th>
          <th class="text-left">Description</th>
          <th class="text-left">Semester offered</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in courses" :key="course.id">
          <td>{{ course.name }}</td>
          <td>{{ course.courseID }}</td>
          <td>{{ course.description }}</td>
          <td>{{ course.semesterOffered }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>
