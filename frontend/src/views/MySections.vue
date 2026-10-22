<script setup>
import { onMounted, ref } from "vue";
import mySectionServices from "../services/mySectionServices.js";

const sections = ref([]);
const loading = ref(true);
const error = ref("");

const formatSectionNumber = (value) => String(value).padStart(2, "0");

const loadSections = async () => {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await mySectionServices.listMySections();
    sections.value = Array.isArray(data) ? data : [];
  } catch (err) {
    error.value = err.response?.data?.message || "Could not load your sections.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadSections);
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-6">My Sections</h1>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <p v-else-if="!sections.length" class="text-body-1">
      You are not enrolled in any sections.
    </p>

    <v-table v-else>
      <thead>
        <tr>
          <th class="text-left">Section number</th>
          <th class="text-left">Semester</th>
          <th class="text-left">Course ID</th>
          <th class="text-left">Faculty ID</th>
          <th class="text-left">Days</th>
          <th class="text-left">Start time</th>
          <th class="text-left">End time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="section in sections" :key="section.id">
          <td>{{ formatSectionNumber(section.sectionNumber) }}</td>
          <td>{{ section.semester }}</td>
          <td>{{ section.courseID }}</td>
          <td>{{ section.facultyId }}</td>
          <td>{{ section.daysOfWeek }}</td>
          <td>{{ section.startTime }}</td>
          <td>{{ section.endTime }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>
